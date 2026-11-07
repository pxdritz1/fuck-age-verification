const QUOTED_KEYS = [
  'quoted_status_result',
  'quotedRefResult',
  'nested_quoted_tweet_results',
] as const;

function isDomNode(value: unknown): boolean {
  return typeof Node !== 'undefined' && value instanceof Node;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !isDomNode(value);
}

function safeGet(object: Record<string, unknown>, key: string): unknown {
  try {
    return object[key];
  } catch {
    return undefined;
  }
}

export function isTweetVisibilityResult(
  value: unknown,
): value is Record<string, unknown> & { tweet: Record<string, unknown> } {
  return isRecord(value) && value.__typename === 'TweetWithVisibilityResults' && isRecord(value.tweet);
}

function clearProfileInterstitial(tweet: Record<string, unknown>): void {
  const core = safeGet(tweet, 'core');
  if (!isRecord(core)) return;

  const userResults = safeGet(core, 'user_results');
  if (!isRecord(userResults)) return;

  const result = safeGet(userResults, 'result');
  if (!isRecord(result)) return;

  const profileMetadata = safeGet(result, 'profile_metadata');
  if (!isRecord(profileMetadata)) return;

  try {
    profileMetadata.profile_interstitial_type = '';
  } catch {
    // Ignore read-only metadata.
  }
}

function clearSensitiveFlag(tweet: Record<string, unknown>): void {
  const legacy = safeGet(tweet, 'legacy');
  if (!isRecord(legacy)) return;

  const current = safeGet(legacy, 'possibly_sensitive');

  try {
    if (typeof current === 'string') legacy.possibly_sensitive = 'false';
    else if (typeof current === 'number') legacy.possibly_sensitive = 0;
    else legacy.possibly_sensitive = false;
  } catch {
    // Ignore read-only flags.
  }
}

export function normalizeTweetResult(value: unknown): unknown {
  if (!isRecord(value)) return value;

  let tweet: Record<string, unknown> = value;

  if (isTweetVisibilityResult(tweet)) {
    tweet = { ...tweet.tweet, __typename: 'Tweet' };
    delete tweet.tweet;
  }

  clearProfileInterstitial(tweet);
  clearSensitiveFlag(tweet);

  for (const key of QUOTED_KEYS) {
    const holder = safeGet(tweet, key);
    if (!isRecord(holder)) continue;

    const result = safeGet(holder, 'result');
    if (result === undefined) continue;

    try {
      holder.result = normalizeTweetResult(result);
    } catch {
      // Ignore non-writable result holders.
    }
  }

  return tweet;
}

export function patchTweetResults(root: unknown): number {
  let changed = 0;
  const seen = new WeakSet<object>();
  const stack: unknown[] = [root];

  while (stack.length > 0) {
    const value = stack.pop();

    if (Array.isArray(value)) {
      if (seen.has(value)) continue;
      seen.add(value);

      for (let index = 0; index < value.length; index += 1) {
        const item = value[index];

        if (isTweetVisibilityResult(item)) {
          const normalized = normalizeTweetResult(item);
          value[index] = normalized;
          changed += 1;
          stack.push(normalized);
        } else if (item && typeof item === 'object') {
          stack.push(item);
        }
      }

      continue;
    }

    if (!isRecord(value) || seen.has(value)) continue;
    seen.add(value);

    for (const key of Object.keys(value)) {
      const child = safeGet(value, key);

      if (isTweetVisibilityResult(child)) {
        const normalized = normalizeTweetResult(child);

        try {
          value[key] = normalized;
          changed += 1;
          stack.push(normalized);
        } catch {
          // Ignore read-only properties.
        }
      } else if (child && typeof child === 'object') {
        stack.push(child);
      }
    }
  }

  return changed;
}
