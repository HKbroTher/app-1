import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/icon';
import { IconButton } from '@/components/ui/icon-button';
import { TextButton } from '@/components/ui/text-button';
import { CURRENT_USER_ID, users } from '@/data/mock';
import { followLabel } from '@/data/social-graph';
import { useSocial } from '@/store/social';
import { colors } from '@/theme/tokens';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const following = useSocial((s) => s.following);
  const toggleFollow = useSocial((s) => s.toggleFollow);

  const results = useMemo(() => {
    const q = query.trim().replace(/^@/, '').toLowerCase();
    if (!q) return [];
    // Search by user ID: exact match first, then prefix matches.
    return users
      .filter((u) => u.id !== CURRENT_USER_ID && u.id.toLowerCase().startsWith(q))
      .sort((a, b) => Number(b.id.toLowerCase() === q) - Number(a.id.toLowerCase() === q));
  }, [query]);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.bar}>
        <IconButton icon="back" accessibilityLabel="返回" onPress={() => router.back()} />
        <View style={styles.inputWrap}>
          <Icon name="search" size={18} color={colors.textSecondary} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="输入用户 ID"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.input}
          />
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(u) => u.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        ListEmptyComponent={
          <Text style={styles.empty}>{query.trim() ? '没有找到该用户' : '按用户 ID 搜索策展人，例如 lumen'}</Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.id } })}>
            <View style={styles.row}>
              <Image source={item.avatar} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.id}>@{item.id}</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name} · {item.bio}
                </Text>
              </View>
              <TextButton
                size="sm"
                label={followLabel(item.id, following)}
                variant={following[item.id] ? 'muted' : 'brand'}
                onPress={() => toggleFollow(item.id)}
              />
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputWrap: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glassBorder,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  id: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  name: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 60,
  },
});
