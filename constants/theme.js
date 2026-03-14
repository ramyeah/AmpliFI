// constants/theme.js

export const Colors = {
  // Primary Palette
  coral:       '#FF8698',   // primary accent / buttons / highlights
  mint:        '#D2EBBF',   // success states, progress bars
  yellow:      '#FFF6A4',   // warnings, XP badges
  orange:      '#FF8E3C',   // secondary accent (from style guide)
  skyBlue:     '#BCE7F0',   // backgrounds, cards, info states

  // Neutrals
  white:       '#FFFFFF',
  black:       '#121211',   // primary text
  darkGray:    '#3A3A3A',   // secondary text
  midGray:     '#9A9A9A',   // placeholder / disabled text
  lightGray:   '#F5F5F5',   // subtle backgrounds
  border:      '#E8E8E8',   // card borders, dividers

  // Semantic aliases (use these in components, not raw colors above)
  primary:     '#F97B8B',   // coral — main CTA color
  primaryLight:'#FFD6DC',   // tinted coral for backgrounds
  secondary:   '#BCE7F0',   // sky blue — secondary surfaces
  success:      '#D2EBBF',  // mint
  successDark:  '#6BBF6B',  // deeper green for text/icons on light backgrounds
  successLight: '#DCFCE7',  // tinted green for backgrounds
  warning:      '#FFF6A4',  // yellow
  warningDark:  '#E6A800',  // amber — for text/icons on warning backgrounds
  warningLight: '#FFFBEB',  // tinted amber for backgrounds
  danger:       '#DC2626',  // red — wrong answers, errors
  dangerLight:  '#FEF2F2',  // tinted red for backgrounds
  dangerMid:    '#FECACA',  // mid red for borders
  dangerDark:   '#991B1B',  // dark red for text on light red backgrounds
  accent:       '#FF8E3C',  // orange
  accentLight:  '#FFF0E5',  // tinted orange for backgrounds
  secondaryLight:'#E5F6FB', // tinted sky blue for backgrounds
  background:   '#FFFDF5',
  surface:      '#F9F4FF',  // very light off-white for cards
  textPrimary:  '#121211',
  textSecondary:'#3A3A3A',
  textMuted:    '#9A9A9A',
};

// ─── Module Color Tokens ──────────────────────────────────────────────────────
// Each module has a `color` (solid accent) and `colorLight` (tinted background).
// Components reading module.color / module.colorLight get these values at runtime.
// To change a module's entire color scheme, edit ONLY this map.
//
// Usage in modules.js:  color: MODULE_COLORS['module-1'].color
// Usage in components:  <View style={{ backgroundColor: module.colorLight }}>
export const MODULE_COLORS = {
  'module-1': {
    color:      '#3AAECC',   // teal blue
    colorLight: '#E0F5FB',
  },
  'module-2': {
    color:      '#F5883A',   // burnt orange
    colorLight: '#FFF0E3',
  },
  'module-3': {
    color:      '#5BBF8A',   // forest mint
    colorLight: '#E4F7EE',
  },
  'module-4': {
    color:      '#8B6FD4',   // soft purple
    colorLight: '#F0EBFC',
  },
};

export const Typography = {
  fontFamily: {
    regular:    'Nunito_400Regular',
    medium:     'Nunito_500Medium',
    semiBold:   'Nunito_600SemiBold',
    bold:       'Nunito_700Bold',
    extraBold:  'Nunito_800ExtraBold',
  },
  fontSize: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    xxl:  30,
    hero: 38,
  },
  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.8,
  },
};

export const Fonts = {
  regular:  'Nunito_400Regular',
  medium:   'Nunito_500Medium',
  semiBold: 'Nunito_600SemiBold',
  bold:     'Nunito_700Bold',
  extraBold:'Nunito_800ExtraBold',
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,   // gutter
  lg:   16,   // margin
  xl:   24,
  xxl:  32,
  xxxl: 48,
};

export const Radii = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
};

export const Shadows = {
  soft: {
    shadowColor: '#121211',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: '#121211',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const Layout = {
  columns:      4,
  margin:       16,
  gutter:       12,
  screenPadding: 16,
};

// Convenience default export
const theme = { Colors, Typography, Spacing, Radii, Shadows, Layout };
export default theme;