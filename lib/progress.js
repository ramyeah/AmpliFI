/**
 * lib/progress.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all lesson/chapter/module progress logic.
 *
 * Firestore layout:
 *   progress/{uid}          — completedSections[], completedLessons[],
 *                             completedChapters[], completedModules[]
 *   users/{uid}             — finCoins (number), xp (number), streak, etc.
 *
 * Key functions:
 *   completeSection(lessonId, sectionIndex)
 *     → called the FIRST TIME a user finishes a section.
 *     → awards fincoins for the lesson when all sections are done.
 *     → cascades to chapter + module completion.
 *
 *   redoSection(lessonId, sectionIndex)
 *     → called when a user REDOES an already-completed section.
 *     → awards NO fincoins — fincoins are only earned on first completion.
 *     → does NOT re-trigger lesson/chapter/module cascade.
 *
 *   syncProfileAfterSection(result)
 *     → call after completeSection() or redoSection() to keep Zustand in sync.
 *     → merges finCoinsDelta + new completedLessons into the profile store.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { auth, db } from './firebase';
import { MODULES } from '../constants/modules';
import useUserStore from '../store/userStore';
import { useLessonStore } from '../store/useLessonStore'; // ← ADDED

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export const findLesson = (lessonId) => {
  for (const mod of MODULES) {
    for (const chapter of mod.chapters) {
      for (const lesson of chapter.lessons) {
        if (lesson.id === lessonId) return { lesson, chapter, module: mod };
      }
    }
  }
  return null;
};

export const getLessonIdsInChapter = (chapterId) => {
  for (const mod of MODULES) {
    for (const chapter of mod.chapters) {
      if (chapter.id === chapterId) return chapter.lessons.map(l => l.id);
    }
  }
  return [];
};

export const getLessonIdsInModule = (moduleId) => {
  const mod = MODULES.find(m => m.id === moduleId);
  return mod ? mod.chapters.flatMap(c => c.lessons.map(l => l.id)) : [];
};

export const getSectionCount = (lessonId) => {
  const found = findLesson(lessonId);
  return found?.lesson?.sections?.length ?? 4;
};

export const buildSectionId = (lessonId, sectionIndex) =>
  `${lessonId}-s${sectionIndex + 1}`;

export const getNextLesson = (lessonId) => {
  const allLessons = MODULES.flatMap(m => m.chapters.flatMap(c => c.lessons));
  const idx = allLessons.findIndex(l => l.id === lessonId);
  return idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
};

export const getNextChapter = (chapterId) => {
  for (const mod of MODULES) {
    const idx = mod.chapters.findIndex(c => c.id === chapterId);
    if (idx >= 0)
      return idx < mod.chapters.length - 1 ? mod.chapters[idx + 1] : null;
  }
  return null;
};

export const getNextModule = (moduleId) => {
  const idx = MODULES.findIndex(m => m.id === moduleId);
  return idx >= 0 && idx < MODULES.length - 1 ? MODULES[idx + 1] : null;
};

// ─── Firestore read ───────────────────────────────────────────────────────────

export const getProgress = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return emptyProgress();

  const snap = await getDoc(doc(db, 'progress', uid));
  if (!snap.exists()) return emptyProgress();

  const data = snap.data();
  return {
    completedSections:  data.completedSections  ?? [],
    completedLessons:   data.completedLessons   ?? [],
    completedChapters:  data.completedChapters  ?? [],
    completedModules:   data.completedModules   ?? [],
  };
};

const emptyProgress = () => ({
  completedSections:  [],
  completedLessons:   [],
  completedChapters:  [],
  completedModules:   [],
});

// ─── completeSection ──────────────────────────────────────────────────────────

/**
 * Called the FIRST TIME a user finishes a section.
 * Safe to call multiple times — arrayUnion is idempotent.
 * Awards lesson fincoins only once (when all sections are newly done).
 */
export const completeSection = async (lessonId, sectionIndex) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const found = findLesson(lessonId);
  if (!found) return null;

  const { lesson, chapter, module: mod } = found;
  const sectionId     = buildSectionId(lessonId, sectionIndex);
  const totalSections = getSectionCount(lessonId);
  const progressRef   = doc(db, 'progress', uid);

  const result = {
    sectionId,
    lessonCompleted:  false,
    chapterCompleted: false,
    moduleCompleted:  false,
    fincoinsDelta:    0,
    lessonId,
    chapterId:        chapter.id,
    moduleId:         mod.id,
    lesson, chapter,
    module:           mod,
    isRedo:           false,
  };

  // Step 1: mark section complete (idempotent)
  await updateDoc(progressRef, {
    completedSections: arrayUnion(sectionId),
  }).catch(async () => {
    await setDoc(progressRef, { completedSections: [sectionId] }, { merge: true });
  });

  // Step 2: read back committed state
  const snap    = await getDoc(progressRef);
  const current = snap.exists() ? snap.data() : {};

  const completedSections  = current.completedSections  ?? [];
  const completedLessons   = current.completedLessons   ?? [];
  const completedChapters  = current.completedChapters  ?? [];
  const completedModules   = current.completedModules   ?? [];

  // Already completed this lesson — nothing more to cascade
  if (completedLessons.includes(lessonId)) return result;

  // Step 3: check if all sections are now done
  const allSectionIds   = Array.from({ length: totalSections }, (_, i) => buildSectionId(lessonId, i));
  const allSectionsDone = allSectionIds.every(sid => completedSections.includes(sid));

  if (!allSectionsDone) return result;

  // Step 4: lesson complete
  result.lessonCompleted = true;
  result.fincoinsDelta   = lesson.fincoins ?? 55;

  const cascadeUpdates = {
    completedLessons: arrayUnion(lessonId),
  };

  // Award fincoins + XP to users/{uid}
  await updateDoc(doc(db, 'users', uid), {
    finCoins: increment(result.fincoinsDelta),
    xp:       increment(result.fincoinsDelta), // XP mirrors fincoins
  });

  // Step 5: chapter cascade
  const chapterLessonIds    = getLessonIdsInChapter(chapter.id);
  const newCompletedLessons = [...new Set([...completedLessons, lessonId])];
  const allLessonsDone      = chapterLessonIds.every(lid => newCompletedLessons.includes(lid));

  if (allLessonsDone && !completedChapters.includes(chapter.id)) {
    cascadeUpdates.completedChapters = arrayUnion(chapter.id);
    result.chapterCompleted = true;

    // Step 6: module cascade
    const newCompletedChapters = [...new Set([...completedChapters, chapter.id])];
    const allChaptersDone      = mod.chapters.map(c => c.id)
      .every(cid => newCompletedChapters.includes(cid));

    if (allChaptersDone && !completedModules.includes(mod.id)) {
      cascadeUpdates.completedModules = arrayUnion(mod.id);
      result.moduleCompleted = true;
    }
  }

  await updateDoc(progressRef, cascadeUpdates);
  return result;
};

// ─── redoSection ─────────────────────────────────────────────────────────────

/**
 * Called when a user REDOES an already-completed section.
 * No fincoins or XP are awarded — fincoins are only earned once, on first completion.
 * Does NOT re-trigger lesson/chapter/module cascade.
 *
 * @param {string} lessonId       e.g. '2-2'
 * @param {number} sectionIndex   0-based index
 */
export const redoSection = async (lessonId, sectionIndex) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const found = findLesson(lessonId);
  if (!found) return null;

  const { lesson, chapter, module: mod } = found;
  const sectionId = buildSectionId(lessonId, sectionIndex);

  // No fincoins awarded for redos
  return {
    sectionId,
    lessonCompleted:  false,
    chapterCompleted: false,
    moduleCompleted:  false,
    fincoinsDelta:    0,
    lessonId,
    chapterId:        chapter.id,
    moduleId:         mod.id,
    lesson, chapter,
    module:           mod,
    isRedo:           true,
  };
};

// ─── syncProfileAfterSection ─────────────────────────────────────────────────

/**
 * Merges a completeSection() or redoSection() result into Zustand's profile.
 * Call this immediately after either function returns so the UI reflects
 * the new finCoins balance and completedLessons without a full reload.
 *
 * Usage:
 *   const result = await completeSection(lessonId, sectionIndex);
 *   if (result) syncProfileAfterSection(result);
 */
export const syncProfileAfterSection = (result) => {
  if (!result || result.fincoinsDelta === 0) return;

  const store   = useUserStore.getState();
  const profile = store.profile ?? {};

  const updatedProfile = {
    ...profile,
    finCoins: (profile.finCoins ?? 0) + result.fincoinsDelta,
    xp:       (profile.xp       ?? 0) + result.fincoinsDelta,
  };

  // If the lesson was newly completed, add it to the in-memory array
  // so simulate.js unlock logic picks it up immediately.
  if (result.lessonCompleted && !result.isRedo) {
    const existing = profile.completedLessons ?? [];
    if (!existing.includes(result.lessonId)) {
      updatedProfile.completedLessons = [...existing, result.lessonId];
    }
  }

  if (result.chapterCompleted && !result.isRedo) {
    const existing = profile.completedChapters ?? [];
    if (!existing.includes(result.chapterId)) {
      updatedProfile.completedChapters = [...existing, result.chapterId];
    }
  }

  if (result.moduleCompleted && !result.isRedo) {
    const existing = profile.completedModules ?? [];
    if (!existing.includes(result.moduleId)) {
      updatedProfile.completedModules = [...existing, result.moduleId];
    }
  }

  store.setProfile(updatedProfile);
};

// ─── Convenience checkers ─────────────────────────────────────────────────────

export const isSectionComplete  = (sectionId,  arr) => arr.includes(sectionId);
export const isLessonComplete   = (lessonId,   arr) => arr.includes(lessonId);
export const isChapterComplete  = (chapterId,  arr) => arr.includes(chapterId);
export const isModuleComplete   = (moduleId,   arr) => arr.includes(moduleId);

export const getSectionsCompletedCount = (lessonId, completedSections) => {
  const total = getSectionCount(lessonId);
  return Array.from({ length: total }, (_, i) => buildSectionId(lessonId, i))
    .filter(sid => completedSections.includes(sid)).length;
};

// ─── Dev: reset all progress ──────────────────────────────────────────────────

export const resetProgress = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  // 1. Reset Firestore progress/{uid}
  await setDoc(doc(db, 'progress', uid), {
    completedSections:  [],
    completedLessons:   [],
    completedChapters:  [],
    completedModules:   [],
  });

  // 2. Reset finCoins and xp in users/{uid}
  await updateDoc(doc(db, 'users', uid), {
    finCoins: 0,
    xp:       0,
  });

  // 3. Reset useLessonStore (Zustand + Firestore subcollection) ← ADDED
  await useLessonStore.getState().resetStore(uid);

  // 4. Wipe useUserStore (Zustand)
  const store = useUserStore.getState();
  store.setProfile({
    ...(store.profile ?? {}),
    finCoins:           0,
    xp:                 0,
    completedSections:  [], // ← ADDED
    completedLessons:   [],
    completedChapters:  [],
    completedModules:   [],
  });
};