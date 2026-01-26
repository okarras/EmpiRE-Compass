import { processPapers } from '../services/orkgStatisticsService'; // Adjust path if needed
import * as fs from 'fs';
import * as path from 'path';

// Parse args manually for simplicity
const args = process.argv.slice(2);
const templateArg = args.find((arg) => arg.startsWith('--template='));
const limitArg = args.find((arg) => arg.startsWith('--limit='));

const template = templateArg
  ? (templateArg.split('=')[1] as 'empire' | 'nlp4re')
  : 'empire';
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 5;

console.log(`Running TS validation for template: ${template}, limit: ${limit}`);

async function run() {
  try {
    const { results, globalStats } = await processPapers(template, limit);

    const outputData = {
      results,
      globalStats,
      metadata: {
        timestamp: new Date().toISOString(),
        count: results.length,
      },
    };

    const outputFile = 'ts_output.json';
    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));

    console.log(`Validation output written to ${outputFile}`);
  } catch (error) {
    console.error('Error during validation:', error);
    process.exit(1);
  }
}

run();
