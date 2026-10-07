import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScheduleSheet } from '@/components/create/schedule-sheet';
import { SortableGrid } from '@/components/create/sortable-grid';
import { Icon, type IconName } from '@/components/icons/icon';
import { IconButton } from '@/components/ui/icon-button';
import { TextButton } from '@/components/ui/text-button';
import { LOCK_WINDOW_MS } from '@/data/exhibition-status';
import { CURRENT_USER_ID } from '@/data/mock';
import { useNow } from '@/hooks/use-now';
import { resolveLocalUri } from '@/hooks/use-photo-library';
import { prepareImage } from '@/lib/prepare-image';
import {
  clampDuration,
  clampStart,
  DEFAULT_DURATION_MS,
  earliestStart,
  formatDuration,
  formatStart,
} from '@/lib/schedule';
import { MAX_TOPICS, REQUIRED_IMAGES, useDraft } from '@/store/draft';
import { useExhibitionStore } from '@/store/exhibitions';
import { brandSolid, colors, textGlow } from '@/theme/tokens';

const HOUR = 60 * 60 * 1000;

/** Step 2 of creating an exhibition: title, text, #topics and schedule, then publish. */
export default function ComposeScreen() {
  const { images, title, intro, topics, setTitle, setIntro, addTopic, removeTopic, reorder, reset } = useDraft();
  const publish = useExhibitionStore((s) => s.publish);
  const now = useNow(60_000);
  const { width } = useWindowDimensions();
  // Default: opens 3 hours from now, runs 1 day. Re-clamped as time passes.
  const [startPick, setStartPick] = useState(() => earliestStart(Date.now()) + 2 * HOUR);
  const [duration, setDuration] = useState(DEFAULT_DURATION_MS);
  const [sheet, setSheet] = useState<'start' | 'duration' | null>(null);
  const [dragging, setDragging] = useState(false);
  const [topicInput, setTopicInput] = useState<string | null>(null); // null = not editing
  const [publishing, setPublishing] = useState(false);

  const schedule = useMemo(() => {
    const start = clampStart(startPick, now);
    const end = start + clampDuration(duration);
    return { start, end, lock: start - LOCK_WINDOW_MS };
  }, [now, startPick, duration]);

  const canPublish = images.length === REQUIRED_IMAGES && title.trim().length > 0 && !publishing;

  const commitTopic = () => {
    if (topicInput) addTopic(topicInput);
    setTopicInput(null);
  };

  const doPublish = async () => {
    setPublishing(true);
    try {
      const uris = await Promise.all(images.map(async (i) => prepareImage(await resolveLocalUri(i))));
      publish({
        title: title.trim(),
        intro: intro.trim(),
        topics,
        curatorId: CURRENT_USER_ID,
        images: uris,
        startAt: schedule.start,
        endAt: schedule.end,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      reset();
      router.dismissAll();
      router.navigate('/profile');
    } catch {
      Alert.alert('发布失败', '处理图片时出错，请重试。');
      setPublishing(false);
    }
  };

  const confirmPublish = () =>
    Alert.alert(
      '确认发布？',
      `《${title.trim()}》将于 ${formatStart(schedule.start)} 开展，${formatStart(schedule.end)} 闭展。\n${formatStart(schedule.lock)} 之后不能取消。`,
      [
        { text: '再看看', style: 'cancel' },
        { text: '发布', onPress: doPublish },
      ],
    );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="back" accessibilityLabel="返回选图" onPress={() => router.back()} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!dragging}
          contentContainerStyle={styles.content}>
          {/* Selected artworks: long-press and drag to reorder; slot 1 is the cover */}
          <SortableGrid images={images} width={width - 32} onReorder={reorder} onDragActive={setDragging} />

          <TextInput
            value={title}
            onChangeText={setTitle}
            maxLength={30}
            placeholder="添加标题"
            placeholderTextColor={colors.textTertiary}
            style={styles.title}
          />
          <TextInput
            value={intro}
            onChangeText={setIntro}
            maxLength={500}
            multiline
            placeholder="添加正文"
            placeholderTextColor={colors.textTertiary}
            style={styles.intro}
          />

          {/* Topics */}
          <View style={styles.topics}>
            {topics.map((t) => (
              <Pressable key={t} hitSlop={6} onPress={() => removeTopic(t)} accessibilityLabel={`移除话题 ${t}`}>
                <Text style={[styles.topic, textGlow.brand]}>#{t}</Text>
              </Pressable>
            ))}
            {topicInput !== null ? (
              <View style={styles.topicInputWrap}>
                <Text style={[styles.topic, textGlow.brand]}>#</Text>
                <TextInput
                  autoFocus
                  value={topicInput}
                  onChangeText={setTopicInput}
                  onSubmitEditing={commitTopic}
                  onBlur={commitTopic}
                  maxLength={20}
                  returnKeyType="done"
                  placeholder="输入话题"
                  placeholderTextColor={colors.textTertiary}
                  style={styles.topicInput}
                />
              </View>
            ) : (
              topics.length < MAX_TOPICS && (
                <Pressable hitSlop={8} onPress={() => setTopicInput('')}>
                  <Text style={[styles.addTopic, textGlow.soft]}># 话题</Text>
                </Pressable>
              )
            )}
          </View>

          <View style={styles.divider} />

          {/* Schedule (required by the exhibition model) */}
          <ScheduleRow icon="start" label="开展时间" value={formatStart(schedule.start)} onPress={() => setSheet('start')} />
          <ScheduleRow icon="clock" label="展期" value={formatDuration(duration)} onPress={() => setSheet('duration')} />
          <View style={styles.summary}>
            <Row icon="end" text={`闭展  ${formatStart(schedule.end)}`} muted />
            <Row icon="lock" text={`${formatStart(schedule.lock)} 起进入锁定期，不可取消`} muted />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {publishing ? (
            <ActivityIndicator color={brandSolid} />
          ) : (
            <TextButton
              size="lg"
              variant="brand"
              label={title.trim() ? '发布' : '请添加标题'}
              disabled={!canPublish}
              onPress={confirmPublish}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      <ScheduleSheet
        visible={sheet === 'start'}
        mode="start"
        value={schedule.start}
        now={now}
        onClose={() => setSheet(null)}
        onConfirm={(start) => {
          setStartPick(start);
          setSheet(null);
        }}
      />
      <ScheduleSheet
        visible={sheet === 'duration'}
        mode="duration"
        value={duration}
        start={schedule.start}
        onClose={() => setSheet(null)}
        onConfirm={(ms) => {
          setDuration(ms);
          setSheet(null);
        }}
      />
    </SafeAreaView>
  );
}

function ScheduleRow({ icon, label, value, onPress }: { icon: IconName; label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.scheduleRow} onPress={onPress} hitSlop={4}>
      <Icon name={icon} size={18} glow />
      <Text style={styles.scheduleLabel}>{label}</Text>
      <Text style={[styles.scheduleValue, textGlow.soft]} numberOfLines={1}>
        {value}
      </Text>
      <Icon name="chevronDown" size={16} color={colors.textTertiary} />
    </Pressable>
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
  header: {
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    paddingVertical: 8,
  },
  intro: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  topics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
  },
  topic: {
    color: brandSolid,
    fontSize: 15,
    fontWeight: '700',
  },
  topicInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicInput: {
    color: brandSolid,
    fontSize: 15,
    fontWeight: '700',
    minWidth: 90,
    paddingVertical: 0,
  },
  addTopic: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginVertical: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  scheduleLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  scheduleValue: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  summary: {
    gap: 8,
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
