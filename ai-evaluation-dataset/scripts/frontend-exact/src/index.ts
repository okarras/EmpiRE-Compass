#!/usr/bin/env node

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { FrontendExactEvaluationRunner } from './evaluation-runner';

interface CLIOptions {
  dataset: string;
  output: string;
  limit?: number;
  offset?: number;
  backend?: string;
  model?: string;
  modelTag?: string;
  withContext?: boolean;
  skipExisting?: boolean;
  onlyQuestions?: string[];
  test?: boolean;
  help?: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    dataset: process.env.DEFAULT_DATASET_PATH || '../../dataset',
    output: process.env.DEFAULT_OUTPUT_FILE || 'frontend-exact-results.json',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dataset':
        options.dataset = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
      case '--offset':
        options.offset = parseInt(args[++i]);
        break;
      case '--backend':
        options.backend = args[++i];
        break;
      case '--model':
        options.model = args[++i];
        break;
      case '--model-tag':
        options.modelTag = args[++i];
        break;
      case '--with-context':
        options.withContext = true;
        break;
      case '--skip-existing':
        options.skipExisting = true;
        break;
      case '--only-questions':
        options.onlyQuestions = args[++i].split(',').map((s) => s.trim());
        break;
      case '--test':
        options.test = true;
        break;
      case '--help':
        options.help = true;
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        process.exit(1);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Frontend-Exact Evaluation Runner

Usage: node dist/index.js [options]

Options:
  --dataset <path>    Path to dataset directory (default: ../../dataset)
  --output <path>     Output file path (default: auto-generated with model tag)
  --limit <number>    Limit number of papers to evaluate
  --offset <number>   Skip first N papers (for slab-based evaluation)
  --model <name>      Override AI model (e.g., gpt-4o-mini, gpt-3.5-turbo)
  --model-tag <tag>   Tag for output file naming and result tracking
  --with-context      Include sibling ground truth as context (simulates real app)
  --backend <url>     Backend service URL (default: http://localhost:5001)
  --test              Test backend connectivity only
  --help              Show this help message

Examples:
  # Test backend connectivity
  node dist/index.js --test

  # Evaluate first 75 papers (10% slab) with gpt-3.5-turbo
  node dist/index.js --limit 75 --model gpt-3.5-turbo --model-tag gpt35

  # Same slab with gpt-4o-mini for comparison
  node dist/index.js --limit 75 --model gpt-4o-mini --model-tag gpt4omini

  # Next slab (papers 75-150)
  node dist/index.js --offset 75 --limit 75 --model gpt-3.5-turbo --model-tag gpt35


Requirements:
  - Backend service running (default: http://localhost:5001)
  - Dataset with PDF files and metadata
  - Node.js 18+ (for built-in fetch support)
`);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  try {
    if (options.model) {
      if (
        options.model.startsWith('gpt-') ||
        options.model.startsWith('o1') ||
        options.model.startsWith('o3')
      ) {
        process.env.AI_PROVIDER = 'openai';
        process.env.OPENAI_MODEL = options.model;
      } else if (options.model.startsWith('mistral')) {
        process.env.AI_PROVIDER = 'mistral';
        process.env.MISTRAL_MODEL = options.model;
      } else if (
        options.model.startsWith('deepseek') ||
        options.model.startsWith('llama') ||
        options.model.startsWith('gemma')
      ) {
        process.env.AI_PROVIDER = 'groq';
        process.env.GROQ_MODEL = options.model;
      } else {
        process.env.AI_PROVIDER = 'openai';
        process.env.OPENAI_MODEL = options.model;
      }
    }

    if (!process.argv.includes('--output')) {
      const tag = options.modelTag || options.model || 'default';
      const offsetStr = options.offset ? `${options.offset}` : '0';
      const limitStr = options.limit ? `${options.limit}` : 'all';
      options.output = `results-${tag}-${offsetStr}-${limitStr}.json`;
    }

    const useBERTScore = process.env.USE_BERTSCORE === 'true';

    const runner = new FrontendExactEvaluationRunner(options.backend, {
      useBERTScore,
    });

    if (options.test) {
      console.log('Testing backend connectivity...');
      const testResult = await runner.testBackend();

      if (testResult.connected) {
        console.log('Backend is connected and ready');
      } else {
        console.error('Backend connection failed:', testResult.error);
        process.exit(1);
      }

      if (useBERTScore) {
        console.log('\nTesting BERTScore availability...');
        const bertScoreTest = await runner.testBERTScore();

        if (bertScoreTest.available) {
          console.log('BERTScore is available and working');
        } else {
          console.error('BERTScore test failed:', bertScoreTest.error);
          console.error('Evaluation will fall back to token-based F1 scores');
        }
      }

      process.exit(0);
    }

    console.log('Starting frontend-exact evaluation...');
    console.log(`Dataset: ${options.dataset}`);
    console.log(`Output: ${options.output}`);
    console.log(`Backend: ${options.backend || 'http://localhost:5001'}`);
    console.log(`Model: ${options.model || 'from .env'}`);
    console.log(
      `BERTScore: ${useBERTScore ? 'enabled' : 'disabled (use USE_BERTSCORE=true to enable)'}`
    );

    if (options.offset) {
      console.log(`Offset: ${options.offset} papers`);
    }
    if (options.limit) {
      console.log(`Limit: ${options.limit} papers`);
    }
    if (options.modelTag) {
      console.log(`Model Tag: ${options.modelTag}`);
    }
    console.log(
      `Sibling Context: ${options.withContext ? 'enabled' : 'disabled'}`
    );

    if (useBERTScore) {
      console.log('\nVerifying BERTScore availability...');
      const bertScoreTest = await runner.testBERTScore();

      if (bertScoreTest.available) {
        console.log('✓ BERTScore is ready');
      } else {
        console.warn('⚠ BERTScore test failed:', bertScoreTest.error);
        console.warn(
          '  Evaluation will continue with token-based F1 scores as fallback'
        );
      }
    }

    const summary = await runner.runEvaluation(
      options.dataset,
      options.output,
      {
        limit: options.limit,
        offset: options.offset,
        modelTag: options.modelTag || options.model,
        withContext: options.withContext,
        backendUrl: options.backend,
        skipExisting: options.skipExisting,
        onlyQuestions: options.onlyQuestions,
      }
    );

    console.log('\nEvaluation completed successfully!');
    console.log(`Final Results:`);
    console.log(
      `Papers: ${summary.successfulPapers}/${summary.totalPapers} successful`
    );
    console.log(
      `Questions: ${summary.successfulQuestions}/${summary.totalQuestions} successful`
    );

    process.exit(0);
  } catch (error) {
    console.error(
      '\n✗ Evaluation failed:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}

export { main };
