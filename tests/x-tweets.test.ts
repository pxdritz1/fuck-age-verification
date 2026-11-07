import { describe, expect, it } from 'vitest';
import {
  isTweetVisibilityResult,
  normalizeTweetResult,
  patchTweetResults,
} from '../src/modules/x/tweets';

function visibilityResult() {
  return {
    __typename: 'TweetWithVisibilityResults',
    tweet: {
      __typename: 'Tweet',
      legacy: { possibly_sensitive: true },
      core: {
        user_results: {
          result: {
            profile_metadata: { profile_interstitial_type: 'sensitive' },
          },
        },
      },
      quoted_status_result: {
        result: {
          __typename: 'TweetWithVisibilityResults',
          tweet: {
            __typename: 'Tweet',
            legacy: { possibly_sensitive: true },
          },
        },
      },
    },
  };
}

describe('normalizeTweetResult', () => {
  it('unwraps visibility results and clears sensitive flags', () => {
    const normalized = normalizeTweetResult(visibilityResult()) as any;

    expect(normalized.__typename).toBe('Tweet');
    expect(normalized.tweet).toBeUndefined();
    expect(normalized.legacy.possibly_sensitive).toBe(false);
    expect(normalized.core.user_results.result.profile_metadata.profile_interstitial_type).toBe('');
    expect(normalized.quoted_status_result.result.__typename).toBe('Tweet');
    expect(normalized.quoted_status_result.result.legacy.possibly_sensitive).toBe(false);
  });

  it('preserves the original value type for possibly_sensitive', () => {
    const tweet = {
      __typename: 'Tweet',
      legacy: { possibly_sensitive: 'true' },
    };

    const normalized = normalizeTweetResult(tweet) as any;

    expect(normalized.legacy.possibly_sensitive).toBe('false');
  });

  it('detects visibility result wrappers', () => {
    expect(isTweetVisibilityResult(visibilityResult())).toBe(true);
    expect(isTweetVisibilityResult({ __typename: 'Tweet' })).toBe(false);
  });
});

describe('patchTweetResults', () => {
  it('replaces nested visibility results in objects', () => {
    const root = {
      data: {
        thread: [
          {
            content: {
              itemContent: {
                tweet_results: { result: visibilityResult() },
              },
            },
          },
        ],
      },
    };

    expect(patchTweetResults(root)).toBe(1);

    const result = (root as any).data.thread[0].content.itemContent.tweet_results.result;
    expect(result.__typename).toBe('Tweet');
    expect(result.legacy.possibly_sensitive).toBe(false);
  });

  it('replaces visibility results inside arrays', () => {
    const root = { items: [visibilityResult()] };

    expect(patchTweetResults(root)).toBe(1);
    expect((root as any).items[0].__typename).toBe('Tweet');
  });

  it('ignores unrelated objects', () => {
    expect(patchTweetResults({ data: { value: 1 } })).toBe(0);
  });
});
