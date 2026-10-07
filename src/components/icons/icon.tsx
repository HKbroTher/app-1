import { useId, type ReactNode } from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { brandGradient, colors } from '@/theme/tokens';

export type IconName =
  | 'explore'
  | 'post'
  | 'profile'
  | 'search'
  | 'back'
  | 'arrowLeft'
  | 'arrowRight'
  | 'bell'
  | 'settings'
  | 'close'
  | 'lock'
  | 'clock'
  | 'plus'
  | 'check'
  | 'more'
  | 'start'
  | 'end';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  /** Stroke with the brand gradient instead of a flat color. */
  gradient?: boolean;
  strokeWidth?: number;
  /** Soft halo (wide translucent strokes under the glyph) marking it as interactive. */
  glow?: boolean;
};

// Halo layers: [stroke multiplier, opacity], widest/faintest first.
const HALO = [
  [5, 0.07],
  [3.2, 0.14],
] as const;
// Extra viewBox room (in glyph units) so the halo isn't clipped; cancelled with a negative margin.
const HALO_PAD = 4;

/** Custom thin-line icon set (24×24 grid, round caps) used across the app. */
export function Icon({ name, size = 24, color = colors.text, gradient = false, strokeWidth = 1.6, glow = false }: Props) {
  const gradId = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const paint = gradient ? `url(#${gradId})` : color;
  const pad = glow ? (size * HALO_PAD) / 24 : 0;
  const stroke = (w: number) => ({ stroke: paint, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }) as const;

  return (
    <Svg
      width={size + pad * 2}
      height={size + pad * 2}
      viewBox={glow ? `${-HALO_PAD} ${-HALO_PAD} ${24 + HALO_PAD * 2} ${24 + HALO_PAD * 2}` : '0 0 24 24'}
      style={glow ? { margin: -pad } : undefined}>
      {gradient && (
        <Defs>
          <LinearGradient id={gradId} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            {brandGradient.map((c, i) => (
              <Stop key={c} offset={i / (brandGradient.length - 1)} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
      )}
      {glow &&
        HALO.map(([mult, opacity]) => (
          <G key={mult} opacity={opacity}>
            {GLYPHS[name](stroke(strokeWidth * mult), paint)}
          </G>
        ))}
      {GLYPHS[name](stroke(strokeWidth), paint)}
    </Svg>
  );
}

type StrokeProps = {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
  fill: 'none';
};

const GLYPHS: Record<IconName, (s: StrokeProps, paint: string) => ReactNode> = {
  explore: (s) => (
    <>
      <Circle cx="12" cy="12" r="9.25" {...s} />
      <Path d="M15.2 8.8 13.3 13.3 8.8 15.2 10.7 10.7Z" {...s} />
    </>
  ),
  post: (s) => (
    <>
      <Rect x="3.75" y="3.75" width="16.5" height="16.5" rx="5.5" {...s} />
      <Path d="M12 8.5v7M8.5 12h7" {...s} />
    </>
  ),
  profile: (s) => (
    <>
      <Circle cx="12" cy="8.5" r="3.75" {...s} />
      <Path d="M4.75 19.75c1.4-3 4.1-4.5 7.25-4.5s5.85 1.5 7.25 4.5" {...s} />
    </>
  ),
  search: (s) => (
    <>
      <Circle cx="11" cy="11" r="6.75" {...s} />
      <Path d="m16.2 16.2 4.05 4.05" {...s} />
    </>
  ),
  back: (s) => <Path d="M14.5 5.5 8 12l6.5 6.5" {...s} />,
  arrowLeft: (s) => <Path d="M19.5 12h-15M10 6.5 4.5 12l5.5 5.5" {...s} />,
  arrowRight: (s) => <Path d="M4.5 12h15M14 6.5l5.5 5.5-5.5 5.5" {...s} />,
  bell: (s) => (
    <>
      <Path d="M6.5 10a5.5 5.5 0 0 1 11 0v3.6l1.5 2.4H5l1.5-2.4Z" {...s} />
      <Path d="M10 19a2 2 0 0 0 4 0" {...s} />
    </>
  ),
  settings: (s) => (
    <>
      <Path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9" {...s} />
      <Circle cx="15" cy="7.5" r="2" {...s} />
      <Circle cx="9" cy="16.5" r="2" {...s} />
    </>
  ),
  close: (s) => <Path d="m6.5 6.5 11 11M17.5 6.5l-11 11" {...s} />,
  lock: (s) => (
    <>
      <Rect x="5.5" y="10.5" width="13" height="9.5" rx="3" {...s} />
      <Path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" {...s} />
    </>
  ),
  clock: (s) => (
    <>
      <Circle cx="12" cy="12" r="8.75" {...s} />
      <Path d="M12 7.5V12l3 2" {...s} />
    </>
  ),
  plus: (s) => <Path d="M12 5v14M5 12h14" {...s} />,
  check: (s) => <Path d="m5.5 12.5 4 4 9-9" {...s} />,
  more: (_s, paint) => (
    <>
      <Circle cx="6" cy="12" r="1.4" fill={paint} />
      <Circle cx="12" cy="12" r="1.4" fill={paint} />
      <Circle cx="18" cy="12" r="1.4" fill={paint} />
    </>
  ),
  start: (s) => (
    <>
      <Circle cx="12" cy="12" r="8.75" {...s} />
      <Path d="m10.5 9 4 3-4 3Z" {...s} />
    </>
  ),
  end: (s) => (
    <>
      <Circle cx="12" cy="12" r="8.75" {...s} />
      <Rect x="9.5" y="9.5" width="5" height="5" rx="1" {...s} />
    </>
  ),
};
