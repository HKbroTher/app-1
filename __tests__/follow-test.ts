import { beforeEach, describe, expect, it } from '@jest/globals';

import { exhibitions } from '@/data/mock';
import { followersOf, followingOf, followLabel, isMutual, type MyFollowing } from '@/data/social-graph';
import { useMessages } from '@/store/messages';
import { useSocial } from '@/store/social';

const initial = useSocial.getState();
const initialMessages = useMessages.getState();

beforeEach(() => {
  useSocial.setState(initial, true);
  useMessages.setState(initialMessages, true);
});

const mine = () => useSocial.getState().following;

describe('seed follow graph', () => {
  it('lists my followers and the people I follow', () => {
    expect(followersOf('me', mine()).sort()).toEqual(['kai.film', 'linlin', 'mori_k', 'nanami', 'sora.k', 'yuki_draws']);
    expect(followingOf('me', mine()).sort()).toEqual(['kai.film', 'mori_k', 'nanami', 'orbit.lab']);
  });

  it('classifies each relationship', () => {
    const m = mine();
    expect(followLabel('mori_k', m)).toBe('互相关注'); // both ways
    expect(followLabel('orbit.lab', m)).toBe('已关注'); // I follow, they don't
    expect(followLabel('yuki_draws', m)).toBe('回关'); // they follow me, I don't
    expect(followLabel('lumen.studio', m)).toBe('关注'); // no relationship
  });

  it('only mutual follows count as mutual', () => {
    const m = mine();
    expect(isMutual('nanami', m)).toBe(true);
    expect(isMutual('orbit.lab', m)).toBe(false);
    expect(isMutual('yuki_draws', m)).toBe(false);
    expect(isMutual('me', m)).toBe(false);
  });
});

describe('follow / unfollow', () => {
  it('following someone adds me to their followers and them to my following', () => {
    const before = followersOf('lumen.studio', mine()).length;
    useSocial.getState().toggleFollow('lumen.studio');

    expect(followersOf('lumen.studio', mine())).toContain('me');
    expect(followersOf('lumen.studio', mine())).toHaveLength(before + 1);
    expect(followingOf('me', mine())).toContain('lumen.studio');
  });

  it('following back a follower makes it mutual (回关 → 互相关注)', () => {
    expect(followLabel('yuki_draws', mine())).toBe('回关');
    useSocial.getState().toggleFollow('yuki_draws');
    expect(followLabel('yuki_draws', mine())).toBe('互相关注');
    expect(isMutual('yuki_draws', mine())).toBe(true);
  });

  it('unfollowing removes me from their followers and breaks mutual', () => {
    useSocial.getState().toggleFollow('mori_k');
    expect(followersOf('mori_k', mine())).not.toContain('me');
    expect(isMutual('mori_k', mine())).toBe(false);
    expect(followLabel('mori_k', mine())).toBe('回关'); // they still follow me
  });

  it('toggling twice restores the original state', () => {
    const before = { ...mine() };
    useSocial.getState().toggleFollow('azure.lab');
    useSocial.getState().toggleFollow('azure.lab');
    expect(mine()).toEqual(before);
  });

  it('cannot follow yourself', () => {
    useSocial.getState().toggleFollow('me');
    expect(mine().me).toBeUndefined();
  });
});

describe('follow-gated features', () => {
  const upcomingLumen = exhibitions.find((e) => e.id === 'ex8')!; // lumen.studio, opens in 3h

  it('reserving requires following the curator', () => {
    expect(useSocial.getState().reserve(upcomingLumen.id)).toBe(false);
    useSocial.getState().toggleFollow('lumen.studio');
    expect(useSocial.getState().reserve(upcomingLumen.id)).toBe(true);
    expect(useSocial.getState().reservations[upcomingLumen.id]).toBe(true);
  });

  it('unfollowing drops reservations for that curator’s upcoming shows', () => {
    useSocial.getState().toggleFollow('lumen.studio');
    useSocial.getState().reserve(upcomingLumen.id);
    useSocial.getState().toggleFollow('lumen.studio');
    expect(useSocial.getState().reservations[upcomingLumen.id]).toBeUndefined();
  });

  it('messages can only be sent between mutual follows', () => {
    const send = useMessages.getState().send;
    expect(send('nanami', 'hi')).toBe(true); // mutual
    expect(send('orbit.lab', 'hi')).toBe(false); // they don't follow back → read-only
    expect(send('yuki_draws', 'hi')).toBe(false); // I don't follow back

    useSocial.getState().toggleFollow('yuki_draws'); // follow back → mutual
    expect(send('yuki_draws', 'hi')).toBe(true);

    useSocial.getState().toggleFollow('nanami'); // unfollow → history kept, sending blocked
    expect(send('nanami', 'still there?')).toBe(false);
    expect(useMessages.getState().threads.nanami.length).toBeGreaterThan(0);
  });
});

describe('sanity of the graph helpers with an empty follow set', () => {
  it('nobody is mutual when I follow nobody', () => {
    const none: MyFollowing = {};
    expect(followingOf('me', none)).toEqual([]);
    expect(followersOf('me', none).length).toBe(6); // followers don't depend on my follows
    expect(isMutual('mori_k', none)).toBe(false);
  });
});
