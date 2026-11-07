type BrowserApi = typeof chrome;

const globalScope = globalThis as typeof globalThis & {
  browser?: BrowserApi;
  chrome?: BrowserApi;
};

export const ext: BrowserApi | undefined = globalScope.browser ?? globalScope.chrome;

export const SETTINGS_KEY = 'settings';

export async function storageGet<T>(key: string): Promise<T | undefined> {
  if (!ext?.storage?.local) return undefined;
  const result = await ext.storage.local.get(key);
  return result[key] as T | undefined;
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  if (!ext?.storage?.local) return;
  await ext.storage.local.set({ [key]: value });
}

export function onStorageChanged(
  callback: (changes: Record<string, chrome.storage.StorageChange>) => void,
): void {
  ext?.storage?.onChanged?.addListener(callback);
}

export function getVersion(): string {
  try {
    return ext?.runtime?.getManifest?.().version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}
