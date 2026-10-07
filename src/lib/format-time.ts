const pad = (n: number) => String(n).padStart(2, '0');
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Chat list/bubble time: 14:05 · 昨天 · 周三 · 10月3日. */
export function formatChatTime(ts: number, now = Date.now()): string {
  const d = new Date(ts);
  const days = Math.round((startOfDay(now) - startOfDay(ts)) / 86_400_000);
  if (days <= 0) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (days === 1) return '昨天';
  if (days < 7) return WEEKDAYS[d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
