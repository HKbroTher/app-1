import { create } from 'zustand';

import { getStatus } from '@/data/exhibition-status';
import { CURRENT_USER_ID, exhibitions, initialMyFollowing } from '@/data/mock';
import { followersOf, followingOf, type MyFollowing } from '@/data/social-graph';

// Local mock of follow / reservation state; will be replaced by Supabase queries.
type SocialState = {
  following: MyFollowing; // whom I follow
  reservations: Record<string, true>; // exhibitionId -> reserved
  toggleFollow: (userId: string) => void;
  /** Returns false when the viewer must follow the curator first. */
  reserve: (exhibitionId: string) => boolean;
  cancelReservation: (exhibitionId: string) => void;
};

export const useSocial = create<SocialState>((set, get) => ({
  following: Object.fromEntries(initialMyFollowing.map((id) => [id, true])) as MyFollowing,
  reservations: {},

  toggleFollow: (userId) =>
    set((s) => {
      if (userId === CURRENT_USER_ID) return {}; // can't follow yourself
      const following = { ...s.following };
      const reservations = { ...s.reservations };
      if (following[userId]) {
        delete following[userId];
        // PRD §4.3: unfollowing drops reservations for that curator's not-yet-open shows.
        for (const ex of exhibitions) {
          const status = getStatus(ex);
          if (ex.curatorId === userId && (status === 'scheduled' || status === 'locked')) {
            delete reservations[ex.id];
          }
        }
      } else {
        following[userId] = true;
      }
      return { following, reservations };
    }),

  reserve: (exhibitionId) => {
    const ex = exhibitions.find((e) => e.id === exhibitionId);
    if (!ex || !get().following[ex.curatorId]) return false;
    set((s) => ({ reservations: { ...s.reservations, [exhibitionId]: true } }));
    return true;
  },

  cancelReservation: (exhibitionId) =>
    set((s) => {
      const reservations = { ...s.reservations };
      delete reservations[exhibitionId];
      return { reservations };
    }),
}));

/** Followers of a user, recomputed when my follows change. */
export function useFollowers(userId: string): string[] {
  const following = useSocial((s) => s.following);
  return followersOf(userId, following);
}

/** Users a user follows, recomputed when my follows change. */
export function useFollowingList(userId: string): string[] {
  const following = useSocial((s) => s.following);
  return followingOf(userId, following);
}
