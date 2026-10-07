export type ExhibitionStatus = 'scheduled' | 'locked' | 'live' | 'archived' | 'cancelled';

export type User = {
  id: string; // public handle, searchable
  name: string;
  avatar: string;
  bio: string;
};

export type Exhibition = {
  id: string;
  title: string;
  intro: string;
  curatorId: string;
  images: string[]; // always 9, images[0] is the cover
  topics?: string[]; // without the leading '#'
  startAt: number; // epoch ms
  endAt: number;
  closedAt?: number; // set when closed early
  cancelledAt?: number;
};

export type ChatMessage = {
  id: string;
  from: string; // user id
  text: string;
  at: number; // epoch ms
};
