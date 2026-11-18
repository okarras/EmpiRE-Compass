import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedRequest } from './auth.js';

vi.mock('../config/firebase.js', () => ({
  db: {},
}));

import { getAiRateLimitSubject } from './aiRateLimit.js';

describe('getAiRateLimitSubject', () => {
  it('keys signed-in callers by user id', () => {
    const req = { userId: 'user-1', ip: '203.0.113.8' } as AuthenticatedRequest;
    expect(getAiRateLimitSubject(req)).toBe('user-1');
  });

  it('keys anonymous callers by client IP', () => {
    const req = { ip: '203.0.113.8' } as AuthenticatedRequest;
    expect(getAiRateLimitSubject(req)).toBe('anon_203.0.113.8');
  });

  it('falls back when the client IP is missing', () => {
    const req = {} as AuthenticatedRequest;
    expect(getAiRateLimitSubject(req)).toBe('anon_unknown');
  });
});
