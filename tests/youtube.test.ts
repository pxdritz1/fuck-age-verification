import { describe, expect, it } from 'vitest';
import {
  addContentCheck,
  isAgeRestricted,
  isPlayerResponse,
  VALID_STATUSES,
} from '../src/modules/youtube/unlock';

describe('isPlayerResponse', () => {
  it('accepts objects with video details and playability status', () => {
    expect(
      isPlayerResponse({
        videoDetails: { videoId: 'abc' },
        playabilityStatus: { status: 'OK' },
      }),
    ).toBe(true);
  });

  it('accepts preview playability responses', () => {
    expect(isPlayerResponse({ previewPlayabilityStatus: { status: 'OK' } })).toBe(true);
  });

  it('rejects unrelated objects', () => {
    expect(isPlayerResponse({ videoId: 'abc' })).toBe(false);
    expect(isPlayerResponse(null)).toBe(false);
    expect(isPlayerResponse('OK')).toBe(false);
  });
});

describe('isAgeRestricted', () => {
  it('detects age and content check statuses', () => {
    expect(isAgeRestricted({ playabilityStatus: { status: 'AGE_VERIFICATION_REQUIRED' } })).toBe(true);
    expect(isAgeRestricted({ playabilityStatus: { status: 'CONTENT_CHECK_REQUIRED' } })).toBe(true);
    expect(isAgeRestricted({ previewPlayabilityStatus: { status: 'LOGIN_REQUIRED' } })).toBe(true);
  });

  it('detects legacy desktop age gates', () => {
    expect(
      isAgeRestricted({
        playabilityStatus: { status: 'UNPLAYABLE', desktopLegacyAgeGateReason: true },
      }),
    ).toBe(true);
  });

  it('does not flag playable videos', () => {
    expect(isAgeRestricted({ playabilityStatus: { status: 'OK' } })).toBe(false);
    expect(isAgeRestricted({})).toBe(false);
  });

  it('treats OK and live streams as valid unlock results', () => {
    expect(VALID_STATUSES.has('OK')).toBe(true);
    expect(VALID_STATUSES.has('LIVE_STREAM_OFFLINE')).toBe(true);
  });
});

describe('addContentCheck', () => {
  it('adds content and racy check flags when a video id exists', () => {
    const result = JSON.parse(addContentCheck(JSON.stringify({ videoId: 'abc', context: {} })));

    expect(result.contentCheckOk).toBe(true);
    expect(result.racyCheckOk).toBe(true);
  });

  it('keeps bodies without a video id unchanged', () => {
    const body = JSON.stringify({ context: {} });
    expect(addContentCheck(body)).toBe(body);
  });

  it('keeps invalid json unchanged', () => {
    expect(addContentCheck('not json')).toBe('not json');
  });
});
