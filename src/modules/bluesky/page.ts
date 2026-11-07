import { transformResponse } from './transform';

const INSTALL_KEY = '__FAV_BLUESKY_PATCHED__';

function enabled(): boolean {
  return document.documentElement?.getAttribute('data-fav-bluesky') !== '0';
}

function isBlueskyApi(url: string): boolean {
  return url.includes('api.bsky.app') || url.includes('public.api.bsky.app');
}

function install(): void {
  const scope = window as typeof window & Record<string, unknown>;
  if (scope[INSTALL_KEY]) return;

  try {
    Object.defineProperty(scope, INSTALL_KEY, { value: true, configurable: false });
  } catch {
    scope[INSTALL_KEY] = true;
  }

  if (typeof Response === 'undefined') return;

  const nativeJson = Response.prototype.json;

  Response.prototype.json = function (this: Response): Promise<unknown> {
    return nativeJson.call(this).then((data: unknown) => {
      if (enabled() && isBlueskyApi(this.url)) transformResponse(this.url, data);
      return data;
    });
  };

  const nativeText = Response.prototype.text;

  Response.prototype.text = function (this: Response): Promise<string> {
    return nativeText.call(this).then((text: string) => {
      if (!enabled() || !text || !isBlueskyApi(this.url)) return text;

      try {
        const data: unknown = JSON.parse(text);
        return transformResponse(this.url, data) ? JSON.stringify(data) : text;
      } catch {
        return text;
      }
    });
  };
}

install();
