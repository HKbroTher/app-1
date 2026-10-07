import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDateTime, formatRemaining, getStatus } from '@/data/exhibition-status';
import { getUser } from '@/data/mock';
import type { Exhibition } from '@/data/types';
import { useNow } from '@/hooks/use-now';
import { colors, radius } from '@/theme/tokens';

type Props = {
  exhibition: Exhibition;
  showCurator?: boolean;
};

export function ExhibitionCard({ exhibition, showCurator = true }: Props) {
  const now = useNow();
  const status = getStatus(exhibition, now);
  const curator = getUser(exhibition.curatorId);

  const badge =
    status === 'live'
      ? `剩余 ${formatRemaining(exhibition.endAt - now)}`
      : status === 'archived'
        ? '已闭展'
        : status === 'cancelled'
          ? '已取消'
          : `${formatDateTime(exhibition.startAt)} 开展`;

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/exhibition/[id]', params: { id: exhibition.id } })}
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.97 }] }]}>
        <Image source={exhibition.images[0]} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={[StyleSheet.absoluteFill, { top: '45%' }]}
        />
        <View style={styles.top}>
          <View style={styles.badge}>
            {status === 'live' && <View style={styles.liveDot} />}
            <Text style={styles.badgeText} numberOfLines={1}>
              {badge}
            </Text>
          </View>
        </View>
        <View style={styles.bottom}>
          <Text style={styles.title} numberOfLines={1}>
            {exhibition.title}
          </Text>
          {showCurator && curator && (
            <View style={styles.curatorRow}>
              <Image source={curator.avatar} style={styles.avatar} />
              <Text style={styles.curator} numberOfLines={1}>
                @{curator.id}
              </Text>
            </View>
          )}
        </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  top: {
    padding: 8,
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    height: 22,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4D6D',
  },
  badgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  bottom: {
    marginTop: 'auto',
    padding: 12,
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  curatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  curator: {
    color: colors.textSecondary,
    fontSize: 12,
    flexShrink: 1,
  },
});
