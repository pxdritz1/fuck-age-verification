import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, isModuleEnabled, normalizeSettings } from '../src/core/settings';

const ids = ['reddit', 'x', 'youtube'];

describe('normalizeSettings', () => {
  it('returns defaults for missing input', () => {
    expect(normalizeSettings(undefined, ids)).toEqual({
      enabled: true,
      modules: { reddit: true, x: true, youtube: true },
      showToasts: true,
    });
  });

  it('keeps disabled modules and ignores unknown ids', () => {
    const settings = normalizeSettings(
      { enabled: true, modules: { reddit: false, unknown: false } },
      ids,
    );

    expect(settings.modules).toEqual({ reddit: false, x: true, youtube: true });
  });

  it('treats only explicit false as disabled', () => {
    const settings = normalizeSettings({ modules: { reddit: 'no', x: 0 } }, ids);

    expect(settings.modules.reddit).toBe(true);
    expect(settings.modules.x).toBe(true);
  });

  it('preserves global and toast switches', () => {
    const settings = normalizeSettings({ enabled: false, showToasts: false }, ids);

    expect(settings.enabled).toBe(false);
    expect(settings.showToasts).toBe(false);
  });
});

describe('isModuleEnabled', () => {
  it('requires both the global switch and the module switch', () => {
    const settings = normalizeSettings({ modules: { reddit: false } }, ids);

    expect(isModuleEnabled(settings, 'reddit')).toBe(false);
    expect(isModuleEnabled(settings, 'x')).toBe(true);

    settings.enabled = false;

    expect(isModuleEnabled(settings, 'x')).toBe(false);
  });

  it('uses defaults when no settings exist', () => {
    expect(isModuleEnabled(DEFAULT_SETTINGS, 'reddit')).toBe(true);
  });
});
