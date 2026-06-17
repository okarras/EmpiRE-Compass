import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../services/backendApi', () => ({
  getQuestions: vi.fn(),
}));

vi.mock('../services/BackupService', () => ({
  default: {
    isExplicitlyUsingBackup: vi.fn(),
    getQuestions: vi.fn(),
  },
}));

import { getQuestions as getQuestionsApi } from '../services/backendApi';
import BackupService from '../services/BackupService';
import CRUDQuestions from './CRUDQuestions';

describe('CRUDQuestions.getQuestions backup fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(BackupService.isExplicitlyUsingBackup).mockReturnValue(false);
  });

  it('returns API results when backend succeeds', async () => {
    vi.mocked(getQuestionsApi).mockResolvedValue([{ id: 1, uid: 'q1' }]);

    const result = await CRUDQuestions.getQuestions('R186491');

    expect(result).toEqual([{ id: 1, uid: 'q1' }]);
    expect(BackupService.getQuestions).not.toHaveBeenCalled();
  });

  it('uses explicit backup when selected', async () => {
    vi.mocked(BackupService.isExplicitlyUsingBackup).mockReturnValue(true);
    vi.mocked(BackupService.getQuestions).mockResolvedValue([
      { id: 2, uid: 'backup' },
    ]);

    const result = await CRUDQuestions.getQuestions('R186491');

    expect(result).toEqual([{ id: 2, uid: 'backup' }]);
    expect(getQuestionsApi).not.toHaveBeenCalled();
  });

  it('falls back to backup when API fails', async () => {
    vi.mocked(getQuestionsApi).mockRejectedValue(new Error('network'));
    vi.mocked(BackupService.getQuestions).mockResolvedValue([
      { id: 3, uid: 'fallback' },
    ]);

    const result = await CRUDQuestions.getQuestions('R186491');

    expect(result).toEqual([{ id: 3, uid: 'fallback' }]);
  });
});
