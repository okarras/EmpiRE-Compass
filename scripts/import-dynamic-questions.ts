/**
 * Script to import dynamic questions from JSON file into Firebase
 *
 * Prerequisites:
 *   - Install tsx: npm install -g tsx (or use npx)
 *   - Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable
 *
 * Usage:
 *   npx tsx scripts/import-dynamic-questions.ts <path-to-json-file>
 *
 * Example:
 *   npx tsx scripts/import-dynamic-questions.ts dynamic-questions-2025-12-03.json
 *
 * Alternative (if tsx is not available):
 *   - Compile to JS: npx tsc scripts/import-dynamic-questions.ts
 *   - Run: node scripts/import-dynamic-questions.js
 */

import * as fs from 'fs';
import * as path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

interface DynamicQuestion {
  id: string;
  name: string;
  timestamp: number;
  state: {
    question: string;
    sparqlQuery: string;
    sparqlTranslation?: string;
    queryResults?: any[];
    chartHtml?: string;
    questionInterpretation?: string;
    dataCollectionInterpretation?: string;
    dataAnalysisInterpretation?: string;
    processingFunctionCode?: string;
    history?: any[];
    templateId?: string;
    templateMapping?: Record<string, any>;
    targetClassId?: string;
  };
}

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase(): void {
  if (getApps().length > 0) {
    console.log('Firebase Admin already initialized');
    return;
  }

  // Try to get service account from environment variable
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required.\n' +
        'Set it to the JSON string of your Firebase service account key.'
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    throw new Error(
      `Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Import questions from JSON file
 */
async function importQuestions(jsonFilePath: string): Promise<void> {
  console.log(`\n📂 Reading file: ${jsonFilePath}`);

  // Read and parse JSON file
  const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
  const questions: DynamicQuestion[] = JSON.parse(fileContent);

  if (!Array.isArray(questions)) {
    throw new Error('JSON file must contain an array of questions');
  }

  console.log(`📊 Found ${questions.length} questions to import\n`);

  // Initialize Firebase
  initializeFirebase();
  const db = getFirestore();

  let success = 0;
  let failed = 0;

  // Import each question
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const questionId =
      question.id || `question_${question.timestamp || Date.now()}`;

    try {
      // Validate question structure
      if (!question.state || !question.state.question) {
        throw new Error('Question missing required state.question field');
      }

      // Save to Firestore
      await db
        .collection('DynamicQuestions')
        .doc(questionId)
        .set(
          {
            name: question.name || 'Untitled Question',
            timestamp: question.timestamp || Date.now(),
            state: question.state,
          },
          { merge: true }
        );

      success++;
      console.log(
        `✅ [${i + 1}/${questions.length}] Imported: ${question.name || questionId}`
      );
    } catch (error) {
      failed++;
      console.error(
        `❌ [${i + 1}/${questions.length}] Failed to import ${questionId}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log(`\n📈 Import Summary:`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📦 Total: ${questions.length}\n`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: Please provide the path to the JSON file');
    console.error('\nUsage:');
    console.error(
      '  npx tsx scripts/import-dynamic-questions.ts <path-to-json-file>'
    );
    console.error('\nExample:');
    console.error(
      '  npx tsx scripts/import-dynamic-questions.ts dynamic-questions-2025-12-03.json'
    );
    process.exit(1);
  }

  const jsonFilePath = path.resolve(args[0]);

  if (!fs.existsSync(jsonFilePath)) {
    console.error(`❌ Error: File not found: ${jsonFilePath}`);
    process.exit(1);
  }

  try {
    await importQuestions(jsonFilePath);
    console.log('✅ Import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(
      '❌ Import failed:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { importQuestions, initializeFirebase };
