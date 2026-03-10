export const ASSET_CLASSES = [
  {
    id: 'stocks',
    name: 'Singapore Stocks/ETFs',
    description: 'STI ETF, blue chip stocks',
    icon: '📈',
    avgReturn: 0.08,
    volatility: 0.20,
    color: '#2E75B6',
  },
  {
    id: 'bonds',
    name: 'Bonds / Fixed Deposits',
    description: 'SSBs, bank FDs, corporate bonds',
    icon: '🏦',
    avgReturn: 0.04,
    volatility: 0.03,
    color: '#27AE60',
  },
  {
    id: 'cpf',
    name: 'CPF Investment Scheme',
    description: 'CPF-OA invested in unit trusts',
    icon: '🇸🇬',
    avgReturn: 0.05,
    volatility: 0.05,
    color: '#E67E22',
  },
  {
    id: 'robo',
    name: 'Robo-Advisor Fund',
    description: 'Syfe, StashAway diversified portfolio',
    icon: '🤖',
    avgReturn: 0.065,
    volatility: 0.10,
    color: '#9B59B6',
  },
];

export const RISK_PROFILES = {
  conservative: { stocks: 10, bonds: 50, cpf: 30, robo: 10 },
  balanced: { stocks: 30, bonds: 30, cpf: 20, robo: 20 },
  aggressive: { stocks: 50, bonds: 10, cpf: 10, robo: 30 },
};

export const SINGAPORE_EVENTS = [
  { text: "MAS raises interest rates 🏦", effect: { bonds: 0.02, stocks: -0.03, cpf: 0.01, robo: -0.01 } },
  { text: "STI hits record high 📈", effect: { stocks: 0.08, robo: 0.05, bonds: 0, cpf: 0 } },
  { text: "Global recession fears 😨", effect: { stocks: -0.12, robo: -0.08, bonds: 0.03, cpf: 0 } },
  { text: "Singapore GDP growth beats forecast 🇸🇬", effect: { stocks: 0.05, robo: 0.03, bonds: 0, cpf: 0 } },
  { text: "CPF interest rate revised upward 💰", effect: { cpf: 0.02, stocks: 0, bonds: 0, robo: 0 } },
  { text: "Tech sector selloff 💻", effect: { stocks: -0.06, robo: -0.04, bonds: 0.02, cpf: 0 } },
  { text: "Strong dividend season for SGX stocks 💵", effect: { stocks: 0.04, robo: 0.02, bonds: 0, cpf: 0 } },
  { text: "Inflation rises to 4% in Singapore 📊", effect: { stocks: -0.02, bonds: -0.03, cpf: 0, robo: -0.01 } },
  { text: "No event this month — steady markets ✅", effect: { stocks: 0, bonds: 0, cpf: 0, robo: 0 } },
  { text: "Property cooling measures announced 🏠", effect: { stocks: -0.02, bonds: 0.01, cpf: 0, robo: -0.01 } },
];

export const INFLATION_RATE = 0.025 / 12; // 2.5% p.a. monthly