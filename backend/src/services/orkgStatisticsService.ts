/**
 * ORKG Statistics Service
 *
 * Ports the Python logic from orkg-statistics.py to TypeScript.
 * Fetches papers from ORKG, calculates RPL metrics, and updates Firebase.
 */

import fetch from 'node-fetch';
import { db } from '../config/firebase.js';

// ──────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ──────────────────────────────────────────────────────────────────────────────

export type TemplateKey = 'empire' | 'nlp4re';

export interface TemplateConfig {
  name: string;
  firebaseTemplateId: string;
  firebaseStatisticId: string;
  sparqlQuery: string;
}

export interface SPARQLBinding {
  paper: {
    value: string;
    type: string;
  };
  doi?: {
    value: string;
    type: string;
  };
}

export interface SPARQLResponse {
  results: {
    bindings: SPARQLBinding[];
  };
}

export interface ORKGStatementSubject {
  id: string;
  _class: 'resource' | 'literal';
  label?: string;
}

export interface ORKGStatementObject {
  id: string;
  _class: 'resource' | 'literal';
  label?: string;
}

export interface ORKGStatementPredicate {
  id: string;
  label?: string;
}

export interface ORKGStatement {
  subject: ORKGStatementSubject;
  object: ORKGStatementObject;
  predicate: ORKGStatementPredicate;
}

export interface ORKGStatementsBundle {
  statements: ORKGStatement[];
}

export interface PaperAnalysisResult {
  paperId: string;
  paperTitle: string;
  totalStatements: number;
  resourceCount: number;
  literalCount: number;
  predicateCount: number;
  resourceIds: string[];
  literalIds: string[];
  predicateIds: string[];
}

export interface GlobalStatistics {
  totalStatements: number;
  totalResources: number;
  totalLiterals: number;
  totalPredicates: number;
  globalDistinctResources: number;
  globalDistinctLiterals: number;
  globalDistinctPredicates: number;
  paperCount: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Template Configurations
// ──────────────────────────────────────────────────────────────────────────────

const TEMPLATE_CONFIGS: Record<TemplateKey, TemplateConfig> = {
  empire: {
    name: 'KG-EmpiRE',
    firebaseTemplateId: 'R186491',
    firebaseStatisticId: 'empire-statistics',
    sparqlQuery: `
      PREFIX r: <http://orkg.org/orkg/resource/>
      PREFIX c: <http://orkg.org/orkg/class/>
      PREFIX p: <http://orkg.org/orkg/predicate/>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

      SELECT ?paper, ?doi
      WHERE {
          ?paper p:P31 ?contri.
          OPTIONAL{?paper p:P26 ?doi.} 
          ?contri a c:C27001.
          ?contri p:P135046 ?venue.
          ?venue rdfs:label ?venue_name.
        FILTER ((?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string || ?venue_name = "International Working Conference on Requirements Engineering: Foundation for Software Quality"^^xsd:string))
      }
    `,
  },
  nlp4re: {
    name: 'NLP4RE',
    firebaseTemplateId: 'R1544125',
    firebaseStatisticId: 'nlp4re-statistics',
    sparqlQuery: `
      PREFIX r: <http://orkg.org/orkg/resource/>
      PREFIX c: <http://orkg.org/orkg/class/>
      PREFIX p: <http://orkg.org/orkg/predicate/>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

      SELECT ?paper, ?doi
      WHERE {
          ?paper p:P31 ?contri.
          OPTIONAL{?paper p:P26 ?doi.} 
          ?contri a c:C121001.
      }
    `,
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const SPARQL_ENDPOINT = 'https://www.orkg.org/triplestore';
const ORKG_API_BASE = 'https://www.orkg.org/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// ──────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        const waitTime = delay * Math.pow(2, attempt);
        console.log(
          `Attempt ${attempt + 1} failed, retrying in ${waitTime}ms...`
        );
        await sleep(waitTime);
      }
    }
  }

  throw lastError || new Error('Unknown error in retry');
}

// ──────────────────────────────────────────────────────────────────────────────
// ORKG API Functions
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Fetch paper list from ORKG using SPARQL query
 */
export async function fetchPaperList(sparqlQuery: string): Promise<string[]> {
  const url = new URL(SPARQL_ENDPOINT);
  url.searchParams.set('query', sparqlQuery);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/sparql-results+json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `SPARQL query failed: ${response.status} ${response.statusText}. ${errorText}`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();

  if (!contentType.includes('json') && responseText.trim()) {
    throw new Error(`Expected JSON but got content-type: ${contentType}`);
  }

  if (!responseText.trim()) {
    throw new Error('Received empty response from SPARQL endpoint');
  }

  const data = JSON.parse(responseText) as SPARQLResponse;
  const bindings = data.results?.bindings || [];

  // Extract resource IDs from paper IRIs
  const resourceIds = bindings
    .map((binding) => {
      const paperIri = binding.paper?.value;
      if (!paperIri) return null;
      // Extract resource ID from IRI (e.g., "http://orkg.org/orkg/resource/R12345" -> "R12345")
      const match = paperIri.match(/\/resource\/([^/]+)$/);
      return match ? match[1] : paperIri.split('/').pop() || null;
    })
    .filter((id): id is string => id !== null);

  return resourceIds;
}

/**
 * Fetch statements bundle for a resource from ORKG API
 * This replicates the Python orkg.statements.bundle(thing_id=paper_id) call
 *
 * Endpoint format confirmed from frontend code (src/helpers/statistics_calculator.ts):
 * /api/statements/bundle/{resourceId}
 */
export async function fetchStatementsBundle(
  resourceId: string
): Promise<ORKGStatement[]> {
  // ORKG API endpoint for statements bundle
  // Format: https://www.orkg.org/api/statements/{resource_id}/bundle
  const url = `${ORKG_API_BASE}/statements/${resourceId}/bundle`;

  const fetchWithRetry = async () => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Resource not found - return empty array (matching Python behavior)
        return [];
      }
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Failed to fetch statements bundle for ${resourceId}: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const data = (await response.json()) as ORKGStatementsBundle;
    return data.statements || [];
  };

  return retryWithBackoff(fetchWithRetry);
}

// ──────────────────────────────────────────────────────────────────────────────
// Statistics Calculation
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Analyze a single paper and return counts and IDs
 */
export function analyzePaper(statements: ORKGStatement[]): {
  total: number;
  resourceCount: number;
  literalCount: number;
  predicateCount: number;
  resourceIds: string[];
  literalIds: string[];
  predicateIds: string[];
} {
  const total = statements.length;
  const resourceIds: string[] = [];
  const literalIds: string[] = [];
  const predicateIds: string[] = [];

  for (const stmt of statements) {
    // Subject
    if (stmt.subject._class === 'resource') {
      resourceIds.push(stmt.subject.id);
    } else {
      literalIds.push(stmt.subject.id);
    }

    // Object
    if (stmt.object._class === 'resource') {
      resourceIds.push(stmt.object.id);
    } else {
      literalIds.push(stmt.object.id);
    }

    // Predicate
    if (stmt.predicate?.id) {
      predicateIds.push(stmt.predicate.id);
    }
  }

  return {
    total,
    resourceCount: resourceIds.length,
    literalCount: literalIds.length,
    predicateCount: predicateIds.length,
    resourceIds,
    literalIds,
    predicateIds,
  };
}

/**
 * Calculate global distinct counts across all papers
 */
export function calculateGlobalDistinctCounts(
  allStatements: Record<string, ORKGStatement[]>
): {
  globalDistinctResources: number;
  globalDistinctLiterals: number;
  globalDistinctPredicates: number;
} {
  const allResIds = new Set<string>();
  const allLitIds = new Set<string>();
  const allPredIds = new Set<string>();

  for (const statements of Object.values(allStatements)) {
    for (const stmt of statements) {
      // Subject
      if (stmt.subject._class === 'resource') {
        allResIds.add(stmt.subject.id);
      } else {
        allLitIds.add(stmt.subject.id);
      }

      // Object
      if (stmt.object._class === 'resource') {
        allResIds.add(stmt.object.id);
      } else {
        allLitIds.add(stmt.object.id);
      }

      // Predicate
      if (stmt.predicate?.id) {
        allPredIds.add(stmt.predicate.id);
      }
    }
  }

  return {
    globalDistinctResources: allResIds.size,
    globalDistinctLiterals: allLitIds.size,
    globalDistinctPredicates: allPredIds.size,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Firebase Integration
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Update statistics in Firebase Firestore
 */
export async function updateFirebaseStatistics(
  statistics: GlobalStatistics,
  templateId: string,
  statisticId: string
): Promise<boolean> {
  try {
    // Ensure the Template document exists first
    const templateRef = db.collection('Templates').doc(templateId);
    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
      await templateRef.set(
        {
          id: templateId,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log(`Created Template document: ${templateId}`);
    }

    // Prepare statistics data
    const statsData = {
      ...statistics,
      updatedAt: new Date().toISOString(),
      id: statisticId,
    };

    // Update the document using nested path structure
    const docRef = db
      .collection('Templates')
      .doc(templateId)
      .collection('Statistics')
      .doc(statisticId);

    await docRef.set(statsData, { merge: false });

    // Small delay to ensure write propagates
    await sleep(500);

    // Verify the write
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      console.error(
        `ERROR: Document was not created in Firebase! Path: Templates/${templateId}/Statistics/${statisticId}`
      );
      return false;
    }

    const verifyData = verifyDoc.data();
    console.log(`✅ Statistics verified in Firebase`);
    console.log(`   Document ID: ${verifyDoc.id}`);
    console.log(
      `   Fields written: ${Object.keys(verifyData || {}).length} fields`
    );

    // Check critical fields
    const criticalFields = [
      'total_statements',
      'paperCount',
      'global_distinct_resources',
    ];
    const missingFields = criticalFields.filter(
      (f) => !(f in (verifyData || {}))
    );
    if (missingFields.length > 0) {
      console.warn(
        `   ⚠️  WARNING: Missing fields: ${missingFields.join(', ')}`
      );
    } else {
      console.log(`   ✅ All critical fields present`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error updating statistics in Firebase:`, error);
    if (error instanceof Error) {
      console.error(`   Traceback: ${error.stack}`);
    }
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Processing Function
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Process papers and calculate statistics for a template
 */
export async function processPapers(
  templateKey: TemplateKey,
  limit?: number
): Promise<{
  results: PaperAnalysisResult[];
  globalStats: GlobalStatistics;
}> {
  const config = TEMPLATE_CONFIGS[templateKey];

  console.log(`🔍 Fetching ${config.name} papers from ORKG...`);
  const paperIds = await fetchPaperList(config.sparqlQuery);

  const papersToProcess = limit ? paperIds.slice(0, limit) : paperIds;
  console.log(`📊 Processing ${papersToProcess.length} papers...`);

  const results: PaperAnalysisResult[] = [];
  const allStatements: Record<string, ORKGStatement[]> = {};
  const allResIds = new Set<string>();
  const allLitIds = new Set<string>();
  const allPredIds = new Set<string>();

  for (let i = 0; i < papersToProcess.length; i++) {
    const paperId = papersToProcess[i];
    console.log(`[${i + 1}/${papersToProcess.length}] Processing: ${paperId}`);

    try {
      const statements = await fetchStatementsBundle(paperId);
      allStatements[paperId] = statements;

      const analysis = analyzePaper(statements);

      // Add to global sets for distinct calculation
      analysis.resourceIds.forEach((id) => allResIds.add(id));
      analysis.literalIds.forEach((id) => allLitIds.add(id));
      analysis.predicateIds.forEach((id) => allPredIds.add(id));

      results.push({
        paperId,
        paperTitle: paperId, // Could be enhanced with actual title if available
        totalStatements: analysis.total,
        resourceCount: analysis.resourceCount,
        literalCount: analysis.literalCount,
        predicateCount: analysis.predicateCount,
        resourceIds: analysis.resourceIds,
        literalIds: analysis.literalIds,
        predicateIds: analysis.predicateIds,
      });

      console.log(`  ✓ Processed: ${analysis.total} statements`);
    } catch (error) {
      console.error(`  ✗ Error processing ${paperId}:`, error);
      // Continue processing other papers
      allStatements[paperId] = [];
      results.push({
        paperId,
        paperTitle: paperId,
        totalStatements: 0,
        resourceCount: 0,
        literalCount: 0,
        predicateCount: 0,
        resourceIds: [],
        literalIds: [],
        predicateIds: [],
      });
    }
  }

  // Calculate global statistics
  const globalStats: GlobalStatistics = {
    totalStatements: results.reduce((sum, r) => sum + r.totalStatements, 0),
    totalResources: results.reduce((sum, r) => sum + r.resourceCount, 0),
    totalLiterals: results.reduce((sum, r) => sum + r.literalCount, 0),
    totalPredicates: results.reduce((sum, r) => sum + r.predicateCount, 0),
    globalDistinctResources: allResIds.size,
    globalDistinctLiterals: allLitIds.size,
    globalDistinctPredicates: allPredIds.size,
    paperCount: results.length,
  };

  return { results, globalStats };
}

/**
 * Main function to update statistics for a template
 * This is the primary function that should be called from the admin dashboard
 */
export async function updateStatistics(
  templateKey: TemplateKey,
  options: {
    limit?: number;
    updateFirebase?: boolean;
  } = {}
): Promise<{
  success: boolean;
  results: PaperAnalysisResult[];
  globalStats: GlobalStatistics;
  firebaseUpdated?: boolean;
  error?: string;
}> {
  const { limit, updateFirebase = true } = options;

  try {
    // Process papers and calculate statistics
    const { results, globalStats } = await processPapers(templateKey, limit);

    // Print summary
    console.log(`\n📈 Summary for ${TEMPLATE_CONFIGS[templateKey].name}:`);
    console.log(`  Papers processed: ${results.length}`);
    console.log(
      `  Total statements: ${globalStats.totalStatements.toLocaleString()}`
    );
    console.log(
      `  Total resources: ${globalStats.totalResources.toLocaleString()}`
    );
    console.log(
      `  Total literals: ${globalStats.totalLiterals.toLocaleString()}`
    );
    console.log(
      `  Total predicates: ${globalStats.totalPredicates.toLocaleString()}`
    );
    console.log(
      `  Global distinct resources: ${globalStats.globalDistinctResources.toLocaleString()}`
    );
    console.log(
      `  Global distinct literals: ${globalStats.globalDistinctLiterals.toLocaleString()}`
    );
    console.log(
      `  Global distinct predicates: ${globalStats.globalDistinctPredicates.toLocaleString()}`
    );

    // Calculate reuse ratios
    const resourceReuse =
      globalStats.globalDistinctResources > 0
        ? globalStats.totalResources / globalStats.globalDistinctResources
        : 0;
    const literalReuse =
      globalStats.globalDistinctLiterals > 0
        ? globalStats.totalLiterals / globalStats.globalDistinctLiterals
        : 0;
    const predicateReuse =
      globalStats.globalDistinctPredicates > 0
        ? globalStats.totalPredicates / globalStats.globalDistinctPredicates
        : 0;

    console.log(`  Resource reuse ratio: ${resourceReuse.toFixed(2)}`);
    console.log(`  Literal reuse ratio: ${literalReuse.toFixed(2)}`);
    console.log(`  Predicate reuse ratio: ${predicateReuse.toFixed(2)}`);

    // Update Firebase if requested
    let firebaseUpdated = false;
    if (updateFirebase) {
      console.log(`\n🔥 Updating Firebase...`);
      const config = TEMPLATE_CONFIGS[templateKey];
      firebaseUpdated = await updateFirebaseStatistics(
        globalStats,
        config.firebaseTemplateId,
        config.firebaseStatisticId
      );

      if (firebaseUpdated) {
        console.log(`✅ Firebase updated successfully`);
      } else {
        console.log(`❌ Firebase update failed`);
      }
    }

    return {
      success: true,
      results,
      globalStats,
      firebaseUpdated,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error updating statistics:`, errorMessage);
    return {
      success: false,
      results: [],
      globalStats: {
        totalStatements: 0,
        totalResources: 0,
        totalLiterals: 0,
        totalPredicates: 0,
        globalDistinctResources: 0,
        globalDistinctLiterals: 0,
        globalDistinctPredicates: 0,
        paperCount: 0,
      },
      error: errorMessage,
    };
  }
}

// Convenience functions for specific templates
export async function updateEmpireStatistics(options?: {
  limit?: number;
  updateFirebase?: boolean;
}) {
  return updateStatistics('empire', options);
}

export async function updateNlp4reStatistics(options?: {
  limit?: number;
  updateFirebase?: boolean;
}) {
  return updateStatistics('nlp4re', options);
}
