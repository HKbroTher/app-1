import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import { Icon } from '@/components/icons/icon';
import type { User } from '@/data/types';
import { brandGradient, colors, textGlow } from '@/theme/tokens';

type Props = {
  curator: User;
  following: boolean;
  /** Hide the follow control (viewing your own show). */
  hideFollow?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onToggleFollow: () => void;
};

/** Top-right curator identity set straight on the background: avatar, name and a glowing "+". */
export function CuratorChip({ curator, following, hideFollow, onPress, onLongPress, onToggleFollow }: Props) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.identity} onPress={onPress} onLongPress={onLongPress} hitSlop={8}>
        <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ring}>
          <Image source={curator.avatar} style={styles.avatar} />
        </LinearGradient>
        <Text style={[styles.name, textGlow.soft]} numberOfLines={1}>
          {curator.name}
        </Text>
      </Pressable>

      {!hideFollow && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={following ? '取消关注' : '关注'}
          hitSlop={12}
          onPress={() => {
            Haptics.impactAsync(following ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
            onToggleFollow();
          }}>
          <Animated.View key={following ? 'on' : 'off'} entering={ZoomIn.springify()} exiting={ZoomOut}>
            {following ? (
              <Icon name="check" size={20} strokeWidth={1.8} color={colors.textSecondary} />
            ) : (
              <Icon name="plus" size={22} strokeWidth={2.2} gradient glow />
            )}
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ring: {
    width: 32,
    height: 32,
    borderRadius: 16,
    padding: 1.5,
  },
  avatar: {
    flex: 1,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    maxWidth: 110,
  },
});
