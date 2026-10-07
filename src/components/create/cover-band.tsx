import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';

import { colors, textGlow } from '@/theme/tokens';

/** Bottom band on the first photo marking it as the cover. Place inside a clipped tile. */
export function CoverBand() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.78)']}
      style={styles.band}>
      <Text style={[styles.label, textGlow.soft]}>封面</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 34,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
