// store/userStore.js
import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const useUserStore = create((set) => ({
  profile: null,

  setProfile: (profile) => set({ profile }),

  clearProfile: () => set({ profile: null }),

  /**
   * loadProfile(uid)
   *
   * Fetches the user doc from users/{uid} AND the progress doc from
   * progress/{uid}, then merges them into a single profile object in Zustand.
   *
   * Call this once on login/auth state change — everywhere else just use
   * setProfile() for incremental updates.
   */
  loadProfile: async (uid) => {
    try {
      const [userSnap, progressSnap] = await Promise.all([
        getDoc(doc(db, 'users', uid)),
        getDoc(doc(db, 'progress', uid)),
      ]);

      const userData     = userSnap.exists()     ? userSnap.data()     : {};
      const progressData = progressSnap.exists() ? progressSnap.data() : {};

      set({
        profile: {
          ...userData,
          // Explicit fields so the rest of the app can read them reliably
          finCoins:          userData.finCoins          ?? 0,
          xp:                userData.xp                ?? 0,
          streak:            userData.streak            ?? 0,
          riskProfile:       userData.riskProfile       ?? null,
          // Progress arrays — used by simulate.js unlock logic
          completedLessons:  progressData.completedLessons  ?? [],
          completedChapters: progressData.completedChapters ?? [],
          completedModules:  progressData.completedModules  ?? [],
        },
      });
    } catch (e) {
      console.error('loadProfile error:', e);
    }
  },
}));

export default useUserStore;