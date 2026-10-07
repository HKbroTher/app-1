import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { presentPermissionsPickerAsync } from 'expo-media-library/legacy';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoverBand } from '@/components/create/cover-band';
import { SelectionBadge } from '@/components/create/selection-badge';
import { Icon } from '@/components/icons/icon';
import { IconButton } from '@/components/ui/icon-button';
import { TextButton } from '@/components/ui/text-button';
import { usePhotoLibrary } from '@/hooks/use-photo-library';
import { REQUIRED_IMAGES, useDraft, type DraftImage } from '@/store/draft';
import { brandSolid, colors, textGlow } from '@/theme/tokens';

const COLUMNS = 3;
const GAP = 2;

/** Step 1 of creating an exhibition: pick exactly 9 photos from the device library. */
export default function PickPhotosScreen() {
  const { width } = useWindowDimensions();
  const tile = (width - GAP * (COLUMNS - 1)) / COLUMNS;
  const library = usePhotoLibrary();
  const [albumMenu, setAlbumMenu] = useState(false);
  const selected = useDraft((s) => s.images);
  const toggleImage = useDraft((s) => s.toggleImage);
  const reset = useDraft((s) => s.reset);

  const count = selected.length;
  const ready = count === REQUIRED_IMAGES;

  const close = () => {
    reset();
    router.back();
  };

  const onToggle = (photo: DraftImage) => {
    if (toggleImage(photo)) Haptics.selectionAsync();
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // already 9
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {/* Header: close · album · next */}
      <View style={styles.header}>
        <IconButton icon="close" accessibilityLabel="关闭" onPress={close} />
        {library.unavailable ? (
          <Text style={styles.albumTitle}>选择作品</Text>
        ) : (
          <Pressable style={styles.albumButton} hitSlop={8} onPress={() => setAlbumMenu((v) => !v)}>
            <Text style={[styles.albumTitle, textGlow.soft]} numberOfLines={1}>
              {library.album.title}
            </Text>
            <Icon name="chevronDown" size={18} strokeWidth={2} glow />
          </Pressable>
        )}
        <TextButton
          label={`下一步 ${count}/${REQUIRED_IMAGES}`}
          variant="brand"
          size="sm"
          disabled={!ready}
          onPress={() => router.push('/create/compose')}
        />
      </View>

      {/* Wrapper so the album menu overlays everything below the header. */}
      <View style={{ flex: 1 }}>
        <View style={styles.subheader}>
          <Text style={styles.hint}>选择 9 张作品</Text>
          {library.access === 'limited' && (
            <Pressable
              hitSlop={8}
              onPress={() => presentPermissionsPickerAsync(['photo']).catch(() => Linking.openSettings())}>
              <Text style={[styles.manage, textGlow.brand]}>管理可访问的照片</Text>
            </Pressable>
          )}
        </View>

        <Body library={library} tile={tile} selected={selected} onToggle={onToggle} />

        {albumMenu && (
          <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)} style={styles.albumMenu}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              {library.albums.map((a) => {
                const active = a.id === library.album.id;
                return (
                  <Pressable
                    key={a.id ?? 'recents'}
                    style={styles.albumRow}
                    onPress={() => {
                      library.setAlbum(a);
                      setAlbumMenu(false);
                    }}>
                    <Text
                      style={[styles.albumRowText, active && [{ color: brandSolid }, textGlow.brand]]}
                      numberOfLines={1}>
                      {a.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

type BodyProps = {
  library: ReturnType<typeof usePhotoLibrary>;
  tile: number;
  selected: DraftImage[];
  onToggle: (photo: DraftImage) => void;
};

function Body({ library, tile, selected, onToggle }: BodyProps) {
  if (library.unavailable) {
    return <SystemPickerFallback tile={tile} selected={selected} onToggle={onToggle} />;
  }
  if (!library.permission) {
    return <ActivityIndicator style={{ marginTop: 80 }} color={colors.textSecondary} />;
  }
  if (!library.permission.granted) {
    return (
      <Message
        text="需要相册权限才能选择作品"
        action={
          library.permission.canAskAgain ? (
            <TextButton label="允许访问相册" variant="brand" onPress={library.requestPermission} />
          ) : (
            <TextButton label="去设置开启" variant="brand" onPress={() => Linking.openSettings()} />
          )
        }
      />
    );
  }

  return (
    <FlatList
      data={library.photos}
      keyExtractor={(p) => p.id}
      numColumns={COLUMNS}
      columnWrapperStyle={{ gap: GAP }}
      contentContainerStyle={{ gap: GAP, paddingBottom: 40 }}
      onEndReached={library.loadMore}
      onEndReachedThreshold={1.5}
      getItemLayout={(_, index) => ({ length: tile + GAP, offset: (tile + GAP) * Math.floor(index / COLUMNS), index })}
      ListEmptyComponent={library.loading ? null : <Message text="相册里还没有照片" />}
      ListFooterComponent={library.loading ? <ActivityIndicator style={{ margin: 24 }} color={colors.textSecondary} /> : null}
      renderItem={({ item }) => (
        <PhotoTile photo={item} tile={tile} order={orderOf(selected, item)} onToggle={onToggle} />
      )}
    />
  );
}

function orderOf(selected: DraftImage[], photo: DraftImage) {
  const index = selected.findIndex((s) => s.id === photo.id);
  return index >= 0 ? index + 1 : null;
}

function PhotoTile({
  photo,
  tile,
  order,
  onToggle,
}: {
  photo: DraftImage;
  tile: number;
  order: number | null;
  onToggle: (photo: DraftImage) => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: order !== null }}
      onPress={() => onToggle(photo)}
      style={{ width: tile, height: tile }}>
      <Image source={photo.uri} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={photo.id} transition={120} />
      {order !== null && <View style={styles.selectedShade} />}
      {order === 1 && <CoverBand />}
      <View style={styles.badge}>
        <SelectionBadge order={order} />
      </View>
    </Pressable>
  );
}

/**
 * When the library can't be read directly (Expo Go on Android, web), pick through the system
 * photo picker instead. It needs no permission; the chosen photos are listed here to deselect.
 */
function SystemPickerFallback({ tile, selected, onToggle }: Omit<BodyProps, 'library'>) {
  const toggleImage = useDraft((s) => s.toggleImage);
  const remaining = REQUIRED_IMAGES - selected.length;

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      orderedSelection: true,
      quality: 1,
    });
    if (result.canceled) return;
    for (const asset of result.assets) toggleImage({ id: asset.assetId ?? asset.uri, uri: asset.uri });
  };

  return (
    <FlatList
      data={selected}
      keyExtractor={(p) => p.id}
      numColumns={COLUMNS}
      columnWrapperStyle={{ gap: GAP }}
      contentContainerStyle={{ gap: GAP, paddingBottom: 40 }}
      ListHeaderComponent={
        <View style={styles.fallbackHeader}>
          <Text style={styles.messageText}>当前环境无法直接读取相册，将通过系统相册选择。</Text>
          {remaining > 0 && <TextButton label={`从系统相册选择（还差 ${remaining} 张）`} variant="brand" onPress={pick} />}
        </View>
      }
      renderItem={({ item }) => <PhotoTile photo={item} tile={tile} order={orderOf(selected, item)} onToggle={onToggle} />}
    />
  );
}

function Message({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <View style={styles.message}>
      <Text style={styles.messageText}>{text}</Text>
      {action}
    </View>
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
  albumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '50%',
  },
  albumTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subheader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  hint: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  manage: {
    color: brandSolid,
    fontSize: 12,
    fontWeight: '700',
  },
  selectedShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  albumMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.94)',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  albumRow: {
    paddingVertical: 14,
  },
  albumRowText: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: '700',
  },
  fallbackHeader: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  message: {
    alignItems: 'center',
    gap: 16,
    marginTop: 120,
    paddingHorizontal: 32,
  },
  messageText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
