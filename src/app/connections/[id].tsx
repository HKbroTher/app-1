import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/icon-button';
import { TextTabs } from '@/components/ui/text-tabs';
import { UserRow } from '@/components/user-row';
import { CURRENT_USER_ID, getUser } from '@/data/mock';
import type { User } from '@/data/types';
import { useFollowers, useFollowingList } from '@/store/social';
import { colors } from '@/theme/tokens';

type List = 'followers' | 'following';

/** Followers / following of a user, switchable with text tabs. */
export default function ConnectionsScreen() {
  const { id, list: initial } = useLocalSearchParams<{ id: string; list?: List }>();
  const [list, setList] = useState<List>(initial === 'following' ? 'following' : 'followers');
  const user = getUser(id);
  const followers = useFollowers(id);
  const following = useFollowingList(id);

  const ids = list === 'followers' ? followers : following;
  const people = ids.map(getUser).filter((u): u is User => !!u);
  const isMe = id === CURRENT_USER_ID;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="back" accessibilityLabel="返回" onPress={() => router.back()} />
        <Text style={styles.title} numberOfLines={1}>
          {user?.name}
        </Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.tabs}>
        <TextTabs
          options={[
            { value: 'followers', label: `关注者 ${followers.length}` },
            { value: 'following', label: `关注 ${following.length}` },
          ]}
          value={list}
          onChange={setList}
        />
      </View>
      <FlatList
        data={people}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {list === 'followers' ? (isMe ? '还没有人关注你' : '还没有关注者') : isMe ? '你还没有关注任何人' : '还没有关注任何人'}
          </Text>
        }
        renderItem={({ item }) => <UserRow user={item} />}
      />
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
    height: 48,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  tabs: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 60,
  },
});
