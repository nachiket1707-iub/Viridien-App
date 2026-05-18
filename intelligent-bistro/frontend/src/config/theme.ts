export const Colors = {
  // Backgrounds — very dark, near-black with a subtle cool tint
  primary: '#09090f',
  surface: '#111119',
  card: '#17172a',

  // Brand accent — warm amber: universally visible across all colorblind types
  accent: '#e8a020',
  accentDark: '#b87818',
  accentLight: '#f0c048',

  // Text
  textMain: '#eeeeee',
  textMuted: '#7878a0',
  textDark: '#09090f',

  // Status — blue for success, orange for error (avoids red/green confusion)
  success: '#4a9fff',
  error: '#ff6b35',

  // Borders / overlays
  border: 'rgba(255,255,255,0.07)',
  borderAccent: 'rgba(232,160,32,0.22)',
  overlay: 'rgba(0,0,0,0.72)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
} as const;
