import type { Exhibition, ExhibitionStatus } from '@/data/types';

export const LOCK_WINDOW_MS = 30 * 60 * 1000;

/** Client-side mirror of the server state machine (PRD §5.1). The server stays the source of truth. */
export function getStatus(ex: Exhibition, now = Date.now()): ExhibitionStatus {
  if (ex.cancelledAt) return 'cancelled';
  if (ex.closedAt || now >= ex.endAt) return 'archived';
  if (now >= ex.startAt) return 'live';
  if (now >= ex.startAt - LOCK_WINDOW_MS) return 'locked';
  return 'scheduled';
}

/** Whether `viewerId` may browse all 9 images (PRD §5.2). */
export function canViewAllImages(ex: Exhibition, viewerId: string, now = Date.now()) {
  if (ex.curatorId === viewerId) return true;
  return getStatus(ex, now) === 'live';
}

export function formatRemaining(ms: number) {
  if (ms <= 0) return '已结束';
  const minutes = Math.floor(ms / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}天${hours}小时`;
  if (hours > 0) return `${hours}小时${minutes % 60}分`;
  return `${Math.max(minutes, 1)}分钟`;
}

export function formatDateTime(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
