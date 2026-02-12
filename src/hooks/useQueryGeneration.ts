import { useState, useCallback } from 'react';
import { useAIService } from '../services/backendAIService';
import { useAppSelector } from '../store/hooks';
import {
  extractFromMarkdown,
  SPARQLBlock,
  combineSparqlBlocks,
} from '../utils/queryParser';
import fetchSPARQLData from '../helpers/fetch_query';
import promptTemplate from '../prompts/GENERATE_SPARQL.txt?raw';
import { generateDynamicSPARQLPrompt } from '../utils/promptGenerator';
import { PredicatesMapping } from '../components/Graph/types';

interface QueryEvaluation {
  needsImprovement: boolean;
  feedback: string;
}

import type { CostBreakdown } from '../utils/costCalculator';

export interface IterationDetail {
  iteration: number;
  prompt: string;
  llmResponse: string;
  generatedQuery: string;
  executionError?: string;
  resultCount: number;
  feedback: string;
  timestamp: Date;
  cost?: CostBreakdown;
}

interface UseQueryGenerationProps {
  templateMapping?: Record<string, unknown>;
  templateId?: string;
  targetClassId?: string;
  updateSparqlQuery: (query: string, prompt?: string) => void;
}

export const useQueryGeneration = ({
  templateMapping,
  templateId,
  targetClassId,
  updateSparqlQuery,
}: UseQueryGenerationProps) => {
  const aiService = useAIService();
  const { provider, openaiModel, groqModel, mistralModel, googleModel } =
    useAppSelector((state) => state.ai);

  // Determine current model based on provider
  const currentModel =
    provider === 'openai'
      ? openaiModel
      : provider === 'groq'
        ? groqModel
        : provider === 'mistral'
          ? mistralModel
          : googleModel;

  const [currentIteration, setCurrentIteration] = useState(0);
  const [iterationFeedback, setIterationFeedback] = useState('');
  const [iterationHistory, setIterationHistory] = useState<IterationDetail[]>(
    []
  );

  /**
   * Execute SPARQL queries and return raw data
   */
  const executeQueriesRaw = useCallback(
    async (blocks: SPARQLBlock[]): Promise<Record<string, unknown>[]> => {
      if (!blocks || blocks.length === 0) return [];

      if (blocks.length === 1) {
        return await fetchSPARQLData(blocks[0].query);
      }

      // Multiple queries: fetch sequentially, build datasets map
      const datasets: Record<string, Record<string, unknown>[]> = {};
      for (const b of blocks) {
        const rows = await fetchSPARQLData(b.query);
        datasets[b.id] = rows;
      }

      // Return the first dataset for now
      const firstKey = Object.keys(datasets)[0];
      return firstKey ? datasets[firstKey] : [];
    },
    []
  );

  /**
   * Evaluate query results and generate feedback
   */
  const evaluateQueryResults = useCallback(
    (
      data: Record<string, unknown>[],
      _question: string,
      queryError?: string,
      generatedQuery?: string
    ): QueryEvaluation => {
      if (queryError) {
        // Check for common mistakes
        let specificGuidance = '';
        if (generatedQuery) {
          // Pattern 1: IF() in SELECT clause (causes Virtuoso internal errors)
          const ifInSelectPattern =
            /SELECT[^{]+(IF\s*\([^)]+\)[^{]*AS\s+\?\w+)/i;
          const ifInSelectMatch = generatedQuery.match(ifInSelectPattern);

          if (
            ifInSelectMatch &&
            queryError.includes('Internal Optimized compiler error')
          ) {
            specificGuidance = `\n\n🚨 CRITICAL ERROR: IF() function in SELECT clause causes Virtuoso internal compiler errors!\n\n**The Problem:**\nYou cannot use IF() directly in the SELECT clause. Virtuoso's optimizer cannot handle it.\n\n**The Fix:**\nMove IF() inside BIND() in the WHERE clause:\n\n❌ Wrong:\nSELECT (IF(condition, value1, value2) AS ?var) WHERE { ... }\n\n✅ Correct:\nSELECT ?var WHERE {\n  ...\n  BIND(IF(condition, value1, value2) AS ?var)\n}\n\n**For proportions with aggregation, use the subquery pattern shown in the prompt examples.**`;
          }

          // Pattern 2: BIND(IF(?variable = "string", ...)) where ?variable might be a URI
          const uriComparisonPattern =
            /BIND\s*\(\s*IF\s*\(\s*\?(\w+)\s*=\s*"[^"]+"/i;
          const match = generatedQuery.match(uriComparisonPattern);

          if (match && !specificGuidance) {
            const varName = match[1];
            specificGuidance = `\n\n🚨 CRITICAL ERROR DETECTED: You are comparing ?${varName} directly to a string value. This variable likely contains a resource URI, not a string!\n\n**The Fix:**\n1. First get the label: ?${varName} rdfs:label ?${varName}_label .\n2. Then compare the label: BIND(IF(?${varName}_label = "value"^^xsd:string, 1, 0) AS ?flag)\n\n**Remember:** Properties in ORKG return resource URIs. You must use rdfs:label to get the human-readable string before comparing.`;
          }
        }

        return {
          needsImprovement: true,
          feedback: `Query execution failed with the following error from ORKG:\n\n${queryError}${specificGuidance}\n\nPlease analyze the error carefully and fix the syntax or logic issues. Pay special attention to:\n1. **IF() in SELECT** - NEVER use IF() in SELECT clause; only in BIND() within WHERE\n2. **URIs vs Labels** - Always use rdfs:label to get labels before comparing to strings\n3. **BIND placement** - All variables in BIND must be defined before the BIND statement\n4. Syntax errors in property predicates or values\n5. Correct usage of BIND and IF statements\n6. Proper quoting and escaping of literal values\n7. Valid property paths and URIs\n8. No duplicate PREFIX declarations`,
        };
      }

      if (!data || data.length === 0) {
        return {
          needsImprovement: true,
          feedback: `Query returned no results. The query may be too restrictive or the data may not exist in the knowledge graph. Consider: 1) Removing optional filters, 2) Checking if the property paths are correct, 3) Verifying the class and predicate URIs are accurate.`,
        };
      }

      const firstRow = data[0];

      // Check if any entire column has all null/zero values across all rows
      const columns = Object.keys(firstRow);
      const problematicColumns: string[] = [];

      for (const column of columns) {
        const allNullOrZero = data.every((row) => {
          const val = row[column];
          return val === null || val === undefined || val === '' || val == 0;
        });

        if (allNullOrZero) {
          problematicColumns.push(column);
        }
      }

      if (problematicColumns.length > 0) {
        return {
          needsImprovement: true,
          feedback: `Query returned data but the following column(s) have all null/zero values: ${problematicColumns.join(', ')}.\n\nThis suggests:\n1. These fields don't exist in the data or the property paths are incorrect\n2. You may need to use different properties or check the schema\n3. Consider removing these columns or using OPTIONAL if they're not essential\n4. The query logic for calculating these values might be wrong\n\nReview the template structure and ensure all predicates match the actual data.`,
        };
      }

      // Check overall null ratio as a secondary check
      const nullRatio =
        data.reduce((acc, row) => {
          const nullCount = Object.values(row).filter(
            (val) => val === null || val === undefined || val === ''
          ).length;
          return acc + nullCount / Object.keys(row).length;
        }, 0) / data.length;

      if (nullRatio > 0.5) {
        return {
          needsImprovement: true,
          feedback: `Query returned data but over 50% of all values are null/empty. This suggests the query might be selecting many fields that don't exist or using incorrect property paths. Review the template structure and ensure all predicates are valid.`,
        };
      }

      return {
        needsImprovement: false,
        feedback: 'Query results look good!',
      };
    },
    []
  );

  /**
   * Build SPARQL prompt based on template configuration
   */
  const buildSparqlPrompt = useCallback(
    (question: string): string => {
      if (templateMapping && templateId) {
        const dynamicPrompt = generateDynamicSPARQLPrompt(
          templateMapping as PredicatesMapping,
          templateId,
          undefined,
          targetClassId || undefined
        );
        return dynamicPrompt.replace('[Research Question]', question);
      }
      return promptTemplate.replace('[Research Question]', question);
    },
    [templateMapping, templateId, targetClassId]
  );

  /**
   * Build refinement prompt for iterations
   */
  const buildRefinementPrompt = useCallback(
    (
      question: string,
      previousQuery: string,
      previousFeedback: string,
      iteration: number
    ): string => {
      const basePrompt = `You previously generated a SPARQL query that needs improvement.

**Original Question:** ${question}

**Previous SPARQL Query (Iteration ${iteration - 1}):**
\`\`\`sparql
${previousQuery}
\`\`\`

**Feedback on Previous Query:**
${previousFeedback}

**Instructions:**
1. Carefully analyze the feedback and identify what went wrong
2. Generate an improved SPARQL query that addresses the issues
3. Ensure the query follows all the schema rules and best practices
4. Return ONLY the improved SPARQL query in a code block, no explanations

${
  templateMapping && templateId
    ? `Use the following template schema:\n${
        generateDynamicSPARQLPrompt(
          templateMapping as PredicatesMapping,
          templateId,
          undefined,
          targetClassId || undefined
        ).split('[Research Question]')[0]
      }`
    : ''
}

**Improved SPARQL Query:**`;

      return basePrompt;
    },
    [templateMapping, templateId, targetClassId]
  );

  /**
   * Generate and refine SPARQL query iteratively
   */
  const generateQueryWithRefinement = useCallback(
    async (
      question: string,
      maxIterations: number = 3
    ): Promise<{
      sparqlBlocks: SPARQLBlock[];
      rawData: Record<string, unknown>[];
      finalPrompt: string;
      costs: CostBreakdown[];
    }> => {
      setCurrentIteration(0);
      setIterationFeedback('');
      setIterationHistory([]);

      let currentPrompt = '';
      let previousQuery: string | null = null;
      let previousFeedback: string | null = null;
      let bestRawData: Record<string, unknown>[] = [];
      let bestSparqlBlocks: SPARQLBlock[] = [];
      const history: IterationDetail[] = [];

      for (let iteration = 1; iteration <= maxIterations; iteration++) {
        setCurrentIteration(iteration);
        setIterationFeedback(
          `Iteration ${iteration}/${maxIterations}: ${
            previousFeedback
              ? 'Refining query based on feedback...'
              : 'Generating initial query...'
          }`
        );

        // Build prompt
        if (iteration === 1) {
          currentPrompt = buildSparqlPrompt(question);
        } else {
          currentPrompt = buildRefinementPrompt(
            question,
            previousQuery!,
            previousFeedback!,
            iteration
          );
        }

        // Generate SPARQL
        const sparqlResult = await aiService.generateText(currentPrompt, {
          temperature: 0.1 + (iteration - 1) * 0.05,
          maxTokens: 2000,
          provider,
          model: currentModel,
        });

        const { sparqlBlocks } = extractFromMarkdown(sparqlResult.text);

        if (!sparqlBlocks || sparqlBlocks.length === 0) {
          const iterationDetail: IterationDetail = {
            iteration,
            prompt: currentPrompt,
            llmResponse: sparqlResult.text,
            generatedQuery: '',
            executionError: 'No SPARQL code block was generated',
            resultCount: 0,
            feedback:
              'No SPARQL code block was generated. Please ensure the response contains a valid SPARQL query in a code block.',
            timestamp: new Date(),
            cost: sparqlResult.cost
              ? {
                  ...sparqlResult.cost,
                  section: `Query Generation - Iteration ${iteration}`,
                }
              : undefined,
          };
          history.push(iterationDetail);
          setIterationHistory([...history]);

          if (iteration === maxIterations) {
            throw new Error(
              'The AI did not return a SPARQL code block after multiple attempts. Please try rephrasing your question.'
            );
          }
          previousFeedback = iterationDetail.feedback;
          continue;
        }

        // Execute query
        setIterationFeedback(
          `Iteration ${iteration}/${maxIterations}: Executing query...`
        );

        let rawData: Record<string, unknown>[] = [];
        let executionError: string | undefined;

        try {
          rawData = await executeQueriesRaw(sparqlBlocks);
        } catch (err: unknown) {
          executionError =
            err instanceof Error
              ? err.message
              : 'Unknown error during query execution';
          console.warn(`Iteration ${iteration} execution error:`, err);
        }

        previousQuery = combineSparqlBlocks(sparqlBlocks);

        // Evaluate results
        const evaluation = evaluateQueryResults(
          rawData,
          question,
          executionError,
          previousQuery
        );

        setIterationFeedback(
          `Iteration ${iteration}/${maxIterations}: ${evaluation.feedback}`
        );

        // Store iteration details
        const iterationDetail: IterationDetail = {
          iteration,
          prompt: currentPrompt,
          llmResponse: sparqlResult.text,
          generatedQuery: previousQuery,
          executionError,
          resultCount: rawData.length,
          feedback: evaluation.feedback,
          timestamp: new Date(),
          cost: sparqlResult.cost
            ? {
                ...sparqlResult.cost,
                section: `Query Generation - Iteration ${iteration}`,
              }
            : undefined,
        };
        history.push(iterationDetail);
        setIterationHistory([...history]);

        // If results are good, stop iterating
        if (!evaluation.needsImprovement) {
          bestRawData = rawData;
          bestSparqlBlocks = sparqlBlocks;
          setIterationFeedback(
            `✅ Success after ${iteration} iteration(s): Query returned good results!`
          );
          break;
        }

        // Store best results so far
        if (rawData.length > bestRawData.length) {
          bestRawData = rawData;
          bestSparqlBlocks = sparqlBlocks;
        }

        previousFeedback = evaluation.feedback;

        // Last iteration fallback
        if (iteration === maxIterations) {
          if (bestRawData.length > 0) {
            setIterationFeedback(
              `⚠️ Completed ${maxIterations} iterations. Using best results found (${bestRawData.length} rows).`
            );
          } else {
            throw new Error(
              `After ${maxIterations} iterations, the query still returns no results. ${evaluation.feedback}`
            );
          }
        }
      }

      // Save the best query
      const combinedQuery = combineSparqlBlocks(bestSparqlBlocks);
      updateSparqlQuery(combinedQuery, currentPrompt);

      // Collect costs from iteration history
      const queryCosts: CostBreakdown[] = history
        .filter((item) => item.cost)
        .map((item) => item.cost!);

      return {
        sparqlBlocks: bestSparqlBlocks,
        rawData: bestRawData,
        finalPrompt: currentPrompt,
        costs: queryCosts,
      };
    },
    [
      aiService,
      buildSparqlPrompt,
      buildRefinementPrompt,
      executeQueriesRaw,
      evaluateQueryResults,
      updateSparqlQuery,
    ]
  );

  /**
   * Reset iteration history and state
   */
  const resetIterationHistory = useCallback(() => {
    setCurrentIteration(0);
    setIterationFeedback('');
    setIterationHistory([]);
  }, []);

  return {
    generateQueryWithRefinement,
    executeQueriesRaw,
    currentIteration,
    iterationFeedback,
    iterationHistory,
    resetIterationHistory,
  };
};
