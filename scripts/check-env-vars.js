#!/usr/bin/env node
/**
 * Fails the build if forbidden VITE_* API keys are set in production/CI.
 * These would be baked into the frontend bundle and exposed to users.
 *
 * Only runs in CI or Vercel – local dev can use these for testing.
 */

const FORBIDDEN_IN_PROD = [
  'VITE_OPEN_AI_API_KEY',
  'VITE_GROQ_API_KEY',
  'VITE_MISTRAL_API_KEY',
  'VITE_GOOGLE_GENERATIVE_AI_API_KEY',
  'VITE_OPEN_ROUTER_API_KEY',
];

const isCI = process.env.CI === 'true';
const isVercel = process.env.VERCEL === '1';

if (!isCI && !isVercel) {
  // Local dev – skip check
  process.exit(0);
}

const found = FORBIDDEN_IN_PROD.filter((key) => {
  const value = process.env[key];
  return value && value.length > 0 && !value.startsWith('your-');
});

if (found.length > 0) {
  console.error(
    '\n❌ SECURITY: Forbidden env vars would be exposed in the frontend bundle:\n'
  );
  found.forEach((key) => console.error(`   - ${key}`));
  console.error('\n   Do NOT add these to the frontend project in Vercel.');
  console.error(
    '   Add API keys only to the backend project. See docs/VERCEL_SECURITY.md\n'
  );
  process.exit(1);
}

process.exit(0);
