// constants/simulation.js
import { Colors, MODULE_COLORS } from './theme';

// ─── SHARED ───────────────────────────────────────────────────────────────────

export const INFLATION_RATE = 0.025 / 12;

// ─── SALARY SCALING ───────────────────────────────────────────────────────────
// FinCoins map to income brackets. More studying = higher simulated income.

export const INCOME_BRACKETS = [
  { minCoins: 500, income: 3800, label: 'Mid-level exec',   emoji: '💼' },
  { minCoins: 300, income: 2800, label: 'Fresh grad',       emoji: '🎓' },
  { minCoins: 150, income: 2000, label: 'Part-time worker', emoji: '📚' },
  { minCoins:   0, income: 1200, label: 'Student allowance',emoji: '🌱' },
];

export const getIncomeBracket = (finCoins = 0) =>
  INCOME_BRACKETS.find(b => finCoins >= b.minCoins) ?? INCOME_BRACKETS[INCOME_BRACKETS.length - 1];

// ─── BUDGETING SIM — CHARACTER STATE ─────────────────────────────────────────
//
// The character's financial life persists across all 6 months.
// Every decision changes the numbers going into the next month.

export const createInitialState = (income, stakeCoins) => ({
  income,
  // Bank balance starts at stake × 10 to give the SGD amounts meaning
  // e.g. 100 coins → $1,000 bank balance — a realistic starting point
  bankBalance:      stakeCoins * 10,
  savingsBalance:   0,       // emergency fund — target is 3× monthly income
  creditCardDebt:   0,       // grows if player makes bad choices
  savingsRate:      0,       // % of income committed to savings (set month 1)
  monthlyNeeds:     Math.round(income * 0.50),   // fixed — rent, food, transport
  history:          [],      // bank balance after each month
});

// Apply a confirmed choice + event outcome to get next month's state.
// This is a pure function — no side effects.
export const computeNewState = (state, option, event) => {
  const savingsDelta = typeof option.savings_delta === 'number' ? option.savings_delta : 0;
  const debtDelta    = typeof option.debt_delta    === 'number' ? option.debt_delta    : 0;

  // Credit card interest compounds regardless of choice
  const interestCharge = state.creditCardDebt > 0
    ? Math.round(state.creditCardDebt * 0.25 / 12)
    : 0;

  const newDebt     = Math.max(0, state.creditCardDebt + debtDelta + interestCharge);
  const newSavings  = Math.max(0, state.savingsBalance + savingsDelta);

  // Bank balance = income − needs − new savings added − debt payment − interest
  const savingsAdded   = Math.max(0, savingsDelta);   // money moved to savings
  const debtPayment    = Math.abs(Math.min(0, debtDelta)); // money used to pay debt
  const bankChange     = state.income - state.monthlyNeeds - savingsAdded - debtPayment - interestCharge;

  // Apply any event-level bank shocks (floods, bonuses, etc.)
  const eventBankShock = event?.bank_shock ?? 0;
  const newBank = Math.max(0, state.bankBalance + bankChange + eventBankShock);

  const newHistory = [...state.history, Math.round(newBank)];

  // Derive savings rate from this month's action
  const newSavingsRate = state.income > 0
    ? Math.round((savingsAdded / state.income) * 100)
    : state.savingsRate;

  return {
    ...state,
    bankBalance:    newBank,
    savingsBalance: newSavings,
    creditCardDebt: newDebt,
    savingsRate:    newSavingsRate,
    history:        newHistory,
  };
};

// ─── MONTHLY EVENTS ───────────────────────────────────────────────────────────
// One fires per month. The event is passed to the backend which generates
// contextual options around it. bank_shock is applied automatically regardless
// of the player's choice — it represents unavoidable external forces.

export const MONTHLY_EVENTS = [
  {
    id: 'first-paycheck',
    month: 1,
    icon: '💸',
    text: 'First paycheck arrives',
    detail: 'Your salary just hit your account. Rent is due in 3 days. This is the moment that sets your financial habits for the year.',
    bank_shock: 0,
    concept: 'Pay yourself first — the 50/30/20 rule',
  },
  {
    id: 'grabfood-creep',
    month: 2,
    icon: '🍜',
    text: 'GrabFood habit is eating your budget',
    detail: 'You have been ordering delivery every evening this week. The convenience fee adds up to significantly more than eating at the hawker centre.',
    bank_shock: 0,
    concept: 'Present bias — small daily costs compound',
  },
  {
    id: 'market-shock',
    month: 3,
    icon: '📉',
    text: 'STI drops 15% this week',
    detail: 'Your small STI ETF investment is now down. A colleague says it will keep falling. Your emergency fund is separate and untouched.',
    bank_shock: 0,
    concept: 'Loss aversion — paper losses feel more painful than they are',
  },
  {
    id: 'angbao',
    month: 4,
    icon: '🧧',
    text: 'Chinese New Year ang bao windfall',
    detail: 'You received ang baos from relatives. Unexpected income is a rare chance to accelerate your financial position.',
    bank_shock: 0,  // GPT will set the amount in options based on income
    concept: 'Windfall allocation — debt first, then emergency fund, then wants',
  },
  {
    id: 'rent-hike',
    month: 5,
    icon: '🏠',
    text: 'Landlord raises rent',
    detail: 'Your landlord just increased rent. Your fixed Needs now consume more of your income than the 50% target. Something has to give.',
    bank_shock: 0,
    concept: 'The savings-first rule — cut Wants before touching Savings',
  },
  {
    id: 'bonus-surplus',
    month: 6,
    icon: '🎯',
    text: 'Performance bonus and year-end surplus',
    detail: 'Final month. You received a small bonus and have surplus left over after all expenses. This is the moment that separates savers from spenders.',
    bank_shock: 0,
    concept: 'Delayed gratification — the habit loop that builds wealth',
  },
];

// ─── INVESTING SIM ────────────────────────────────────────────────────────────

export const ASSET_CLASSES = [
  {
    id: 'stocks',
    name: 'Singapore Stocks/ETFs',
    description: 'STI ETF, blue chip stocks',
    icon: '📈',
    avgReturn: 0.08,
    volatility: 0.20,
    color: MODULE_COLORS['module-3'].color,
  },
  {
    id: 'bonds',
    name: 'Bonds / Fixed Deposits',
    description: 'SSBs, bank FDs, corporate bonds',
    icon: '🏦',
    avgReturn: 0.04,
    volatility: 0.03,
    color: MODULE_COLORS['module-2'].color,
  },
  {
    id: 'cpf',
    name: 'CPF Investment Scheme',
    description: 'CPF-OA invested in unit trusts',
    icon: '🇸🇬',
    avgReturn: 0.05,
    volatility: 0.05,
    color: MODULE_COLORS['module-4'].color,
  },
  {
    id: 'robo',
    name: 'Robo-Advisor Fund',
    description: 'Syfe, StashAway diversified portfolio',
    icon: '🤖',
    avgReturn: 0.065,
    volatility: 0.10,
    color: Colors.accent,
  },
];

export const RISK_PROFILES = {
  conservative: { stocks: 10, bonds: 50, cpf: 30, robo: 10 },
  balanced:     { stocks: 30, bonds: 30, cpf: 20, robo: 20 },
  aggressive:   { stocks: 50, bonds: 10, cpf: 10, robo: 30 },
};

export const INVESTING_EVENTS = [
  { text: 'MAS raises interest rates 🏦',             effect: { bonds: 0.02,  stocks: -0.03, cpf: 0.01,  robo: -0.01 } },
  { text: 'STI hits record high 📈',                  effect: { stocks: 0.08, robo: 0.05,   bonds: 0,    cpf: 0      } },
  { text: 'Global recession fears 😨',                effect: { stocks: -0.12,robo: -0.08,  bonds: 0.03, cpf: 0      } },
  { text: 'Singapore GDP growth beats forecast 🇸🇬', effect: { stocks: 0.05, robo: 0.03,   bonds: 0,    cpf: 0      } },
  { text: 'CPF interest rate revised upward 💰',      effect: { cpf: 0.02,   stocks: 0,     bonds: 0,    robo: 0     } },
  { text: 'Tech sector selloff 💻',                   effect: { stocks: -0.06,robo: -0.04,  bonds: 0.02, cpf: 0      } },
  { text: 'Strong dividend season for SGX stocks 💵', effect: { stocks: 0.04, robo: 0.02,   bonds: 0,    cpf: 0      } },
  { text: 'Inflation rises to 4% in Singapore 📊',    effect: { stocks: -0.02,bonds: -0.03, cpf: 0,      robo: -0.01 } },
  { text: 'No event this month — steady markets ✅',  effect: { stocks: 0,    bonds: 0,     cpf: 0,      robo: 0     } },
  { text: 'Property cooling measures announced 🏠',   effect: { stocks: -0.02,bonds: 0.01,  cpf: 0,      robo: -0.01 } },
];

export const SINGAPORE_EVENTS = INVESTING_EVENTS;

// ─── SAVING SIM ───────────────────────────────────────────────────────────────

export const SAVING_ACCOUNTS = [
  {
    id: 'basic',
    name: 'Basic Savings Account',
    description: 'Standard DBS/POSB savings account',
    icon: '🏦',
    baseRate: 0.0005,
    bonusRate: 0,
    color: Colors.midGray,
    colorLight: Colors.lightGray,
    conditions: [],
  },
  {
    id: 'hysa',
    name: 'High-Yield Savings Account',
    description: 'OCBC 360 / UOB One — up to 4% p.a.',
    icon: '⚡',
    baseRate: 0.0005,
    bonusRate: 0.04,
    color: MODULE_COLORS['module-2'].color,
    colorLight: MODULE_COLORS['module-2'].colorLight,
    conditions: ['Salary credit', 'Min. card spend $500', 'GIRO debit'],
  },
  {
    id: 'ssb',
    name: 'Singapore Savings Bond',
    description: 'Government-backed, ~3% p.a., penalty-free redemption',
    icon: '📜',
    baseRate: 0.03,
    bonusRate: 0,
    color: MODULE_COLORS['module-1'].color,
    colorLight: MODULE_COLORS['module-1'].colorLight,
    conditions: ['Min. $500', 'CDP account required'],
  },
  {
    id: 'cpf_oa',
    name: 'CPF Ordinary Account',
    description: 'Guaranteed 2.5% p.a. — housing & investment eligible',
    icon: '🇸🇬',
    baseRate: 0.025,
    bonusRate: 0,
    color: MODULE_COLORS['module-4'].color,
    colorLight: MODULE_COLORS['module-4'].colorLight,
    conditions: ['Singapore citizen/PR only', 'Locked until 55'],
  },
];

export const SAVING_EVENTS = [
  { text: 'MAS cuts interest rates 📉',               effect: { hysa: -0.005 },  tip: 'Interest rate risk is real for HYSA holders. SSBs lock in your rate at purchase.' },
  { text: 'Unexpected repair — $200 deducted 🔧',     effect: { withdraw: 200 }, tip: 'This is exactly what an emergency fund is for. Rebuild it as soon as possible.' },
  { text: 'CPF interest rate revised upward 💰',      effect: { cpf_oa: 0.005 }, tip: 'CPF OA rate adjustments are rare but meaningful over decades of compounding.' },
  { text: "New SSB tranche at higher rate 📈",        effect: {},                 tip: 'SSBs can be redeemed penalty-free. If a new tranche offers more, redeem and reinvest.' },
  { text: 'Uneventful month — interest credited ✅',  effect: {},                 tip: 'Compounding works silently. The best action this month was doing nothing.' },
  { text: 'Medical emergency — $500 withdrawn 🏥',    effect: { withdraw: 500 }, tip: 'A 3-month emergency fund absorbs this without touching investments.' },
];

// ─── SIM CONFIG ───────────────────────────────────────────────────────────────

export const SIM_CONFIG = {
  budgeting: {
    id: 'budgeting',
    title: 'Budgeting Sim',
    subtitle: 'Manage your financial life for 6 months',
    icon: '🏠',
    color: MODULE_COLORS['module-1'].color,
    colorLight: MODULE_COLORS['module-1'].colorLight,
    fincoinCost: 50,
    xpReward: 200,
    months: 6,
    unlockRequirement: 'Complete Module 1 Chapter 2',
    unlockLesson: '2-3',
    description: '6 months of real Singapore financial decisions. Your choices have consequences — bank balance, debt, and savings all carry forward.',
  },
  saving: {
    id: 'saving',
    title: 'Saving Sim',
    subtitle: 'Grow your emergency fund',
    icon: '🏦',
    color: MODULE_COLORS['module-2'].color,
    colorLight: MODULE_COLORS['module-2'].colorLight,
    fincoinCost: 75,
    xpReward: 250,
    fincoinReward: 100,
    months: 12,
    unlockRequirement: 'Complete Module 2',
    unlockLesson: '6-3',
    description: 'Allocate savings across account types and build your emergency fund to 3–6 months of expenses.',
    npcDialogue: "You've been working for 6 months and have $2,000 saved. Time to make that money work harder.",
  },
  investing: {
    id: 'investing',
    title: 'Investing Sim',
    subtitle: 'Build a portfolio',
    icon: '📈',
    color: MODULE_COLORS['module-3'].color,
    colorLight: MODULE_COLORS['module-3'].colorLight,
    fincoinCost: 100,
    xpReward: 300,
    fincoinReward: 150,
    months: 12,
    unlockRequirement: 'Complete Module 3 + Risk Quiz',
    unlockLesson: '9-3',
    description: 'Build a diversified portfolio across Singapore asset classes and simulate 12 months of market conditions.',
    npcDialogue: "Your emergency fund is fully funded. Now it's time to put your long-term savings to work.",
  },
};

// ─── AVATAR + ADVISOR ─────────────────────────────────────────────────────────

export const AVATAR_OPTIONS = [
  { id: 'avatar-1', emoji: '🧑', label: 'Alex' },
  { id: 'avatar-2', emoji: '👩', label: 'Maya' },
  { id: 'avatar-3', emoji: '🧑‍💼', label: 'Jordan' },
  { id: 'avatar-4', emoji: '👩‍💼', label: 'Priya' },
];

export const ADVISOR = {
  emoji: '🦉',
  name: 'Fin',
  title: 'Your Financial Advisor',
};