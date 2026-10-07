import { useId } from 'react';
import Svg, { Defs, G, LinearGradient, Stop, Text } from 'react-native-svg';

import { brandGradient } from '@/theme/tokens';

type Props = {
  value: number | string;
  size?: number;
  fontSize?: number;
  /** Soft halo around the numeral. */
  glow?: boolean;
};

/** A numeral filled with the brand gradient (SVG text, so it works without MaskedView). */
export function GradientNumber({ value, size = 44, fontSize = 26, glow = false }: Props) {
  const id = `n${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const paint = `url(#${id})`;
  const text = (props: object) => (
    <Text
      x={size / 2}
      y={size / 2 + fontSize * 0.36}
      fontSize={fontSize}
      fontWeight="800"
      textAnchor="middle"
      {...props}>
      {String(value)}
    </Text>
  );

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
          {brandGradient.map((c, i) => (
            <Stop key={c} offset={i / (brandGradient.length - 1)} stopColor={c} />
          ))}
        </LinearGradient>
      </Defs>
      {glow && (
        <>
          <G opacity={0.1}>{text({ fill: paint, stroke: paint, strokeWidth: 9, strokeLinejoin: 'round' })}</G>
          <G opacity={0.2}>{text({ fill: paint, stroke: paint, strokeWidth: 4, strokeLinejoin: 'round' })}</G>
        </>
      )}
      {text({ fill: paint })}
    </Svg>
  );
}
