function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clearPostLabels(post: unknown): boolean {
  if (!isRecord(post) || !Array.isArray(post.labels) || post.labels.length === 0) return false;

  try {
    post.labels = [];
    return true;
  } catch {
    return false;
  }
}

export function relaxLabelerServices(data: unknown): number {
  if (!isRecord(data) || !Array.isArray(data.views)) return 0;

  let changed = 0;

  for (const view of data.views) {
    if (!isRecord(view)) continue;

    const policies = view.policies;
    if (!isRecord(policies) || !Array.isArray(policies.labelValueDefinitions)) continue;

    for (const definition of policies.labelValueDefinitions) {
      if (!isRecord(definition)) continue;

      if (definition.adultOnly !== false) {
        definition.adultOnly = false;
        changed += 1;
      }

      if (definition.blurs !== 'none') {
        definition.blurs = 'none';
        changed += 1;
      }

      if (definition.defaultSetting !== 'show') {
        definition.defaultSetting = 'show';
        changed += 1;
      }
    }
  }

  return changed;
}

export function disableAgeAssurance(data: unknown): boolean {
  if (!isRecord(data)) return false;
  if (Array.isArray(data.regions) && data.regions.length === 0) return false;

  try {
    data.regions = [];
    return true;
  } catch {
    return false;
  }
}

export function clearFeedLabels(data: unknown): number {
  if (!isRecord(data) || !Array.isArray(data.feed)) return 0;

  let changed = 0;

  for (const item of data.feed) {
    if (!isRecord(item)) continue;
    if (clearPostLabels(item.post)) changed += 1;
    if (clearPostLabels(item.reply)) changed += 1;
  }

  return changed;
}

export function clearThreadLabels(data: unknown): number {
  if (!isRecord(data)) return 0;

  const roots = Array.isArray(data.thread) ? data.thread : data.thread ? [data.thread] : [];
  if (roots.length === 0) return 0;

  let changed = 0;
  const seen = new WeakSet<object>();
  const stack: unknown[] = [...roots];

  while (stack.length > 0) {
    const value = stack.pop();
    if (!isRecord(value) || seen.has(value)) continue;
    seen.add(value);

    if (clearPostLabels(value.post)) changed += 1;

    const nested = value.value;
    if (isRecord(nested)) {
      if (clearPostLabels(nested.post)) changed += 1;
      if (clearPostLabels(nested.reply)) changed += 1;
      stack.push(nested);
    }

    for (const child of Object.values(value)) {
      if (child && typeof child === 'object') stack.push(child);
    }
  }

  return changed;
}

export function clearProfileLabels(data: unknown): boolean {
  if (!isRecord(data) || !Array.isArray(data.labels) || data.labels.length === 0) return false;

  try {
    data.labels = [];
    return true;
  } catch {
    return false;
  }
}

export function transformResponse(url: string, data: unknown): boolean {
  if (url.includes('app.bsky.ageassurance.getConfig')) return disableAgeAssurance(data);
  if (url.includes('app.bsky.labeler.getServices')) return relaxLabelerServices(data) > 0;
  if (url.includes('getPostThreadV2') || url.includes('getPostThread')) {
    return clearThreadLabels(data) > 0;
  }
  if (url.includes('getAuthorFeed') || url.includes('app.bsky.feed.getFeed')) {
    return clearFeedLabels(data) > 0;
  }
  if (url.includes('app.bsky.actor.getProfile')) return clearProfileLabels(data);

  return false;
}
