// constants/questRoadmap.js
//
// Master quest roadmap and month gate definitions.
// Pure data — no UI, no side effects, no React imports.

export const QUEST_MAP = [
  { id: '1.1', name: 'Know Your Number',          chapter: 1, stageId: 'stage-1',  fcReward: 15 },
  { id: '1.2', name: 'Open Your Bank Account',    chapter: 1, stageId: 'stage-2',  fcReward: 15 },
  { id: '2.1', name: 'First Paycheck',             chapter: 2, stageId: 'stage-3',  fcReward: 0 },
  { id: '2.2', name: 'Build Your Budget',         chapter: 2, stageId: 'stage-4',  fcReward: 0 },
  { id: '3.1', name: 'Open Savings Goal Account', chapter: 3, stageId: 'stage-5',  fcReward: 15 },
  { id: '3.2', name: 'Build Emergency Fund',      chapter: 3, stageId: 'stage-6',  fcReward: 15 },
  { id: '4.1', name: 'Compound Interest',         chapter: 4, stageId: 'stage-7',  fcReward: 10 },
  { id: '4.2', name: 'Choose Your Vehicle',       chapter: 4, stageId: 'stage-8',  fcReward: 15 },
  { id: '4.3', name: 'First Investment',          chapter: 4, stageId: 'stage-9',  fcReward: 20 },
  { id: '4.4', name: 'Survive Market Dip',        chapter: 4, stageId: 'stage-10', fcReward: 20 },
  { id: '4.5', name: 'Diversify Portfolio',       chapter: 4, stageId: 'stage-11', fcReward: 15 },
  { id: '4.6', name: 'Rebalance Portfolio',       chapter: 4, stageId: 'stage-12', fcReward: 15 },
  { id: '5.1', name: 'Understand Your SFS',       chapter: 5, stageId: 'stage-13', fcReward: 15 },
  { id: '5.2', name: 'The CPFIS Decision',        chapter: 5, stageId: 'stage-14', fcReward: 20 },
  { id: '5.3', name: 'Retirement Projection',     chapter: 5, stageId: 'stage-15', fcReward: 15 },
  { id: '6.1', name: 'Hit Your FI Number',        chapter: 6, stageId: 'stage-16', fcReward: 50 },
  { id: '6.2', name: '4% Withdrawal Test',        chapter: 6, stageId: 'stage-17', fcReward: 25 },
];

// Single gate: bank account must be open before month can advance
export const ADVANCE_REQUIREMENT = {
  stageId: 'stage-2',
  message: "Open a bank account first \u2014 your salary needs somewhere to land.",
};

// ─── Side quests ──────────────────────────────────────────────────────────────
export const SIDE_QUESTS = [
  // Chapter 1 — Foundations
  { id: 'sq-1-3', name: 'Set a Financial Goal',          chapter: 1, category: 'Goals',     icon: '\uD83C\uDFAF', built: false },
  { id: 'sq-1-4', name: 'Calculate Net Worth',           chapter: 1, category: 'Banking',   icon: '\uD83D\uDCCA', built: false },
  { id: 'sq-1-5', name: 'Risk Profile Quiz',             chapter: 1, category: 'Investing', icon: '\u26A1',       built: false },

  // Chapter 2 — First Job
  { id: 'sq-2-3', name: 'Track Your Spending',           chapter: 2, category: 'Budgeting',   icon: '\uD83D\uDCCB', built: false },
  { id: 'sq-2-4', name: 'Automate Your Savings',         chapter: 2, category: 'Automation',  icon: '\u2699\uFE0F', built: false },
  { id: 'sq-2-5', name: 'Compare Budget Methods',        chapter: 2, category: 'Budgeting',   icon: '\uD83D\uDCA1', built: false },
  { id: 'sq-2-6', name: 'Surprise Expense',              chapter: 2, category: 'Emergency',   icon: '\uD83D\uDE2C', built: false },

  // Chapter 3 — Banking Pro
  { id: 'sq-3-3', name: 'Upgrade to HYSA',               chapter: 3, category: 'Banking',   icon: '\u26A1',       built: false },
  { id: 'sq-3-4', name: 'Set Up Standing Order',         chapter: 3, category: 'Automation', icon: '\u2699\uFE0F', built: false },
  { id: 'sq-3-5', name: 'HYSA Conditions Checklist',     chapter: 3, category: 'Banking',   icon: '\u2705',       built: false },
  { id: 'sq-3-6', name: 'Interest Comparison',           chapter: 3, category: 'Banking',   icon: '\uD83D\uDCC8', built: false },
  { id: 'sq-3-7', name: 'Medical Emergency',             chapter: 3, category: 'Emergency', icon: '\uD83C\uDFE5', built: false },

  // Chapter 4 — Investing
  { id: 'sq-4-7',  name: 'Investment Policy Statement',  chapter: 4, category: 'Investing', icon: '\uD83D\uDCDC', built: false },
  { id: 'sq-4-8',  name: 'Fee Drag Calculator',          chapter: 4, category: 'Investing', icon: '\uD83D\uDCB8', built: false },
  { id: 'sq-4-9',  name: 'DCA vs Lump Sum',              chapter: 4, category: 'Investing', icon: '\u2696\uFE0F', built: false },
  { id: 'sq-4-10', name: 'Understand DCA',               chapter: 4, category: 'Investing', icon: '\uD83D\uDCC9', built: false },
  { id: 'sq-4-11', name: 'Portfolio Report',             chapter: 4, category: 'Insights',  icon: '\uD83E\uDD16', built: false },
  { id: 'sq-4-12', name: 'Windfall Decision',            chapter: 4, category: 'Investing', icon: '\uD83C\uDFB0', built: false },
  { id: 'sq-4-13', name: 'Spot the Red Flag',            chapter: 4, category: 'Investing', icon: '\uD83D\uDEA9', built: false },

  // Chapter 5 — Advanced
  { id: 'sq-5-4', name: 'Voluntary SFS Top-Up',          chapter: 5, category: 'CPF',       icon: '\uD83C\uDFDB\uFE0F', built: false },
  { id: 'sq-5-5', name: 'Buy vs Rent Calculator',        chapter: 5, category: 'Property',  icon: '\uD83C\uDFE0',       built: false },
  { id: 'sq-5-6', name: 'International Considerations',  chapter: 5, category: 'CPF',       icon: '\u2708\uFE0F',       built: false },
  { id: 'sq-5-7', name: 'Tax-Loss Harvesting',           chapter: 5, category: 'Investing', icon: '\uD83D\uDCC9',       built: false },

  // Endgame
  { id: 'sq-6-3', name: 'One More Year Syndrome',        chapter: 6, category: 'Mindset',   icon: '\uD83E\uDDE0', built: false },
  { id: 'sq-6-4', name: 'Legacy Planning',               chapter: 6, category: 'Advanced',  icon: '\uD83C\uDFDB\uFE0F', built: false },
];

// ─── Chapter metadata ─────────────────────────────────────────────────────────
export const CHAPTER_META = {
  1: { name: 'Foundations',  icon: '\uD83C\uDF31', mainQuestIds: ['1.1', '1.2'] },
  2: { name: 'First Job',   icon: '\uD83D\uDCBC', mainQuestIds: ['2.1', '2.2'] },
  3: { name: 'Banking Pro',  icon: '\uD83C\uDFE6', mainQuestIds: ['3.1', '3.2'] },
  4: { name: 'Investing',    icon: '\uD83D\uDCC8', mainQuestIds: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6'] },
  5: { name: 'Advanced',     icon: '\uD83C\uDFDB\uFE0F', mainQuestIds: ['5.1', '5.2', '5.3'] },
  6: { name: 'Endgame',      icon: '\uD83C\uDFC6', mainQuestIds: ['6.1', '6.2'] },
};
