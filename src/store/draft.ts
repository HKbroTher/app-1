import { create } from 'zustand';

export const REQUIRED_IMAGES = 9;
export const MAX_TOPICS = 5;

export type DraftImage = { id: string; uri: string };

// In-progress exhibition shared by the picker (/create) and the compose screen (/create/compose).
type DraftState = {
  images: DraftImage[]; // selection order; images[0] is the cover
  title: string;
  intro: string;
  topics: string[];
  /** Returns false when the selection is already full. */
  toggleImage: (image: DraftImage) => boolean;
  /** Apply a new order (ids); the first becomes the cover. */
  reorder: (ids: string[]) => void;
  setTitle: (title: string) => void;
  setIntro: (intro: string) => void;
  addTopic: (topic: string) => void;
  removeTopic: (topic: string) => void;
  reset: () => void;
};

const empty = { images: [], title: '', intro: '', topics: [] };

export const useDraft = create<DraftState>((set, get) => ({
  ...empty,
  toggleImage: (image) => {
    const { images } = get();
    if (images.some((i) => i.id === image.id)) {
      set({ images: images.filter((i) => i.id !== image.id) });
      return true;
    }
    if (images.length >= REQUIRED_IMAGES) return false;
    set({ images: [...images, image] });
    return true;
  },
  reorder: (ids) =>
    set(({ images }) => {
      const byId = new Map(images.map((i) => [i.id, i]));
      const next = ids.map((id) => byId.get(id)).filter((i): i is DraftImage => !!i);
      return next.length === images.length ? { images: next } : {};
    }),
  setTitle: (title) => set({ title }),
  setIntro: (intro) => set({ intro }),
  addTopic: (raw) =>
    set(({ topics }) => {
      const topic = raw.trim().replace(/^#+/, '').replace(/\s+/g, '');
      if (!topic || topics.includes(topic) || topics.length >= MAX_TOPICS) return {};
      return { topics: [...topics, topic] };
    }),
  removeTopic: (topic) => set(({ topics }) => ({ topics: topics.filter((t) => t !== topic) })),
  reset: () => set(empty),
}));
