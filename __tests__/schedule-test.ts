import { describe, expect, it } from '@jest/globals';

import {
  BOOKABLE_DAYS,
  clampDuration,
  clampStart,
  composeStart,
  dayOptions,
  durationOptions,
  earliestStart,
  formatDuration,
  hourOptions,
  minuteOptions,
  startOfDay,
} from '@/lib/schedule';
import { useDraft } from '@/store/draft';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// 2026-10-07 18:52 local time
const now = new Date(2026, 9, 7, 18, 52).getTime();

describe('opening time', () => {
  it('is at least 1 hour away, rounded up to 5 minutes', () => {
    expect(earliestStart(now)).toBe(new Date(2026, 9, 7, 19, 55).getTime());
  });

  it('offers 14 days starting today and labels them', () => {
    const days = dayOptions(now);
    expect(days).toHaveLength(BOOKABLE_DAYS);
    expect(days[0].label).toContain('今天');
    expect(days[1].label).toContain('明天');
  });

  it('cuts off earlier hours and minutes on the first day only', () => {
    const today = startOfDay(now);
    expect(hourOptions(today, now)[0].value).toBe(19);
    expect(minuteOptions(today, 19, now).map((m) => m.value)).toEqual([55]);
    expect(minuteOptions(today, 20, now)).toHaveLength(12);

    const tomorrow = today + DAY;
    expect(hourOptions(tomorrow, now)).toHaveLength(24);
  });

  it('clamps out-of-range picks', () => {
    expect(clampStart(now, now)).toBe(earliestStart(now)); // too soon
    const farFuture = composeStart(startOfDay(now) + 30 * DAY, 12, 0);
    expect(clampStart(farFuture, now)).toBeLessThan(startOfDay(now) + BOOKABLE_DAYS * DAY);
  });
});

describe('duration', () => {
  it('offers 48 whole-hour options, 1 to 48 hours', () => {
    const options = durationOptions();
    expect(options).toHaveLength(48);
    expect(options[0]).toEqual({ value: HOUR, label: '1 小时' });
    expect(options[47]).toEqual({ value: 2 * DAY, label: '48 小时' });
  });

  it('clamps to whole hours within range', () => {
    expect(clampDuration(10 * MIN)).toBe(HOUR);
    expect(clampDuration(5 * HOUR + 20 * MIN)).toBe(5 * HOUR);
    expect(clampDuration(5 * DAY)).toBe(2 * DAY);
    expect(formatDuration(24 * HOUR)).toBe('24 小时');
  });
});

describe('reordering the 9 images', () => {
  it('applies a dragged order and moves the cover', () => {
    const images = Array.from({ length: 9 }, (_, i) => ({ id: `p${i}`, uri: `file://${i}.jpg` }));
    useDraft.setState({ images });
    const order = ['p3', 'p0', 'p1', 'p2', 'p4', 'p5', 'p6', 'p7', 'p8'];
    useDraft.getState().reorder(order);
    expect(useDraft.getState().images.map((i) => i.id)).toEqual(order);
  });

  it('ignores an order that loses images', () => {
    const images = Array.from({ length: 9 }, (_, i) => ({ id: `p${i}`, uri: `file://${i}.jpg` }));
    useDraft.setState({ images });
    useDraft.getState().reorder(['p1', 'p0']);
    expect(useDraft.getState().images).toEqual(images);
  });
});
