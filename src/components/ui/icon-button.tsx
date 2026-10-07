import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';

import { Icon, type IconName } from '@/components/icons/icon';

type Props = {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  accessibilityLabel: string;
};

/** Borderless icon action: the glyph sits on the background with a soft glow. */
export function IconButton({ icon, onPress, size = 24, accessibilityLabel }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={12}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, padding: 4 })}>
      <Icon name={icon} size={size} glow />
    </Pressable>
  );
}
