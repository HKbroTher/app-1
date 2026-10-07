import type { Exhibition, User } from '@/data/types';

// Placeholder data until the Supabase backend is wired up.

export const CURRENT_USER_ID = 'me';

const HOUR = 60 * 60 * 1000;
const now = Date.now();

const img = (seed: string, i: number) => `https://picsum.photos/seed/${seed}-${i}/900/1200`;
const nine = (seed: string) => Array.from({ length: 9 }, (_, i) => img(seed, i));
const avatar = (seed: string) => `https://picsum.photos/seed/avatar-${seed}/200/200`;

export const users: User[] = [
  { id: 'me', name: '我', avatar: avatar('me'), bio: '把光收进九个格子里。' },
  { id: 'lumen.studio', name: 'Lumen', avatar: avatar('lumen'), bio: '城市夜色与霓虹' },
  { id: 'mori_k', name: '森 Mori', avatar: avatar('mori'), bio: '胶片 · 山野 · 慢' },
  { id: 'azure.lab', name: 'Azure Lab', avatar: avatar('azure'), bio: '数字雕塑实验室' },
  { id: 'nanami', name: '七海', avatar: avatar('nanami'), bio: '海边的人像练习' },
  { id: 'kai.film', name: '凯 Kai', avatar: avatar('kai'), bio: '35mm 街头扫街' },
  { id: 'yuki_draws', name: '雪 Yuki', avatar: avatar('yuki'), bio: '水彩与冬天' },
  { id: 'orbit.lab', name: 'Orbit Lab', avatar: avatar('orbit'), bio: '生成艺术 · 每周一展' },
  { id: 'linlin', name: '林林', avatar: avatar('linlin'), bio: '看展爱好者' },
  { id: 'sora.k', name: '空 Sora', avatar: avatar('sora'), bio: '天空收集者' },
  { id: 'haru_photo', name: '春 Haru', avatar: avatar('haru'), bio: '花与微距' },
];

/**
 * Seed follow graph: who each user follows (everyone except me — my follows live in the
 * social store so they can change). Relationship to me:
 *   mutual: mori_k, nanami, kai.film · follow me only: yuki_draws, linlin, sora.k
 *   I follow only: orbit.lab · none: lumen.studio, azure.lab, haru_photo
 */
export const seedFollows: Record<string, string[]> = {
  'lumen.studio': ['azure.lab', 'mori_k'],
  mori_k: ['me', 'lumen.studio', 'haru_photo'],
  'azure.lab': ['lumen.studio'],
  nanami: ['me', 'mori_k', 'yuki_draws'],
  'kai.film': ['me', 'lumen.studio'],
  yuki_draws: ['me', 'nanami'],
  'orbit.lab': ['azure.lab'],
  linlin: ['me'],
  'sora.k': ['me', 'lumen.studio'],
  haru_photo: ['mori_k'],
};

/** Whom I follow when the app starts. */
export const initialMyFollowing = ['mori_k', 'nanami', 'kai.film', 'orbit.lab'];

export const exhibitions: Exhibition[] = [
  {
    id: 'ex1',
    title: '霓虹以北',
    intro: '九个夜晚，九条街。在城市最安静的时候，霓虹替所有人醒着。',
    curatorId: 'lumen.studio',
    images: nine('neon'),
    startAt: now - 20 * HOUR,
    endAt: now + 4 * HOUR,
  },
  {
    id: 'ex2',
    title: '雾中山',
    intro: '用一卷 Portra 400 走完三座山，雾是唯一的滤镜。',
    curatorId: 'mori_k',
    images: nine('mist'),
    startAt: now - 2 * HOUR,
    endAt: now + 3 * 24 * HOUR,
  },
  {
    id: 'ex3',
    title: 'Liquid Chrome',
    intro: '液态金属与光的九次碰撞，渲染于 2026 年秋。',
    curatorId: 'azure.lab',
    images: nine('chrome'),
    startAt: now - 30 * HOUR,
    endAt: now + 45 * 60 * 1000,
  },
  {
    id: 'ex4',
    title: '潮汐练习',
    intro: '同一片海，九种情绪。',
    curatorId: 'nanami',
    images: nine('tide'),
    startAt: now - 5 * HOUR,
    endAt: now + 6 * 24 * HOUR,
  },
  {
    id: 'ex5',
    title: '午后的玻璃',
    intro: '窗边、杯沿、雨后的车窗——关于透明的小展。',
    curatorId: 'me',
    images: nine('glass'),
    startAt: now - 1 * HOUR,
    endAt: now + 2 * 24 * HOUR,
  },
  {
    id: 'ex6',
    title: '冬至以前',
    intro: '即将开展：关于漫长黑夜前的最后几缕暖光。',
    curatorId: 'me',
    images: nine('winter'),
    startAt: now + 26 * HOUR,
    endAt: now + 5 * 24 * HOUR,
  },
  {
    id: 'ex7',
    title: '夏日底片',
    intro: '已闭展的夏天。',
    curatorId: 'me',
    images: nine('summer'),
    startAt: now - 30 * 24 * HOUR,
    endAt: now - 23 * 24 * HOUR,
  },
  {
    id: 'ex8',
    title: '午夜航线',
    intro: '即将开展：从起飞到降落的九个瞬间。',
    curatorId: 'lumen.studio',
    images: nine('flight'),
    startAt: now + 3 * HOUR,
    endAt: now + 2 * 24 * HOUR,
  },
];

// Extra live shows so the Explore masonry has enough to fill the screen.
const EXTRA = [
  ['velvet', '天鹅绒时刻'],
  ['dune', '沙丘回声'],
  ['bloom', '暗处花开'],
  ['metro', '末班地铁'],
  ['aurora', '极光备忘录'],
  ['ink', '水墨实验'],
  ['frost', '霜降'],
  ['coral', '珊瑚色黄昏'],
  ['echo', '回声之屋'],
  ['prism', '棱镜'],
  ['orbit', '轨道之外'],
  ['paper', '纸上月光'],
] as const;
const CURATORS = ['lumen.studio', 'mori_k', 'azure.lab', 'nanami'];

exhibitions.push(
  ...EXTRA.map(([seed, title], i) => ({
    id: `live-${seed}`,
    title,
    intro: `「${title}」——九张作品，一段限时的观看。`,
    curatorId: CURATORS[i % CURATORS.length],
    images: nine(seed),
    startAt: now - (i + 1) * 3 * HOUR,
    endAt: now + (i + 1) * 7 * HOUR,
  })),
);

export const getUser =(id: string) => users.find((u) => u.id === id);
export const getExhibition = (id: string) => exhibitions.find((e) => e.id === id);
