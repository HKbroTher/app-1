import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextButton } from '@/components/ui/text-button';
import { WheelPicker } from '@/components/ui/wheel-picker';
import {
  clampStart,
  composeStart,
  dayOptions,
  durationOptions,
  formatStart,
  hourOptions,
  minuteOptions,
  startOfDay,
} from '@/lib/schedule';
import { brandSolid, colors, textGlow } from '@/theme/tokens';

type StartProps = {
  mode: 'start';
  value: number; // epoch ms
  now: number;
  onConfirm: (start: number) => void;
};

type DurationProps = {
  mode: 'duration';
  value: number; // ms
  start: number;
  onConfirm: (duration: number) => void;
};

type Props = (StartProps | DurationProps) & { visible: boolean; onClose: () => void };

/** Bottom sheet with wheel pickers: opening = date step then time step; duration = one wheel. */
export function ScheduleSheet(props: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
      <Pressable style={styles.backdrop} onPress={props.onClose} />
      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        {props.visible && (props.mode === 'start' ? <StartPicker {...props} /> : <DurationPicker {...props} />)}
      </View>
    </Modal>
  );
}

function StartPicker({ value, now, onConfirm, onClose }: StartProps & { onClose: () => void }) {
  const [step, setStep] = useState<'date' | 'time'>('date');
  const [day, setDay] = useState(startOfDay(value));
  const [hour, setHour] = useState(new Date(value).getHours());
  const [minute, setMinute] = useState(new Date(value).getMinutes());

  const days = dayOptions(now);
  const hours = hourOptions(day, now);
  // If the chosen day cut off earlier hours, snap to the first valid one.
  const safeHour = hours.some((h) => h.value === hour) ? hour : hours[0].value;
  const minutes = minuteOptions(day, safeHour, now);
  const safeMinute = minutes.some((m) => m.value === minute) ? minute : minutes[0].value;
  const candidate = clampStart(composeStart(day, safeHour, safeMinute), now);

  return (
    <>
      <View style={styles.titleRow}>
        <TextButton label="取消" variant="muted" size="sm" onPress={onClose} />
        <View style={styles.steps}>
          <Pressable onPress={() => setStep('date')} hitSlop={8}>
            <Text style={[styles.step, step === 'date' && [styles.stepActive, textGlow.soft]]}>1 日期</Text>
          </Pressable>
          <Text style={styles.stepArrow}>→</Text>
          <Pressable onPress={() => setStep('time')} hitSlop={8}>
            <Text style={[styles.step, step === 'time' && [styles.stepActive, textGlow.soft]]}>2 时间</Text>
          </Pressable>
        </View>
        {step === 'date' ? (
          <TextButton label="下一步" variant="brand" size="sm" onPress={() => setStep('time')} />
        ) : (
          <TextButton label="确定" variant="brand" size="sm" onPress={() => onConfirm(candidate)} />
        )}
      </View>

      <Text style={styles.preview}>{formatStart(candidate)} 开展</Text>

      {step === 'date' ? (
        <WheelPicker options={days} value={day} onChange={setDay} accessibilityLabel="开展日期" />
      ) : (
        <View style={styles.timeRow}>
          <WheelPicker options={hours} value={safeHour} onChange={setHour} width={110} accessibilityLabel="小时" />
          <Text style={styles.colon}>:</Text>
          <WheelPicker options={minutes} value={safeMinute} onChange={setMinute} width={110} accessibilityLabel="分钟" />
        </View>
      )}
      <Text style={styles.note}>开展时间需在发布后至少 1 小时，最多 14 天内</Text>
    </>
  );
}

function DurationPicker({ value, start, onConfirm, onClose }: DurationProps & { onClose: () => void }) {
  const [duration, setDuration] = useState(value);
  return (
    <>
      <View style={styles.titleRow}>
        <TextButton label="取消" variant="muted" size="sm" onPress={onClose} />
        <Text style={[styles.stepActive, styles.step, textGlow.soft]}>展期</Text>
        <TextButton label="确定" variant="brand" size="sm" onPress={() => onConfirm(duration)} />
      </View>
      <Text style={styles.preview}>{formatStart(start + duration)} 闭展</Text>
      <WheelPicker options={durationOptions()} value={duration} onChange={setDuration} accessibilityLabel="展期" />
      <Text style={styles.note}>展期 1–48 小时</Text>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  panel: {
    backgroundColor: '#0B0B0E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  step: {
    color: colors.textTertiary,
    fontSize: 15,
    fontWeight: '700',
  },
  stepActive: {
    color: colors.text,
  },
  stepArrow: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  preview: {
    color: brandSolid,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(240,69,127,0.6)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  colon: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  note: {
    color: colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
  },
});
