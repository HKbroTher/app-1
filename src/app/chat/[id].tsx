import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/icon-button';
import { TextButton } from '@/components/ui/text-button';
import { CURRENT_USER_ID, getUser } from '@/data/mock';
import { followsMe, isMutual } from '@/data/social-graph';
import type { ChatMessage } from '@/data/types';
import { formatChatTime } from '@/lib/format-time';
import { useMessages } from '@/store/messages';
import { useSocial } from '@/store/social';
import { colors, textGlow } from '@/theme/tokens';

const EMPTY: ChatMessage[] = [];

/** One-to-one chat. Sending requires a mutual follow; otherwise the history is read-only (PRD §4.7). */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = getUser(id);
  const thread = useMessages((s) => s.threads[id] ?? EMPTY);
  const send = useMessages((s) => s.send);
  const markRead = useMessages((s) => s.markRead);
  const myFollowing = useSocial((s) => s.following);
  const [draft, setDraft] = useState('');
  const list = useRef<FlatList<ChatMessage>>(null);

  const canSend = isMutual(id, myFollowing);

  // Opening (and receiving while open) marks the thread read.
  useEffect(() => {
    markRead(id);
  }, [id, thread.length, markRead]);

  if (!user) return null;

  const onSend = () => {
    if (send(id, draft)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDraft('');
    }
  };

  const reason = !myFollowing[id]
    ? '你已不再关注对方，互相关注后可继续聊天'
    : !followsMe(id)
      ? '对方没有关注你，互相关注后可继续聊天'
      : '';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="back" accessibilityLabel="返回" onPress={() => router.back()} />
        <Pressable
          style={styles.peer}
          onPress={() => router.push({ pathname: '/user/[id]', params: { id: user.id } })}>
          <Image source={user.avatar} style={styles.peerAvatar} />
          <Text style={[styles.peerName, textGlow.soft]} numberOfLines={1}>
            {user.name}
          </Text>
        </Pressable>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <FlatList
          ref={list}
          data={thread}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          // Keyboard opening shrinks the list; keep the newest message in view.
          onLayout={() => list.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={styles.empty}>打个招呼吧</Text>}
          renderItem={({ item }) => {
            const mine = item.from === CURRENT_USER_ID;
            return (
              <View style={[styles.bubbleRow, mine && { justifyContent: 'flex-end' }]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={styles.text}>{item.text}</Text>
                  <Text style={styles.time}>{formatChatTime(item.at)}</Text>
                </View>
              </View>
            );
          }}
        />

        {canSend ? (
          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="发消息…"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={1000}
              style={styles.input}
            />
            <TextButton label="发送" variant="brand" size="sm" disabled={!draft.trim()} onPress={onSend} />
          </View>
        ) : (
          <Text style={styles.readOnly}>{reason}</Text>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 52,
  },
  peer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  peerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  peerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  messages: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    gap: 4,
  },
  theirs: {
    backgroundColor: '#141417',
    borderTopLeftRadius: 6,
  },
  mine: {
    backgroundColor: '#3A1328',
    borderTopRightRadius: 6,
  },
  text: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  time: {
    color: colors.textTertiary,
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.glassBorder,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    maxHeight: 120,
    paddingVertical: 6,
  },
  readOnly: {
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  empty: {
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 40,
  },
});
