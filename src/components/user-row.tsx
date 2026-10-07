import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TextButton } from '@/components/ui/text-button';
import { CURRENT_USER_ID } from '@/data/mock';
import { followLabel } from '@/data/social-graph';
import type { User } from '@/data/types';
import { useSocial } from '@/store/social';
import { colors } from '@/theme/tokens';

type Props = {
  user: User;
  subtitle?: ReactNode;
};

/** A person in a list: avatar, name, handle and my follow button (hidden on my own row). */
export function UserRow({ user, subtitle }: Props) {
  const myFollowing = useSocial((s) => s.following);
  const toggleFollow = useSocial((s) => s.toggleFollow);
  const isMe = user.id === CURRENT_USER_ID;

  return (
    <Pressable
      style={styles.row}
      onPress={() => (isMe ? router.navigate('/profile') : router.push({ pathname: '/user/[id]', params: { id: user.id } }))}>
      <Image source={user.avatar} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {subtitle ?? `@${user.id}${isMe ? ' · 你' : ''}`}
        </Text>
      </View>
      {!isMe && (
        <TextButton
          size="sm"
          label={followLabel(user.id, myFollowing)}
          variant={myFollowing[user.id] ? 'muted' : 'brand'}
          onPress={() => toggleFollow(user.id)}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
