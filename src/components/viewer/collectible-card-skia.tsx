import {
  BlurMask,
  Canvas,
  Group,
  Image,
  LinearGradient,
  Rect,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, gold } from '@/theme/tokens';

const MAX_TILT = 18; // degrees
const PAD = 56; // canvas room around the card for the halo
const EDGE = 34; // depth of the inner gold edge light
const GOLD_SOLID = 'rgba(242,193,78,0.9)';
const GOLD_CLEAR = 'rgba(242,193,78,0)';

// Explicit worklet: it is called from the gesture callbacks on the UI thread. An inline arrow
// there gets hoisted by the React Compiler into a plain JS function, which crashes the app
// ("Tried to synchronously call a Remote Function").
function clampTilt(v: number) {
  'worklet';
  return Math.max(-MAX_TILT, Math.min(MAX_TILT, v));
}

export type CollectibleCardProps = {
  uri: string;
  width: number;
  height: number;
  /** Swipe released past the threshold: -1 = previous, 1 = next. */
  onSwipe?: (direction: -1 | 1) => void;
};

/**
 * The artwork, rendered with Skia so the 3D tilt is anti-aliased and the glow is a real
 * Gaussian blur (no jagged pixels). Dragging tilts it like a collectible held to the light:
 * the edge pushed away lights up gold and a gold halo blooms behind it.
 */
export function CollectibleCard({ uri, width: w, height: h, onSwipe }: CollectibleCardProps) {
  const image = useImage(uri);
  const tiltX = useSharedValue(0); // degrees, vertical drag
  const tiltY = useSharedValue(0); // degrees, horizontal drag
  const shiftX = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    float.set(withRepeat(withSequence(withTiming(-4, { duration: 2600 }), withTiming(4, { duration: 2600 })), -1, true));
  }, [float]);

  // Gesture callbacks are UI-thread worklets: keep them free of inline helper functions.
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tiltY.set(clampTilt((e.translationX / w) * MAX_TILT * 2.2));
      tiltX.set(clampTilt((-e.translationY / h) * MAX_TILT * 2.6));
      shiftX.set(e.translationX * 0.18);
    })
    .onEnd((e) => {
      const far = Math.abs(e.translationX) > w * 0.3;
      const fast = Math.abs(e.velocityX) > 800 && Math.abs(e.translationX) > 30;
      if (onSwipe && (far || fast)) scheduleOnRN(onSwipe, e.translationX < 0 ? 1 : -1);
    })
    .onFinalize(() => {
      tiltX.set(withSpring(0, { damping: 10, stiffness: 130 }));
      tiltY.set(withSpring(0, { damping: 10, stiffness: 130 }));
      shiftX.set(withSpring(0, { damping: 16, stiffness: 160 }));
    });

  const amount = useDerivedValue(() => Math.min(1, Math.hypot(tiltX.get(), tiltY.get()) / MAX_TILT));

  const transform = useDerivedValue(() => [
    { translateX: shiftX.get() },
    { translateY: float.get() },
    { perspective: 900 },
    { rotateX: (tiltX.get() * Math.PI) / 180 },
    { rotateY: (tiltY.get() * Math.PI) / 180 },
    { scale: 1 + amount.get() * 0.04 },
  ]);

  // Halo drifts toward the lit (receding) edge.
  const haloX = useDerivedValue(() => PAD + (tiltY.get() / MAX_TILT) * 12);
  const haloY = useDerivedValue(() => PAD - (tiltX.get() / MAX_TILT) * 12);
  const haloOpacity = useDerivedValue(() => amount.get() * 0.95);
  const auraOpacity = useDerivedValue(() => 0.1 * (1 - amount.get()));

  // Edge lights: positive rotateY pushes the right edge away, positive rotateX the top edge.
  const right = useDerivedValue(() => Math.max(0, tiltY.get()) / MAX_TILT);
  const left = useDerivedValue(() => Math.max(0, -tiltY.get()) / MAX_TILT);
  const top = useDerivedValue(() => Math.max(0, tiltX.get()) / MAX_TILT);
  const bottom = useDerivedValue(() => Math.max(0, -tiltX.get()) / MAX_TILT);

  const x0 = PAD;
  const y0 = PAD;
  const x1 = PAD + w;
  const y1 = PAD + h;

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: w, height: h }}>
        <Canvas style={{ position: 'absolute', left: -PAD, top: -PAD, width: w + PAD * 2, height: h + PAD * 2 }}>
          <Group transform={transform} origin={vec(PAD + w / 2, PAD + h / 2)}>
            {/* resting aura: marks the piece as touchable on pure black */}
            <Rect x={x0} y={y0} width={w} height={h} color="white" opacity={auraOpacity}>
              <BlurMask blur={24} style="normal" />
            </Rect>
            {/* gold halo while tilting */}
            <Rect x={haloX} y={haloY} width={w} height={h} color={gold} opacity={haloOpacity}>
              <BlurMask blur={30} style="normal" />
            </Rect>

            {image ? (
              <Image image={image} x={x0} y={y0} width={w} height={h} fit="cover" />
            ) : (
              <Rect x={x0} y={y0} width={w} height={h} color={colors.surface} />
            )}

            {/* inner gold edge light */}
            <Rect x={x1 - EDGE} y={y0} width={EDGE} height={h} opacity={right}>
              <LinearGradient start={vec(x1 - EDGE, 0)} end={vec(x1, 0)} colors={[GOLD_CLEAR, GOLD_SOLID]} />
            </Rect>
            <Rect x={x0} y={y0} width={EDGE} height={h} opacity={left}>
              <LinearGradient start={vec(x0, 0)} end={vec(x0 + EDGE, 0)} colors={[GOLD_SOLID, GOLD_CLEAR]} />
            </Rect>
            <Rect x={x0} y={y0} width={w} height={EDGE} opacity={top}>
              <LinearGradient start={vec(0, y0)} end={vec(0, y0 + EDGE)} colors={[GOLD_SOLID, GOLD_CLEAR]} />
            </Rect>
            <Rect x={x0} y={y1 - EDGE} width={w} height={EDGE} opacity={bottom}>
              <LinearGradient start={vec(0, y1 - EDGE)} end={vec(0, y1)} colors={[GOLD_CLEAR, GOLD_SOLID]} />
            </Rect>

            {/* soft gold rim */}
            <Rect x={x0} y={y0} width={w} height={h} style="stroke" strokeWidth={1.5} color={gold} opacity={amount}>
              <BlurMask blur={1.5} style="solid" />
            </Rect>
          </Group>
        </Canvas>
      </View>
    </GestureDetector>
  );
}

export default CollectibleCard;
