import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { View } from 'react-native';

import type { CollectibleCardProps } from '@/components/viewer/collectible-card-skia';

export type { CollectibleCardProps };

/** Web: load CanvasKit (public/canvaskit.wasm) before rendering the Skia card. */
export function CollectibleCard(props: CollectibleCardProps) {
  return (
    <WithSkiaWeb
      opts={{ locateFile: () => '/canvaskit.wasm' }}
      getComponent={() => import('@/components/viewer/collectible-card-skia')}
      fallback={<View style={{ width: props.width, height: props.height }} />}
      componentProps={props}
    />
  );
}
