export const AGE_STATUSES = new Set([
  'AGE_VERIFICATION_REQUIRED',
  'AGE_CHECK_REQUIRED',
  'CONTENT_CHECK_REQUIRED',
  'LOGIN_REQUIRED',
]);

export const VALID_STATUSES = new Set(['OK', 'LIVE_STREAM_OFFLINE']);

export interface PlayerResponse {
  videoDetails?: { videoId?: string };
  playabilityStatus?: { status?: string; desktopLegacyAgeGateReason?: unknown };
  previewPlayabilityStatus?: { status?: string };
  [key: string]: unknown;
}

interface Strategy {
  clientName: string;
  clientVersion: string;
  clientScreen?: string;
  thirdParty?: boolean;
  requiresAuth?: boolean;
}

const playerCache = new Map<string, PlayerResponse>();
let signatureTimestamp: number | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isPlayerResponse(value: unknown): value is PlayerResponse {
  if (!isRecord(value)) return false;

  const hasDetails = isRecord(value.videoDetails);
  const hasStatus = isRecord(value.playabilityStatus);

  return (hasDetails && hasStatus) || isRecord(value.previewPlayabilityStatus);
}

export function isAgeRestricted(player: PlayerResponse): boolean {
  const status = player.previewPlayabilityStatus?.status ?? player.playabilityStatus?.status;

  if (!status) return false;
  if (AGE_STATUSES.has(status)) return true;

  return Boolean(player.playabilityStatus?.desktopLegacyAgeGateReason);
}

export function addContentCheck(body: string): string {
  try {
    const parsed: unknown = JSON.parse(body);

    if (isRecord(parsed) && typeof parsed.videoId === 'string') {
      parsed.contentCheckOk = true;
      parsed.racyCheckOk = true;
      return JSON.stringify(parsed);
    }
  } catch {
    // The request body was not JSON.
  }

  return body;
}

function getYtcfgValue(name: string): unknown {
  const ytcfg = (window as typeof window & { ytcfg?: { get?: (key: string) => unknown } }).ytcfg;

  try {
    return ytcfg?.get?.(name);
  } catch {
    return undefined;
  }
}

function getApiKey(): string | undefined {
  const value = getYtcfgValue('INNERTUBE_API_KEY');
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function getClientVersion(): string {
  const value = getYtcfgValue('INNERTUBE_CLIENT_VERSION');
  return typeof value === 'string' && value.length > 0 ? value : '2.20250101.00.00';
}

function getClientName(): string | number | undefined {
  const value = getYtcfgValue('INNERTUBE_CONTEXT_CLIENT_NAME');
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function getHl(): string {
  const value = getYtcfgValue('HL');
  return typeof value === 'string' && value.length > 0 ? value : 'en';
}

function isUserLoggedIn(): boolean {
  const loggedIn = getYtcfgValue('LOGGED_IN');
  if (typeof loggedIn === 'boolean') return loggedIn;

  const sessionIndex = Number(getYtcfgValue('SESSION_INDEX'));
  return Number.isFinite(sessionIndex) && sessionIndex >= 0;
}

export function getSignatureTimestamp(): number | undefined {
  if (signatureTimestamp !== undefined) return signatureTimestamp;

  const value = getYtcfgValue('STS');
  if (typeof value === 'number') {
    signatureTimestamp = value;
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    signatureTimestamp = Number(value);
    return signatureTimestamp;
  }

  const script = document.querySelector<HTMLScriptElement>('script[src*="/base.js"]');
  if (!script?.src) return undefined;

  try {
    const request = new XMLHttpRequest();
    request.open('GET', script.src, false);
    request.send(null);

    const match = request.responseText.match(/signatureTimestamp:(\d+)/);
    if (match?.[1]) {
      signatureTimestamp = Number(match[1]);
      return signatureTimestamp;
    }
  } catch {
    // Embedded players do not always expose base.js.
  }

  return undefined;
}

function buildPayload(videoId: string, strategy: Strategy, hl: string) {
  const client: Record<string, unknown> = {
    clientName: strategy.clientName,
    clientVersion: strategy.clientVersion,
    hl,
  };

  if (strategy.clientScreen) client.clientScreen = strategy.clientScreen;

  const context: Record<string, unknown> = { client };
  if (strategy.thirdParty) context.thirdParty = { embedUrl: 'https://www.youtube.com/' };

  const timestamp = getSignatureTimestamp();

  return {
    context,
    playbackContext: timestamp ? { contentPlaybackContext: { signatureTimestamp: timestamp } } : undefined,
    videoId,
    startTimeSecs: 0,
    racyCheckOk: true,
    contentCheckOk: true,
  };
}

function requestPlayer(videoId: string): PlayerResponse | undefined {
  const apiKey = getApiKey();
  if (!apiKey) return undefined;

  const hl = getHl();
  const clientVersion = getClientVersion();
  const clientName = getClientName();

  const strategies: Strategy[] = [
    {
      clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
      clientVersion: '2.0',
      clientScreen: 'WATCH',
      thirdParty: true,
    },
    { clientName: 'WEB', clientVersion },
    { clientName: 'WEB_CREATOR', clientVersion: '1.20210909.07.00', requiresAuth: true },
  ];

  for (const strategy of strategies) {
    if (strategy.requiresAuth && !isUserLoggedIn()) continue;

    try {
      const request = new XMLHttpRequest();
      request.open(
        'POST',
        `/youtubei/v1/player?key=${encodeURIComponent(apiKey)}&prettyPrint=false`,
        false,
      );
      request.withCredentials = Boolean(strategy.requiresAuth);
      request.setRequestHeader('Content-Type', 'application/json');

      if (clientName !== undefined) {
        request.setRequestHeader('X-YouTube-Client-Name', String(clientName));
      }

      request.setRequestHeader('X-YouTube-Client-Version', clientVersion);
      request.send(JSON.stringify(buildPayload(videoId, strategy, hl)));

      if (request.status < 200 || request.status >= 300) continue;

      const result: unknown = JSON.parse(request.responseText);
      if (!isPlayerResponse(result)) continue;

      const status = result.playabilityStatus?.status;
      if (status && VALID_STATUSES.has(status)) return result;
    } catch {
      // Try the next client.
    }
  }

  return undefined;
}

function applyUnlocked(player: PlayerResponse, unlocked: PlayerResponse): void {
  if (player.previewPlayabilityStatus) {
    player.previewPlayabilityStatus = unlocked.playabilityStatus;
  }

  Object.assign(player, unlocked);
}

export function unlockPlayerResponse(player: PlayerResponse): boolean {
  if (!isAgeRestricted(player)) return false;

  const videoId = player.videoDetails?.videoId;
  if (!videoId) return false;

  const cached = playerCache.get(videoId);
  if (cached) {
    applyUnlocked(player, cached);
    return true;
  }

  const unlocked = requestPlayer(videoId);
  if (!unlocked) return false;

  const status = unlocked.playabilityStatus?.status;
  if (!status || !VALID_STATUSES.has(status)) return false;

  if (playerCache.size >= 20) {
    const oldest = playerCache.keys().next().value;
    if (oldest) playerCache.delete(oldest);
  }

  playerCache.set(videoId, unlocked);
  applyUnlocked(player, unlocked);
  return true;
}

function copyFunctionMeta(source: Function, target: Function): void {
  for (const key of ['name', 'length'] as const) {
    try {
      Object.defineProperty(target, key, { value: source[key], configurable: true });
    } catch {
      // Ignore non-configurable metadata.
    }
  }
}

function interceptProperty(property: string, onSet: (value: unknown) => unknown): void {
  const dataKey = `__fav_${property}`;
  const descriptor = Object.getOwnPropertyDescriptor(Object.prototype, property);

  const getter = descriptor?.get ?? function (this: Record<string, unknown>) {
    return this[dataKey];
  };

  const setter = descriptor?.set ?? function (this: Record<string, unknown>, value: unknown) {
    this[dataKey] = value;
  };

  Object.defineProperty(Object.prototype, property, {
    configurable: true,
    get() {
      return getter.call(this);
    },
    set(value: unknown) {
      setter.call(this, value ? onSet(value) : value);
    },
  });
}

const INSTALL_KEY = '__FAV_YOUTUBE_PATCHED__';

export function install(): void {
  const scope = window as typeof window & Record<string, unknown>;
  if (scope[INSTALL_KEY]) return;

  try {
    Object.defineProperty(scope, INSTALL_KEY, { value: true, configurable: false });
  } catch {
    scope[INSTALL_KEY] = true;
  }

  const enabled = () => document.documentElement?.getAttribute('data-fav-youtube') !== '0';

  const patchPlayer = (value: unknown): boolean => {
    if (!enabled() || !isPlayerResponse(value)) return false;
    return unlockPlayerResponse(value);
  };

  try {
    let current = scope.ytInitialPlayerResponse;

    if (current) patchPlayer(current);

    Object.defineProperty(scope, 'ytInitialPlayerResponse', {
      configurable: true,
      get() {
        return current;
      },
      set(value) {
        current = value;
        patchPlayer(value);
      },
    });
  } catch (error) {
    console.debug('[FAV:youtube] ytInitialPlayerResponse hook failed', error);
  }

  const nativeParse = JSON.parse;
  const parse = function (
    this: unknown,
    text: string,
    reviver?: (this: unknown, key: string, value: unknown) => unknown,
  ) {
    const result = nativeParse(text, reviver);

    if (enabled() && typeof text === 'string' && text.includes('playabilityStatus')) {
      patchPlayer(result);
    }

    return result;
  } as typeof JSON.parse;

  copyFunctionMeta(nativeParse, parse);
  JSON.parse = parse;

  if (typeof Response !== 'undefined' && typeof Response.prototype.json === 'function') {
    const nativeJson = Response.prototype.json;

    Response.prototype.json = function (this: Response): Promise<unknown> {
      return nativeJson.call(this).then((result: unknown) => {
        patchPlayer(result);
        return result;
      });
    };
  }

  interceptProperty('playerResponse', (value) => {
    if (patchPlayer(value)) {
      try {
        return JSON.parse(JSON.stringify(value));
      } catch {
        return value;
      }
    }

    return value;
  });

  if (typeof window.fetch === 'function') {
    const nativeFetch = window.fetch;

    window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      try {
        const url =
          typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();

        if (
          enabled() &&
          /\/youtubei\/v1\/(player|next)/.test(url) &&
          init?.body &&
          typeof init.body === 'string'
        ) {
          init = { ...init, body: addContentCheck(init.body) };
        }
      } catch {
        // Keep the original request on malformed input.
      }

      return nativeFetch.call(this, input, init);
    };
  }

  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest & { __favUrl?: string },
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    this.__favUrl = String(url);
    return nativeOpen.apply(this, [method, url, ...rest] as unknown as Parameters<XMLHttpRequest['open']>);
  } as typeof XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest & { __favUrl?: string },
    body?: Document | XMLHttpRequestBodyInit | null,
  ) {
    try {
      if (
        enabled() &&
        typeof body === 'string' &&
        this.__favUrl &&
        /\/youtubei\/v1\/(player|next)/.test(this.__favUrl)
      ) {
        body = addContentCheck(body);
      }
    } catch {
      // Keep the original body.
    }

    return nativeSend.call(this, body);
  };
}
