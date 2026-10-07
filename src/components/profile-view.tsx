import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExhibitionCard } from '@/components/exhibition-card';
import { IconButton } from '@/components/ui/icon-button';
import { useTabBarSpace } from '@/components/ui/tab-bar';
import { TextButton } from '@/components/ui/text-button';
import { TextTabs } from '@/components/ui/text-tabs';
import { getStatus } from '@/data/exhibition-status';
import { CURRENT_USER_ID, getUser } from '@/data/mock';
import { useExhibitions } from '@/store/exhibitions';
import { followLabel, isMutual } from '@/data/social-graph';
import { useFollowers, useFollowingList, useSocial } from '@/store/social';
import { brandGradient, colors } from '@/theme/tokens';

type Tab = 'upcoming' | 'live' | 'archived' | 'reservations';

type Props = {
  userId: string;
  /** Rendered inside the tab navigator (needs bottom space for the floating bar). */
  inTabs?: boolean;
};

export function ProfileView({ userId, inTabs = false }: Props) {
  const user = getUser(userId);
  const isMe = userId === CURRENT_USER_ID;
  const [tab, setTab] = useState<Tab>('live');
  const tabBarSpace = useTabBarSpace();
  const exhibitions = useExhibitions();
  const myFollowing = useSocial((s) => s.following);
  const following = !!myFollowing[userId];
  const followers = useFollowers(userId);
  const followingList = useFollowingList(userId);
  const reservations = useSocial((s) => s.reservations);
  const toggleFollow = useSocial((s) => s.toggleFollow);

  const tabs = useMemo(
    () =>
      [
        { value: 'upcoming', label: '即将开展' },
        { value: 'live', label: '展出中' },
        { value: 'archived', label: '已归档' },
        ...(isMe ? [{ value: 'reservations', label: '预约' }] : []),
      ] as { value: Tab; label: string }[],
    [isMe],
  );

  const data = useMemo(() => {
    if (tab === 'reservations') return exhibitions.filter((e) => reservations[e.id]);
    return exhibitions.filter((e) => {
      if (e.curatorId !== userId) return false;
      const s = getStatus(e);
      if (tab === 'upcoming') return s === 'scheduled' || s === 'locked' || (isMe && s === 'cancelled');
      return s === tab;
    });
  }, [tab, exhibitions, reservations, userId, isMe]);

  if (!user) return null;

  const mutual = isMutual(userId, myFollowing);
  const openConnections = (list: 'followers' | 'following') =>
    router.push({ pathname: '/connections/[id]', params: { id: userId, list } });
  const exhibitionCount = exhibitions.filter((e) => e.curatorId === userId && getStatus(e) !== 'cancelled').length;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.topBar}>
        {!inTabs ? (
          <IconButton icon="back" accessibilityLabel="返回" onPress={() => router.back()} />
        ) : (
          <View />
        )}
        {isMe && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <IconButton icon="bell" accessibilityLabel="消息" />
            <IconButton icon="settings" accessibilityLabel="设置" />
          </View>
        )}
      </View>

      <FlatList
        data={data}
        key={tab}
        keyExtractor={(e) => e.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: (inTabs ? tabBarSpace : 0) + 24 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.identity}>
              <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ring}>
                <Image source={user.avatar} style={styles.avatar} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.handle}>@{user.id}</Text>
              </View>
            </View>
            <Text style={styles.bio}>{user.bio}</Text>

            <View style={styles.stats}>
              <Stat value={exhibitionCount} label="展览" />
              <Stat value={followers.length} label="关注者" onPress={() => openConnections('followers')} />
              <Stat value={followingList.length} label="关注" onPress={() => openConnections('following')} />
            </View>

            <View style={styles.actions}>
              {isMe ? (
                <TextButton label="编辑资料" />
              ) : (
                <>
                  <TextButton
                    label={followLabel(userId, myFollowing)}
                    variant={following ? 'muted' : 'brand'}
                    onPress={() => toggleFollow(userId)}
                  />
                  <TextButton
                    label="私信"
                    disabled={!mutual}
                    onPress={() => router.push({ pathname: '/chat/[id]', params: { id: userId } })}
                  />
                </>
              )}
            </View>
            {!isMe && !mutual && <Text style={styles.hint}>互相关注后可以私信</Text>}

            <View style={{ marginTop: 8 }}>
              <TextTabs options={tabs} value={tab} onChange={setTab} />
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{EMPTY[tab]}</Text>}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ExhibitionCard exhibition={item} showCurator={tab === 'reservations'} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const EMPTY: Record<Tab, string> = {
  upcoming: '还没有即将开展的展览',
  live: '当前没有正在展出的展览',
  archived: '还没有归档的展览',
  reservations: '还没有预约任何展览',
};

function Stat({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  const display = value >= 10000 ? `${(value / 10000).toFixed(1)}万` : String(value);
  return (
    <Pressable style={styles.stat} onPress={onPress} disabled={!onPress} hitSlop={6}>
      <Text style={styles.statValue}>{display}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  header: {
    gap: 14,
    paddingTop: 8,
    marginBottom: 4,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ring: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 3,
  },
  avatar: {
    flex: 1,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: colors.bg,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  handle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 28,
  },
  hint: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: -8,
  },
  cell: {
    // Half width even when a row has a single card.
    width: '48%',
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 48,
  },
});
