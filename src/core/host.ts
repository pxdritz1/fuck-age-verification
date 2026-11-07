import type { ModuleMeta } from './types';

const PATTERN = /^(\*|https?|file|ftp):\/\/(\*|\*\.[^/]+|[^/]+)(\/.*)$/;

function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

export function matchPattern(pattern: string, url: string): boolean {
  const parts = PATTERN.exec(pattern);
  if (!parts) return false;

  const scheme = parts[1]!;
  const host = parts[2]!;
  const path = parts[3]!;
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (scheme === '*') {
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  } else if (scheme === 'file') {
    if (parsed.protocol !== 'file:') return false;
  } else if (`${scheme}:` !== parsed.protocol) {
    return false;
  }

  if (host !== '*') {
    const hostname = parsed.hostname.toLowerCase();
    const expected = host.toLowerCase();

    if (expected.startsWith('*.')) {
      const suffix = expected.slice(2);
      if (hostname !== suffix && !hostname.endsWith(`.${suffix}`)) return false;
    } else if (hostname !== expected) {
      return false;
    }
  }

  return globToRegExp(path).test(parsed.pathname + parsed.search);
}

export function findModuleForUrl<T extends { meta: ModuleMeta }>(modules: T[], url: string): T | undefined {
  return modules.find((module) => module.meta.matches.some((pattern) => matchPattern(pattern, url)));
}
