import { SETTINGS_KEY, onStorageChanged, storageGet } from '../core/browser';
import { createContext } from '../core/context';
import { findModuleForUrl } from '../core/host';
import { DEFAULT_SETTINGS, isModuleEnabled, normalizeSettings, type Settings } from '../core/settings';
import { modules } from '../modules/registry';

const module = findModuleForUrl(modules, location.href);

if (module) {
  const activeModule = module;
  const id = activeModule.meta.id;
  const moduleIds = modules.map((definition) => definition.meta.id);
  const cacheKey = `fav:enabled:${id}`;

  let settings: Settings = DEFAULT_SETTINGS;
  let enabled = readCache(cacheKey) ?? true;

  applyFlag(id, enabled);
  void init();

  async function init(): Promise<void> {
    const stored = await storageGet<unknown>(SETTINGS_KEY);
    settings = normalizeSettings(stored, moduleIds);
    enabled = isModuleEnabled(settings, id);
    applyFlag(id, enabled);
    writeCache(cacheKey, enabled);

    onStorageChanged((changes) => {
      const change = changes[SETTINGS_KEY];
      if (!change) return;

      settings = normalizeSettings(change.newValue, moduleIds);
      enabled = isModuleEnabled(settings, id);
      applyFlag(id, enabled);
      writeCache(cacheKey, enabled);
    });

    const context = createContext(
      activeModule.meta,
      () => enabled,
      () => settings.showToasts,
    );

    try {
      await activeModule.setup(context);
    } catch (error) {
      console.error(`[FAV:${id}] setup failed`, error);
    }
  }
}

function applyFlag(id: string, enabled: boolean): void {
  const apply = () => {
    document.documentElement?.setAttribute(`data-fav-${id}`, enabled ? '1' : '0');
  };

  apply();

  if (!document.documentElement) {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  }
}

function readCache(key: string): boolean | undefined {
  try {
    const value = localStorage.getItem(key);
    return value === null ? undefined : value === '1';
  } catch {
    return undefined;
  }
}

function writeCache(key: string, enabled: boolean): void {
  try {
    localStorage.setItem(key, enabled ? '1' : '0');
  } catch {
    // Storage can be unavailable in private or sandboxed contexts.
  }
}
