import { describe, expect, it } from 'vitest';
import { findModuleForUrl, matchPattern } from '../src/core/host';
import type { ModuleMeta } from '../src/core/types';

function moduleWith(id: string, matches: string[]): { meta: ModuleMeta } {
  return {
    meta: {
      id,
      name: id,
      description: id,
      matches,
    },
  };
}

describe('matchPattern', () => {
  it('matches wildcard schemes and subdomains', () => {
    expect(matchPattern('*://*.reddit.com/*', 'https://www.reddit.com/r/all')).toBe(true);
    expect(matchPattern('*://*.reddit.com/*', 'https://old.reddit.com/')).toBe(true);
    expect(matchPattern('*://*.reddit.com/*', 'https://reddit.com/')).toBe(true);
    expect(matchPattern('*://*.reddit.com/*', 'https://notreddit.com/')).toBe(false);
    expect(matchPattern('*://*.reddit.com/*', 'https://reddit.com.evil.com/')).toBe(false);
  });

  it('respects scheme and path', () => {
    expect(matchPattern('https://example.com/foo/*', 'https://example.com/foo/bar')).toBe(true);
    expect(matchPattern('https://example.com/foo/*', 'https://example.com/bar')).toBe(false);
    expect(matchPattern('https://example.com/foo/*', 'http://example.com/foo/bar')).toBe(false);
  });

  it('matches query strings and hash routes', () => {
    expect(matchPattern('*://*.youtube.com/*', 'https://www.youtube.com/watch?v=abc')).toBe(true);
    expect(matchPattern('*://*.x.com/*', 'https://x.com/user/status/1?s=20')).toBe(true);
  });

  it('rejects invalid urls and patterns', () => {
    expect(matchPattern('*://*.reddit.com/*', 'not a url')).toBe(false);
    expect(matchPattern('not a pattern', 'https://reddit.com/')).toBe(false);
  });
});

describe('findModuleForUrl', () => {
  const modules = [
    moduleWith('reddit', ['*://*.reddit.com/*']),
    moduleWith('youtube', ['*://*.youtube.com/*']),
  ];

  it('returns the first matching module', () => {
    expect(findModuleForUrl(modules, 'https://www.reddit.com/r/all')?.meta.id).toBe('reddit');
    expect(findModuleForUrl(modules, 'https://youtube.com/watch?v=1')?.meta.id).toBe('youtube');
  });

  it('returns undefined for unrelated urls', () => {
    expect(findModuleForUrl(modules, 'https://example.com/')).toBeUndefined();
  });
});
