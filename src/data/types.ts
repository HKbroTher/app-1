export type ExhibitionStatus = 'scheduled' | 'locked' | 'live' | 'archived' | 'cancelled';

export type User = {
  id: string; // public handle, searchable
  name: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
};

export type Exhibition = {
  id: string;
  title: string;
  intro: string;
  curatorId: string;
  images: string[]; // always 9, images[0] is the cover
  startAt: number; // epoch ms
  endAt: number;
  closedAt?: number; // set when closed early
  cancelledAt?: number;
};
