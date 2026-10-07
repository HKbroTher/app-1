import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_EDGE = 2048;

/**
 * Copies a library photo into the app cache as a JPEG with the long edge capped at 2048px.
 * Library URIs (ph://, content://) aren't readable by every consumer (e.g. Skia's useImage),
 * and the PRD asks for compression before upload anyway.
 */
export async function prepareImage(uri: string): Promise<string> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const { width, height } = original;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const image =
    scale < 1
      ? await ImageManipulator.manipulate(original)
          .resize({ width: Math.round(width * scale), height: Math.round(height * scale) })
          .renderAsync()
      : original;
  const saved = await image.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
  return saved.uri;
}
