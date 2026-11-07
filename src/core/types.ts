export interface CookieRule {
  name: string;
  value: string;
  domain: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'no_restriction' | 'lax' | 'strict' | 'unspecified';
  expirationDays?: number;
}

export interface ModuleMeta {
  id: string;
  name: string;
  description: string;
  matches: string[];
  order?: number;
  color?: string;
  category?: string;
  cookies?: CookieRule[];
  pageScript?: string;
  pageMatches?: string[];
  pageRunAt?: 'document_start' | 'document_end' | 'document_idle';
  pageAllFrames?: boolean;
}

export interface ObserveOptions {
  throttleMs?: number;
  attributes?: boolean;
}

export interface ClickRule {
  selectors?: string[];
  text?: Array<string | RegExp>;
  scope?: string;
  max?: number;
  includeHidden?: boolean;
}

export interface ContentContext {
  meta: ModuleMeta;
  log: (...args: unknown[]) => void;
  observe: (callback: () => void, options?: ObserveOptions) => () => void;
  onNavigate: (callback: () => void) => () => void;
  click: (rules: ClickRule[]) => number;
  remove: (selectors: string[]) => number;
  hide: (selectors: string[]) => void;
  unlockScroll: () => void;
  toast: (message: string) => void;
  ready: () => Promise<void>;
  isEnabled: () => boolean;
}

export interface ModuleDefinition {
  meta: ModuleMeta;
  setup: (ctx: ContentContext) => void | Promise<void>;
}
