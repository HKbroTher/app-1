import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { brandGradient, colors, glow } from '@/theme/tokens';

const SIZE = 24;

/** Selection marker on a photo: an empty ring, or a glowing gradient disc with the pick order. */
export function SelectionBadge({ order }: { order: number | null }) {
  if (order === null) return <View style={styles.ring} />;
  return (
    <View style={styles.glow}>
      <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.disc}>
        <Text style={styles.number}>{order}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  glow: {
    borderRadius: SIZE / 2,
    boxShadow: glow.brand,
  },
  disc: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
});
