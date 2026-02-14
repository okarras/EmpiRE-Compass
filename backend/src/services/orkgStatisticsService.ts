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

export type StatisticsProgressStatus =
  | 'idle'
  | 'running'
  | 'completed'
  | 'failed';

export interface StatisticsProgress {
  templateKey: TemplateKey;
  status: StatisticsProgressStatus;
  totalPapers: number;
  processedCount: number;
  currentPaper?: string;
  error?: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  globalStats?: GlobalStatistics;
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

const PROGRESS_DOC_SUFFIX = '-progress';
const STATISTICS_PAPERS_COLLECTION = 'StatisticsPapers';

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
    }

    // Prepare statistics data - use snake_case for frontend compatibility
    const statsData = {
      total_statements: statistics.totalStatements,
      total_resources: statistics.totalResources,
      total_literals: statistics.totalLiterals,
      total_predicates: statistics.totalPredicates,
      global_distinct_resources: statistics.globalDistinctResources,
      global_distinct_literals: statistics.globalDistinctLiterals,
      global_distinct_predicates: statistics.globalDistinctPredicates,
      paperCount: statistics.paperCount,
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
    await sleep(500);

    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Firebase paths for progress and cached papers within the template
 */
function getTemplateProgressPaths(templateKey: TemplateKey) {
  const config = TEMPLATE_CONFIGS[templateKey];
  const templateId = config.firebaseTemplateId;
  const statisticId = config.firebaseStatisticId;
  const progressDocId = `${statisticId}${PROGRESS_DOC_SUFFIX}`;
  return {
    templateId,
    statisticId,
    progressRef: db
      .collection('Templates')
      .doc(templateId)
      .collection('Statistics')
      .doc(progressDocId),
    papersRef: db
      .collection('Templates')
      .doc(templateId)
      .collection(STATISTICS_PAPERS_COLLECTION),
  };
}

/**
 * Save or update statistics progress in Firebase (for resume & progress bar)
 * Stored under Templates/{templateId}/Statistics/{statisticId}-progress
 */
export async function saveProgressToFirebase(
  templateKey: TemplateKey,
  progress: Partial<StatisticsProgress>
): Promise<void> {
  const { progressRef } = getTemplateProgressPaths(templateKey);
  await progressRef.set(
    {
      ...progress,
      templateKey,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Save a single paper result to Firebase (for resume - allows skipping on restart)
 * Stored under Templates/{templateId}/StatisticsPapers/{paperId}
 */
export async function savePaperResultToFirebase(
  templateKey: TemplateKey,
  paperId: string,
  result: PaperAnalysisResult
): Promise<void> {
  const { papersRef } = getTemplateProgressPaths(templateKey);
  const docRef = papersRef.doc(paperId);
  await docRef.set(
    {
      paperId,
      totalStatements: result.totalStatements,
      resourceCount: result.resourceCount,
      literalCount: result.literalCount,
      predicateCount: result.predicateCount,
      resourceIds: result.resourceIds,
      literalIds: result.literalIds,
      predicateIds: result.predicateIds,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Load saved progress from Firebase (for resume)
 * Reads from Templates/{templateId}/StatisticsPapers/
 */
export async function loadProgressFromFirebase(
  templateKey: TemplateKey
): Promise<{
  processedPaperIds: Set<string>;
  cachedResults: PaperAnalysisResult[];
}> {
  const { papersRef } = getTemplateProgressPaths(templateKey);
  const snapshot = await papersRef.get();

  const processedPaperIds = new Set<string>();
  const cachedResults: PaperAnalysisResult[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    processedPaperIds.add(data.paperId);
    cachedResults.push({
      paperId: data.paperId,
      paperTitle: data.paperId,
      totalStatements: data.totalStatements || 0,
      resourceCount: data.resourceCount || 0,
      literalCount: data.literalCount || 0,
      predicateCount: data.predicateCount || 0,
      resourceIds: data.resourceIds || [],
      literalIds: data.literalIds || [],
      predicateIds: data.predicateIds || [],
    });
  });

  return { processedPaperIds, cachedResults };
}

/**
 * Clear progress from Firebase (for full refresh)
 * Removes Templates/{templateId}/Statistics/{statisticId}-progress and StatisticsPapers
 */
export async function clearProgressFromFirebase(
  templateKey: TemplateKey
): Promise<void> {
  const { progressRef, papersRef } = getTemplateProgressPaths(templateKey);
  const snapshot = await papersRef.get();

  const batch = db.batch();
  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  await progressRef.delete();
}

/**
 * Get current statistics progress from Firebase
 * Reads from Templates/{templateId}/Statistics/{statisticId}-progress
 */
export async function getStatisticsProgress(
  templateKey: TemplateKey
): Promise<StatisticsProgress | null> {
  const { progressRef } = getTemplateProgressPaths(templateKey);
  const doc = await progressRef.get();
  if (!doc.exists) return null;
  return doc.data() as StatisticsProgress;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Processing Function
// ──────────────────────────────────────────────────────────────────────────────

export interface ProcessPapersOptions {
  limit?: number;
  resume?: boolean;
  onProgress?: (progress: StatisticsProgress) => void;
}

/**
 * Process papers and calculate statistics for a template
 * Supports resume from Firebase and progress callback for UI
 */
export async function processPapers(
  templateKey: TemplateKey,
  options: ProcessPapersOptions | number = {}
): Promise<{
  results: PaperAnalysisResult[];
  globalStats: GlobalStatistics;
}> {
  const opts: ProcessPapersOptions =
    typeof options === 'number' ? { limit: options } : options;
  const { limit, resume = true, onProgress } = opts;

  const config = TEMPLATE_CONFIGS[templateKey];

  const paperIds = await fetchPaperList(config.sparqlQuery);
  let papersToProcess = limit ? paperIds.slice(0, limit) : paperIds;

  const results: PaperAnalysisResult[] = [];
  const allResIds = new Set<string>();
  const allLitIds = new Set<string>();
  const allPredIds = new Set<string>();

  const currentPaperIdSet = new Set(papersToProcess);

  // Resume: load cached results, only process papers not yet done
  if (resume) {
    const { processedPaperIds, cachedResults } =
      await loadProgressFromFirebase(templateKey);
    const { papersRef } = getTemplateProgressPaths(templateKey);

    for (const r of cachedResults) {
      if (currentPaperIdSet.has(r.paperId)) {
        results.push(r);
        r.resourceIds.forEach((id) => allResIds.add(id));
        r.literalIds.forEach((id) => allLitIds.add(id));
        r.predicateIds.forEach((id) => allPredIds.add(id));
      } else {
        await papersRef.doc(r.paperId).delete();
      }
    }

    papersToProcess = papersToProcess.filter(
      (id) => !processedPaperIds.has(id)
    );
  } else {
    await clearProgressFromFirebase(templateKey);
  }

  const totalToProcess = papersToProcess.length;
  const initialCount = results.length;
  const totalPapers = initialCount + totalToProcess;

  await saveProgressToFirebase(templateKey, {
    status: 'running',
    totalPapers,
    processedCount: initialCount,
    startedAt: new Date().toISOString(),
  });

  for (let i = 0; i < papersToProcess.length; i++) {
    const paperId = papersToProcess[i];
    const processedCount = initialCount + i + 1;

    try {
      const statements = await fetchStatementsBundle(paperId);
      const analysis = analyzePaper(statements);

      analysis.resourceIds.forEach((id) => allResIds.add(id));
      analysis.literalIds.forEach((id) => allLitIds.add(id));
      analysis.predicateIds.forEach((id) => allPredIds.add(id));

      const result: PaperAnalysisResult = {
        paperId,
        paperTitle: paperId,
        totalStatements: analysis.total,
        resourceCount: analysis.resourceCount,
        literalCount: analysis.literalCount,
        predicateCount: analysis.predicateCount,
        resourceIds: analysis.resourceIds,
        literalIds: analysis.literalIds,
        predicateIds: analysis.predicateIds,
      };
      results.push(result);

      await savePaperResultToFirebase(templateKey, paperId, result);
      await saveProgressToFirebase(templateKey, {
        status: 'running',
        totalPapers,
        processedCount,
        currentPaper: paperId,
      });

      if (onProgress) {
        onProgress({
          templateKey,
          status: 'running',
          totalPapers,
          processedCount,
          currentPaper: paperId,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch {
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
      await savePaperResultToFirebase(templateKey, paperId, {
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
      await saveProgressToFirebase(templateKey, {
        status: 'running',
        totalPapers,
        processedCount: initialCount + i + 1,
        currentPaper: paperId,
      });
    }
  }

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

  await saveProgressToFirebase(templateKey, {
    status: 'completed',
    totalPapers: results.length,
    processedCount: results.length,
    completedAt: new Date().toISOString(),
    globalStats,
  });

  if (onProgress) {
    onProgress({
      templateKey,
      status: 'completed',
      totalPapers: results.length,
      processedCount: results.length,
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      globalStats,
    });
  }

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
    resume?: boolean;
    onProgress?: (progress: StatisticsProgress) => void;
  } = {}
): Promise<{
  success: boolean;
  results: PaperAnalysisResult[];
  globalStats: GlobalStatistics;
  firebaseUpdated?: boolean;
  error?: string;
}> {
  const { limit, updateFirebase = true, resume = true, onProgress } = options;

  try {
    const { results, globalStats } = await processPapers(templateKey, {
      limit,
      resume,
      onProgress,
    });

    // Update Firebase if requested
    let firebaseUpdated = false;
    if (updateFirebase) {
      const config = TEMPLATE_CONFIGS[templateKey];
      firebaseUpdated = await updateFirebaseStatistics(
        globalStats,
        config.firebaseTemplateId,
        config.firebaseStatisticId
      );
    }

    return {
      success: true,
      results,
      globalStats,
      firebaseUpdated,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
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
  resume?: boolean;
}) {
  return updateStatistics('empire', options);
}

export async function updateNlp4reStatistics(options?: {
  limit?: number;
  updateFirebase?: boolean;
  resume?: boolean;
}) {
  return updateStatistics('nlp4re', options);
}
