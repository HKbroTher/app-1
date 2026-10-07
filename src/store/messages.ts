import { create } from 'zustand';

import { CURRENT_USER_ID } from '@/data/mock';
import { isMutual } from '@/data/social-graph';
import type { ChatMessage } from '@/data/types';
import { useSocial } from '@/store/social';

const MIN = 60 * 1000;
const now = Date.now();
const msg = (id: string, from: string, text: string, minutesAgo: number): ChatMessage => ({
  id,
  from,
  text,
  at: now - minutesAgo * MIN,
});

// Seed conversations. orbit.lab doesn't follow me back, so that thread is read-only (PRD §4.7).
const seedThreads: Record<string, ChatMessage[]> = {
  mori_k: [
    msg('m1', CURRENT_USER_ID, '《雾中山》第 4 张是在哪座山拍的？', 190),
    msg('m2', 'mori_k', '是雨后的大菩萨岭，早上五点。', 180),
    msg('m3', 'mori_k', '下周我还有一场预约开展，记得来看～', 12),
  ],
  nanami: [
    msg('n1', 'nanami', '你的《午后的玻璃》好美', 60 * 26),
    msg('n2', CURRENT_USER_ID, '谢谢！下次一起拍海边吧', 60 * 25),
  ],
  'kai.film': [msg('k1', 'kai.film', '已关注你，期待你的下一场展 :)', 60 * 50)],
  'orbit.lab': [
    msg('o1', 'orbit.lab', '感谢预约《Orbit 07》！', 60 * 24 * 6),
    msg('o2', CURRENT_USER_ID, '期待开展', 60 * 24 * 6 - 5),
  ],
};

type MessagesState = {
  threads: Record<string, ChatMessage[]>;
  lastRead: Record<string, number>; // userId -> time I last opened the thread
  /** Sends a message; returns false unless we follow each other. */
  send: (userId: string, text: string) => boolean;
  markRead: (userId: string) => void;
};

export const useMessages = create<MessagesState>((set) => ({
  threads: seedThreads,
  lastRead: { nanami: now, 'kai.film': now, 'orbit.lab': now },
  send: (userId, text) => {
    const body = text.trim();
    if (!body || !isMutual(userId, useSocial.getState().following)) return false;
    const message: ChatMessage = { id: `local-${Date.now()}`, from: CURRENT_USER_ID, text: body, at: Date.now() };
    set((s) => ({
      threads: { ...s.threads, [userId]: [...(s.threads[userId] ?? []), message] },
      lastRead: { ...s.lastRead, [userId]: message.at },
    }));
    return true;
  },
  markRead: (userId) => set((s) => ({ lastRead: { ...s.lastRead, [userId]: Date.now() } })),
}));

export function unreadCount(thread: ChatMessage[], lastRead: number | undefined): number {
  return thread.filter((m) => m.from !== CURRENT_USER_ID && m.at > (lastRead ?? 0)).length;
}

/** Total unread messages across threads (for the tab bar dot). */
export function useUnreadTotal(): number {
  const threads = useMessages((s) => s.threads);
  const lastRead = useMessages((s) => s.lastRead);
  return Object.entries(threads).reduce((sum, [id, t]) => sum + unreadCount(t, lastRead[id]), 0);
}
