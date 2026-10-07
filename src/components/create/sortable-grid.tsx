import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { CoverBand } from '@/components/create/cover-band';
import type { DraftImage } from '@/store/draft';
import { colors, glow, radius } from '@/theme/tokens';

type Positions = Record<string, number>; // image id -> slot index

const SPRING = { damping: 20, stiffness: 220 };

// ── UI-thread helpers ────────────────────────────────────────────────────────────────
// Module-level worklets with plain loops only: inline closures inside gesture callbacks get
// hoisted by the React Compiler into plain JS functions and crash on the UI thread.

function slotLeft(slot: number, columns: number, step: number) {
  'worklet';
  return (slot % columns) * step;
}

function slotTop(slot: number, columns: number, step: number) {
  'worklet';
  return Math.floor(slot / columns) * step;
}

/** Slot under a point (tile centre), clamped to the grid. */
function slotAt(x: number, y: number, columns: number, step: number, count: number) {
  'worklet';
  const rows = Math.ceil(count / columns);
  const col = Math.max(0, Math.min(columns - 1, Math.floor(x / step)));
  const row = Math.max(0, Math.min(rows - 1, Math.floor(y / step)));
  return Math.min(row * columns + col, count - 1);
}

/** Move one item to `to`, shifting the items in between (list-style reorder). */
function moveTo(positions: Positions, id: string, to: number): Positions {
  'worklet';
  const from = positions[id];
  const next: Positions = {};
  for (const key in positions) {
    let p = positions[key];
    if (key === id) p = to;
    else if (from < to && p > from && p <= to) p -= 1;
    else if (from > to && p < from && p >= to) p += 1;
    next[key] = p;
  }
  return next;
}

// ── JS-thread callbacks (scheduled from the UI thread) ─────────────────────────────────

function hapticPickUp() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

function hapticSlot() {
  Haptics.selectionAsync();
}

function toPositions(images: DraftImage[]): Positions {
  const p: Positions = {};
  images.forEach((img, i) => {
    p[img.id] = i;
  });
  return p;
}

type Props = {
  images: DraftImage[];
  width: number;
  columns?: number;
  gap?: number;
  /** New order (image ids) after a drop. */
  onReorder: (ids: string[]) => void;
  /** Lets the parent lock its ScrollView while a tile is being dragged. */
  onDragActive?: (active: boolean) => void;
};

/** 3×3 grid of the selected artworks; long-press and drag to reorder. Slot 1 is the cover. */
export function SortableGrid({ images, width, columns = 3, gap = 6, onReorder, onDragActive }: Props) {
  const size = (width - gap * (columns - 1)) / columns;
  const step = size + gap;
  const rows = Math.ceil(images.length / columns);
  const positions = useSharedValue<Positions>(toPositions(images));

  // Keep slots in sync when the order changes from outside (e.g. after a drop is committed).
  useEffect(() => {
    positions.set(toPositions(images));
  }, [images, positions]);

  const commit = (finalPositions: Positions) => {
    const ids = Object.keys(finalPositions).sort((a, b) => finalPositions[a] - finalPositions[b]);
    onReorder(ids);
  };

  return (
    <View style={{ width, height: rows * step - gap }}>
      {images.map((img) => (
        <SortableTile
          key={img.id}
          image={img}
          positions={positions}
          size={size}
          step={step}
          columns={columns}
          count={images.length}
          onDrop={commit}
          onDragActive={onDragActive}
        />
      ))}
    </View>
  );
}

type TileProps = {
  image: DraftImage;
  positions: SharedValue<Positions>;
  size: number;
  step: number;
  columns: number;
  count: number;
  onDrop: (positions: Positions) => void;
  onDragActive?: (active: boolean) => void;
};

function SortableTile({ image, positions, size, step, columns, count, onDrop, onDragActive }: TileProps) {
  const id = image.id;
  const dragging = useSharedValue(0);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const pan = Gesture.Pan()
    .activateAfterLongPress(220)
    .onStart(() => {
      const slot = positions.get()[id];
      startX.set(slotLeft(slot, columns, step));
      startY.set(slotTop(slot, columns, step));
      x.set(startX.get());
      y.set(startY.get());
      dragging.set(1);
      scheduleOnRN(hapticPickUp);
      if (onDragActive) scheduleOnRN(onDragActive, true);
    })
    .onUpdate((e) => {
      x.set(startX.get() + e.translationX);
      y.set(startY.get() + e.translationY);
      const target = slotAt(x.get() + size / 2, y.get() + size / 2, columns, step, count);
      if (target !== positions.get()[id]) {
        positions.set(moveTo(positions.get(), id, target));
        scheduleOnRN(hapticSlot);
      }
    })
    .onEnd(() => {
      scheduleOnRN(onDrop, positions.get());
    })
    .onFinalize(() => {
      dragging.set(0);
      if (onDragActive) scheduleOnRN(onDragActive, false);
    });

  const style = useAnimatedStyle(() => {
    const slot = positions.get()[id] ?? 0;
    const active = dragging.get() === 1;
    return {
      zIndex: active ? 10 : 1,
      transform: [
        { translateX: active ? x.get() : withSpring(slotLeft(slot, columns, step), SPRING) },
        { translateY: active ? y.get() : withSpring(slotTop(slot, columns, step), SPRING) },
        { scale: withSpring(active ? 1.08 : 1, SPRING) },
      ],
      boxShadow: active ? glow.strong : [],
    };
  });

  const coverStyle = useAnimatedStyle(() => ({ opacity: positions.get()[id] === 0 ? 1 : 0 }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.tile, { width: size, height: size }, style]}>
        <View style={styles.clip}>
          <Image source={image.uri} style={StyleSheet.absoluteFill} contentFit="cover" />
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, coverStyle]}>
            <CoverBand />
          </Animated.View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: radius.sm,
  },
  clip: {
    flex: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
});
