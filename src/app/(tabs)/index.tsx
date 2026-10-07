import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasonryFeed } from '@/components/masonry-feed';
import { ScreenHeader } from '@/components/screen-header';
import { IconButton } from '@/components/ui/icon-button';
import { useTabBarSpace } from '@/components/ui/tab-bar';
import { getStatus } from '@/data/exhibition-status';
import { useNow } from '@/hooks/use-now';
import { useExhibitions } from '@/store/exhibitions';
import { colors } from '@/theme/tokens';

export default function ExploreScreen() {
  const tabBarSpace = useTabBarSpace();
  const exhibitions = useExhibitions();
  const now = useNow(60_000);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [refreshing, setRefreshing] = useState(false);

  const live = useMemo(() => exhibitions.filter((e) => getStatus(e, now) === 'live'), [exhibitions, now]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Mock fetch; new seed = new order and new tile sizes.
    setTimeout(() => {
      setSeed(Math.floor(Math.random() * 1e9));
      setRefreshing(false);
    }, 650);
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScreenHeader
        title="Explore"
        right={<IconButton icon="search" accessibilityLabel="搜索用户" onPress={() => router.push('/search')} />}
      />
      {live.length === 0 ? (
        <Text style={styles.empty}>暂时没有正在展出的展览</Text>
      ) : (
        <MasonryFeed
          items={live}
          seed={seed}
          refreshing={refreshing}
          onRefresh={onRefresh}
          bottomInset={tabBarSpace + 16}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 80,
  },
});
