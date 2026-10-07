import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/icon';
import { IconButton } from '@/components/ui/icon-button';
import { TextButton } from '@/components/ui/text-button';
import { CollectibleCard } from '@/components/viewer/collectible-card';
import { CuratorChip } from '@/components/viewer/curator-chip';
import { IndexBadge } from '@/components/viewer/index-badge';
import { canViewAllImages, formatDateTime, getStatus } from '@/data/exhibition-status';
import { CURRENT_USER_ID, getUser } from '@/data/mock';
import { useNow } from '@/hooks/use-now';
import { useExhibition, useExhibitionStore } from '@/store/exhibitions';
import { useSocial } from '@/store/social';
import { colors } from '@/theme/tokens';

const SLIDE = 70;
const ARTWORK_RATIO = 1.43; // height / width
const ARTWORK_WIDTH = 0.8; // share of screen width
const CHROME_HEIGHT = 170; // top bar + index area

// Enter/exit keyframes per direction (1 = going forward).
const enterFrom = (dir: number) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ translateX: SLIDE * dir }, { scale: 0.92 }] },
    100: { opacity: 1, transform: [{ translateX: 0 }, { scale: 1 }] },
  }).duration(420);
const exitTo = (dir: number) =>
  new Keyframe({
    0: { opacity: 1, transform: [{ translateX: 0 }, { scale: 1 }] },
    100: { opacity: 0, transform: [{ translateX: -SLIDE * dir }, { scale: 0.92 }] },
  }).duration(260);

export default function ExhibitionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exhibition = useExhibition(id);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const now = useNow();

  const following = useSocial((s) => (exhibition ? !!s.following[exhibition.curatorId] : false));
  const reserved = useSocial((s) => (exhibition ? !!s.reservations[exhibition.id] : false));
  const { toggleFollow, reserve, cancelReservation } = useSocial.getState();
  const { cancel, closeEarly } = useExhibitionStore.getState();

  const curator = exhibition ? getUser(exhibition.curatorId) : undefined;
  if (!exhibition || !curator) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.muted}>展览不存在</Text>
      </View>
    );
  }

  const status = getStatus(exhibition, now);
  const isOwner = exhibition.curatorId === CURRENT_USER_ID;
  const fullAccess = canViewAllImages(exhibition, CURRENT_USER_ID, now);
  const images = fullAccess ? exhibition.images : exhibition.images.slice(0, 1);
  const last = images.length - 1;
  const current = images[Math.min(index, last)];

  // Portrait artwork, height:width = 1.43:1, 80% of the screen width (shrinks to fit short screens).
  const cardWidth = Math.min(width * ARTWORK_WIDTH, (height - insets.top - insets.bottom - CHROME_HEIGHT) / ARTWORK_RATIO);
  const cardHeight = cardWidth * ARTWORK_RATIO;

  const go = (dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next > last) return;
    Haptics.selectionAsync();
    // Commit the direction first so the outgoing card exits with the new direction, then swap.
    setDirection(dir);
    requestAnimationFrame(() => setIndex((i) => Math.min(last, Math.max(0, i + dir))));
  };

  const openActions = () => {
    if (!isOwner) {
      Alert.alert(`@${curator.id}`, undefined, [
        { text: '查看主页', onPress: () => router.push({ pathname: '/user/[id]', params: { id: curator.id } }) },
        { text: '举报', onPress: () => Alert.alert('已收到举报') },
        { text: '拉黑', style: 'destructive' },
        { text: '取消', style: 'cancel' },
      ]);
      return;
    }
    if (status === 'scheduled') {
      Alert.alert('取消展览？', '取消后展览不会进入归档，已预约的用户会收到取消通知。', [
        { text: '再想想', style: 'cancel' },
        { text: '取消展览', style: 'destructive', onPress: () => cancel(exhibition) },
      ]);
    } else if (status === 'locked') {
      Alert.alert('锁定期内不可取消', '开展前 30 分钟起无法取消，开展后可提前闭展。');
    } else if (status === 'live') {
      Alert.alert('提前闭展？', '闭展后立即归档，其他人只能看到封面。此操作不可撤销。', [
        { text: '再想想', style: 'cancel' },
        { text: '提前闭展', style: 'destructive', onPress: () => closeEarly(exhibition) },
      ]);
    } else {
      Alert.alert(status === 'archived' ? '展览已归档' : '展览已取消');
    }
  };

  const onReserve = () => {
    if (reserved) return cancelReservation(exhibition.id);
    if (reserve(exhibition.id)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    Alert.alert('关注后即可预约', `预约需要先关注 @${curator.id}`, [
      { text: '取消', style: 'cancel' },
      {
        text: '关注并预约',
        onPress: () => {
          toggleFollow(exhibition.curatorId);
          reserve(exhibition.id);
        },
      },
    ]);
  };

  const notice = fullAccess
    ? null
    : status === 'archived'
      ? { icon: 'lock' as const, text: '本展已闭展 · 仅展示封面' }
      : status === 'cancelled'
        ? { icon: 'lock' as const, text: '展览已取消' }
        : { icon: 'clock' as const, text: `${formatDateTime(exhibition.startAt)} 开展` };

  return (
    <View style={styles.screen}>
      {/* Top bar: back (left), curator chip (right) */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <IconButton icon="back" accessibilityLabel="返回" onPress={() => router.back()} />
        <CuratorChip
          curator={curator}
          following={following}
          hideFollow={isOwner}
          onPress={() => (isOwner ? openActions() : router.push({ pathname: '/user/[id]', params: { id: curator.id } }))}
          onLongPress={openActions}
          onToggleFollow={() => toggleFollow(curator.id)}
        />
      </View>

      {/* Stage */}
      <View style={styles.stage}>
        <View style={{ width: cardWidth, height: cardHeight }}>
          <Animated.View
            key={current}
            entering={enterFrom(direction)}
            exiting={exitTo(direction)}
            style={StyleSheet.absoluteFill}>
            <CollectibleCard uri={current} width={cardWidth} height={cardHeight} onSwipe={go} />
          </Animated.View>
        </View>
      </View>

      {/* Bottom: index or access notice */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        {notice ? (
          <>
            <View style={styles.notice}>
              <Icon name={notice.icon} size={15} color={colors.textSecondary} />
              <Text style={styles.noticeText}>{notice.text}</Text>
            </View>
            {!isOwner && (status === 'scheduled' || status === 'locked') && (
              <TextButton label={reserved ? '已预约 · 点击取消' : '预约开展提醒'} variant={reserved ? 'muted' : 'brand'} onPress={onReserve} />
            )}
          </>
        ) : (
          <IndexBadge index={index} total={images.length} />
        )}
        <Text style={styles.title} numberOfLines={1}>
          {exhibition.title}
        </Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    alignItems: 'center',
    gap: 12,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
  },
  muted: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
