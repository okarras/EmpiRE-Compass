const REDACTED = '[redacted]';

// Identity and secrets. `token(?!s)` keeps operational fields such as maxTokens.
const SENSITIVE_KEY =
  /(e-?mail|user.?id|user.?name|display.?name|full.?name|(?:^|_)name$|author|creator.?name|created.?by|submitted.?by|reviewed.?by|password|passwd|secret|token(?!s)|api.?key|authorization|private.?key|credential|cookie|session)/i;

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SECRET_VALUE =
  /(bearer\s+)[a-z0-9._~+/-]+=*|sk-[a-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gi;

export const redactString = (value: string): string =>
  value
    .replace(EMAIL, REDACTED)
    .replace(SECRET_VALUE, (match, bearerPrefix: string | undefined) =>
      bearerPrefix ? `${bearerPrefix}${REDACTED}` : REDACTED
    );

export const sanitizeForLog = (value: unknown): unknown => {
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeForLog(item));
  if (!value || typeof value !== 'object') return value;
  // Leave Firestore timestamps and other class instances intact.
  if (Object.getPrototypeOf(value) !== Object.prototype) return value;

  const sanitized: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (child === undefined) continue;
    sanitized[key] = SENSITIVE_KEY.test(key) ? REDACTED : sanitizeForLog(child);
  }
  return sanitized;
};

/** Drop account identifiers and redact secrets before a log is stored or returned. */
export const sanitizeLogRecord = (
  record: Record<string, unknown>
): Record<string, unknown> => {
  const copy: Record<string, unknown> = { ...record };
  delete copy.userId;
  delete copy.userEmail;
  const sanitized = sanitizeForLog(copy) as Record<string, unknown>;
  if (sanitized.collection === 'Users') {
    delete sanitized.documentId;
  }
  return sanitized;
};
