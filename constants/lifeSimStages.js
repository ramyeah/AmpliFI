// constants/lifeSimStages.js
//
// All static data for the AmpliFI persistent life simulation — Module 1.
//
// This file is pure data — no UI, no side effects, no imports from React.
// Everything the stage screens and lib/lifeSim.js need lives here.
//
// Contents:
//   STAGE_GATES         — lesson unlock requirements per stage
//   STAGES              — full stage definitions (id, title, description, etc.)
//   INCOME_BRACKETS     — FinCoin → SGD income mapping
//   BANK_ACCOUNTS       — Stage 4 bank account options
//   SPENDING_TRANSACTIONS — Stage 3 fixed transaction list
//   EMERGENCY_EVENTS    — Stage 5 random near-miss events
//   WALLET_TEMPLATES    — initial wallet shapes for each stage unlock
//   createSimProgress   — factory for a brand-new simProgress document
//   getIncomeBracket    — helper
//   canAdvanceMonth     — helper (checks 4-hour gate)
//   getStageStatus      — helper (locked / active / complete)

import { Colors, MODULE_COLORS } from './theme';

// ─── Income Brackets ──────────────────────────────────────────────────────────
// FinCoins earned from lessons determine the user's simulated monthly income.
// More studying = higher income bracket = more realistic simulation.

export const INCOME_BRACKETS = [
  { minCoins: 500, income: 3800, label: 'Mid-level exec',    emoji: '💼', takeHome: 3420 },
  { minCoins: 300, income: 2800, label: 'Fresh grad',        emoji: '🎓', takeHome: 2520 },
  { minCoins: 150, income: 2000, label: 'Part-time worker',  emoji: '📚', takeHome: 1800 },
  { minCoins:   0, income: 1200, label: 'Student allowance', emoji: '🌱', takeHome: 1200 },
];

export function getIncomeBracket(finCoins = 0) {
  return (
    INCOME_BRACKETS.find(b => finCoins >= b.minCoins) ??
    INCOME_BRACKETS[INCOME_BRACKETS.length - 1]
  );
}

// ─── Stage Gates ──────────────────────────────────────────────────────────────
// Each stage requires a specific completed lesson ID.
// Lesson IDs map to modules.js: '2-2' = Module 1, Chapter 2, Lesson 2 (50/30/20 Rule)

export const STAGE_GATES = {
  'stage-1': { lessonId: '1-3', lessonTitle: 'Setting Financial Goals'  },
  'stage-2': { lessonId: '2-2', lessonTitle: 'The 50/30/20 Rule'        },
  'stage-3': { lessonId: '2-3', lessonTitle: 'Tracking Your Spending'   },
  'stage-4': { lessonId: '4-1', lessonTitle: 'The Big Three Local Banks' },
  'stage-5': { lessonId: '3-1', lessonTitle: 'Why You Need an Emergency Fund' },
};

// ─── Stage Definitions ────────────────────────────────────────────────────────

export const STAGES = [
  {
    id:          'stage-1',
    number:      1,
    title:       'Set Your Financial Goals',
    subtitle:    'What is your money actually for?',
    icon:        '🎯',
    color:       MODULE_COLORS['module-1'].color,
    colorLight:  MODULE_COLORS['module-1'].colorLight,
    description: 'Work with Fin to define your Financial Freedom Number and your first short-term savings goal.',
    conceptTag:  'Financial goals · 4% rule',
    outfitUnlock: 'lanyard',
    // What gets displayed in the completed summary card
    summaryFields: ['ffn', 'ffnAge', 'firstGoal'],
  },
  {
    id:          'stage-2',
    number:      2,
    title:       'Your First Paycheck',
    subtitle:    'Allocate before you spend — not after',
    icon:        '💸',
    color:       MODULE_COLORS['module-1'].color,
    colorLight:  MODULE_COLORS['module-1'].colorLight,
    description: 'Drag the sliders to split your income across Needs, Wants, and Savings. No hints — apply what you learned.',
    conceptTag:  '50/30/20 rule',
    outfitUnlock: 'notebook',
    summaryFields: ['needsPct', 'wantsPct', 'savingsPct', 'savingsAmt'],
  },
  {
    id:          'stage-3',
    number:      3,
    title:       'Track Your Spending',
    subtitle:    'A month has passed. Let\'s see where it went.',
    icon:        '🔍',
    color:       MODULE_COLORS['module-1'].color,
    colorLight:  MODULE_COLORS['module-1'].colorLight,
    description: 'Categorise 10 transactions from your first month in Singapore. Fin will show you where your budget leaked.',
    conceptTag:  'Spending awareness · Present bias',
    outfitUnlock: 'magnifier',
    summaryFields: ['cutTransaction', 'savedAmount'],
  },
  {
    id:          'stage-4',
    number:      4,
    title:       'Open a Bank Account',
    subtitle:    'Your money needs a proper home',
    icon:        '🏦',
    color:       MODULE_COLORS['module-2'].color,
    colorLight:  MODULE_COLORS['module-2'].colorLight,
    description: 'Compare the three major Singapore banks and open your first account. See what the base interest rate actually earns you.',
    conceptTag:  'Banking in Singapore',
    outfitUnlock: 'card',
    summaryFields: ['bankChosen', 'openingBalance'],
  },
  {
    id:          'stage-5',
    number:      5,
    title:       'Build Your Emergency Fund',
    subtitle:    'The buffer that protects everything else',
    icon:        '🛡️',
    color:       MODULE_COLORS['module-1'].color,
    colorLight:  MODULE_COLORS['module-1'].colorLight,
    description: 'Allocate savings each month toward your emergency fund target. A random life event will test whether you\'re prepared.',
    conceptTag:  'Emergency fund · 3-month rule',
    outfitUnlock: 'shield',
    summaryFields: ['emergencyFundBalance', 'monthsBuilt'],
    // Stage completes at 1 month of expenses (not 3 — that continues into later sessions)
    completionCondition: 'emergencyFund >= monthlyNeeds',
  },
];

// ─── Stage Status Helper ──────────────────────────────────────────────────────
// Returns: 'locked' | 'active' | 'complete'
// completedLessons: string[] from progress/{uid}
// completedStages:  string[] from simProgress/{uid}

export function getStageStatus(stageId, completedLessons = [], completedStages = []) {
  if (completedStages.includes(stageId)) return 'complete';
  const gate = STAGE_GATES[stageId];
  if (!gate) return 'locked';
  if (!completedLessons.includes(gate.lessonId)) return 'locked';
  return 'active';
}

// ─── Time Gate Helper ─────────────────────────────────────────────────────────
// Minimum 4 hours between month advances.
// nextMonthAvailableAt is a Unix timestamp (ms) stored in Firestore.
// Returns { canAdvance: bool, msRemaining: number }

export const MONTH_GATE_MS = 4 * 60 * 60 * 1000; // 4 hours

export function canAdvanceMonth(nextMonthAvailableAt) {
  if (!nextMonthAvailableAt) return { canAdvance: true, msRemaining: 0 };
  const now = Date.now();
  const ms  = nextMonthAvailableAt - now;
  return { canAdvance: ms <= 0, msRemaining: Math.max(0, ms) };
}

export function formatCountdown(msRemaining) {
  if (msRemaining <= 0) return null;
  const totalSeconds = Math.floor(msRemaining / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── Bank Account Options (Stage 4) ──────────────────────────────────────────

export const BANK_ACCOUNTS = [
  {
    id:             'dbs',
    bank:           'DBS',
    name:           'DBS Savings Account',
    icon:           '🏦',
    color:          '#E62B3A',   // DBS red
    colorLight:     '#FEF2F2',
    baseRate:       0.0005,      // 0.05% p.a.
    minBalance:     3000,
    fallBelowFee:   2,           // $2/month if below min
    features: [
      'Instant PayNow transfers',
      'Access to DBS Multiplier (bonus interest later)',
      'DBS digibank app — rated best in SG',
    ],
    finNote: 'A safe, well-supported starting account. The Multiplier account becomes very powerful once you have salary credit and regular card spend — worth setting up now.',
  },
  {
    id:             'ocbc',
    bank:           'OCBC',
    name:           'OCBC 360 Account',
    icon:           '🏦',
    color:          '#E84A24',   // OCBC orange-red
    colorLight:     '#FFF0E5',
    baseRate:       0.0005,
    minBalance:     3000,
    fallBelowFee:   2,
    features: [
      'Bonus interest tiers with salary + GIRO + card spend',
      'Up to 4.65% p.a. with all conditions met',
      'OCBC OneAdvisor — integrated financial planning',
    ],
    finNote: 'The 360 account has some of the best bonus interest tiers in Singapore — but only activates fully when you have salary credit, GIRO payments, and card spend. Perfect to set up now and grow into.',
  },
  {
    id:             'uob',
    bank:           'UOB',
    name:           'UOB One Account',
    icon:           '🏦',
    color:          '#003087',   // UOB navy
    colorLight:     '#E5EBFF',
    baseRate:       0.0005,
    minBalance:     1000,        // lower minimum — easier for students
    fallBelowFee:   2,
    features: [
      'Lower $1,000 minimum balance',
      'Bonus interest with $500/month card spend',
      'Predictable tiered interest — no complex conditions',
    ],
    finNote: 'The lower minimum balance makes UOB One the most accessible for students. Bonus interest requires $500/month card spend — achievable once you start working full-time.',
  },
];

// ─── Spending Transactions (Stage 3) ─────────────────────────────────────────
// 10 fixed transactions representing a realistic Singapore student month.
// Fin's commentary on each is generated by the AI using the user's actual budget.
// The `correct` field is what the transaction should be categorised as.
// `ambiguous: true` means both answers are defensible — Fin acknowledges this.

export const SPENDING_TRANSACTIONS = [
  {
    id:          'grab-ride',
    merchant:    'Grab',
    description: 'Ride to Jurong Point (×3 this month)',
    amount:      25.20,
    correct:     'needs',   // transport is a Need
    ambiguous:   false,
    icon:        '🚗',
    finHint:     'Transport to run errands and get around is a core Need — but could any of these trips have been MRT instead?',
  },
  {
    id:          'hawker',
    merchant:    'Hawker Centre',
    description: 'Meals at hawker centre (×12 this month)',
    amount:      72.00,
    correct:     'needs',   // food baseline is a Need
    ambiguous:   false,
    icon:        '🍚',
    finHint:     'Hawker food is Singapore\'s most cost-effective nutrition — this is a sensible Need spend.',
  },
  {
    id:          'grabfood',
    merchant:    'GrabFood',
    description: 'Delivery orders (×8 this month)',
    amount:      152.00,
    correct:     'wants',   // convenience premium = Want
    ambiguous:   false,
    icon:        '🛵',
    finHint:     null,   // Fin generates personalised commentary here using their actual Wants budget
  },
  {
    id:          'subscriptions',
    merchant:    'Netflix + Spotify',
    description: 'Monthly subscriptions',
    amount:      23.90,
    correct:     'wants',
    ambiguous:   false,
    icon:        '📺',
    finHint:     'Subscriptions are classic Wants — valued but not essential. Worth auditing once a year: are you using both?',
  },
  {
    id:          'ezlink',
    merchant:    'TransitLink',
    description: 'MRT/Bus ez-link top-up',
    amount:      38.00,
    correct:     'needs',
    ambiguous:   false,
    icon:        '🚇',
    finHint:     'Public transport is a clear Need in Singapore — one of the cheapest, most reliable systems in the world.',
  },
  {
    id:          'bbq',
    merchant:    'NTUC FairPrice',
    description: 'BBQ contribution (hall event)',
    amount:      25.00,
    correct:     'wants',
    ambiguous:   false,
    icon:        '🍖',
    finHint:     'Social spending is a Want — but an important one. The 30% Wants budget exists precisely so you don\'t have to say no to everything.',
  },
  {
    id:          'groceries',
    merchant:    'Cold Storage',
    description: 'Weekly groceries',
    amount:      68.00,
    correct:     'needs',
    ambiguous:   false,
    icon:        '🛒',
    finHint:     'Groceries are a Need — though the choice of Cold Storage vs NTUC vs Sheng Siong affects how much this costs.',
  },
  {
    id:          'clothing',
    merchant:    'Uniqlo',
    description: 'Clothing (sale purchase)',
    amount:      49.90,
    correct:     'wants',
    ambiguous:   false,
    icon:        '👕',
    finHint:     'Clothing purchases sit in Wants unless you genuinely needed them for work or essential wear.',
  },
  {
    id:          'gym',
    merchant:    'ActiveSG Gym',
    description: 'Monthly gym membership',
    amount:      45.00,
    correct:     'wants',   // default, but Fin acknowledges ambiguity
    ambiguous:   true,
    icon:        '🏋️',
    finHint:     'This one is genuinely up to you. If exercise protects your physical and mental health — enabling you to study and work — a case can be made for Need. If it\'s mostly aspirational, it\'s a Want. What does it do for you?',
  },
  {
    id:          'course',
    merchant:    'Coursera',
    description: 'Online course subscription',
    amount:      19.90,
    correct:     'savings',  // default — investment in skills = Savings-adjacent
    ambiguous:   true,
    icon:        '💻',
    finHint:     'Investing in skills that increase your earning potential sits somewhere between Wants and Savings. Some financial advisors treat it as human capital investment — a form of savings. Others put it in Wants. The key question: is it moving you toward a concrete goal, or is it a nice-to-have?',
  },
];

// Total amounts by correct category — used to generate Fin's post-review summary
export const TRANSACTION_TOTALS = SPENDING_TRANSACTIONS.reduce((acc, t) => {
  acc[t.correct] = (acc[t.correct] || 0) + t.amount;
  return acc;
}, {});
// → { needs: 203.20, wants: 250.80, savings: 19.90 }

// ─── Emergency Fund Events (Stage 5) ──────────────────────────────────────────
// One fires at a random month between 1–4 of Stage 5.
// Presented as a near-miss: money comes out of bank balance,
// but Fin shows the parallel "with fund" path side by side.

export const EMERGENCY_EVENTS = [
  {
    id:          'phone-screen',
    icon:        '📱',
    title:       'Cracked phone screen',
    description: 'You dropped your phone on the MRT platform. The screen cracked — it needs repair to stay usable.',
    amount:      180,
    category:    'Repair',
    finMessage:  'Phone repairs happen suddenly and can\'t be postponed. This is exactly the kind of $100–$200 shock an emergency fund absorbs without touching your monthly budget.',
    withFundPath: 'Paid from emergency fund. Monthly budget unchanged. Fund rebuilds over 2–3 months.',
    withoutFundPath: 'Came out of bank balance. Set back your savings target by {weeks} weeks.',
  },
  {
    id:          'clinic-visit',
    icon:        '🏥',
    title:       'Fell sick — clinic visit',
    description: 'You came down with a bad flu. A GP visit at a private clinic plus medication set you back unexpectedly.',
    amount:      65,
    category:    'Medical',
    finMessage:  'Medical costs in Singapore are subsidised at polyclinics (~$10–$20) but private GPs run $40–$90 per visit. Even small medical bills disrupt a tight budget without a buffer.',
    withFundPath: 'Paid from emergency fund. No impact on savings goals.',
    withoutFundPath: 'Came out of bank balance. Small amount — but a reminder that these costs are unpredictable.',
  },
  {
    id:          'birthday-dinner',
    icon:        '🎂',
    title:       'Friend\'s birthday dinner',
    description: 'Your close friend\'s birthday dinner at a sit-down restaurant. You didn\'t want to miss it — but it wasn\'t in your budget.',
    amount:      120,
    category:    'Social',
    finMessage:  'Social spending surprises are common — birthdays, farewell dinners, weddings. Not all of these belong in the emergency fund (they\'re technically Wants), but they\'re a reminder to leave buffer in your monthly Wants allocation too.',
    withFundPath: 'This one is debatable — social events aren\'t true emergencies. Ideally your Wants budget absorbed this.',
    withoutFundPath: 'Came out of bank balance. Consider budgeting a "social buffer" within your Wants allocation going forward.',
  },
  {
    id:          'charger-died',
    icon:        '🔌',
    title:       'Laptop charger died',
    description: 'Your laptop charger stopped working mid-semester. A replacement is essential for your studies.',
    amount:      89,
    category:    'Equipment',
    finMessage:  'Essential equipment failures are classic emergency fund territory — unplanned, urgent, and non-negotiable. A $89 charger feels manageable, but add a phone repair and a clinic visit in the same month and you\'re looking at $300+ in shocks.',
    withFundPath: 'Paid from emergency fund. Studied without interruption. Fund replenishes over 6–8 weeks.',
    withoutFundPath: 'Came out of bank balance. Manageable this time — but what if three things broke at once?',
  },
];

// ─── Wallet Templates ─────────────────────────────────────────────────────────
// Each wallet starts from one of these templates when first unlocked.
// The `linkedTo` field is populated at runtime using the actual wallet id.

export const WALLET_TEMPLATES = {
  wallet: {
    id:           'wallet',
    type:         'wallet',
    label:        'Cash Wallet',
    icon:         '💳',
    balance:      0,
    interestRate: 0,
    color:        Colors.textMuted,
    colorLight:   Colors.lightGray,
    institution:  null,
    linkedTo:     null,
    unlockedAtStage: 'stage-1',
    unlockTitle:  'Your Starting Wallet',
    unlockBody:   'Every financial journey starts somewhere. This is yours — your simulated cash wallet. Earn FinCoins from lessons and they\'ll show up here.',
  },
  bank: {
    // Populated at Stage 4 using the chosen BANK_ACCOUNTS entry
    id:           null,          // set to bank.id at unlock time
    type:         'bank',
    label:        null,          // set to bank.name
    icon:         '🏦',
    balance:      0,
    interestRate: 0.0005,
    color:        null,          // set from bank.color
    colorLight:   null,
    institution:  null,          // set to bank.bank
    linkedTo:     null,
    unlockedAtStage: 'stage-4',
    unlockTitle:  'Bank Account Opened',
    unlockBody:   'Your money now has a proper home. It earns 0.05% p.a. for now — not much. But this account is the foundation everything else is built on.',
  },
  emergencyFund: {
    id:           'emergency-fund',
    type:         'fund',
    label:        'Emergency Fund',
    icon:         '🛡️',
    balance:      0,
    target:       null,          // set to monthlyNeeds × 3 at unlock time
    interestRate: 0.0005,        // same as linked bank account
    color:        Colors.successDark,
    colorLight:   Colors.successLight,
    institution:  null,          // same as linked bank account
    linkedTo:     null,          // set to bank wallet id at unlock time
    unlockedAtStage: 'stage-5',
    unlockTitle:  'Emergency Fund Created',
    unlockBody:   'A ring-fenced buffer for life\'s unexpected costs. Target: 3 months of your essential expenses. This account is what stands between you and financial stress.',
  },
};

// ─── createSimProgress factory ────────────────────────────────────────────────
// Creates the initial Firestore document for a new simulation.
// Call once when a user first enters the sim.

export function createSimProgress(uid, finCoins = 0) {
  const bracket = getIncomeBracket(finCoins);
  const now     = Date.now();

  return {
    uid,
    createdAt:              now,
    updatedAt:              now,

    // Stage tracking
    currentStage:           'stage-1',
    completedStages:        [],

    // Time gate — first month is always immediately available
    nextMonthAvailableAt:   null,
    currentMonth:           1,

    // Financial state — populated as user progresses
    income:                 bracket.income,
    incomeLabel:            bracket.label,
    incomeEmoji:            bracket.emoji,

    // Set in Stage 1
    ffn:                    null,
    ffnAge:                 null,
    monthlyRetirementIncome: null,
    goals:                  [],   // [{ id, label, target, balance }]

    // Set in Stage 2
    monthlyBudget:          null,
    // { needs: 50, wants: 30, savings: 20, needsAmt, wantsAmt, savingsAmt }

    // Set in Stage 3
    stage3Cut:              null,
    // { transactionId, amount, label }

    // Set in Stage 4
    bankAccountId:          null,

    // Wallets — grows as stages are completed
    wallets: [
      {
        ...WALLET_TEMPLATES.wallet,
        balance:  finCoins * 10,   // 1 FinCoin = $10 SGD starting balance
      },
    ],

    // Unlocked outfit items
    unlockedOutfits:        [],

    // Month-by-month history — one entry appended per advance
    history:                [],
    // [{
    //   month: 1,
    //   walletSnapshots: { 'wallet': 1200, 'emergency-fund': 0 },
    //   event: null | { id, amount, hadFund: bool },
    //   decisions: { budgetPct: {...}, cutTransaction: '...' }
    // }]
  };
}

// ─── Month history snapshot helper ───────────────────────────────────────────
// Call at the end of each month to append a history entry.

export function buildHistoryEntry(month, wallets, event = null, decisions = {}) {
  const snapshots = {};
  wallets.forEach(w => { snapshots[w.id] = Math.round(w.balance); });
  return { month, walletSnapshots: snapshots, event, decisions };
}

// ─── SGD ↔ FinCoin helpers ────────────────────────────────────────────────────
export const SGD_PER_FINCOIN = 10;

export function sgdToFincoins(sgd) {
  return Math.round(sgd / SGD_PER_FINCOIN);
}

export function fincoinsToSgd(coins) {
  return coins * SGD_PER_FINCOIN;
}

export function formatDual(sgd) {
  const coins = sgdToFincoins(sgd);
  const sgdStr = `$${Math.round(sgd).toLocaleString()}`;
  return { sgd: sgdStr, coins: `${coins}🪙`, combined: `${sgdStr} · ${coins}🪙` };
}