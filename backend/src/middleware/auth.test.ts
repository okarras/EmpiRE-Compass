import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../config/keycloak.js', () => ({
  verifyKeycloakToken: vi.fn(),
}));

vi.mock('../config/firebase.js', () => ({
  db: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ data: () => ({ is_admin: false }) }),
      })),
    })),
  },
}));

import { verifyKeycloakToken } from '../config/keycloak.js';
import { validateKeycloakToken } from '../middleware/auth.js';

const createMockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

describe('validateKeycloakToken', () => {
  const next = vi.fn() as NextFunction;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('accepts valid Bearer token', async () => {
    vi.mocked(verifyKeycloakToken).mockResolvedValue({
      userId: 'user-1',
      userEmail: 'admin@example.com',
    });

    const req = {
      headers: { authorization: 'Bearer valid-token' },
    } as unknown as Request;
    const res = createMockRes();

    await validateKeycloakToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects invalid Bearer token', async () => {
    vi.mocked(verifyKeycloakToken).mockRejectedValue(new Error('invalid'));

    const req = {
      headers: { authorization: 'Bearer bad-token' },
    } as unknown as Request;
    const res = createMockRes();

    await validateKeycloakToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows dev header fallback when no token', async () => {
    const req = {
      headers: {
        'x-user-id': 'dev-user',
        'x-user-email': 'dev@example.com',
      },
    } as unknown as Request;
    const res = createMockRes();

    await validateKeycloakToken(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 401 when no auth in production', async () => {
    process.env.NODE_ENV = 'production';

    const req = { headers: {} } as unknown as Request;
    const res = createMockRes();

    await validateKeycloakToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
