import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

type Props = {
  title: string;
  right?: ReactNode;
};

export function ScreenHeader({ title, right }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
