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
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  arrayUnion, increment,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  createSimProgress,
  buildHistoryEntry,
  MONTH_GATE_MS,
  WALLET_TEMPLATES,
  STAGES,
  RESET_FINCOIN_BALANCE,
  canAdvanceMonth as canAdvanceMonthPure,
  createSavingsGoalWallet,
  createEmergencyFundWallet,
} from '../constants/lifeSimStages.js';
import { QUEST_MAP, ADVANCE_REQUIREMENT } from '../constants/questRoadmap.js';
import { getNewOutfit } from '../constants/avatars';
import useUserStore from '../store/userStore';

// ─── Collection reference helper ─────────────────────────────────────────────

const simRef = (uid) => doc(db, 'simProgress', uid);

// ─── Deep clean — strip undefined values before Firestore writes ────────────
const deepClean = (obj) => {
  if (Array.isArray(obj)) return obj.map(deepClean);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, deepClean(v)])
    );
  }
  return obj ?? null;
};

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
    const sim = snap.data();

    // ── Migration: ensure completedStages includes all stages with evidence ──
    const cs = sim.completedStages ?? [];
    const missing = [];
    if (sim.stage1Data && !cs.includes('stage-1')) missing.push('stage-1');
    if (sim.stage2Data && !cs.includes('stage-2')) missing.push('stage-2');
    if (sim.stage3Data && !cs.includes('stage-3')) missing.push('stage-3');
    if (sim.stage4Data && !cs.includes('stage-4')) missing.push('stage-4');
    if (sim.stage5Data && !cs.includes('stage-5')) missing.push('stage-5');
    if (sim.stage6Data && !cs.includes('stage-6')) missing.push('stage-6');
    if (sim.investmentVehicle && cs.includes('stage-7') && !cs.includes('stage-8')) missing.push('stage-8');
    if (sim.monthlyDCA && !cs.includes('stage-9')) missing.push('stage-9');
    if (sim.marketDipChoice && !cs.includes('stage-10')) missing.push('stage-10');
    if (sim.portfolioAllocations && !cs.includes('stage-11')) missing.push('stage-11');
    if (sim.lastRebalancedMonth && !cs.includes('stage-12')) missing.push('stage-12');

    if (missing.length > 0) {
      const patched = [...cs, ...missing];
      await updateDoc(simRef(uid), { completedStages: patched });
      sim.completedStages = patched;
      console.log('Migration: added missing stages', missing);
    }

    return sim;
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

  // Queue FinCoins (flushed on month advance)
  await updateDoc(simRef(uid), { pendingFinCoins: increment(50) });

  const updated = await getDoc(simRef(uid));
  return updated.exists() ? updated.data() : null;
};

// ─── Life events ──────────────────────────────────────────────────────────────

const LIFE_EVENTS = [
  { id: 'medical_bill', emoji: '🏥', title: 'Medical Bill', description: 'An unexpected medical expense has come up.', minAmount: 200, maxAmount: 1500, category: 'health' },
  { id: 'phone_repair', emoji: '📱', title: 'Phone Repair', description: 'Your phone screen cracked and needs replacing.', minAmount: 150, maxAmount: 400, category: 'device' },
  { id: 'car_repair', emoji: '🚗', title: 'Car Repair', description: 'Your car needs urgent repairs.', minAmount: 300, maxAmount: 1200, category: 'transport' },
  { id: 'home_repair', emoji: '🔧', title: 'Home Repair', description: 'A household appliance broke down and needs replacing.', minAmount: 200, maxAmount: 800, category: 'home' },
  { id: 'travel_emergency', emoji: '✈️', title: 'Emergency Travel', description: 'A family situation requires emergency travel.', minAmount: 400, maxAmount: 1600, category: 'travel' },
  { id: 'vet_bill', emoji: '🐾', title: 'Vet Bill', description: 'An unexpected vet visit for your pet.', minAmount: 100, maxAmount: 600, category: 'health' },
  { id: 'job_bonus', emoji: '🎉', title: 'Performance Bonus', description: 'You received an unexpected performance bonus!', minAmount: 300, maxAmount: 1500, category: 'income', isPositive: true },
  { id: 'freelance', emoji: '💼', title: 'Freelance Gig', description: 'A friend referred you for a one-off freelance project.', minAmount: 200, maxAmount: 1000, category: 'income', isPositive: true },
  { id: 'tax_refund', emoji: '💰', title: 'Tax Refund', description: 'You received an unexpected tax refund.', minAmount: 150, maxAmount: 800, category: 'income', isPositive: true },
];

const getRandomLifeEvent = (sim) => {
  if ((sim.currentMonth ?? 1) < 3) return null;
  const event = LIFE_EVENTS[Math.floor(Math.random() * LIFE_EVENTS.length)];
  const amount = Math.round(
    event.minAmount + Math.random() * (event.maxAmount - event.minAmount)
  );
  return { ...event, amount };
};

// ─── advanceMonth ─────────────────────────────────────────────────────────────
/**
 * Advances the simulation by one month.
 *
 * Steps:
 *   1. Fetch simProgress
 *   2. Check gate: bank account must be open (stage-2)
 *   3. Credit salary to bank wallet (if stage-4 complete)
 *   4. Auto-deduct needs from bank wallet (if stage-3 complete)
 *   5. Apply monthly interest to all wallets
 *   6. Increment currentMonth + append history
 *   7. Sync real finCoins delta
 *   8. Return summary
 */
export const advanceMonth = async (uid) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return { canAdvance: false, reason: 'No user.' };

  const snap = await getDoc(simRef(uid));
  if (!snap.exists()) return { canAdvance: false, reason: 'No sim data.' };
  const sim = snap.data();
  const currentMonth = sim.currentMonth ?? 1;
  const completed    = sim.completedStages ?? [];

  // Gate: bank account must be open
  if (!completed.includes(ADVANCE_REQUIREMENT.stageId)) {
    return { canAdvance: false, reason: ADVANCE_REQUIREMENT.message };
  }

  let wallets = [...(sim.wallets ?? []).map(w => ({ ...w }))];

  // Credit salary (only if stage-3 complete — first paycheck quest done)
  let salaryCredit = 0;
  if (completed.includes('stage-3') && sim.income) {
    salaryCredit = sim.income;
    wallets = wallets.map(w => {
      if (w.type === 'bank') return { ...w, balance: Math.round(((w.balance ?? 0) + salaryCredit) * 100) / 100 };
      return w;
    });
  }

  // Auto-deduct needs (only if stage-4 complete — budget quest done)
  let needsDebit = 0;
  if (completed.includes('stage-4') && sim.monthlyBudget?.needsAmt) {
    needsDebit = sim.monthlyBudget.needsAmt;
    wallets = wallets.map(w => {
      if (w.type === 'bank') return { ...w, balance: Math.round(Math.max(0, (w.balance ?? 0) - needsDebit) * 100) / 100 };
      return w;
    });
  }

  // Auto-contribute to savings goal wallet — only if below target
  let savingsContribution = 0;
  const savingsGoalWallet = wallets.find(w => w.type === 'savings-goal');
  if (savingsGoalWallet && completed.includes('stage-5') && (savingsGoalWallet.balance ?? 0) < (savingsGoalWallet.target ?? 0)) {
    const sgContrib = savingsGoalWallet.monthlyContribution ?? 0;
    if (sgContrib > 0) {
      const sgBank = wallets.find(w => w.type === 'bank');
      const sgSpace = (savingsGoalWallet.target ?? 0) - (savingsGoalWallet.balance ?? 0);
      const sgActual = Math.min(sgContrib, sgSpace);
      if (sgBank && sgBank.balance >= sgActual) {
        sgBank.balance = Math.round((sgBank.balance - sgActual) * 100) / 100;
        savingsGoalWallet.balance = Math.round((savingsGoalWallet.balance + sgActual) * 100) / 100;
        savingsContribution = sgActual;
      }
    }
  }

  // Auto-contribute to emergency fund wallet — only if below target
  let efContribution = 0;
  const emergencyWallet = wallets.find(w => w.type === 'emergency');
  if (emergencyWallet && completed.includes('stage-6') && (emergencyWallet.balance ?? 0) < (emergencyWallet.target ?? 0)) {
    const efContrib = sim.stage6Data?.monthlyContribution ?? 0;
    if (efContrib > 0) {
      const efBank = wallets.find(w => w.type === 'bank');
      const efSpace = (emergencyWallet.target ?? 0) - (emergencyWallet.balance ?? 0);
      const efActual = Math.min(efContrib, efSpace);
      if (efBank && efBank.balance >= efActual) {
        efBank.balance = Math.round((efBank.balance - efActual) * 100) / 100;
        emergencyWallet.balance = Math.round((emergencyWallet.balance + efActual) * 100) / 100;
        efContribution = efActual;
      }
    }
  }

  // Auto-invest DCA + apply returns for ALL investment wallets
  let dcaContribution = 0;
  let investmentReturns = 0;
  const investmentWallets = wallets.filter(w => w.type === 'investment');
  if (completed.includes('stage-9')) {
    for (const invWallet of investmentWallets) {
      const holdings = invWallet.holdings ?? [];
      const dca = invWallet.monthlyDCA ?? sim.monthlyDCA ?? 0;
      const dcaBank = wallets.find(w => w.type === 'bank');

      // DCA contribution
      if (dca > 0 && dcaBank && (dcaBank.balance ?? 0) >= dca) {
        dcaBank.balance = Math.round(((dcaBank.balance ?? 0) - dca) * 100) / 100;
        invWallet.balance = Math.round(((invWallet.balance ?? 0) + dca) * 100) / 100;
        dcaContribution += dca;
        // Distribute DCA into holdings by allocation
        const totalAlloc = holdings.reduce((s, h) => s + (h.allocation ?? 0), 0);
        if (totalAlloc > 0 && holdings.length > 0) {
          for (const h of holdings) {
            const share = (h.allocation ?? 0) / totalAlloc;
            h.value = Math.round(((h.value ?? 0) + dca * share) * 100) / 100;
          }
        }
      }

      // Per-asset returns
      let walletReturns = 0;
      if (holdings.length > 0) {
        const ter = (invWallet.ter ?? 0.65) / 100;
        const monthlyFeeRate = ter / 12;
        for (const h of holdings) {
          const annualReturn = h.annualReturn ?? (invWallet.expectedReturn ?? 5);
          const monthlyRate = annualReturn / 100 / 12;
          const gain = (h.value ?? 0) * monthlyRate;
          const fee = (h.value ?? 0) * monthlyFeeRate;
          h.value = Math.round(((h.value ?? 0) + gain - fee) * 100) / 100;
          walletReturns += (gain - fee);
        }
        // Recalculate total and drift allocations
        const newTotal = holdings.reduce((s, h) => s + (h.value ?? 0), 0);
        holdings.forEach(h => {
          h.allocation = newTotal > 0 ? Math.round(((h.value ?? 0) / newTotal) * 1000) / 10 : 0;
        });
        invWallet.holdings = holdings;
        invWallet.balance = Math.round(newTotal * 100) / 100;
      } else {
        // No holdings — blended return
        const monthlyRate = (invWallet.expectedReturn ?? invWallet.interestRate ?? 5) / 100 / 12;
        const gain = (invWallet.balance ?? 0) * monthlyRate;
        invWallet.balance = Math.round(((invWallet.balance ?? 0) + gain) * 100) / 100;
        walletReturns += gain;
      }
      investmentReturns += Math.round(walletReturns * 100) / 100;
    }
  }

  // DCA streak tracking
  const newDcaStreak = dcaContribution > 0 ? (sim.dcaStreak ?? 0) + 1 : 0;

  // Apply monthly interest
  let interestEarned = 0;
  wallets = wallets.map(w => {
    if (!w.interestRate || w.interestRate <= 0) return w;
    const earned = (w.balance ?? 0) * (w.interestRate / 12);
    interestEarned += earned;
    return { ...w, balance: Math.round(((w.balance ?? 0) + earned) * 100) / 100 };
  });
  interestEarned = Math.round(interestEarned * 100) / 100;

  // Life event — 15% chance per month
  let lifeEvent = null;
  if (Math.random() < 0.15) {
    lifeEvent = getRandomLifeEvent(sim);
  }

  // Positive life events — auto-apply to bank
  if (lifeEvent && lifeEvent.isPositive) {
    const bankWallet = wallets.find(w => w.type === 'bank');
    if (bankWallet) bankWallet.balance = Math.round(((bankWallet.balance ?? 0) + lifeEvent.amount) * 100) / 100;
  }

  // Build history entry
  const historyEntry = {
    month: currentMonth, salaryCredit, needsDebit, interestEarned, event: lifeEvent ? lifeEvent.id : null,
    walletSnapshots: {},
    holdingSnapshots: Object.fromEntries(
      investmentWallets.flatMap(iw => (iw.holdings ?? []).map(h => [h.assetId, h.value ?? 0]))
    ),
  };
  wallets.forEach(w => { historyEntry.walletSnapshots[w.id] = Math.round(w.balance ?? 0); });

  // Write to Firestore
  await updateDoc(simRef(uid), {
    wallets,
    currentMonth:  currentMonth + 1,
    history:       arrayUnion(historyEntry),
    salaryNotif:   salaryCredit > 0,
    dcaStreak:     newDcaStreak,
    updatedAt:     Date.now(),
  });

  // Sync real finCoins: +salary, -needs, +interest
  const fcDelta = salaryCredit - needsDebit + interestEarned + investmentReturns;
  if (fcDelta !== 0) {
    await updateDoc(doc(db, 'users', uid), {
      finCoins: increment(fcDelta),
      xp:       increment(Math.max(0, fcDelta)),
    });
    syncSimToStore(fcDelta);
  }

  // Check for newly completed savings goals
  const completedGoals = [];
  wallets.forEach(w => {
    if (w.type === 'savings-goal' && w.target > 0 && (w.balance ?? 0) >= w.target) {
      const prevBal = (sim.wallets ?? []).find(pw => pw.id === w.id)?.balance ?? 0;
      if (prevBal < w.target) {
        completedGoals.push({
          id: w.id,
          label: w.label,
          target: w.target,
          balance: w.balance,
          interestEarned: Math.max(0, (w.balance ?? 0) - w.target),
          monthsActive: (sim.currentMonth ?? 1) - (w.openedMonth ?? 1),
        });
      }
    }
  });

  const updated = await getDoc(simRef(uid));
  return {
    canAdvance:    true,
    newMonth:      currentMonth + 1,
    salaryCredit,
    needsDebit,
    interestEarned,
    savingsContribution,
    efContribution,
    dcaContribution,
    investmentReturns,
    completedGoals,
    lifeEvent,
    wallets:       updated.exists() ? updated.data().wallets : wallets,
  };
};

// ─── closeSavingsGoalAccount ────────────────────────────────────────────────
export const closeSavingsGoalAccount = async (uid, walletId) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(simRef(uid));
  if (!snap.exists()) return null;
  const sim = snap.data();

  const goalWallet = (sim.wallets ?? []).find(w => w.id === walletId);
  if (!goalWallet) return null;
  const goalBalance = goalWallet.balance ?? 0;
  const bankWallet = (sim.wallets ?? []).find(w => w.type === 'bank');
  if (!bankWallet) return null;

  const updatedWallets = (sim.wallets ?? [])
    .filter(w => w.id !== walletId)
    .map(w => w.id === bankWallet.id ? { ...w, balance: (w.balance ?? 0) + goalBalance } : w);

  await updateDoc(simRef(uid), { wallets: updatedWallets, updatedAt: Date.now() });
  return { closedWallet: goalWallet, returnedAmount: goalBalance, bankWalletName: bankWallet.label };
};

// ─── advanceMultipleMonths ──────────────────────────────────────────────────
/**
 * Calls advanceMonth in a loop `count` times.
 * Stops early if any call returns canAdvance: false.
 */
export const advanceMultipleMonths = async (uid, count = 1) => {
  if (!uid) uid = auth.currentUser?.uid;
  let totalSalary = 0, totalNeeds = 0, totalInterest = 0, totalDCA = 0, totalReturns = 0;
  let stoppedAt = null, finalMonth = null;
  const allCompletedGoals = [];
  const milestones = [];

  for (let i = 0; i < count; i++) {
    const result = await advanceMonth(uid);
    if (!result.canAdvance) { stoppedAt = i + 1; break; }

    totalSalary  += result.salaryCredit ?? 0;
    totalNeeds   += result.needsDebit ?? 0;
    totalInterest += result.interestEarned ?? 0;
    totalDCA     += result.dcaContribution ?? 0;
    totalReturns += result.investmentReturns ?? 0;
    finalMonth    = result.newMonth;
    if (result.completedGoals?.length > 0) allCompletedGoals.push(...result.completedGoals);

    // Check wallet states for milestones
    const snap = await getDoc(simRef(uid));
    if (snap.exists()) {
      const wallets = snap.data().wallets ?? [];
      const efW = wallets.find(w => w.type === 'emergency');
      if (efW?.target > 0) {
        const efPct = Math.round(((efW.balance ?? 0) / efW.target) * 100);
        if (efPct >= 100 && !milestones.find(m => m.type === 'ef-complete'))
          milestones.push({ type: 'ef-complete', label: 'Emergency fund fully funded', icon: '\uD83D\uDEE1\uFE0F', value: Math.round(efW.balance), pct: 100 });
        else if (efPct >= 50 && !milestones.find(m => m.type === 'ef-50') && !milestones.find(m => m.type === 'ef-complete'))
          milestones.push({ type: 'ef-50', label: 'Emergency fund 50% funded', icon: '\uD83D\uDEE1\uFE0F', value: Math.round(efW.balance), pct: efPct });
      }
      const sgW = wallets.find(w => w.type === 'savings-goal');
      if (sgW?.target > 0 && sgW.balance < sgW.target) {
        const idx = milestones.findIndex(m => m.type === 'sg-progress');
        if (idx >= 0) milestones.splice(idx, 1);
        milestones.push({ type: 'sg-progress', label: sgW.label ?? 'Savings Goal', icon: '\uD83C\uDFAF', value: Math.round(sgW.balance), target: Math.round(sgW.target), pct: Math.round(((sgW.balance ?? 0) / sgW.target) * 100) });
      }
    }
  }

  // Final wallet states for summary
  const finalSnap = await getDoc(simRef(uid));
  const finalWallets = finalSnap.exists() ? (finalSnap.data().wallets ?? []) : [];
  const finalEF = finalWallets.find(w => w.type === 'emergency');
  const finalSG = finalWallets.find(w => w.type === 'savings-goal');

  return {
    totalSalary, totalNeeds, totalInterest, totalDCA, totalReturns,
    finalMonth, stoppedEarly: stoppedAt != null, stoppedAt,
    completedGoals: allCompletedGoals, milestones,
    finalEFPct: finalEF?.target > 0 ? Math.round(((finalEF.balance ?? 0) / finalEF.target) * 100) : null,
    finalSGPct: finalSG?.target > 0 ? Math.round(((finalSG.balance ?? 0) / finalSG.target) * 100) : null,
    finalEFBalance: finalEF ? Math.round(finalEF.balance ?? 0) : null,
    finalSGBalance: finalSG ? Math.round(finalSG.balance ?? 0) : null,
    finalEFTarget: finalEF ? Math.round(finalEF.target ?? 0) : null,
    finalSGTarget: finalSG ? Math.round(finalSG.target ?? 0) : null,
    finalSGLabel: finalSG?.label ?? null,
  };
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

  // Get current wallet balance and calculate deposit
  const cashWallet     = (sim.wallets ?? []).find(w => w.id === 'wallet');
  const fullCashBalance = cashWallet?.balance ?? 0;
  const depositAmount  = bankAccount.openingBalance ?? fullCashBalance;
  const remainingCash  = Math.max(0, fullCashBalance - depositAmount);

  // Build the bank wallet from the template + chosen bank data
  const bankWallet = deepClean({
    ...WALLET_TEMPLATES.bank,
    id:           bankAccount.id,
    label:        bankAccount.name ?? 'Bank Account',
    accountType:  bankAccount.accountType ?? 'basic',
    color:        bankAccount.color ?? null,
    colorLight:   bankAccount.colorLight ?? null,
    institution:  bankAccount.bank ?? bankAccount.name ?? null,
    interestRate: bankAccount.baseRate ?? 0,
    balance:      depositAmount,
    unlockedAtStage: 'stage-4',
    unlockTitle:  'Bank Account Opened',
    unlockBody:   bankAccount.finNote ?? null,
  });

  // Deduct deposit from cash wallet, add bank wallet
  const wallets = (sim.wallets ?? []).map(w =>
    w.id === 'wallet' ? { ...w, balance: remainingCash } : w
  );
  wallets.push(bankWallet);

  await updateDoc(simRef(uid), deepClean({
    bankAccountId: bankAccount.id,
    stage2Data: {
      bankId:         bankAccount.id,
      bankName:       bankAccount.bank ?? bankAccount.name ?? null,
      accountType:    bankAccount.accountType ?? 'basic',
      openingBalance: depositAmount,
    },
    wallets,
    updatedAt: Date.now(),
  }));

  const updated = await getDoc(simRef(uid));
  return updated.exists() ? updated.data() : null;
};

// ─── openSavingsGoalAccount ──────────────────────────────────────────────────
export const openSavingsGoalAccount = async (uid, goalData) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(simRef(uid));
  if (!snap.exists()) return null;
  const sim = snap.data();

  const bankWallet = (sim.wallets ?? []).find(w => w.type === 'bank');
  const parentInterestRate = bankWallet?.interestRate ?? 0.0005;

  const newWallet = deepClean(createSavingsGoalWallet(
    goalData.goalName ?? 'Savings Goal',
    goalData.targetAmount ?? 0,
    goalData.monthlyContribution ?? 0,
    sim.stage2Data?.bankName ?? 'Your Bank',
    parentInterestRate,
  ));

  const updatedWallets = [...(sim.wallets ?? []), newWallet];

  await updateDoc(simRef(uid), deepClean({
    wallets: updatedWallets,
    stage5Data: {
      goalName: goalData.goalName ?? 'Savings Goal',
      targetAmount: goalData.targetAmount ?? 0,
      targetDate: goalData.targetDate ?? null,
      monthlyContribution: goalData.monthlyContribution ?? 0,
    },
    updatedAt: Date.now(),
  }));

  return { wallet: newWallet };
};

// ─── openEmergencyFundAccount ────────────────────────────────────────────────
export const openEmergencyFundAccount = async (uid, monthsCovered, monthlyContribution) => {
  if (!uid) uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(simRef(uid));
  if (!snap.exists()) return null;
  const sim = snap.data();

  const bankWallet = (sim.wallets ?? []).find(w => w.type === 'bank');
  const parentInterestRate = bankWallet?.interestRate ?? 0.0005;
  const needsAmt = sim.monthlyBudget?.needsAmt ?? 0;
  const targetAmount = needsAmt * monthsCovered;

  const newWallet = createEmergencyFundWallet(
    targetAmount,
    sim.stage2Data?.bankName ?? 'Your Bank',
    parentInterestRate,
  );

  const updatedWallets = [...(sim.wallets ?? []), newWallet];

  await updateDoc(simRef(uid), {
    wallets: updatedWallets,
    stage6Data: {
      monthsCovered,
      targetAmount,
      monthlyContribution,
    },
    updatedAt: Date.now(),
  });

  return { wallet: newWallet, targetAmount };
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
  await deleteDoc(simRef(uid));
  await updateDoc(doc(db, 'users', uid), { finCoins: RESET_FINCOIN_BALANCE });
  syncSimToStore(RESET_FINCOIN_BALANCE - ((useUserStore.getState().profile?.finCoins) ?? 0));
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

// ─── Multi-vehicle investment helpers ────────────────────────────────────────

const INVESTMENT_VEHICLES = {
  'nestvault': {
    id: 'investment-nestvault', type: 'investment', vehicleId: 'nestvault',
    label: 'NestVault', icon: '🤖', balance: 0, monthlyDCA: 0, holdings: [],
    riskScore: 50, expectedReturn: 6.5, ter: 0.65, openedMonth: null,
  },
  'drakon-rss': {
    id: 'investment-drakon-rss', type: 'investment', vehicleId: 'drakon-rss',
    label: 'Drakon RSS Plan', icon: '📊', balance: 0, monthlyDCA: 0, holdings: [],
    riskScore: 45, expectedReturn: 5.5, ter: 0.30, openedMonth: null,
  },
  'apextrade-diy': {
    id: 'investment-apextrade-diy', type: 'investment', vehicleId: 'apextrade-diy',
    label: 'ApexTrade DIY', icon: '📈', balance: 0, monthlyDCA: 0, holdings: [],
    riskScore: 60, expectedReturn: 6.0, ter: 0.20, openedMonth: null,
  },
};

export const openInvestmentVehicle = async (uid, vehicleId) => {
  const vehicle = INVESTMENT_VEHICLES[vehicleId];
  if (!vehicle) throw new Error(`Unknown vehicle: ${vehicleId}`);

  const sim = await loadSimProgress(uid);
  const existing = (sim.wallets ?? []).filter(w => w.type === 'investment');

  if (existing.length >= 3) throw new Error('Maximum 3 investment accounts reached');
  if (existing.some(w => w.vehicleId === vehicleId)) throw new Error('This vehicle is already open');

  const newWallet = { ...vehicle, openedMonth: sim.currentMonth ?? 1 };
  const updatedWallets = [...(sim.wallets ?? []), newWallet];
  await saveSimProgress(uid, { wallets: deepClean(updatedWallets) });
  return newWallet;
};

export const updateInvestmentDCA = async (uid, walletId, newDCA) => {
  const sim = await loadSimProgress(uid);
  const updatedWallets = (sim.wallets ?? []).map(w =>
    w.id === walletId ? { ...w, monthlyDCA: newDCA } : w
  );
  await saveSimProgress(uid, { wallets: deepClean(updatedWallets) });
};

export const lumpSumInvest = async (uid, walletId, amount) => {
  const sim = await loadSimProgress(uid);
  const updatedWallets = (sim.wallets ?? []).map(w => {
    if (w.id !== walletId) return w;
    const holdings = w.holdings ?? [];
    const totalAlloc = holdings.reduce((s, h) => s + (h.allocation ?? 0), 0);
    let updatedHoldings = holdings;
    if (totalAlloc > 0 && holdings.length > 0) {
      updatedHoldings = holdings.map(h => ({
        ...h, value: (h.value ?? 0) + amount * ((h.allocation ?? 0) / totalAlloc),
      }));
    }
    return { ...w, balance: (w.balance ?? 0) + amount, holdings: updatedHoldings };
  });

  const withBankDeduction = updatedWallets.map(w => {
    if (w.type !== 'bank') return w;
    return { ...w, balance: Math.max(0, (w.balance ?? 0) - amount) };
  });

  await saveSimProgress(uid, { wallets: deepClean(withBankDeduction) });
};

// Re-export pure helper so screens only need to import from one place
export { canAdvanceMonthPure as canAdvanceMonth };