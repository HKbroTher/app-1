import { useMemo } from 'react';
import { create } from 'zustand';

import { getStatus, LOCK_WINDOW_MS } from '@/data/exhibition-status';
import { exhibitions as seed } from '@/data/mock';
import type { Exhibition } from '@/data/types';

// Local mock of curator actions; the server will enforce the same rules (PRD §4.6).
type Patch = Pick<Exhibition, 'closedAt' | 'cancelledAt'>;

type ExhibitionsState = {
  patches: Record<string, Patch>;
  /** Exhibitions published on this device (mock until the backend exists). */
  created: Exhibition[];
  publish: (ex: Omit<Exhibition, 'id'>) => Exhibition;
  /** Allowed only before the lock window starts. */
  cancel: (ex: Exhibition) => boolean;
  /** Allowed only while live. */
  closeEarly: (ex: Exhibition) => boolean;
};

export const useExhibitionStore = create<ExhibitionsState>((set) => ({
  patches: {},
  created: [],
  publish: (draft) => {
    const ex: Exhibition = { ...draft, id: `local-${Date.now()}` };
    set((s) => ({ created: [ex, ...s.created] }));
    return ex;
  },
  cancel: (ex) => {
    const now = Date.now();
    if (getStatus(ex, now) !== 'scheduled' || now >= ex.startAt - LOCK_WINDOW_MS) return false;
    set((s) => ({ patches: { ...s.patches, [ex.id]: { ...s.patches[ex.id], cancelledAt: now } } }));
    return true;
  },
  closeEarly: (ex) => {
    const now = Date.now();
    if (getStatus(ex, now) !== 'live') return false;
    set((s) => ({ patches: { ...s.patches, [ex.id]: { ...s.patches[ex.id], closedAt: now } } }));
    return true;
  },
}));

export function useExhibitions(): Exhibition[] {
  const patches = useExhibitionStore((s) => s.patches);
  const created = useExhibitionStore((s) => s.created);
  return useMemo(
    () => [...created, ...seed].map((e) => (patches[e.id] ? { ...e, ...patches[e.id] } : e)),
    [patches, created],
  );
}

export function useExhibition(id: string | undefined): Exhibition | undefined {
  const all = useExhibitions();
  return all.find((e) => e.id === id);
}
