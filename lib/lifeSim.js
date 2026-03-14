/**
 * lib/lifeSim.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Firestore read/write layer for the AmpliFI persistent life simulation.
 *
 * Firestore layout:
 *   simProgress/{uid}   — full simulation state (see createSimProgress in
 *                         constants/lifeSimStages.js for the document shape)
 *
 * Key functions:
 *   loadSimProgress(uid)              → loads or creates simProgress doc
 *   saveSimProgress(uid, updates)     → partial update (merges, never overwrites)
 *   completeStage(uid, stageId, ...)  → marks stage complete, unlocks outfit,
 *                                       appends history, sets next time gate
 *   advanceMonth(uid, wallets, ...)   → records month snapshot, sets next gate
 *   updateWallet(uid, walletId, delta)→ adds delta to a specific wallet balance
 *   addWallet(uid, wallet)            → appends a new wallet to the registry
 *   canAdvanceMonth(simProgress)      → returns { canAdvance, msRemaining }
 *
 * Design rules (matching progress.js conventions):
 *   - Never use setDoc without merge:true unless explicitly creating fresh
 *   - Always catch missing docs and create them on first write
 *   - Return the full updated simProgress after every mutating call
 *   - No UI logic here — pure async data functions
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  doc, getDoc, setDoc, updateDoc,
  arrayUnion, increment,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  createSimProgress,
  buildHistoryEntry,
  MONTH_GATE_MS,
  WALLET_TEMPLATES,
  STAGES,
  canAdvanceMonth as canAdvanceMonthPure,
} from '../constants/lifeSimStages.js';
import { getNewOutfit } from '../constants/avatars';
import useUserStore from '../store/userStore';

// ─── Collection reference helper ─────────────────────────────────────────────

const simRef = (uid) => doc(db, 'simProgress', uid);

// ─── loadSimProgress ──────────────────────────────────────────────────────────
/**
 * Load the simProgress document for the current user.
 * If the document doesn't exist yet, creates it from scratch using
 * the user's current finCoins balance from Firestore.
 *
 * Returns the full simProgress object (never null).
 */
export const loadSimProgress = async (uid) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) throw new Error('loadSimProgress: no uid');

  const snap = await getDoc(simRef(uid));

  if (snap.exists()) {
    return snap.data();
  }

  // First time — read finCoins from users/{uid} to set starting balance
  const userSnap = await getDoc(doc(db, 'users', uid));
  const finCoins = userSnap.exists() ? (userSnap.data().finCoins ?? 0) : 0;

  const fresh = createSimProgress(uid, finCoins);
  await setDoc(simRef(uid), fresh);
  return fresh;
};

// ─── saveSimProgress ──────────────────────────────────────────────────────────
/**
 * Partial update — merges `updates` into the simProgress doc.
 * Use for simple field updates (ffn, monthlyBudget, bankAccountId, etc.).
 * For wallets and history, use the dedicated helpers below.
 *
 * Also syncs income-relevant fields back to Zustand if they changed.
 */
export const saveSimProgress = async (uid, updates) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return null;

  const withTimestamp = { ...updates, updatedAt: Date.now() };

  await updateDoc(simRef(uid), withTimestamp).catch(async () => {
    // Doc doesn't exist yet — create it first, then apply updates
    const fresh = await loadSimProgress(uid);
    await updateDoc(simRef(uid), withTimestamp);
    return fresh;
  });

  // Return fresh state
  const snap = await getDoc(simRef(uid));
  return snap.exists() ? snap.data() : null;
};

// ─── updateWallet ─────────────────────────────────────────────────────────────
/**
 * Adds `delta` (positive or negative SGD) to a specific wallet's balance.
 * Reads the full wallets array, mutates the target wallet, writes back.
 * Returns the updated simProgress.
 *
 * @param {string} uid
 * @param {string} walletId   — wallet.id to update
 * @param {number} delta      — SGD amount (positive = deposit, negative = withdrawal)
 */
export const updateWallet = async (uid, walletId, delta) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return null;

  const snap = await getDoc(simRef(uid));
  if (!snap.exists()) return null;

  const sim     = snap.data();
  const wallets = (sim.wallets ?? []).map(w => {
    if (w.id !== walletId) return w;
    const newBalance = Math.max(0, (w.balance ?? 0) + delta);
    return { ...w, balance: Math.round(newBalance * 100) / 100 };
  });

  await updateDoc(simRef(uid), { wallets, updatedAt: Date.now() });

  return { ...sim, wallets };
};

// ─── transferBetweenWallets ───────────────────────────────────────────────────
/**
 * Moves `amount` SGD from one wallet to another atomically.
 * Clamps the transfer to the available balance of the source wallet.
 * Returns the updated simProgress.
 */
export const transferBetweenWallets = async (uid, fromWalletId, toWalletId, amount) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return null;

  const snap = await getDoc(simRef(uid));
  if (!snap.exists()) return null;

  const sim     = snap.data();
  const wallets = sim.wallets ?? [];

  const from = wallets.find(w => w.id === fromWalletId);
  const to   = wallets.find(w => w.id === toWalletId);
  if (!from || !to) return sim;

  // Clamp to available balance
  const actual = Math.min(amount, from.balance ?? 0);
  if (actual <= 0) return sim;

  const updated = wallets.map(w => {
    if (w.id === fromWalletId)
      return { ...w, balance: Math.round(((w.balance ?? 0) - actual) * 100) / 100 };
    if (w.id === toWalletId)
      return { ...w, balance: Math.round(((w.balance ?? 0) + actual) * 100) / 100 };
    return w;
  });

  await updateDoc(simRef(uid), { wallets: updated, updatedAt: Date.now() });
  return { ...sim, wallets: updated };
};

// ─── addWallet ────────────────────────────────────────────────────────────────
/**
 * Appends a new wallet to the wallets array.
 * Called when the user unlocks a new account (Stage 4 bank, Stage 5 fund, etc.).
 * Returns the updated simProgress.
 */
export const addWallet = async (uid, wallet) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return null;

  const snap = await getDoc(simRef(uid));
  if (!snap.exists()) return null;

  const sim = snap.data();

  // Prevent duplicates
  if ((sim.wallets ?? []).some(w => w.id === wallet.id)) return sim;

  const wallets = [...(sim.wallets ?? []), wallet];
  await updateDoc(simRef(uid), { wallets, updatedAt: Date.now() });
  return { ...sim, wallets };
};

// ─── completeStage ────────────────────────────────────────────────────────────
/**
 * Marks a stage as complete. Handles:
 *   - Adding stageId to completedStages[]
 *   - Unlocking the outfit item for this stage
 *   - Appending a history entry for the current month
 *   - Advancing currentStage to the next stage
 *   - Setting the next month time gate
 *   - Awarding FinCoins for stage completion (50 coins per stage)
 *
 * @param {string} uid
 * @param {string} stageId          — e.g. 'stage-2'
 * @param {object} decisions        — stage-specific decision data to record
 * @param {object} wallets          — current wallet array (for snapshot)
 * @param {object} eventFired       — emergency event that fired (Stage 5 only, or null)
 *
 * Returns the updated simProgress.
 */
export const completeStage = async (uid, stageId, decisions = {}, wallets = [], eventFired = null) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return null;

  const snap = await getDoc(simRef(uid));
  if (!snap.exists()) return null;

  const sim = snap.data();

  // Prevent double-completion
  if ((sim.completedStages ?? []).includes(stageId)) return sim;

  // Outfit unlock for this stage
  const outfit      = getNewOutfit(stageId);
  const newOutfits  = outfit
    ? [...(sim.unlockedOutfits ?? []), outfit.id]
    : (sim.unlockedOutfits ?? []);

  // History entry
  const historyEntry = buildHistoryEntry(
    sim.currentMonth ?? 1,
    wallets.length ? wallets : (sim.wallets ?? []),
    eventFired,
    decisions,
  );

  // Determine next stage id
  const stageNumbers  = STAGES.map(s => s.id);
  const currentIdx    = stageNumbers.indexOf(stageId);
  const nextStage     = currentIdx >= 0 && currentIdx < stageNumbers.length - 1
    ? stageNumbers[currentIdx + 1]
    : null;

  // Time gate — next month available in 4 hours
  // (first month of each stage is immediate, so gate kicks in AFTER stage completes)
  const nextMonthAvailableAt = Date.now() + MONTH_GATE_MS;

  const updates = {
    completedStages:       arrayUnion(stageId),
    unlockedOutfits:       newOutfits,
    history:               arrayUnion(historyEntry),
    nextMonthAvailableAt,
    updatedAt:             Date.now(),
    ...(nextStage ? { currentStage: nextStage } : {}),
    ...(wallets.length ? { wallets } : {}),
  };

  await updateDoc(simRef(uid), updates);

  // Award FinCoins for stage completion
  const coinAward = 50;
  await updateDoc(doc(db, 'users', uid), {
    finCoins: increment(coinAward),
    xp:       increment(coinAward),
  });

  // Sync to Zustand
  syncSimToStore(coinAward);

  const updated = await getDoc(simRef(uid));
  return updated.exists() ? updated.data() : null;
};

// ─── advanceMonth ─────────────────────────────────────────────────────────────
/**
 * Advances the simulation by one month.
 * - Checks the 4-hour time gate first
 * - Appends a history snapshot
 * - Applies monthly interest to all wallets with interestRate > 0
 * - Increments currentMonth
 * - Sets the next time gate
 *
 * Returns { success: bool, sim: simProgress, msRemaining: number }
 */
export const advanceMonth = async (uid, eventFired = null, decisions = {}) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return { success: false, sim: null, msRemaining: 0 };

  const snap = await getDoc(simRef(uid));
  if (!snap.exists()) return { success: false, sim: null, msRemaining: 0 };

  const sim = snap.data();

  // Check time gate
  const { canAdvance, msRemaining } = canAdvanceMonthPure(sim.nextMonthAvailableAt);
  if (!canAdvance) return { success: false, sim, msRemaining };

  const currentMonth = (sim.currentMonth ?? 1);

  // Apply monthly interest to all interest-bearing wallets
  const wallets = (sim.wallets ?? []).map(w => {
    if (!w.interestRate || w.interestRate <= 0) return w;
    const monthlyRate    = w.interestRate / 12;
    const interestEarned = (w.balance ?? 0) * monthlyRate;
    return {
      ...w,
      balance: Math.round(((w.balance ?? 0) + interestEarned) * 100) / 100,
    };
  });

  // History snapshot
  const historyEntry = buildHistoryEntry(currentMonth, wallets, eventFired, decisions);

  // New time gate
  const nextMonthAvailableAt = Date.now() + MONTH_GATE_MS;

  await updateDoc(simRef(uid), {
    wallets,
    currentMonth:          currentMonth + 1,
    nextMonthAvailableAt,
    history:               arrayUnion(historyEntry),
    updatedAt:             Date.now(),
  });

  const updated = await getDoc(simRef(uid));
  const updatedSim = updated.exists() ? updated.data() : null;
  return { success: true, sim: updatedSim, msRemaining: 0 };
};

// ─── setGoals ─────────────────────────────────────────────────────────────────
/**
 * Saves the user's financial goals from Stage 1.
 * Also sets the FFN and retirement age.
 */
export const setGoals = async (uid, {
  ffn,
  ffnAge,
  monthlyRetirementIncome,
  goals = [],
}) => {
  return saveSimProgress(uid, {
    ffn,
    ffnAge,
    monthlyRetirementIncome,
    goals,
  });
};

// ─── setBudget ────────────────────────────────────────────────────────────────
/**
 * Saves the monthly budget allocation from Stage 2.
 * Also updates income field in case FinCoins changed since last load.
 */
export const setBudget = async (uid, { needsPct, wantsPct, savingsPct, income }) => {
  const needsAmt   = Math.round((needsPct   / 100) * income);
  const wantsAmt   = Math.round((wantsPct   / 100) * income);
  const savingsAmt = Math.round((savingsPct / 100) * income);

  return saveSimProgress(uid, {
    income,
    monthlyBudget: {
      needs:    needsPct,
      wants:    wantsPct,
      savings:  savingsPct,
      needsAmt,
      wantsAmt,
      savingsAmt,
    },
  });
};

// ─── setBankAccount ───────────────────────────────────────────────────────────
/**
 * Records the bank account chosen in Stage 4.
 * Creates and appends the bank wallet using the chosen BANK_ACCOUNTS entry.
 * Transfers the existing wallet balance into the new bank account.
 */
export const setBankAccount = async (uid, bankAccount) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return null;

  const snap = await getDoc(simRef(uid));
  if (!snap.exists()) return null;
  const sim = snap.data();

  // Get current wallet balance to transfer in
  const cashWallet    = (sim.wallets ?? []).find(w => w.id === 'wallet');
  const openingBalance = cashWallet?.balance ?? 0;

  // Build the bank wallet from the template + chosen bank data
  const bankWallet = {
    ...WALLET_TEMPLATES.bank,
    id:          bankAccount.id,
    label:       bankAccount.name,
    color:       bankAccount.color,
    colorLight:  bankAccount.colorLight,
    institution: bankAccount.bank,
    interestRate: bankAccount.baseRate,
    balance:     openingBalance,    // transfer cash wallet balance in
    unlockedAtStage: 'stage-4',
    unlockTitle: 'Bank Account Opened',
    unlockBody:  bankAccount.finNote,
  };

  // Zero out cash wallet, add bank wallet
  const wallets = (sim.wallets ?? []).map(w =>
    w.id === 'wallet' ? { ...w, balance: 0 } : w
  );
  wallets.push(bankWallet);

  await updateDoc(simRef(uid), {
    bankAccountId: bankAccount.id,
    wallets,
    updatedAt: Date.now(),
  });

  const updated = await getDoc(simRef(uid));
  return updated.exists() ? updated.data() : null;
};

// ─── addEmergencyFund ─────────────────────────────────────────────────────────
/**
 * Creates the emergency fund wallet at the start of Stage 5.
 * Links it to the user's bank account.
 * Target = monthlyNeeds × 3.
 */
export const addEmergencyFund = async (uid) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return null;

  const snap = await getDoc(simRef(uid));
  if (!snap.exists()) return null;
  const sim = snap.data();

  const monthlyNeeds   = sim.monthlyBudget?.needsAmt ?? 0;
  const bankAccountId  = sim.bankAccountId ?? 'wallet';
  const bankAccount    = (sim.wallets ?? []).find(w => w.id === bankAccountId);

  const fundWallet = {
    ...WALLET_TEMPLATES.emergencyFund,
    target:      monthlyNeeds * 3,
    institution: bankAccount?.institution ?? null,
    linkedTo:    bankAccountId,
    interestRate: bankAccount?.interestRate ?? 0.0005,
    balance:     0,
  };

  return addWallet(uid, fundWallet);
};

// ─── allocateMonthlySavings ───────────────────────────────────────────────────
/**
 * Distributes the monthly savings amount across active goals.
 * `allocations` is an array of { walletId, amount } objects.
 * Total of all amounts should not exceed the monthly savings budget.
 * Transfers from the bank account (or cash wallet) to each target wallet.
 *
 * Returns updated simProgress.
 */
export const allocateMonthlySavings = async (uid, allocations = []) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return null;
  if (!allocations.length) return null;

  const snap = await getDoc(simRef(uid));
  if (!snap.exists()) return null;
  const sim = snap.data();

  const sourceId = sim.bankAccountId ?? 'wallet';
  let wallets    = [...(sim.wallets ?? [])];

  // Apply all transfers
  for (const { walletId, amount } of allocations) {
    if (!amount || amount <= 0) continue;

    wallets = wallets.map(w => {
      if (w.id === sourceId) {
        return { ...w, balance: Math.max(0, (w.balance ?? 0) - amount) };
      }
      if (w.id === walletId) {
        // Respect target cap for fund-type wallets
        const newBalance = (w.balance ?? 0) + amount;
        const capped     = w.target ? Math.min(newBalance, w.target) : newBalance;
        return { ...w, balance: Math.round(capped * 100) / 100 };
      }
      return w;
    });
  }

  await updateDoc(simRef(uid), { wallets, updatedAt: Date.now() });
  const updated = await getDoc(simRef(uid));
  return updated.exists() ? updated.data() : null;
};

// ─── applyEmergencyEvent ──────────────────────────────────────────────────────
/**
 * Applies a near-miss emergency event (Stage 5).
 * Deducts the amount from the bank account balance.
 * Does NOT touch the emergency fund (near-miss framing — Fin shows
 * the parallel path where the fund would have absorbed it).
 *
 * Returns updated simProgress.
 */
export const applyEmergencyEvent = async (uid, event) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return null;

  const snap = await getDoc(simRef(uid));
  if (!snap.exists()) return null;
  const sim = snap.data();

  const sourceId = sim.bankAccountId ?? 'wallet';
  return updateWallet(uid, sourceId, -event.amount);
};

// ─── resetSimProgress ─────────────────────────────────────────────────────────
/**
 * Dev helper — wipes the simProgress document and starts fresh.
 * Mirrors resetProgress() in lib/progress.js.
 */
export const resetSimProgress = async (uid) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return;

  const userSnap = await getDoc(doc(db, 'users', uid));
  const finCoins = userSnap.exists() ? (userSnap.data().finCoins ?? 0) : 0;

  const fresh = createSimProgress(uid, finCoins);
  await setDoc(simRef(uid), fresh);
  return fresh;
};

// ─── Zustand sync helper ──────────────────────────────────────────────────────
/**
 * After any sim action that awards FinCoins, sync the delta into Zustand
 * so the home tab and dashboard reflect it immediately without a reload.
 */
function syncSimToStore(coinDelta) {
  if (!coinDelta) return;
  const store   = useUserStore.getState();
  const profile = store.profile ?? {};
  store.setProfile({
    ...profile,
    finCoins: (profile.finCoins ?? 0) + coinDelta,
    xp:       (profile.xp       ?? 0) + coinDelta,
  });
}

// ─── getWallet / getWalletBalance convenience helpers ─────────────────────────

export function getWallet(sim, walletId) {
  return (sim?.wallets ?? []).find(w => w.id === walletId) ?? null;
}

export function getWalletBalance(sim, walletId) {
  return getWallet(sim, walletId)?.balance ?? 0;
}

export function getTotalBalance(sim) {
  return (sim?.wallets ?? []).reduce((sum, w) => sum + (w.balance ?? 0), 0);
}

// Re-export pure helper so screens only need to import from one place
export { canAdvanceMonthPure as canAdvanceMonth };