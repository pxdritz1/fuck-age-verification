export interface Settings {
  enabled: boolean;
  modules: Record<string, boolean>;
  showToasts: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  modules: {},
  showToasts: true,
};

export function normalizeSettings(value: unknown, moduleIds: string[]): Settings {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const rawModules = source.modules && typeof source.modules === 'object' ? (source.modules as Record<string, unknown>) : {};
  const modules: Record<string, boolean> = {};

  for (const id of moduleIds) {
    modules[id] = rawModules[id] !== false;
  }

  return {
    enabled: source.enabled !== false,
    modules,
    showToasts: source.showToasts !== false,
  };
}

export function isModuleEnabled(settings: Settings, id: string): boolean {
  return settings.enabled && settings.modules[id] !== false;
}
