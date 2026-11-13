import { describe, expect, it } from 'vitest';
import { sanitizeLogRecord } from './logSanitizer.js';

class TimestampStub {
  constructor(readonly seconds: number) {}
}

describe('sanitizeLogRecord', () => {
  it('drops account fields and redacts identity and secrets', () => {
    const sanitized = sanitizeLogRecord({
      collection: 'Team',
      documentId: 'member-1',
      userId: 'user-1',
      userEmail: 'ada@example.com',
      error: 'failed for ada@example.com with Bearer abc.def and sk-secretkey',
      requestBody: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        sparqlQuery: 'SELECT ?paper',
        maxTokens: 800,
        nested: { submittedByUserId: 'user-1', apiKey: 'secret' },
      },
      timestamp: new TimestampStub(1),
    });

    expect(sanitized.userId).toBeUndefined();
    expect(sanitized.userEmail).toBeUndefined();
    expect(sanitized.documentId).toBe('member-1');
    expect(sanitized.error).toBe(
      'failed for [redacted] with Bearer [redacted] and [redacted]'
    );
    expect(sanitized.requestBody).toEqual({
      name: '[redacted]',
      email: '[redacted]',
      sparqlQuery: 'SELECT ?paper',
      maxTokens: 800,
      nested: { submittedByUserId: '[redacted]', apiKey: '[redacted]' },
    });
    expect(sanitized.timestamp).toBeInstanceOf(TimestampStub);
  });

  it('omits the document id when the collection is Users', () => {
    const sanitized = sanitizeLogRecord({
      collection: 'Users',
      documentId: 'user-1',
      operation: 'read',
    });

    expect(sanitized.documentId).toBeUndefined();
    expect(sanitized.operation).toBe('read');
  });
});
