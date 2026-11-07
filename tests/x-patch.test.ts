import { describe, expect, it } from 'vitest';
import { mightBeRelevant, patchState, writeTyped } from '../src/modules/x/patch-state';

describe('writeTyped', () => {
  it('preserves the original value type', () => {
    const stringValue = { flag: 'true' };
    const numberValue = { flag: 1 };
    const booleanValue = { flag: true };

    expect(writeTyped(stringValue, 'flag', false)).toBe(true);
    expect(stringValue.flag).toBe('false');

    expect(writeTyped(numberValue, 'flag', false)).toBe(true);
    expect(numberValue.flag).toBe(0);

    expect(writeTyped(booleanValue, 'flag', false)).toBe(true);
    expect(booleanValue.flag).toBe(false);
  });

  it('reports no change when the value already matches', () => {
    const value = { flag: false };
    expect(writeTyped(value, 'flag', false)).toBe(false);
  });
});

describe('patchState', () => {
  it('patches featureSwitch.customOverrides', () => {
    const state = {
      featureSwitch: {
        customOverrides: {
          rweb_age_assurance_flow_enabled: true,
          sensitive_media_settings_enabled: false,
        },
      },
    };

    expect(patchState(state)).toBe(2);
    expect(state.featureSwitch.customOverrides.rweb_age_assurance_flow_enabled).toBe(false);
    expect(state.featureSwitch.customOverrides.sensitive_media_settings_enabled).toBe(true);
  });

  it('patches direct flags with type preservation', () => {
    const state = {
      age_verification_gate_enabled: 'true',
      sensitive_tweet_warnings_enabled: 1,
    };

    expect(patchState(state)).toBe(2);
    expect(state.age_verification_gate_enabled).toBe('false');
    expect(state.sensitive_tweet_warnings_enabled).toBe(0);
  });

  it('patches GraphQL-style feature entries', () => {
    const state = {
      data: [{ feature: 'sensitive_tweet_warnings_enabled', enabled: true }],
    };

    expect(patchState(state)).toBe(1);
    expect(state.data[0]!.enabled).toBe(false);
  });

  it('patches wrapped values', () => {
    const state = {
      featureSwitch: {
        customOverrides: {
          rweb_age_assurance_flow_enabled: { value: true },
        },
      },
    };

    expect(patchState(state)).toBe(1);
    expect(state.featureSwitch.customOverrides.rweb_age_assurance_flow_enabled.value).toBe(false);
  });

  it('handles deep and cyclic state', () => {
    const state: Record<string, unknown> = {
      featureSwitch: {
        customOverrides: {
          rweb_age_assurance_flow_enabled: true,
        },
      },
    };
    state.self = state;

    expect(patchState(state)).toBe(1);
  });

  it('ignores DOM nodes and unrelated objects', () => {
    const state = {
      element: document.createElement('div'),
      value: 42,
    };

    expect(patchState(state)).toBe(0);
  });
});

describe('mightBeRelevant', () => {
  it('finds known flags at shallow depth', () => {
    expect(mightBeRelevant({ data: { featureSwitch: {} } })).toBe(true);
    expect(
      mightBeRelevant({ data: [{ feature: 'rweb_age_assurance_flow_enabled', enabled: true }] }),
    ).toBe(true);
  });

  it('rejects unrelated payloads', () => {
    expect(mightBeRelevant({ data: { tweets: [{ id: '1' }] } })).toBe(false);
  });
});
