// Design rule: the background is pure black; anything interactive glows.
export const colors = {
  bg: '#000000',
  surface: '#0A0A0C',
  glass: 'rgba(255,255,255,0.08)',
  glassStrong: 'rgba(255,255,255,0.14)',
  // Android fallback when real-time blur is unavailable
  glassFallback: 'rgba(28,28,32,0.78)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassHighlight: 'rgba(255,255,255,0.25)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textTertiary: 'rgba(255,255,255,0.38)',
  danger: '#FF5A6A',
} as const;

// Instagram-style brand gradient
export const brandGradient = ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'] as const;
export const brandGradientShort = ['#FA7E1E', '#D62976', '#962FBF'] as const;

export const gold = '#F2C14E';

/** Solid brand accent for text-only actions (e.g. Follow). */
export const brandSolid = '#F0457F';

const textShadow = (color: string, radius: number) => ({
  textShadowColor: color,
  textShadowRadius: radius,
  textShadowOffset: { width: 0, height: 0 },
});

/**
 * Borderless UI: actions are text/icons set straight on the black background.
 * Interactive text glows; static text does not.
 */
export const textGlow = {
  soft: textShadow('rgba(255,255,255,0.55)', 8),
  strong: textShadow('rgba(255,255,255,0.8)', 12),
  brand: textShadow('rgba(240,69,127,0.85)', 12),
} as const;

type Shadow = {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spreadDistance?: number;
  color: string;
};

/** Outer glows for interactive elements (RN `boxShadow`, works on iOS + Android). */
export const glow: Record<'soft' | 'strong' | 'brand', Shadow[]> = {
  soft: [{ offsetX: 0, offsetY: 0, blurRadius: 14, color: 'rgba(255,255,255,0.10)' }],
  strong: [{ offsetX: 0, offsetY: 0, blurRadius: 20, color: 'rgba(255,255,255,0.18)' }],
  brand: [
    { offsetX: -4, offsetY: 0, blurRadius: 18, color: 'rgba(250,126,30,0.45)' },
    { offsetX: 4, offsetY: 0, blurRadius: 18, color: 'rgba(150,47,191,0.45)' },
  ],
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const blur = {
  regular: 40,
  strong: 70,
} as const;

export const spring = {
  tab: { damping: 18, stiffness: 180, mass: 0.9 },
  card: { damping: 20, stiffness: 160 },
} as const;
