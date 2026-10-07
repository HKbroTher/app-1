import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { Exhibition } from '@/data/types';
import { colors, glow, radius } from '@/theme/tokens';

const GAP = 10;
const PADDING = 12;
// Cover height / width range for the waterfall tiles.
const MIN_RATIO = 1.0;
const MAX_RATIO = 1.7;

type Props = {
  items: Exhibition[];
  /** Changing the seed reshuffles order and tile heights (pull-to-refresh). */
  seed: number;
  refreshing: boolean;
  onRefresh: () => void;
  header?: ReactElement;
  bottomInset: number;
};

/** Deterministic PRNG so a given seed always lays out the same way. */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Xiaohongshu-style two-column waterfall of exhibition covers. */
export function MasonryFeed({ items, seed, refreshing, onRefresh, header, bottomInset }: Props) {
  const { width } = useWindowDimensions();
  const columnWidth = (width - PADDING * 2 - GAP) / 2;

  const columns = useMemo(() => {
    const rand = mulberry32(seed);
    const shuffled = [...items].sort(() => rand() - 0.5);
    const cols: { ex: Exhibition; height: number }[][] = [[], []];
    const heights = [0, 0];
    for (const ex of shuffled) {
      const height = columnWidth * (MIN_RATIO + rand() * (MAX_RATIO - MIN_RATIO));
      const target = heights[0] <= heights[1] ? 0 : 1;
      cols[target].push({ ex, height });
      heights[target] += height + GAP;
    }
    return cols;
  }, [items, seed, columnWidth]);

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: PADDING, paddingBottom: bottomInset }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />}>
      {header}
      <View style={styles.row}>
        {columns.map((col, c) => (
          <View key={c} style={{ width: columnWidth, gap: GAP }}>
            {col.map(({ ex, height }, i) => (
              <Animated.View key={`${seed}-${ex.id}`} entering={FadeInDown.delay((i * 2 + c) * 45).springify().damping(18)}>
                <CoverTile exhibition={ex} height={height} />
              </Animated.View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function CoverTile({ exhibition, height }: { exhibition: Exhibition; height: number }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={exhibition.title}
      onPress={() => router.push({ pathname: '/exhibition/[id]', params: { id: exhibition.id } })}
      style={({ pressed }) => [styles.tile, { height }, pressed && styles.pressed]}>
      <Image source={exhibition.images[0]} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: GAP,
    alignItems: 'flex-start',
  },
  tile: {
    borderRadius: radius.lg - 4,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    boxShadow: glow.strong,
  },
});
