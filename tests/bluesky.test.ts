import { describe, expect, it } from 'vitest';
import {
  clearFeedLabels,
  clearProfileLabels,
  clearThreadLabels,
  disableAgeAssurance,
  relaxLabelerServices,
  transformResponse,
} from '../src/modules/bluesky/transform';

describe('relaxLabelerServices', () => {
  it('turns label definitions into visible content', () => {
    const data = {
      views: [
        {
          policies: {
            labelValueDefinitions: [
              {
                identifier: 'porn',
                adultOnly: true,
                blurs: 'media',
                defaultSetting: 'hide',
              },
            ],
          },
        },
      ],
    };

    expect(relaxLabelerServices(data)).toBe(3);

    expect(data.views[0]!.policies.labelValueDefinitions[0]).toMatchObject({
      adultOnly: false,
      blurs: 'none',
      defaultSetting: 'show',
    });
  });
});

describe('disableAgeAssurance', () => {
  it('clears the regions list', () => {
    const data = { regions: ['BR', 'US'] };

    expect(disableAgeAssurance(data)).toBe(true);
    expect(data.regions).toEqual([]);
    expect(disableAgeAssurance(data)).toBe(false);
  });
});

describe('clearFeedLabels', () => {
  it('clears labels on feed posts and replies', () => {
    const data = {
      feed: [
        { post: { labels: [{ val: 'porn' }] } },
        { reply: { labels: [{ val: 'sensitive' }] } },
      ],
    };

    expect(clearFeedLabels(data)).toBe(2);
    expect((data.feed[0] as any).post.labels).toEqual([]);
    expect((data.feed[1] as any).reply.labels).toEqual([]);
  });
});

describe('clearThreadLabels', () => {
  it('clears labels on thread posts and replies', () => {
    const data = {
      thread: [
        {
          value: {
            post: { labels: [{ val: 'porn' }] },
            reply: { labels: [{ val: 'sensitive' }] },
          },
        },
      ],
    };

    expect(clearThreadLabels(data)).toBe(2);
    expect(data.thread[0]!.value.post.labels).toEqual([]);
    expect(data.thread[0]!.value.reply.labels).toEqual([]);
  });
});

describe('clearProfileLabels', () => {
  it('clears profile labels', () => {
    const data = { labels: [{ val: 'porn' }] };

    expect(clearProfileLabels(data)).toBe(true);
    expect(data.labels).toEqual([]);
  });
});

describe('transformResponse', () => {
  it('dispatches known Bluesky endpoints', () => {
    expect(
      transformResponse('https://public.api.bsky.app/xrpc/app.bsky.ageassurance.getConfig', {
        regions: ['BR'],
      }),
    ).toBe(true);

    expect(
      transformResponse('https://public.api.bsky.app/xrpc/app.bsky.labeler.getServices', {
        views: [
          {
            policies: {
              labelValueDefinitions: [{ blurs: 'media', defaultSetting: 'hide', adultOnly: true }],
            },
          },
        ],
      }),
    ).toBe(true);

    expect(
      transformResponse('https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed', {
        feed: [{ post: { labels: [{ val: 'porn' }] } }],
      }),
    ).toBe(true);

    expect(
      transformResponse('https://public.api.bsky.app/xrpc/app.bsky.unspecced.getPostThreadV2', {
        thread: [{ value: { post: { labels: [{ val: 'porn' }] } } }],
      }),
    ).toBe(true);

    expect(
      transformResponse('https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile', {
        labels: [{ val: 'porn' }],
      }),
    ).toBe(true);
  });

  it('ignores unrelated endpoints', () => {
    expect(transformResponse('https://public.api.bsky.app/xrpc/app.bsky.feed.getFeed', {})).toBe(
      false,
    );
    expect(transformResponse('https://example.com/api', { regions: ['BR'] })).toBe(false);
  });
});
