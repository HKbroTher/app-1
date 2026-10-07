import { CURRENT_USER_ID, seedFollows, users } from '@/data/mock';

/** Whom I follow, as a set-like record (the only mutable part of the graph). */
export type MyFollowing = Record<string, true>;

const ME = CURRENT_USER_ID;

/** Ids that `userId` follows. */
export function followingOf(userId: string, mine: MyFollowing): string[] {
  if (userId === ME) return Object.keys(mine);
  return seedFollows[userId] ?? [];
}

/** Ids that follow `userId`, including me when I follow them. */
export function followersOf(userId: string, mine: MyFollowing): string[] {
  const result = users
    .filter((u) => u.id !== ME && u.id !== userId && (seedFollows[u.id] ?? []).includes(userId))
    .map((u) => u.id);
  if (userId !== ME && mine[userId]) result.unshift(ME);
  return result;
}

export function followsMe(userId: string): boolean {
  return (seedFollows[userId] ?? []).includes(ME);
}

/** Mutual follow between me and `userId` — the requirement for sending messages (PRD §4.7). */
export function isMutual(userId: string, mine: MyFollowing): boolean {
  return userId !== ME && !!mine[userId] && followsMe(userId);
}

/** Label for my follow button on someone else: 关注 / 回关 / 已关注 / 互相关注. */
export function followLabel(userId: string, mine: MyFollowing): string {
  if (mine[userId]) return followsMe(userId) ? '互相关注' : '已关注';
  return followsMe(userId) ? '回关' : '关注';
}
