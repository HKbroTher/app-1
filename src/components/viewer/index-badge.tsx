import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { GradientNumber } from '@/components/icons/gradient-number';
import { colors } from '@/theme/tokens';

type Props = {
  index: number; // 0-based
  total: number;
};

/** Current position as a glowing gradient numeral set into the background, with a quiet total. */
export function IndexBadge({ index, total }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.numberSlot}>
        <Animated.View key={index} entering={FadeInDown.springify().damping(16)} exiting={FadeOutUp.duration(160)} style={StyleSheet.absoluteFill}>
          <GradientNumber value={index + 1} size={52} fontSize={34} glow />
        </Animated.View>
      </View>
      <Text style={styles.total}>/ {total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberSlot: {
    width: 52,
    height: 52,
    overflow: 'hidden',
  },
  total: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: -6,
    marginTop: 8,
  },
});
