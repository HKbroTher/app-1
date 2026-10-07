import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { Option } from '@/lib/schedule';
import { colors } from '@/theme/tokens';

const ITEM = 44;
const VISIBLE = 5; // odd: one centred row plus two above/below

function tick() {
  Haptics.selectionAsync();
}

type Props<T extends string | number> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  width?: number;
  accessibilityLabel?: string;
};

/** iOS-style wheel: rows curve away from the centre, the centred row is the selection. */
export function WheelPicker<T extends string | number>({ options, value, onChange, width, accessibilityLabel }: Props<T>) {
  const ref = useAnimatedRef<Animated.ScrollView>();
  const offset = useSharedValue(0);
  const lastIndex = useSharedValue(-1);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const mounted = useRef(false);

  // Keep the wheel on the selected row when the value or the option list changes.
  useEffect(() => {
    ref.current?.scrollTo({ y: index * ITEM, animated: mounted.current });
    mounted.current = true;
  }, [index, options.length, ref]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      offset.set(e.contentOffset.y);
    },
  });

  // Haptic tick each time a new row crosses the centre.
  useAnimatedReaction(
    () => Math.round(offset.get() / ITEM),
    (current, previous) => {
      if (previous !== null && current !== previous && current !== lastIndex.get()) {
        lastIndex.set(current);
        scheduleOnRN(tick);
      }
    },
  );

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(options.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM)));
    if (options[i] && options[i].value !== value) onChange(options[i].value);
  };

  return (
    <View style={{ height: ITEM * VISIBLE, width }} accessibilityLabel={accessibilityLabel}>
      <View pointerEvents="none" style={styles.band} />
      <Animated.ScrollView
        ref={ref}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: index * ITEM }}
        contentContainerStyle={{ paddingVertical: ITEM * Math.floor(VISIBLE / 2) }}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}>
        {options.map((o, i) => (
          <WheelRow key={String(o.value)} label={o.label} index={i} offset={offset} />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

function WheelRow({ label, index, offset }: { label: string; index: number; offset: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const d = (offset.get() - index * ITEM) / ITEM; // rows away from the centre
    const abs = Math.abs(d);
    // Off-centre rows keep full size and only dim + curve slightly; shrinking them made
    // the narrow hour/minute wheels look like the font was broken.
    return {
      opacity: interpolate(abs, [0, 1, 2.5], [1, 0.5, 0.2], Extrapolation.CLAMP),
      transform: [{ perspective: 900 }, { rotateX: `${interpolate(d, [-2.5, 0, 2.5], [-22, 0, 22], Extrapolation.CLAMP)}deg` }],
    };
  });
  return (
    <Animated.View style={[styles.row, style]}>
      <Animated.Text style={styles.label} numberOfLines={1}>
        {label}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM * Math.floor(VISIBLE / 2),
    height: ITEM,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  row: {
    height: ITEM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
    textShadowColor: 'rgba(255,255,255,0.35)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
});
