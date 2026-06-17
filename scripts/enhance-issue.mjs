#!/usr/bin/env node
/**
 * Expand a rough issue note into a structured GitHub issue body using AI.
 *
 * Usage:
 *   npm run issue:enhance -- --type bug --text "editor crashes on paste"
 *   npm run issue:enhance -- --type feature --text "export charts as PNG"
 *   echo "docs for firebase setup are outdated" | npm run issue:enhance -- --type docs
 *   npm run issue:enhance -- --type bug --text "..." --create
 *
 * Requires an API key in backend/.env (see backend/.env.example).
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { createMistral } from '@ai-sdk/mistral';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const VALID_TYPES = ['bug', 'feature', 'docs', 'refactor'];
const TYPE_TO_LABEL = {
  bug: 'bug',
  feature: 'enhancement',
  docs: 'documentation',
  refactor: 'refactor',
};
const TYPE_TO_TITLE_PREFIX = {
  bug: '[Bug]',
  feature: '[Feature]',
  docs: '[Docs]',
  refactor: '[Refactor]',
};

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const args = {
    type: '',
    text: '',
    create: false,
    title: '',
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg === '--type' || arg === '-t') args.type = argv[++i] ?? '';
    else if (arg === '--text' || arg === '-x') args.text = argv[++i] ?? '';
    else if (arg === '--title') args.title = argv[++i] ?? '';
    else if (arg === '--create') args.create = true;
    else if (!arg.startsWith('-') && !args.text) args.text = arg;
  }

  return args;
}

function printHelp() {
  console.log(`Usage: npm run issue:enhance -- [options]

Options:
  --type, -t <bug|feature|docs|refactor>   Issue template type (required)
  --text, -x <string>                      Rough description (or pipe via stdin)
  --title <string>                         Override generated title
  --create                                 Create issue via gh CLI (requires gh auth)
  --help, -h                               Show this help

Examples:
  npm run issue:enhance -- --type bug --text "SPARQL editor crashes on paste"
  npm run issue:enhance -- --type feature --text "export chart as PNG" --create
`);
}

function resolveProvider() {
  const explicit = (process.env.AI_PROVIDER || 'openrouter').toLowerCase();
  const openAiKey = process.env.OPENAI_API_KEY || '';

  // OpenRouter keys are often stored in OPENAI_API_KEY for backward compatibility
  if (openAiKey.startsWith('sk-or-') && explicit === 'openai') {
    return 'openrouter';
  }

  return explicit;
}

function getModel() {
  const provider = resolveProvider();

  if (provider === 'openrouter') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.startsWith('your-')) {
      throw new Error(
        'Set OPENAI_API_KEY in backend/.env (OpenRouter key when AI_PROVIDER=openrouter)'
      );
    }
    const openrouter = createOpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        ...(process.env.OPENROUTER_HTTP_REFERER
          ? { 'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER }
          : {}),
        ...(process.env.OPENROUTER_APP_TITLE
          ? { 'X-Title': process.env.OPENROUTER_APP_TITLE }
          : {}),
      },
    });
    const modelId =
      process.env.OPENROUTER_MODEL ||
      process.env.OPENAI_MODEL ||
      'openai/gpt-4o-mini';
    return openrouter.languageModel(modelId);
  }

  if (provider === 'groq') {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('Set GROQ_API_KEY in backend/.env');
    return createGroq({ apiKey }).languageModel(
      process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
    );
  }

  if (provider === 'mistral') {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) throw new Error('Set MISTRAL_API_KEY in backend/.env');
    return createMistral({ apiKey }).languageModel(
      process.env.MISTRAL_MODEL || 'mistral-large-latest'
    );
  }

  if (provider === 'google') {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error('Set GOOGLE_GENERATIVE_AI_API_KEY in backend/.env');
    return createGoogleGenerativeAI({ apiKey }).languageModel(
      process.env.GOOGLE_MODEL || 'gemini-2.5-flash'
    );
  }

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Set OPENAI_API_KEY in backend/.env');
    return createOpenAI({ apiKey }).languageModel(
      process.env.OPENAI_MODEL || 'gpt-4o-mini'
    );
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

function extractTitle(body, type, roughText) {
  const summaryMatch = body.match(/^## Summary\s*\n+(.+?)(?:\n\n|\n##)/ms);
  if (summaryMatch?.[1]) {
    const line = summaryMatch[1]
      .split('\n')[0]
      .replace(/^[-*]\s*/, '')
      .replace(/<!--.*?-->/g, '')
      .trim();
    if (line && line !== 'TBD') {
      return `${TYPE_TO_TITLE_PREFIX[type]}: ${line.slice(0, 80)}`;
    }
  }
  const fallback = roughText.split(/[.!?\n]/)[0].trim().slice(0, 80);
  return `${TYPE_TO_TITLE_PREFIX[type]}: ${fallback || 'Untitled'}`;
}

async function main() {
  loadEnvFile(join(ROOT, 'backend', '.env'));
  loadEnvFile(join(ROOT, '.env'));

  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!VALID_TYPES.includes(args.type)) {
    console.error(`Error: --type must be one of: ${VALID_TYPES.join(', ')}\n`);
    printHelp();
    process.exit(1);
  }

  let roughText = args.text.trim();
  if (!roughText) {
    roughText = await readStdin();
  }
  if (!roughText) {
    console.error('Error: provide --text or pipe a description via stdin\n');
    printHelp();
    process.exit(1);
  }

  const templatePath = join(
    ROOT,
    'scripts',
    'issue-templates',
    `${args.type === 'feature' ? 'feature' : args.type}.md`
  );
  const template = readFileSync(templatePath, 'utf8');

  const systemContext = `You help write GitHub issues for the EmpiRE-Compass open-source project (React + Node.js neuro-symbolic ORKG dashboard).
Output ONLY valid GitHub-flavored Markdown matching the template sections exactly.
Rules:
- Stay concise (~125 words unless the user gave extensive detail)
- Do NOT invent versions, stack traces, or reproduction steps — use "TBD" or "Not provided"
- Use numbered lists for steps to reproduce
- Use "- [ ]" checklist items for acceptance criteria
- Keep a technical, neutral tone
- Do not wrap output in code fences`;

  const prompt = `Expand this rough issue note into a complete GitHub issue body.

Issue type: ${args.type}

Template (fill every section; keep headings):
${template}

User's rough note:
"""
${roughText}
"""

Return ONLY the filled markdown body (start with ## Summary).`;

  const model = getModel();
  const result = await generateText({
    model,
    system: systemContext,
    prompt,
    temperature: 0.3,
  });

  const body = result.text.trim();
  const title = args.title || extractTitle(body, args.type, roughText);
  const label = TYPE_TO_LABEL[args.type];

  console.log('\n--- Suggested title ---');
  console.log(title);
  console.log('\n--- Issue body ---\n');
  console.log(body);
  console.log('\n--- Labels ---');
  console.log(`${label}, triage`);

  if (args.create) {
    const gh = spawnSync(
      'gh',
      [
        'issue',
        'create',
        '--title',
        title,
        '--body',
        body,
        '--label',
        label,
        '--label',
        'triage',
      ],
      { stdio: 'inherit' }
    );
    process.exit(gh.status ?? 1);
  }
}

main().catch((err) => {
  console.error(`\nError: ${err.message}\n`);
  process.exit(1);
});
