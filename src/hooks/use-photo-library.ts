// The legacy API on purpose: Expo Go (SDK 57) doesn't ship the native module behind the new
// Query/Album API ("Cannot find native module 'ExpoMediaLibraryNext'"), and importing it crashes.
import {
  getAlbumsAsync,
  getAssetInfoAsync,
  getAssetsAsync,
  getPermissionsAsync,
  MediaType,
  requestPermissionsAsync,
  SortBy,
  type Album,
  type PermissionResponse,
} from 'expo-media-library/legacy';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import type { DraftImage } from '@/store/draft';

const PAGE = 60;

export type AlbumOption = { id: string | null; title: string; album?: Album };

export const RECENTS: AlbumOption = { id: null, title: '最近项目' };

/**
 * Reads photos from the device library (newest first), paged, optionally scoped to one album.
 * Handles the permission request; `access` tells the UI whether access is full or limited.
 */
export function usePhotoLibrary() {
  const supported = Platform.OS !== 'web';
  const [permission, setPermission] = useState<PermissionResponse | null>(null);
  // Expo Go on Android rejects every media-library call (it can't hold the permission);
  // the UI then falls back to the system photo picker.
  const [unavailable, setUnavailable] = useState(!supported);
  const [album, setAlbum] = useState<AlbumOption>(RECENTS);
  const [albums, setAlbums] = useState<AlbumOption[]>([RECENTS]);
  const [photos, setPhotos] = useState<DraftImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const cursor = useRef<string | undefined>(undefined);
  const busy = useRef(false);
  const generation = useRef(0); // bumps on album change so stale pages are dropped

  const granted = permission?.granted ?? false;

  const requestPermission = useCallback(async () => {
    try {
      setPermission(await requestPermissionsAsync(false, ['photo']));
    } catch {
      setUnavailable(true);
    }
  }, []);

  // Check on first open and ask once if we still can; afterwards the user has to go to Settings.
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    (async () => {
      try {
        const current = await getPermissionsAsync(false, ['photo']);
        if (cancelled) return;
        if (!current.granted && current.canAskAgain) {
          const asked = await requestPermissionsAsync(false, ['photo']);
          if (!cancelled) setPermission(asked);
        } else {
          setPermission(current);
        }
      } catch {
        if (!cancelled) setUnavailable(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const loadMore = useCallback(async () => {
    if (!granted || busy.current || done) return;
    busy.current = true;
    setLoading(true);
    const gen = generation.current;
    try {
      const page = await getAssetsAsync({
        first: PAGE,
        after: cursor.current,
        mediaType: MediaType.photo,
        sortBy: [[SortBy.creationTime, false]],
        album: album.album,
      });
      if (gen !== generation.current) return;
      cursor.current = page.endCursor;
      setPhotos((prev) => [...prev, ...page.assets.map((a) => ({ id: a.id, uri: a.uri }))]);
      if (!page.hasNextPage) setDone(true);
    } catch {
      // Stop paging rather than retrying in a loop; the grid shows what loaded so far.
      if (gen === generation.current) setDone(true);
    } finally {
      // A stale load must not release the lock held by the current generation's load.
      if (gen === generation.current) {
        busy.current = false;
        setLoading(false);
      }
    }
  }, [granted, done, album]);

  // Switching album restarts paging from the top; in-flight pages for the old album are dropped.
  const chooseAlbum = useCallback((next: AlbumOption) => {
    generation.current += 1;
    busy.current = false;
    cursor.current = undefined;
    setLoading(false);
    setPhotos([]);
    setDone(false);
    setAlbum(next);
  }, []);

  useEffect(() => {
    if (granted && photos.length === 0 && !done) loadMore();
  }, [granted, photos.length, done, loadMore]);

  useEffect(() => {
    if (!granted) return;
    let cancelled = false;
    getAlbumsAsync({ includeSmartAlbums: true })
      .then((all) => {
        if (cancelled) return;
        const options = all
          .filter((a) => a.title && a.assetCount > 0)
          .sort((a, b) => b.assetCount - a.assetCount)
          .map((a) => ({ id: a.id, title: a.title, album: a }));
        setAlbums([RECENTS, ...options]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [granted]);

  return {
    unavailable,
    permission,
    requestPermission,
    access: permission?.accessPrivileges ?? 'none',
    photos,
    loading,
    loadMore,
    album,
    albums,
    setAlbum: chooseAlbum,
  };
}

/**
 * iOS library URIs are `ph://` asset references; tools that read pixels need a file path.
 * Resolves to the local file when possible and falls back to the original URI.
 */
export async function resolveLocalUri(image: DraftImage): Promise<string> {
  if (!image.uri.startsWith('ph://')) return image.uri;
  try {
    const info = await getAssetInfoAsync(image.id);
    return info.localUri ?? image.uri;
  } catch {
    return image.uri;
  }
}
