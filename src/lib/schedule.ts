// Scheduling rules for a new exhibition (PRD §4.1, duration narrowed to 1–48 hours).

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const MIN_LEAD_MS = 1 * HOUR; // opening at least 1 hour after publishing
export const MINUTE_STEP = 5;
export const BOOKABLE_DAYS = 14;
export const MIN_DURATION_MS = 1 * HOUR;
export const MAX_DURATION_MS = 2 * DAY;
export const DURATION_STEP_MS = 1 * HOUR;
export const DEFAULT_DURATION_MS = 1 * DAY;

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const pad = (n: number) => String(n).padStart(2, '0');

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Earliest allowed opening time: now + 1h, rounded up to the minute step. */
export function earliestStart(now: number): number {
  const step = MINUTE_STEP * MIN;
  return Math.ceil((now + MIN_LEAD_MS) / step) * step;
}

export type Option<T> = { value: T; label: string };

/** Selectable opening days, starting with the day of the earliest allowed time. */
export function dayOptions(now: number): Option<number>[] {
  const first = startOfDay(earliestStart(now));
  const today = startOfDay(now);
  return Array.from({ length: BOOKABLE_DAYS }, (_, i) => {
    const day = new Date(first);
    day.setDate(day.getDate() + i);
    const ts = day.getTime();
    const offset = Math.round((ts - today) / DAY);
    const date = `${day.getMonth() + 1}月${day.getDate()}日`;
    const prefix = offset === 0 ? '今天' : offset === 1 ? '明天' : offset === 2 ? '后天' : WEEKDAYS[day.getDay()];
    return { value: ts, label: `${date} ${prefix}` };
  });
}

/** Hours available on `day` (earlier hours are cut off on the first possible day). */
export function hourOptions(day: number, now: number): Option<number>[] {
  const earliest = earliestStart(now);
  const minHour = startOfDay(earliest) === day ? new Date(earliest).getHours() : 0;
  return Array.from({ length: 24 - minHour }, (_, i) => ({ value: minHour + i, label: pad(minHour + i) }));
}

/** Minutes available for `hour` on `day`, in 5-minute steps. */
export function minuteOptions(day: number, hour: number, now: number): Option<number>[] {
  const earliest = earliestStart(now);
  const e = new Date(earliest);
  const limited = startOfDay(earliest) === day && hour === e.getHours();
  const min = limited ? e.getMinutes() : 0;
  const result: Option<number>[] = [];
  for (let m = min; m < 60; m += MINUTE_STEP) result.push({ value: m, label: pad(m) });
  return result;
}

export function composeStart(day: number, hour: number, minute: number): number {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

/** Clamp a candidate opening time into the allowed window. */
export function clampStart(ts: number, now: number): number {
  const earliest = earliestStart(now);
  const last = startOfDay(earliest) + BOOKABLE_DAYS * DAY - MINUTE_STEP * MIN;
  return Math.min(Math.max(ts, earliest), last);
}

export function durationOptions(): Option<number>[] {
  const result: Option<number>[] = [];
  for (let ms = MIN_DURATION_MS; ms <= MAX_DURATION_MS; ms += DURATION_STEP_MS) {
    result.push({ value: ms, label: formatDuration(ms) });
  }
  return result;
}

export function clampDuration(ms: number): number {
  const stepped = Math.round(ms / DURATION_STEP_MS) * DURATION_STEP_MS;
  return Math.min(Math.max(stepped, MIN_DURATION_MS), MAX_DURATION_MS);
}

/** Whole hours: 1 小时 … 48 小时 */
export function formatDuration(ms: number): string {
  return `${Math.round(ms / HOUR)} 小时`;
}

/** 10月8日 周四 20:05 */
export function formatStart(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAYS[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
