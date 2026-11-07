import { patchTweetResults } from './tweets';

export const X_FLAGS: Record<string, boolean> = {
  rweb_age_assurance_flow_enabled: false,
  age_verification_gate_enabled: false,
  sensitive_tweet_warnings_enabled: false,
  sensitive_media_settings_enabled: true,
  grok_settings_age_restriction_enabled: false,
  rweb_mvr_blurred_media_interstitial_enabled: false,
};

const FLAG_NAMES = new Set(Object.keys(X_FLAGS));
const RELEVANT_PATTERN =
  /rweb_age_assurance_flow_enabled|age_verification_gate_enabled|sensitive_tweet_warnings_enabled|sensitive_media_settings_enabled|grok_settings_age_restriction_enabled|rweb_mvr_blurred_media_interstitial_enabled|TweetWithVisibilityResults|possibly_sensitive|profile_interstitial_type|featureSwitch/;

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

export function writeTyped(object: Record<string, unknown>, key: string, desired: boolean): boolean {
  try {
    const current = object[key];
    const next =
      typeof current === 'string' ? String(desired) : typeof current === 'number' ? (desired ? 1 : 0) : desired;

    if (current === next) return false;

    object[key] = next;
    return object[key] === next;
  } catch {
    return false;
  }
}

function writeValue(object: Record<string, unknown>, key: string, desired: boolean): boolean {
  const current = safeGet(object, key);

  if (isRecord(current) && 'value' in current) {
    return writeTyped(current, 'value', desired);
  }

  return writeTyped(object, key, desired);
}

function patchRoot(value: unknown): number {
  return patchState(value) + patchTweetResults(value);
}

export function patchState(root: unknown): number {
  let changed = 0;
  const seen = new WeakSet<object>();
  const stack: unknown[] = [root];

  while (stack.length > 0) {
    const value = stack.pop();
    if (!value || typeof value !== 'object' || isDomNode(value)) continue;
    if (seen.has(value)) continue;
    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) stack.push(item);
      continue;
    }

    const object = value as Record<string, unknown>;

    const featureSwitch = safeGet(object, 'featureSwitch');
    if (isRecord(featureSwitch)) {
      const overrides = safeGet(featureSwitch, 'customOverrides');
      if (isRecord(overrides)) {
        for (const [flag, desired] of Object.entries(X_FLAGS)) {
          if (Object.prototype.hasOwnProperty.call(overrides, flag) && writeValue(overrides, flag, desired)) {
            changed += 1;
          }
        }
      }
    }

    const feature = safeGet(object, 'feature');
    if (typeof feature === 'string' && FLAG_NAMES.has(feature) && safeGet(object, 'enabled') !== undefined) {
      if (writeValue(object, 'enabled', X_FLAGS[feature]!)) changed += 1;
    }

    for (const flag of FLAG_NAMES) {
      if (Object.prototype.hasOwnProperty.call(object, flag) && writeValue(object, flag, X_FLAGS[flag]!)) {
        changed += 1;
      }
    }

    for (const key of Object.keys(object)) {
      const child = safeGet(object, key);
      if (child && typeof child === 'object') stack.push(child);
    }
  }

  return changed;
}

export function mightBeRelevant(root: unknown, maxDepth = 6): boolean {
  const seen = new WeakSet<object>();
  const stack: Array<[unknown, number]> = [[root, 0]];

  while (stack.length > 0) {
    const [value, depth] = stack.pop()!;
    if (!value || typeof value !== 'object' || isDomNode(value) || seen.has(value) || depth > maxDepth) continue;
    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) stack.push([item, depth + 1]);
      continue;
    }

    const object = value as Record<string, unknown>;

    for (const key of Object.keys(object)) {
      if (FLAG_NAMES.has(key) || key === 'featureSwitch') return true;
      if (key === '__typename' && safeGet(object, key) === 'TweetWithVisibilityResults') return true;
      if (key === 'possibly_sensitive' || key === 'profile_interstitial_type') return true;

      if (key === 'feature') {
        const feature = safeGet(object, 'feature');
        if (typeof feature === 'string' && FLAG_NAMES.has(feature)) return true;
      }

      const child = safeGet(object, key);
      if (child && typeof child === 'object') stack.push([child, depth + 1]);
    }
  }

  return false;
}

function copyFunctionMeta(source: Function, target: Function): void {
  for (const key of ['name', 'length'] as const) {
    try {
      Object.defineProperty(target, key, { value: source[key], configurable: true });
    } catch {
      // Some environments expose non-configurable function metadata.
    }
  }
}

const INSTALL_KEY = '__FAV_X_PATCHED__';

export function install(): void {
  const scope = window as typeof window & Record<string, unknown>;
  if (scope[INSTALL_KEY]) return;

  try {
    Object.defineProperty(scope, INSTALL_KEY, { value: true, configurable: false });
  } catch {
    scope[INSTALL_KEY] = true;
  }

  const enabled = () => document.documentElement?.getAttribute('data-fav-x') !== '0';

  try {
    let current = scope.__INITIAL_STATE__;
    if (current) patchRoot(current);

    Object.defineProperty(scope, '__INITIAL_STATE__', {
      configurable: true,
      get() {
        return current;
      },
      set(value) {
        current = value;
        if (enabled()) patchRoot(value);
      },
    });
  } catch (error) {
    console.debug('[FAV:x] __INITIAL_STATE__ hook failed', error);
  }

  const nativeParse = JSON.parse;
  const parse = function (this: unknown, text: string, reviver?: (this: unknown, key: string, value: unknown) => unknown) {
    const result = nativeParse(text, reviver);
    if (enabled() && typeof text === 'string' && RELEVANT_PATTERN.test(text)) patchRoot(result);
    return result;
  } as typeof JSON.parse;

  copyFunctionMeta(nativeParse, parse);
  JSON.parse = parse;

  if (typeof Response !== 'undefined' && typeof Response.prototype.json === 'function') {
    const nativeJson = Response.prototype.json;

    Response.prototype.json = function (this: Response): Promise<unknown> {
      return nativeJson.call(this).then((result: unknown) => {
        if (!enabled()) return result;

        if (/\/i\/api\/graphql\//.test(this.url) || mightBeRelevant(result)) patchRoot(result);
        return result;
      });
    };
  }

  const nativeAssign = Object.assign;
  const assign = function (target: object, ...sources: object[]) {
    const result = nativeAssign(target, ...sources);
    if (enabled() && mightBeRelevant(result)) patchRoot(result);
    return result;
  } as typeof Object.assign;

  copyFunctionMeta(nativeAssign, assign);
  Object.assign = assign;
}
