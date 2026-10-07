import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { useTabBarSpace } from '@/components/ui/tab-bar';
import { CURRENT_USER_ID, getUser } from '@/data/mock';
import { isMutual } from '@/data/social-graph';
import type { User } from '@/data/types';
import { useNow } from '@/hooks/use-now';
import { formatChatTime } from '@/lib/format-time';
import { unreadCount, useMessages } from '@/store/messages';
import { useSocial } from '@/store/social';
import { brandGradient, brandSolid, colors, glow, textGlow } from '@/theme/tokens';

const openChat = (id: string) => router.push({ pathname: '/chat/[id]', params: { id } });

export default function MessagesScreen() {
  const tabBarSpace = useTabBarSpace();
  const threads = useMessages((s) => s.threads);
  const lastRead = useMessages((s) => s.lastRead);
  const myFollowing = useSocial((s) => s.following);
  const now = useNow(60_000);

  const conversations = useMemo(
    () =>
      Object.entries(threads)
        .filter(([, t]) => t.length > 0)
        .map(([id, t]) => ({ user: getUser(id), last: t[t.length - 1], unread: unreadCount(t, lastRead[id]) }))
        .filter((c): c is typeof c & { user: User } => !!c.user)
        .sort((a, b) => b.last.at - a.last.at),
    [threads, lastRead],
  );

  // People I can message: mutual follows.
  const friends = Object.keys(myFollowing)
    .filter((id) => isMutual(id, myFollowing))
    .map(getUser)
    .filter((u): u is User => !!u);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScreenHeader title="Message" />
      <FlatList
        data={conversations}
        keyExtractor={(c) => c.user.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: tabBarSpace + 16 }}
        ListHeaderComponent={
          friends.length > 0 ? (
            <View style={styles.friendsBlock}>
              <Text style={styles.section}>互相关注 · 可以私信</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 18 }}>
                {friends.map((f) => (
                  <Pressable key={f.id} style={styles.friend} onPress={() => openChat(f.id)}>
                    <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ring}>
                      <Image source={f.avatar} style={styles.friendAvatar} />
                    </LinearGradient>
                    <Text style={styles.friendName} numberOfLines={1}>
                      {f.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.empty}>还没有对话。互相关注后就可以私信。</Text>}
        renderItem={({ item }) => {
          const canSend = isMutual(item.user.id, myFollowing);
          const mine = item.last.from === CURRENT_USER_ID;
          return (
            <Pressable style={styles.row} onPress={() => openChat(item.user.id)}>
              <Image source={item.user.avatar} style={styles.avatar} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.rowTop}>
                  <Text style={[styles.name, item.unread > 0 && textGlow.soft]} numberOfLines={1}>
                    {item.user.name}
                  </Text>
                  <Text style={styles.time}>{formatChatTime(item.last.at, now)}</Text>
                </View>
                <View style={styles.rowTop}>
                  <Text style={[styles.preview, item.unread > 0 && styles.previewUnread]} numberOfLines={1}>
                    {!canSend && '只读 · '}
                    {mine ? '你：' : ''}
                    {item.last.text}
                  </Text>
                  {item.unread > 0 && <View style={styles.unreadDot} />}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const AVATAR = 52;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  friendsBlock: {
    gap: 12,
    paddingBottom: 18,
  },
  section: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
  },
  friend: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  ring: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
  },
  friendAvatar: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  friendName: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.surface,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  time: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  preview: {
    color: colors.textSecondary,
    fontSize: 13,
    flexShrink: 1,
  },
  previewUnread: {
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brandSolid,
    boxShadow: glow.brand,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 60,
  },
});
