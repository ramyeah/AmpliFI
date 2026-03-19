// constants/simTheme.js
//
// Centralised simulation theme tokens.
// Change colours, icons, or labels here to retheme every sim screen at once.
// All colour values reference Colors / MODULE_COLORS from theme.js.

import { Colors, MODULE_COLORS } from './theme';

// ─── Coin asset ──────────────────────────────────────────────────────────────
export const COIN_ASSET = require('../assets/coin.png');

// ─── Chapter accent colours ──────────────────────────────────────────────────
// Each chapter's accent (solid) and light (background tint).
// Mapped to MODULE_COLORS so modules and their sim chapters stay visually linked.
export const CHAPTER_COLORS = {
  1: {
    accent: MODULE_COLORS['module-1'].color,      // teal — Know Your Number (FI goal)
    light:  MODULE_COLORS['module-1'].colorLight,  // tinted teal background
  },
  2: {
    accent: MODULE_COLORS['module-2'].color,      // orange — Open Your Bank
    light:  MODULE_COLORS['module-2'].colorLight,  // tinted orange background
  },
  3: {
    accent: MODULE_COLORS['module-1'].color,      // teal — Budget Your Life (budgeting is module-1 aligned)
    light:  MODULE_COLORS['module-1'].colorLight,  // tinted teal background
  },
  4: {
    accent: MODULE_COLORS['module-3'].color,      // green — Start Investing
    light:  MODULE_COLORS['module-3'].colorLight,  // tinted green background
  },
  5: {
    accent: MODULE_COLORS['module-4'].color,      // purple — Advanced Moves (CPF)
    light:  MODULE_COLORS['module-4'].colorLight,  // tinted purple background
  },
};

// ─── Fin character ───────────────────────────────────────────────────────────
export const FIN = {
  emoji: '🐟',
  name: 'Fin',
};

// ─── Currency display ────────────────────────────────────────────────────────
export const CURRENCY = {
  asset: COIN_ASSET,
  defaultSize: 16,
  label: 'FinCoins',
};

// ─── Status badge colours (chapter cards in simulate.js) ─────────────────────
export const STATUS_COLORS = {
  current: {
    bg:   MODULE_COLORS['module-1'].colorLight,  // tinted teal — active chapter background
    text: MODULE_COLORS['module-1'].color,       // teal — active chapter text
  },
  complete: {
    bg:   Colors.successLight,                   // tinted green — done chapter background
    text: Colors.successDark,                    // deep green — done chapter text
  },
  locked: {
    bg:   Colors.lightGray,                      // neutral grey — locked chapter background
    text: Colors.textMuted,                      // muted grey — locked chapter text
  },
};
