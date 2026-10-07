import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/icon';
import { brandGradient, colors, glow, spring, textGlow } from '@/theme/tokens';

export const TAB_BAR_HEIGHT = 58;

const BAR = 20;

const ITEMS: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'explore', label: 'Explore' },
  post: { icon: 'post', label: 'Post' },
  profile: { icon: 'profile', label: 'Me' },
};

/** Total vertical space the bar occupies; screens pad their content by this. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, 10);
}

/**
 * Borderless tab bar: icons and labels sit on a black fade, no container.
 * A glowing gradient light slides from the current tab to the selected one.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const tabWidth = width / state.routes.length;
  const x = useSharedValue(0);
  const stretch = useSharedValue(1);
  const placed = useRef(false);

  useEffect(() => {
    if (!tabWidth) return;
    const target = state.index * tabWidth + tabWidth / 2 - BAR / 2;
    // First layout: place the light directly; afterwards it slides between tabs.
    if (!placed.current) {
      placed.current = true;
      x.set(target);
      return;
    }
    x.set(withSpring(target, spring.tab));
    stretch.set(withSequence(withTiming(2.2, { duration: 120 }), withSpring(1, spring.tab)));
  }, [state.index, tabWidth, x, stretch]);

  const lightStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { scaleX: stretch.get() }] }));

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)', '#000']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[styles.row, { paddingBottom: Math.max(insets.bottom, 10) }]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const item = ITEMS[route.name] ?? { icon: 'explore', label: route.name };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={item.label}
              style={styles.tab}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  Haptics.selectionAsync();
                  navigation.navigate(route.name, route.params);
                }
              }}>
              <Icon name={item.icon} size={25} gradient={focused} glow={focused} strokeWidth={focused ? 1.9 : 1.6} color={colors.textTertiary} />
              <Text style={[styles.label, focused ? [styles.labelActive, textGlow.soft] : null]}>{item.label}</Text>
            </Pressable>
          );
        })}
        {width > 0 && (
          <Animated.View style={[styles.light, { bottom: Math.max(insets.bottom, 10) - 2 }, lightStyle]}>
            <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: 2 }]} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 24,
  },
  row: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  labelActive: {
    color: colors.text,
    fontWeight: '700',
  },
  light: {
    position: 'absolute',
    left: 0,
    width: BAR,
    height: 3,
    borderRadius: 2,
    boxShadow: glow.brand,
  },
});
