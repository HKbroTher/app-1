import { create } from 'zustand';

import { getStatus } from '@/data/exhibition-status';
import { exhibitions } from '@/data/mock';

// Local mock of follow / reservation state; will be replaced by Supabase queries.
type SocialState = {
  following: Record<string, true>;
  reservations: Record<string, true>; // exhibitionId -> reserved
  toggleFollow: (userId: string) => void;
  /** Returns false when the viewer must follow the curator first. */
  reserve: (exhibitionId: string) => boolean;
  cancelReservation: (exhibitionId: string) => void;
};

export const useSocial = create<SocialState>((set, get) => ({
  following: { 'mori_k': true },
  reservations: {},

  toggleFollow: (userId) =>
    set((s) => {
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
