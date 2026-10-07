import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { brandGradient, colors, glow, spring, textGlow } from '@/theme/tokens';

type Props<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

const BAR = 18;

/** Xiaohongshu-style text tabs: words on the background, a glowing gradient bar slides under the active one. */
export function TextTabs<T extends string>({ options, value, onChange }: Props<T>) {
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const x = useSharedValue(0);
  const stretch = useSharedValue(1);
  const active = layouts[value];
  const placed = useRef(false);

  useEffect(() => {
    if (!active) return;
    const target = active.x + active.width / 2 - BAR / 2;
    if (!placed.current) {
      placed.current = true;
      x.set(target);
      return;
    }
    x.set(withSpring(target, spring.tab));
    stretch.set(withSequence(withTiming(1.8, { duration: 120 }), withSpring(1, spring.tab)));
  }, [active, x, stretch]);

  const barStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { scaleX: stretch.get() }] }));

  return (
    <View style={styles.row}>
      {options.map((o) => {
        const isActive = o.value === value;
        return (
          <Pressable
            key={o.value}
            hitSlop={8}
            onLayout={(e) => {
              const { x: lx, width } = e.nativeEvent.layout;
              setLayouts((prev) => ({ ...prev, [o.value]: { x: lx, width } }));
            }}
            onPress={() => {
              if (!isActive) {
                Haptics.selectionAsync();
                onChange(o.value);
              }
            }}>
            <Text style={[styles.label, isActive ? [styles.active, textGlow.soft] : styles.inactive]}>{o.label}</Text>
          </Pressable>
        );
      })}
      {active && (
        <Animated.View style={[styles.bar, barStyle]}>
          <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: 2 }]} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 24,
    paddingBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  active: {
    color: colors.text,
    fontWeight: '800',
  },
  inactive: {
    color: colors.textTertiary,
  },
  bar: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: BAR,
    height: 3,
    borderRadius: 2,
    boxShadow: glow.brand,
  },
});
