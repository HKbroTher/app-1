import * as Haptics from 'expo-haptics';
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { brandSolid, colors, textGlow } from '@/theme/tokens';

type Props = {
  label: string;
  onPress?: () => void;
  /** brand = primary action, plain = secondary, muted = inactive state (e.g. "已关注"). */
  variant?: 'brand' | 'plain' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const FONT = { sm: 14, md: 16, lg: 18 } as const;

/** Borderless action: just glowing text set into the background, no pill or outline. */
export function TextButton({ label, onPress, variant = 'plain', size = 'md', disabled, style }: Props) {
  const color = disabled ? colors.textTertiary : variant === 'brand' ? brandSolid : variant === 'muted' ? colors.textSecondary : colors.text;
  const glow = disabled || variant === 'muted' ? null : variant === 'brand' ? textGlow.brand : textGlow.soft;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={10}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [{ opacity: pressed ? 0.55 : 1, paddingVertical: 4, alignItems: 'center' }, style]}>
      <Text style={[{ color, fontSize: FONT[size], fontWeight: '700', letterSpacing: 0.3 }, glow]}>{label}</Text>
    </Pressable>
  );
}
