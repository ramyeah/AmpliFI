/**
 * lib/progress.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all lesson/chapter/module progress logic.
 *
 * Firestore document: progress/{uid}
 * Fields:
 *   completedSections : string[]  e.g. ['1-1-s1', '1-1-s2', '1-1-s3', '1-1-s4']
 *   completedLessons  : string[]  e.g. ['1-1', '1-2']
 *   completedChapters : string[]  e.g. ['chapter-1']
 *   completedModules  : string[]  e.g. ['module-1']
 *
 * Usage:
 *   import { completeSection, getProgress } from '../../lib/progress';
 *
 *   // Call when a user finishes a section (e.g. submits multistepmcq in S4)
 *   const result = await completeSection('1-1', 3); // lessonId, sectionIndex (0-based)
 *
 *   // result shape:
 *   {
 *     sectionId        : '1-1-s4',
 *     lessonCompleted  : true,   // all 4 sections now done
 *     chapterCompleted : false,  // not all 3 lessons in chapter done yet
 *     moduleCompleted  : false,
 *     fincoinsDelta    : 55,     // fincoins earned for completing the lesson
 *     lessonId         : '1-1',
 *     chapterId        : 'chapter-1',
 *     moduleId         : 'module-1',
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from './firebase';
import { MODULES } from '../constants/modules';

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/** Returns { lesson, chapter, module } for a given lessonId */
export const findLesson = (lessonId) => {
  for (const mod of MODULES) {
    for (const chapter of mod.chapters) {
      for (const lesson of chapter.lessons) {
        if (lesson.id === lessonId) {
          return { lesson, chapter, module: mod };
        }
      }
    }
  }
  return null;
};

/** Returns all lesson IDs in a chapter */
export const getLessonIdsInChapter = (chapterId) => {
  for (const mod of MODULES) {
    for (const chapter of mod.chapters) {
      if (chapter.id === chapterId) {
        return chapter.lessons.map(l => l.id);
      }
    }
  }
  return [];
};

/** Returns all lesson IDs in a module */
export const getLessonIdsInModule = (moduleId) => {
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) return [];
  return mod.chapters.flatMap(c => c.lessons.map(l => l.id));
};

/** Returns the number of sections in a lesson (defaults to 4) */
export const getSectionCount = (lessonId) => {
  const found = findLesson(lessonId);
  return found?.lesson?.sections?.length ?? 4;
};

/** Builds the sectionId string for a given lesson + index */
export const buildSectionId = (lessonId, sectionIndex) =>
  `${lessonId}-s${sectionIndex + 1}`;

/** Returns the next lesson after the given lessonId, or null if last */
export const getNextLesson = (lessonId) => {
  const allLessons = MODULES.flatMap(m =>
    m.chapters.flatMap(c => c.lessons)
  );
  const idx = allLessons.findIndex(l => l.id === lessonId);
  return idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
};

/** Returns the next chapter after the given chapterId within the same module,
 *  or null if it's the last chapter in the module */
export const getNextChapter = (chapterId) => {
  for (const mod of MODULES) {
    const idx = mod.chapters.findIndex(c => c.id === chapterId);
    if (idx >= 0) {
      return idx < mod.chapters.length - 1 ? mod.chapters[idx + 1] : null;
    }
  }
  return null;
};

/** Returns the next module, or null if last */
export const getNextModule = (moduleId) => {
  const idx = MODULES.findIndex(m => m.id === moduleId);
  return idx >= 0 && idx < MODULES.length - 1 ? MODULES[idx + 1] : null;
};

// ─── Firestore read ───────────────────────────────────────────────────────────

/**
 * Fetches the full progress document for the current user.
 * Returns a normalised object with all four arrays guaranteed to exist.
 */
export const getProgress = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return emptyProgress();

  const snap = await getDoc(doc(db, 'progress', uid));
  if (!snap.exists()) return emptyProgress();

  const data = snap.data();
  return {
    completedSections : data.completedSections  ?? [],
    completedLessons  : data.completedLessons   ?? [],
    completedChapters : data.completedChapters  ?? [],
    completedModules  : data.completedModules   ?? [],
  };
};

const emptyProgress = () => ({
  completedSections : [],
  completedLessons  : [],
  completedChapters : [],
  completedModules  : [],
});

// ─── Core write function ──────────────────────────────────────────────────────

/**
 * completeSection(lessonId, sectionIndex)
 *
 * Called when a user finishes a section. Handles all downstream cascade:
 *   section done → check lesson done → check chapter done → check module done
 *
 * Also awards fincoins to the user's profile when a lesson is completed.
 *
 * Returns a result object describing what was newly completed.
 */
export const completeSection = async (lessonId, sectionIndex) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const found = findLesson(lessonId);
  if (!found) return null;

  const { lesson, chapter, module: mod } = found;
  const sectionId = buildSectionId(lessonId, sectionIndex);
  const totalSections = getSectionCount(lessonId);

  // ── Fetch current progress ──────────────────────────────────────────────
  const progressRef = doc(db, 'progress', uid);
  const progressSnap = await getDoc(progressRef);
  const current = progressSnap.exists() ? progressSnap.data() : {};

  const completedSections  = current.completedSections  ?? [];
  const completedLessons   = current.completedLessons   ?? [];
  const completedChapters  = current.completedChapters  ?? [];
  const completedModules   = current.completedModules   ?? [];

  // ── Build updates object ────────────────────────────────────────────────
  const updates = {};
  const result = {
    sectionId,
    lessonCompleted  : false,
    chapterCompleted : false,
    moduleCompleted  : false,
    fincoinsDelta    : 0,
    lessonId,
    chapterId        : chapter.id,
    moduleId         : mod.id,
    lesson,
    chapter,
    module           : mod,
  };

  // 1. Mark section complete
  if (!completedSections.includes(sectionId)) {
    updates.completedSections = [...completedSections, sectionId];
  } else {
    // Already completed — return early with no changes
    return result;
  }

  const newCompletedSections = updates.completedSections ?? completedSections;

  // 2. Check if all sections in this lesson are now done
  const allSectionsDone = Array.from({ length: totalSections }, (_, i) =>
    buildSectionId(lessonId, i)
  ).every(sid => newCompletedSections.includes(sid));

  if (allSectionsDone && !completedLessons.includes(lessonId)) {
    updates.completedLessons = [...completedLessons, lessonId];
    result.lessonCompleted = true;
    result.fincoinsDelta = lesson.fincoins ?? 55;

    // Award fincoins to user profile
    await updateDoc(doc(db, 'users', uid), {
      finCoins: increment(result.fincoinsDelta),
    });

    const newCompletedLessons = updates.completedLessons;

    // 3. Check if all lessons in the chapter are now done
    const chapterLessonIds = getLessonIdsInChapter(chapter.id);
    const allLessonsDone = chapterLessonIds.every(lid =>
      newCompletedLessons.includes(lid)
    );

    if (allLessonsDone && !completedChapters.includes(chapter.id)) {
      updates.completedChapters = [...completedChapters, chapter.id];
      result.chapterCompleted = true;

      const newCompletedChapters = updates.completedChapters;

      // 4. Check if all chapters in the module are now done
      const allChaptersDone = mod.chapters
        .map(c => c.id)
        .every(cid => newCompletedChapters.includes(cid));

      if (allChaptersDone && !completedModules.includes(mod.id)) {
        updates.completedModules = [...completedModules, mod.id];
        result.moduleCompleted = true;
      }
    }
  }

  // ── Write all updates in one call ───────────────────────────────────────
  if (Object.keys(updates).length > 0) {
    await setDoc(progressRef, updates, { merge: true });
  }

  return result;
};

// ─── Convenience checkers (for UI components) ─────────────────────────────────

export const isSectionComplete = (sectionId, completedSections) =>
  completedSections.includes(sectionId);

export const isLessonComplete = (lessonId, completedLessons) =>
  completedLessons.includes(lessonId);

export const isChapterComplete = (chapterId, completedChapters) =>
  completedChapters.includes(chapterId);

export const isModuleComplete = (moduleId, completedModules) =>
  completedModules.includes(moduleId);

/**
 * Returns how many sections of a lesson are completed (0–4).
 * Useful for partial progress indicators.
 */
export const getSectionsCompletedCount = (lessonId, completedSections) => {
  const total = getSectionCount(lessonId);
  return Array.from({ length: total }, (_, i) =>
    buildSectionId(lessonId, i)
  ).filter(sid => completedSections.includes(sid)).length;
};