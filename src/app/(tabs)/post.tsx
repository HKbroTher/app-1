import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/icon';
import { ScreenHeader } from '@/components/screen-header';
import { useTabBarSpace } from '@/components/ui/tab-bar';
import { TextButton } from '@/components/ui/text-button';
import { formatDateTime, LOCK_WINDOW_MS } from '@/data/exhibition-status';
import { useNow } from '@/hooks/use-now';
import { colors, radius } from '@/theme/tokens';

const REQUIRED = 9;
const HOUR = 60 * 60 * 1000;

const START_OPTIONS = [
  { label: '1 小时后', offset: 1 * HOUR },
  { label: '3 小时后', offset: 3 * HOUR },
  { label: '明天此时', offset: 24 * HOUR },
  { label: '3 天后', offset: 72 * HOUR },
];
const DURATION_OPTIONS = [
  { label: '6 小时', ms: 6 * HOUR },
  { label: '1 天', ms: 24 * HOUR },
  { label: '3 天', ms: 72 * HOUR },
  { label: '7 天', ms: 168 * HOUR },
];

export default function PostScreen() {
  const tabBarSpace = useTabBarSpace();
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [startIdx, setStartIdx] = useState(1);
  const [durationIdx, setDurationIdx] = useState(1);
  const now = useNow(60_000);

  const schedule = useMemo(() => {
    // Round to the next 5 minutes so times look intentional.
    const base = Math.ceil(now / (5 * 60 * 1000)) * 5 * 60 * 1000;
    const start = base + START_OPTIONS[startIdx].offset;
    return { start, end: start + DURATION_OPTIONS[durationIdx].ms, lock: start - LOCK_WINDOW_MS };
  }, [now, startIdx, durationIdx]);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: REQUIRED - images.length,
      orderedSelection: true,
      quality: 0.9,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, REQUIRED));
    }
  };

  const remove = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const makeCover = (i: number) => {
    if (i === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setImages((prev) => [prev[i], ...prev.filter((_, idx) => idx !== i)]);
  };

  const missing = REQUIRED - images.length;
  const canPublish = missing === 0 && title.trim().length > 0;

  const publish = () => {
    Alert.alert(
      '确认发布？',
      `《${title.trim()}》将于 ${formatDateTime(schedule.start)} 开展，${formatDateTime(schedule.end)} 闭展。\n${formatDateTime(schedule.lock)} 之后不能取消。`,
      [
        { text: '再看看', style: 'cancel' },
        { text: '发布', onPress: () => Alert.alert('演示模式', '接入后端后即可真正发布。') },
      ],
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScreenHeader title="Post" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 20, paddingBottom: tabBarSpace + 24 }}>
        {/* 1. Nine images */}
        <Section title="1  选择 9 张作品" hint={missing > 0 ? `还差 ${missing} 张 · 长按设为封面` : '长按设为封面'}>
          <View style={styles.grid}>
            {Array.from({ length: REQUIRED }, (_, i) => {
              const uri = images[i];
              return (
                <View key={i} style={styles.cell}>
                  {uri ? (
                    <Pressable onLongPress={() => makeCover(i)} style={styles.thumb}>
                      <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" />
                      {i === 0 && (
                        <Text style={[styles.coverTag, styles.coverText]}>封面</Text>
                      )}
                      <Pressable hitSlop={8} onPress={() => remove(i)} style={styles.removeBtn}>
                        <Icon name="close" size={14} strokeWidth={2} />
                      </Pressable>
                    </Pressable>
                  ) : (
                    <Pressable onPress={pick} style={{ flex: 1 }}>
                      <View style={styles.empty}>
                        <Icon name="plus" size={20} glow />
                        <Text style={styles.slotNo}>{i + 1}</Text>
                      </View>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </Section>

        {/* 2. Info */}
        <Section title="2  展览信息">
          <View style={styles.field}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              maxLength={30}
              placeholder="展览标题（必填）"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />
            <Text style={styles.counter}>{title.length}/30</Text>
          </View>
          <View style={[styles.field, { minHeight: 110, alignItems: 'flex-start' }]}>
            <TextInput
              value={intro}
              onChangeText={setIntro}
              maxLength={500}
              multiline
              placeholder="介绍一下这场展览（选填）"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
            />
          </View>
        </Section>

        {/* 3. Schedule */}
        <Section title="3  档期">
          <Text style={styles.label}>开展</Text>
          <Chips options={START_OPTIONS.map((o) => o.label)} value={startIdx} onChange={setStartIdx} />
          <Text style={styles.label}>展期</Text>
          <Chips options={DURATION_OPTIONS.map((o) => o.label)} value={durationIdx} onChange={setDurationIdx} />
          <View style={styles.summary}>
            <Row icon="start" text={`开展  ${formatDateTime(schedule.start)}`} />
            <Row icon="end" text={`闭展  ${formatDateTime(schedule.end)}`} />
            <Row icon="lock" text={`${formatDateTime(schedule.lock)} 起进入锁定期，不可取消`} muted />
          </View>
        </Section>

        <TextButton
          size="lg"
          variant="brand"
          label={canPublish ? '预览并发布' : missing > 0 ? `还差 ${missing} 张作品` : '请填写标题'}
          disabled={!canPublish}
          onPress={publish}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

function Chips({ options, value, onChange }: { options: string[]; value: number; onChange: (i: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 22 }}>
      {options.map((label, i) => (
        <TextButton
          key={label}
          size="sm"
          label={label}
          variant={i === value ? 'brand' : 'muted'}
          onPress={() => onChange(i)}
        />
      ))}
    </View>
  );
}

function Row({ icon, text, muted }: { icon: IconName; text: string; muted?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon name={icon} size={16} color={muted ? colors.textTertiary : colors.text} />
      <Text style={{ color: muted ? colors.textTertiary : colors.text, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: '31.8%',
    aspectRatio: 3 / 4,
  },
  thumb: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  empty: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  slotNo: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  coverTag: {
    position: 'absolute',
    left: 8,
    bottom: 6,
  },
  coverText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glassBorder,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  counter: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  summary: {
    gap: 8,
    marginTop: 8,
  },
});
