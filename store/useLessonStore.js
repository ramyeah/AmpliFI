import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useLessonStore = create((set, get) => ({
  lessonProgress: {},
  isLoaded: false,

  loadProgress: async (userId) => {
    try {
      const ref = doc(db, 'users', userId, 'progress', 'lessons');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        set({ lessonProgress: snap.data(), isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch (e) {
      console.error('loadProgress error', e);
      set({ isLoaded: true });
    }
  },

  completeLesson: async (userId, lessonId, fincoins, completedExercises) => {
    const updated = {
      ...get().lessonProgress,
      [lessonId]: { completed: true, fincoins, completedExercises },
    };
    set({ lessonProgress: updated });
    try {
      const ref = doc(db, 'users', userId, 'progress', 'lessons');
      await setDoc(ref, updated, { merge: true });
    } catch (e) {
      console.error('completeLesson error', e);
    }
  },

  isLessonComplete: (lessonId) => {
    return !!get().lessonProgress[lessonId]?.completed;
  },

  getSavedExercises: (lessonId) => {
    return get().lessonProgress[lessonId]?.completedExercises ?? {};
  },
}));