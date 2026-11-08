#!/usr/bin/env node
/**
 * Turn a raw Firestore export into a public fallback snapshot.
 *
 * Raw exports contain Users, FirebaseRequestLogs, AIRateLimits, etc. and must
 * never be committed or served. This script keeps only the collections the
 * frontend's BackupService reads (all of which are public on the live site),
 * writes them to public/backups/, and regenerates public/backups/index.json.
 *
 * Usage: node scripts/sanitize-backup.mjs <raw-export.json> [...more]
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/backups');
const MANIFEST = 'index.json';

// Allowlist: anything not listed here is dropped.
const PUBLIC_COLLECTIONS = [
  'Templates',
  'HomeContent',
  'Team',
  'DynamicQuestions',
];

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error(
    'Usage: node scripts/sanitize-backup.mjs <raw-export.json> [...more]'
  );
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

for (const input of inputs) {
  const raw = JSON.parse(readFileSync(input, 'utf-8'));
  const data = raw.data || raw;
  const sanitized = {};
  for (const name of PUBLIC_COLLECTIONS) {
    if (data[name] !== undefined) sanitized[name] = data[name];
  }
  const dropped = Object.keys(data).filter(
    (k) => !PUBLIC_COLLECTIONS.includes(k)
  );

  const outPath = resolve(OUT_DIR, basename(input));
  writeFileSync(outPath, JSON.stringify(sanitized));
  console.log(
    `${basename(input)}: kept [${Object.keys(sanitized).join(', ')}], dropped [${dropped.join(', ')}]`
  );
}

const files = readdirSync(OUT_DIR)
  .filter((f) => f.endsWith('.json') && f !== MANIFEST)
  .sort();
writeFileSync(
  resolve(OUT_DIR, MANIFEST),
  JSON.stringify(files, null, 2) + '\n'
);
console.log(`Wrote ${MANIFEST} with ${files.length} snapshot(s)`);
