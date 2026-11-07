import { SETTINGS_KEY, ext } from '../core/browser';
import { matchPattern } from '../core/host';
import { DEFAULT_SETTINGS, isModuleEnabled, normalizeSettings, type Settings } from '../core/settings';
import type { CookieRule, ModuleMeta } from '../core/types';
import { catalog } from '../modules/catalog';

const moduleIds = catalog.map((module) => module.id);

async function loadSettings(): Promise<Settings> {
  if (!ext?.storage?.local) return normalizeSettings(DEFAULT_SETTINGS, moduleIds);

  const stored = await ext.storage.local.get(SETTINGS_KEY);
  return normalizeSettings(stored[SETTINGS_KEY], moduleIds);
}

async function ensureSettings(): Promise<void> {
  if (!ext?.storage?.local) return;

  const stored = await ext.storage.local.get(SETTINGS_KEY);
  if (stored[SETTINGS_KEY]) return;

  await ext.storage.local.set({
    [SETTINGS_KEY]: normalizeSettings(DEFAULT_SETTINGS, moduleIds),
  });
}

async function setCookie(rule: CookieRule): Promise<void> {
  if (!ext?.cookies?.set) return;

  const path = rule.path ?? '/';
  const host = rule.domain.replace(/^\./, '');
  const details: chrome.cookies.SetDetails = {
    url: `https://${host}${path}`,
    name: rule.name,
    value: rule.value,
    domain: rule.domain,
    path,
    secure: rule.secure ?? true,
    httpOnly: rule.httpOnly ?? false,
    sameSite: rule.sameSite ?? 'lax',
  };

  if (rule.expirationDays) {
    details.expirationDate = Math.floor(Date.now() / 1000) + rule.expirationDays * 86_400;
  }

  try {
    await ext.cookies.set(details);
  } catch (error) {
    console.warn(`[FAV] could not set cookie "${rule.name}" for ${rule.domain}`, error);
  }
}

async function applyCookies(module: ModuleMeta, settings: Settings): Promise<void> {
  if (!isModuleEnabled(settings, module.id)) return;

  for (const rule of module.cookies ?? []) {
    await setCookie(rule);
  }
}

async function applyAllCookies(settings: Settings): Promise<void> {
  for (const module of catalog) {
    if (module.cookies?.length) await applyCookies(module, settings);
  }
}

ext?.runtime?.onInstalled?.addListener(() => {
  void ensureSettings().then(loadSettings).then(applyAllCookies);
});

ext?.runtime?.onStartup?.addListener(() => {
  void loadSettings().then(applyAllCookies);
});

ext?.tabs?.onUpdated?.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading' || !tab.url) return;

  const module = catalog.find((candidate) =>
    candidate.matches.some((pattern) => matchPattern(pattern, tab.url!)),
  );

  if (!module) return;

  void loadSettings().then((settings) => applyCookies(module, settings));
});

ext?.storage?.onChanged?.addListener((changes, area) => {
  if (area !== 'local' || !changes[SETTINGS_KEY]) return;

  const settings = normalizeSettings(changes[SETTINGS_KEY].newValue, moduleIds);
  void applyAllCookies(settings);
});
