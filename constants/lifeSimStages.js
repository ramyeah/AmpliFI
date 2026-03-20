// constants/lifeSimStages.js
//
// All static data for the AmpliFI persistent life simulation — Module 1.
//
// This file is pure data — no UI, no side effects, no imports from React.
// Everything the stage screens and lib/lifeSim.js need lives here.
//
// ─── Narrative order ────────────────────────────────────────────────────────
//
//  Stage 1  Set Your FI Number          → know what you're working toward
//  Stage 2  Open a Bank Account         → basic savings vs HYSA — pick one
//  Stage 3  Your First Paycheck         → salary lands in the bank you just opened
//  Stage 4  Track Your Spending         → one month later, where did it go?
//  Stage 5  Set Your Budget             → lock in 50/30/20 for future months
//  Stage 6  Build Your Emergency Fund   → monthly allocation, life event fires
//
// ─── Contents ───────────────────────────────────────────────────────────────
//   STAGE_GATES             — lesson unlock requirements per stage
//   STAGES                  — full stage definitions (id, title, description…)
//   ACCOUNT_TYPES           — basic savings vs HYSA options (Stage 2 decision)
//   BANK_ACCOUNTS           — DBS / OCBC / UOB full details (used in Stage 2)
//   INCOME_BRACKETS         — FinCoin → SGD income mapping
//   SPENDING_TRANSACTIONS   — Stage 4 fixed transaction list
//   EMERGENCY_EVENTS        — Stage 6 random near-miss events
//   WALLET_TEMPLATES        — initial wallet shapes for each stage unlock
//   createSimProgress       — factory for a brand-new simProgress document
//   buildHistoryEntry       — month snapshot helper
//   getIncomeBracket        — helper
//   getStageStatus          — helper (locked / active / complete)
//   canAdvanceMonth         — helper (checks 4-hour gate)
//   formatCountdown         — helper
//   formatDual              — SGD + FinCoin display helper
//   SGD_PER_FINCOIN / sgdToFincoins / fincoinsToSgd

import { Colors, MODULE_COLORS } from './theme';
import { MODULES } from './modules';

// ─── Derived income constants ────────────────────────────────────────────────
export const MAX_LESSON_FINCOINS = MODULES
  .flatMap(m => m.chapters.flatMap(c => c.lessons))
  .reduce((sum, l) => sum + (l.fincoins ?? 55), 0);

export const STARTING_SIM_INCOME = Math.round(MAX_LESSON_FINCOINS * 0.15);

export const RESET_FINCOIN_BALANCE = 36 * 55; // 1,980

console.log('Max lesson FC:', MAX_LESSON_FINCOINS);
console.log('Sim monthly income:', STARTING_SIM_INCOME);

// ─── Income Brackets ──────────────────────────────────────────────────────────
// FinCoins earned from lessons determine the user's simulated monthly income.
// More studying = higher income bracket = more realistic simulation.
// The bracket is locked in when the sim is first created (createSimProgress).

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
// Each stage requires one completed lesson before it unlocks.
// Lesson IDs reference modules.js exactly.
//
// New narrative order:
//   Stage 1  → lesson '1-3'  Setting Financial Goals       (Module 1 Ch1)
//   Stage 2  → lesson '4-1'  The Big Three Local Banks     (Module 4 Ch1)
//   Stage 3  → lesson '2-1'  Why Budgeting Works           (Module 2 Ch1)
//   Stage 4  → lesson '2-3'  Tracking Your Spending        (Module 2 Ch1)
//   Stage 5  → lesson '2-2'  The 50/30/20 Rule             (Module 2 Ch1)
//   Stage 6  → lesson '3-1'  Why You Need an Emergency Fund (Module 3 Ch1)

export const STAGE_GATES = {
  // Stage 1 requires the Setting Financial Goals lesson
  'stage-1': { lessonId: '1-3', lessonTitle: 'Setting Financial Goals'         },
  // Stage 2 (Bank) and Stage 3 (Paycheck) unlock purely from completing
  // the previous stage — no extra lesson required. They're narrative flow,
  // not knowledge gates. Users learn about banks IN the bank screen.
  'stage-2': { lessonId: null,  lessonTitle: null },
  // Stage 3 (Track Spending) requires the lesson — genuine knowledge gate
  'stage-3': { lessonId: '2-3', lessonTitle: 'Tracking Your Spending'          },
  // Stage 4 (Paycheck) is narrative flow — unlocks after tracking is done
  'stage-4': { lessonId: null,  lessonTitle: null },
  'stage-5': { lessonId: '2-2', lessonTitle: 'The 50/30/20 Rule'               },
  'stage-6': { lessonId: '3-1', lessonTitle: 'Why You Need an Emergency Fund'  },
};

// ─── Stage Definitions ────────────────────────────────────────────────────────
// Ordered by narrative progression — this IS the story arc.

export const STAGES = [
  {
    id:          'stage-1',
    number:      1,
    title:       'Set Your FI Number',
    subtitle:    'What is your money actually working toward?',
    icon:        '🎯',
    color:       MODULE_COLORS['module-1'].color,
    colorLight:  MODULE_COLORS['module-1'].colorLight,
    description: 'Work out your Financial Independence Number with Fin — the amount you need invested to never have to work again. Then set your first real savings goal.',
    conceptTag:  'Financial goals · 4% rule',
    outfitUnlock: 'lanyard',
    // Narrative context — shown in the simulate hub as a story beat
    narrativeHint: 'Before you do anything with money, you need to know what you\'re doing it for.',
    summaryFields: ['ffn', 'ffnAge', 'firstGoal'],
    // Which simProgress field stores the completion data
    completionKey: 'stage1Data',
  },
  {
    id:          'stage-2',
    number:      2,
    title:       'Open a Bank Account',
    subtitle:    'Your cash wallet needs a proper home',
    icon:        '🏦',
    color:       MODULE_COLORS['module-2'].color,
    colorLight:  MODULE_COLORS['module-2'].colorLight,
    description: 'Choose between a basic savings account and a High-Yield Savings Account. Fin will show you what the interest rate difference actually means in dollar terms over a year.',
    conceptTag:  'Banking · Savings vs HYSA',
    outfitUnlock: 'card',
    narrativeHint: 'Your FinCoins are sitting as cash. They need to be in a bank account — and which account matters more than you think.',
    summaryFields: ['bankChosen', 'accountType', 'openingBalance'],
    completionKey: 'stage2Data',
  },
  {
    id:          'stage-3',
    number:      3,
    title:       'First Paycheck',
    subtitle:    'Your first salary is waiting',
    icon:        '🔍',
    color:       MODULE_COLORS['module-1'].color,
    colorLight:  MODULE_COLORS['module-1'].colorLight,
    description: 'Log your first month of transactions. Fin will show you what your spending actually looked like — and where the leaks are.',
    conceptTag:  'Spending awareness · Present bias',
    outfitUnlock: 'magnifier',
    narrativeHint: 'Most people are surprised by what they actually spent. Tracking is the only way to know.',
    summaryFields: ['cutTransaction', 'savedAmount'],
    completionKey: 'stage3Data',
  },
  {
    id:          'stage-4',
    number:      4,
    title:       'Build Your Budget',
    subtitle:    'Tell your money where to go',
    icon:        '💸',
    color:       MODULE_COLORS['module-1'].color,
    colorLight:  MODULE_COLORS['module-1'].colorLight,
    description: 'Your first Singapore salary just hit your bank account. Watch the balance update. This is what all the planning was for.',
    conceptTag:  'Income · Pay yourself first',
    outfitUnlock: 'notebook',
    narrativeHint: 'Seeing your salary land and knowing you have a plan for it is a completely different feeling.',
    summaryFields: ['income', 'bankBalance'],
    completionKey: 'stage4Data',
  },
  {
    id:          'stage-5',
    number:      5,
    title:       'Set Your Budget',
    subtitle:    'Month 3 — give every dollar a job',
    icon:        '📊',
    color:       MODULE_COLORS['module-1'].color,
    colorLight:  MODULE_COLORS['module-1'].colorLight,
    description: 'Now that you know where your money goes, split it intentionally: 50% Needs, 30% Wants, 20% Savings. Lock in a budget that actually works for your life in Singapore.',
    conceptTag:  '50/30/20 rule',
    outfitUnlock: 'calculator',
    narrativeHint: 'A budget isn\'t a restriction — it\'s permission to spend on the things that matter without guilt.',
    summaryFields: ['needsPct', 'wantsPct', 'savingsPct', 'savingsAmt'],
    completionKey: 'stage5Data',
  },
  {
    id:          'stage-6',
    number:      6,
    title:       'Build Your Emergency Fund',
    subtitle:    'Months 4–7 — the buffer that protects everything',
    icon:        '🛡️',
    color:       MODULE_COLORS['module-3'].color,
    colorLight:  MODULE_COLORS['module-3'].colorLight,
    description: 'Every month, transfer a slice of your savings into a ring-fenced emergency fund. A surprise life event will test whether you\'re ready. Stage completes when you hit 1 month of expenses.',
    conceptTag:  'Emergency fund · 3-month rule',
    outfitUnlock: 'shield',
    narrativeHint: 'Life will surprise you. The question is whether you\'re ready when it does.',
    summaryFields: ['emergencyFundBalance', 'monthsBuilt'],
    completionKey: 'stage6Data',
    completionCondition: 'emergencyFund >= monthlyNeeds',
  },
];

// ─── Stage Status Helper ──────────────────────────────────────────────────────
// Returns: 'locked' | 'active' | 'complete'
// Stages unlock sequentially — a stage is only available if the previous stage
// is complete AND the required lesson is done.

export function getStageStatus(stageId, completedLessons = [], completedStages = []) {
  if (completedStages.includes(stageId)) return 'complete';

  const gate = STAGE_GATES[stageId];
  if (!gate) return 'locked';

  // Lesson gate — skip if lessonId is null (narrative-flow stage)
  if (gate.lessonId && !completedLessons.includes(gate.lessonId)) return 'locked';

  // Sequential gate — previous stage must be complete
  const stage = STAGES.find(s => s.id === stageId);
  if (!stage) return 'locked';
  if (stage.number > 1) {
    const prevStage = STAGES.find(s => s.number === stage.number - 1);
    if (prevStage && !completedStages.includes(prevStage.id)) return 'locked';
  }

  return 'active';
}

// ─── Time Gate Helper ─────────────────────────────────────────────────────────

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

// ─── Account Type Options (Stage 2 — key decision) ────────────────────────────
// The user chooses between a basic savings account and a HYSA.
// This is the central teaching moment of Stage 2:
//   "A savings account is safe. A HYSA is the same safety — just smarter."
//
// accountType is stored in simProgress.accountType: 'basic' | 'hysa'
// The chosen bank + accountType determine the wallet's interestRate going forward.

export const ACCOUNT_TYPES = [
  {
    id:          'basic',
    label:       'Basic Savings Account',
    icon:        '🏦',
    tagline:     'Safe, simple, low friction',
    color:       '#6B7280',       // neutral gray
    colorLight:  '#F9FAFB',
    baseRate:    0.0005,          // 0.05% p.a.
    pros: [
      'No minimum spend requirements',
      'No conditions to meet — interest is automatic',
      'Good starting point for building the habit',
    ],
    cons: [
      'Interest is near zero — $2,000 earns ~$1/year',
      'No bonus tiers — rate never improves without upgrading',
    ],
    finNote: 'A basic account is fine while you\'re finding your feet. But once you have a regular salary and a card, you\'re leaving real money on the table by staying here.',
    bestFor: 'Getting started with zero complexity',
  },
  {
    id:          'hysa',
    label:       'High-Yield Savings Account',
    icon:        '⚡',
    tagline:     'Same safety, smarter rate',
    color:       MODULE_COLORS['module-2'].color,
    colorLight:  MODULE_COLORS['module-2'].colorLight,
    baseRate:    0.0005,          // 0.05% p.a. base (same — bonus unlocks later)
    bonusRate:   0.04,            // up to 4% p.a. with conditions
    pros: [
      'Same deposit protection as basic accounts',
      'Up to 4%+ p.a. when you credit salary + spend on card',
      'Reward structure teaches good money habits naturally',
    ],
    cons: [
      'Bonus interest requires meeting monthly criteria',
      'Slightly more complexity to track',
    ],
    finNote: 'The HYSA base rate is identical to a basic account — but the bonus tiers activate as your financial life matures. Setting this up now means you\'re ready the moment your salary starts.',
    bestFor: 'Anyone who will have a regular salary within the year',
    // Which BANK_ACCOUNTS entries qualify as HYSA
    bankIds: ['ocbc', 'uob'],
  },
];

// ─── Bank Account Options ─────────────────────────────────────────────────────
// Full bank detail cards — used in Stage 2 after the user picks basic vs HYSA.
// If basic: show DBS only (simplest, best app).
// If HYSA:  show OCBC 360 and UOB One (the two best HYSA options for students).

export const BANK_ACCOUNTS = [
  {
    id:             'dbs',
    bank:           'DBS',
    name:           'DBS Savings Account',
    accountType:    'basic',
    icon:           '🏦',
    color:          '#E62B3A',
    colorLight:     '#FEF2F2',
    baseRate:       0.0005,
    bonusRate:      0,
    minBalance:     3000,
    fallBelowFee:   2,
    features: [
      'Instant PayNow transfers',
      'DBS digibank — rated best banking app in SG',
      'Pathway to DBS Multiplier (bonus interest once working)',
    ],
    hysa: {
      name:        'DBS Multiplier Account',
      bonusRate:   0.038,         // up to 3.8% p.a.
      conditions:  ['Salary credit', 'Credit card spend', 'Insurance / investments'],
      upgradeNote: 'Upgrade to DBS Multiplier when you start full-time work. It rewards salary credit + card spend with progressively higher rates.',
    },
    finNote: 'DBS is Singapore\'s largest bank and the default choice for students. The app is excellent, PayNow works instantly, and the Multiplier account is the natural upgrade path when you graduate.',
  },
  {
    id:             'ocbc',
    bank:           'OCBC',
    name:           'OCBC 360 Account',
    accountType:    'hysa',
    icon:           '🏦',
    color:          '#E84A24',
    colorLight:     '#FFF0E5',
    baseRate:       0.0005,
    bonusRate:      0.0465,       // up to 4.65% p.a.
    minBalance:     3000,
    fallBelowFee:   2,
    features: [
      'Up to 4.65% p.a. with salary credit + card spend + GIRO',
      'Salary bonus tier activates with any salary credit',
      'Card spend tier requires min. $500/month',
      'OCBC OneAdvisor for integrated financial planning',
    ],
    finNote: 'OCBC 360 has one of the most generous bonus tier structures in Singapore. The salary credit tier is the easiest to activate — once your salary is in, the rate jumps immediately.',
  },
  {
    id:             'uob',
    bank:           'UOB',
    name:           'UOB One Account',
    accountType:    'hysa',
    icon:           '🏦',
    color:          '#003087',
    colorLight:     '#E5EBFF',
    baseRate:       0.0005,
    bonusRate:      0.078,        // up to 7.8% p.a. with all conditions
    minBalance:     1000,
    fallBelowFee:   2,
    features: [
      'Lowest minimum balance — just $1,000',
      'Up to 7.8% p.a. with $500/month card spend',
      'GIRO payment tier adds additional bonus',
      'Most straightforward conditions of all HYSA accounts',
    ],
    finNote: 'The lower $1,000 minimum makes UOB One the most accessible HYSA for students. The bonus rate is the highest in Singapore if you meet the spend criteria — but that $500/month card spend is a real commitment.',
  },
];

// ─── Interest Rate Comparison Helper (Stage 2) ────────────────────────────────
// Shows the dollar difference between basic and HYSA over time.
// Used in Stage 2 to make the abstract rate difference concrete.

export function calcInterestComparison(balance, years = 1) {
  const basicRate = 0.0005;
  const hysaRate  = 0.04;         // assume full bonus rate for illustration

  const basicEarned = Math.round(balance * basicRate * years);
  const hysaEarned  = Math.round(balance * hysaRate  * years);
  const difference  = hysaEarned - basicEarned;

  return { basicEarned, hysaEarned, difference };
}

// ─── Spending Transactions (Stage 4) ─────────────────────────────────────────
// 10 fixed transactions representing a realistic Singapore student month.
// The user categorises each as Needs / Wants / Savings.
// Fin generates personalised commentary using their actual budget from Stage 5.

export const SPENDING_TRANSACTIONS = [
  {
    id:          'grab-ride',
    merchant:    'Grab',
    description: 'Ride to Jurong Point (×3 this month)',
    amount:      25.20,
    correct:     'needs',
    ambiguous:   false,
    icon:        '🚗',
    finHint:     'Transport to run errands is a core Need — but could any of these trips have been MRT instead?',
  },
  {
    id:          'hawker',
    merchant:    'Hawker Centre',
    description: 'Meals at hawker centre (×12 this month)',
    amount:      72.00,
    correct:     'needs',
    ambiguous:   false,
    icon:        '🍚',
    finHint:     'Hawker food is Singapore\'s most cost-effective nutrition — this is a sensible Need spend.',
  },
  {
    id:          'grabfood',
    merchant:    'GrabFood',
    description: 'Delivery orders (×8 this month)',
    amount:      152.00,
    correct:     'wants',
    ambiguous:   false,
    icon:        '🛵',
    finHint:     null,  // Fin generates personalised commentary using their actual Wants budget
  },
  {
    id:          'subscriptions',
    merchant:    'Netflix + Spotify',
    description: 'Monthly subscriptions',
    amount:      23.90,
    correct:     'wants',
    ambiguous:   false,
    icon:        '📺',
    finHint:     'Subscriptions are classic Wants — valued but not essential. Worth auditing once a year.',
  },
  {
    id:          'ezlink',
    merchant:    'TransitLink',
    description: 'MRT/Bus ez-link top-up',
    amount:      38.00,
    correct:     'needs',
    ambiguous:   false,
    icon:        '🚇',
    finHint:     'Public transport is a clear Need in Singapore — one of the cheapest and most reliable systems in the world.',
  },
  {
    id:          'bbq',
    merchant:    'NTUC FairPrice',
    description: 'BBQ contribution (hall event)',
    amount:      25.00,
    correct:     'wants',
    ambiguous:   false,
    icon:        '🍖',
    finHint:     'Social spending is a Want — but an important one. The 30% Wants budget exists so you don\'t have to say no to everything.',
  },
  {
    id:          'groceries',
    merchant:    'Cold Storage',
    description: 'Weekly groceries',
    amount:      68.00,
    correct:     'needs',
    ambiguous:   false,
    icon:        '🛒',
    finHint:     'Groceries are a Need — though Cold Storage vs NTUC vs Sheng Siong makes a real difference to cost.',
  },
  {
    id:          'clothing',
    merchant:    'Uniqlo',
    description: 'Clothing (sale purchase)',
    amount:      49.90,
    correct:     'wants',
    ambiguous:   false,
    icon:        '👕',
    finHint:     'Clothing sits in Wants unless you genuinely needed it for work or essential wear.',
  },
  {
    id:          'gym',
    merchant:    'ActiveSG Gym',
    description: 'Monthly gym membership',
    amount:      45.00,
    correct:     'wants',
    ambiguous:   true,
    icon:        '🏋️',
    finHint:     'This one is genuinely up to you. If exercise protects your health and study ability, a case can be made for Need. What does it actually do for you?',
  },
  {
    id:          'course',
    merchant:    'Coursera',
    description: 'Online course subscription',
    amount:      19.90,
    correct:     'savings',
    ambiguous:   true,
    icon:        '💻',
    finHint:     'Investing in skills sits between Wants and Savings. The key question: is it moving you toward a concrete goal, or is it a nice-to-have?',
  },
];

export const TRANSACTION_TOTALS = SPENDING_TRANSACTIONS.reduce((acc, t) => {
  acc[t.correct] = (acc[t.correct] || 0) + t.amount;
  return acc;
}, {});
// → { needs: 203.20, wants: 250.80, savings: 19.90 }

// ─── Emergency Fund Events (Stage 6) ─────────────────────────────────────────
// One fires at a random month between 2–4 of Stage 6.
// Educational: shows the parallel "with fund" vs "without fund" paths.

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
    finMessage:  'Social spending surprises are common — birthdays, farewell dinners, weddings. Not all of these belong in the emergency fund, but they\'re a reminder to leave buffer in your Wants allocation.',
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
    finMessage:  'Essential equipment failures are classic emergency fund territory — unplanned, urgent, and non-negotiable. A $89 charger feels manageable, but three things breaking at once is $300+.',
    withFundPath: 'Paid from emergency fund. Studied without interruption. Fund replenishes over 6–8 weeks.',
    withoutFundPath: 'Came out of bank balance. Manageable this time — but what if three things broke at once?',
  },
];

// ─── Wallet Templates ─────────────────────────────────────────────────────────
// Each wallet starts from one of these templates when first unlocked.
// Fields marked `null` are populated at runtime.

export const WALLET_TEMPLATES = {
  // The starting cash wallet — holds FinCoins converted to SGD
  wallet: {
    id:              'wallet',
    type:            'wallet',
    label:           'Cash Wallet',
    icon:            '💳',
    balance:         0,
    interestRate:    0,
    color:           Colors.textMuted,
    colorLight:      Colors.lightGray,
    institution:     null,
    linkedTo:        null,
    unlockedAtStage: 'stage-1',
    unlockTitle:     'Your Starting Wallet',
    unlockBody:      'Every financial journey starts somewhere. This is yours — your simulated cash wallet. Earn FinCoins from lessons and they\'ll show up here.',
  },

  // Bank account — opened in Stage 2. Populated from the chosen BANK_ACCOUNTS entry.
  bank: {
    id:              null,     // set to bank.id at unlock time
    type:            'bank',
    label:           null,     // set to bank.name
    icon:            '🏦',
    balance:         0,
    interestRate:    0.0005,   // updated to HYSA rate if user picks HYSA
    bonusRate:       null,     // set if HYSA chosen
    accountType:     null,     // 'basic' | 'hysa'
    color:           null,
    colorLight:      null,
    institution:     null,     // set to bank.bank
    linkedTo:        null,
    unlockedAtStage: 'stage-2',
    unlockTitle:     'Bank Account Opened',
    unlockBody:      'Your money now has a proper home. This account is the foundation everything else is built on.',
  },

  // Emergency fund — opened in Stage 6. Linked to the bank wallet.
  emergencyFund: {
    id:              'emergency-fund',
    type:            'fund',
    label:           'Emergency Fund',
    icon:            '🛡️',
    balance:         0,
    target:          null,     // set to monthlyNeeds × 3 at unlock time
    interestRate:    0.0005,   // mirrors linked bank account
    color:           Colors.successDark,
    colorLight:      Colors.successLight,
    institution:     null,     // mirrors linked bank account
    linkedTo:        null,     // set to bank wallet id at unlock time
    unlockedAtStage: 'stage-6',
    unlockTitle:     'Emergency Fund Created',
    unlockBody:      'A ring-fenced buffer for life\'s unexpected costs. Target: 3 months of your essential expenses. This is what stands between you and financial stress.',
  },
};

// ─── createSimProgress factory ────────────────────────────────────────────────
// Creates the initial Firestore simProgress document.
// Call once when a user first enters the sim.

export function createSimProgress(uid, finCoins = 0) {
  const now = Date.now();

  return {
    uid,
    createdAt:    now,
    updatedAt:    now,

    // Stage tracking
    currentStage:    'stage-1',
    completedStages: [],

    // Global month counter
    currentMonth:          1,
    nextMonthAvailableAt:  null,

    // Income — set to null initially, assigned in job offer modal
    income:       null,
    incomeLabel:  null,
    incomeEmoji:  null,

    // ── Stage completion data ──────────────────────────────────────────────
    // stage1Data: set in Stage 1
    stage1Data: null,
    // { ffn, ffnAge, monthlyRetirementIncome, goals }

    // stage2Data: set in Stage 2
    stage2Data: null,
    // { bankId, bankName, accountType: 'basic'|'hysa', openingBalance }

    // stage3Data: set in Stage 3 (Track Spending)
    stage3Data: null,
    // { cutTransactionId, cutLabel, cutAmount, transactionCount, totals }

    // stage4Data: set in Stage 4 (First Paycheck)
    stage4Data: null,
    // { income, bankBalance, paycheckCredited: true }

    // stage5Data: set in Stage 5
    stage5Data: null,
    // { needsPct, wantsPct, savingsPct, needsAmt, wantsAmt, savingsAmt }

    // stage6Data: set in Stage 6
    stage6Data: null,
    // { emergencyFundBalance, monthsBuilt, fundTarget }

    // ── Convenience top-level aliases (for backwards compat + quick reads) ─
    // These mirror stage completion data for the fields most often needed
    // by the simulate hub and other screens.
    ffn:           null,
    ffnAge:        null,
    bankAccountId: null,
    accountType:   null,      // 'basic' | 'hysa'
    monthlyBudget: null,      // { needs, wants, savings, needsAmt, wantsAmt, savingsAmt }
    stage3Cut:     null,      // { label, amount } — from Stage 4 (spending tracker)

    // ── Wallets ────────────────────────────────────────────────────────────
    // Starts with just the cash wallet.
    // Stage 2 adds bank wallet. Stage 6 adds emergency fund wallet.
    wallets: [
      {
        ...WALLET_TEMPLATES.wallet,
        balance: finCoins,  // 1:1 — real FinCoins = sim cash
      },
    ],

    // ── Outfit unlocks ─────────────────────────────────────────────────────
    unlockedOutfits: [],

    // ── Month-by-month history ─────────────────────────────────────────────
    history: [],
    // [{
    //   month: 1,
    //   walletSnapshots: { 'wallet': 1200, 'dbs': 0, 'emergency-fund': 0 },
    //   event: null | { id, amount, hadFund: bool },
    //   decisions: { budgetPct: {...}, cutTransaction: '...' }
    // }]
  };
}

// ─── Month history snapshot helper ───────────────────────────────────────────

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
  const coins  = sgdToFincoins(sgd);
  const sgdStr = `$${Math.round(sgd).toLocaleString()}`;
  return { sgd: sgdStr, coins: `${coins}🪙`, combined: `${sgdStr} · ${coins}🪙` };
}

// ─── Narrative month label ────────────────────────────────────────────────────
// Maps the global currentMonth to a human-readable label for the timeline.

export function getMonthLabel(month) {
  const labels = [
    null,                  // 0 — unused
    'Arrived in SG',       // 1 — Stage 1–2: setup
    'Month 1',             // 2 — Stage 3: first paycheck
    'Month 2',             // 3 — Stage 4: tracking
    'Month 3',             // 4 — Stage 5: budget
    'Month 4',             // 5 — Stage 6: emergency fund starts
    'Month 5',
    'Month 6',
    'Month 7',
  ];
  return labels[month] ?? `Month ${month - 1}`;
}

// ─── Savings Goal Wallet Factory ─────────────────────────────────────────────
export const createSavingsGoalWallet = (goalName, targetAmount, monthlyContribution, bankName, parentInterestRate) => ({
  id: 'savings-goal',
  type: 'savings-goal',
  label: goalName,
  icon: '\uD83C\uDFAF',
  balance: 0,
  interestRate: parentInterestRate ?? 0.0005,
  color: MODULE_COLORS['module-3'].color,
  colorLight: MODULE_COLORS['module-3'].colorLight,
  target: targetAmount,
  monthlyContribution,
  institution: bankName,
  parentAccountType: (parentInterestRate ?? 0) > 0.01 ? 'hysa' : 'basic',
});

// ─── Emergency Fund Wallet Factory ───────────────────────────────────────────
export const createEmergencyFundWallet = (targetAmount, bankName, parentInterestRate) => ({
  id: 'emergency-fund',
  type: 'emergency',
  label: 'Emergency Fund',
  icon: '\uD83D\uDEE1\uFE0F',
  balance: 0,
  interestRate: parentInterestRate ?? 0.0005,
  color: '#F5883A',
  colorLight: '#FEF0E6',
  target: targetAmount,
  monthlyContribution: 0,
  institution: bankName,
  monthsCovered: 0,
  parentAccountType: (parentInterestRate ?? 0) > 0.01 ? 'hysa' : 'basic',
});