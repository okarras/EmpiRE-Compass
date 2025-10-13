import { useState, useCallback } from 'react';
import { useAIService } from '../services/aiService';
import {
  extractFromMarkdown,
  SPARQLBlock,
  combineSparqlBlocks,
} from '../utils/queryParser';
import fetchSPARQLData from '../helpers/fetch_query';
import promptTemplate from '../prompts/GENERATE_SPARQL.txt?raw';
import {
  generateDynamicSPARQLPrompt,
  PredicatesMapping,
} from '../utils/promptGenerator';

interface QueryEvaluation {
  needsImprovement: boolean;
  feedback: string;
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
  const [currentIteration, setCurrentIteration] = useState(0);
  const [iterationFeedback, setIterationFeedback] = useState('');

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
      question: string,
      queryError?: string
    ): QueryEvaluation => {
      if (queryError) {
        return {
          needsImprovement: true,
          feedback: `Query execution failed with error: ${queryError}. Please fix the syntax or logic issues.`,
        };
      }

      if (!data || data.length === 0) {
        return {
          needsImprovement: true,
          feedback: `Query returned no results. The query may be too restrictive or the data may not exist in the knowledge graph. Consider: 1) Removing optional filters, 2) Checking if the property paths are correct, 3) Verifying the class and predicate URIs are accurate.`,
        };
      }

      const firstRow = data[0];
      const columnCount = Object.keys(firstRow).length;
      if (columnCount <= 2) {
        return {
          needsImprovement: true,
          feedback: `Query returned data with only ${columnCount} column(s). To better answer "${question}", consider selecting more relevant fields that provide context and details.`,
        };
      }

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
          feedback: `Query returned data but over 50% of values are null/empty. This suggests the query might be selecting fields that don't exist or using incorrect property paths. Review the template structure and ensure all predicates are valid.`,
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
    }> => {
      setCurrentIteration(0);
      setIterationFeedback('');

      let currentPrompt = '';
      let previousQuery: string | null = null;
      let previousFeedback: string | null = null;
      let bestRawData: Record<string, unknown>[] = [];
      let bestSparqlBlocks: SPARQLBlock[] = [];

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
        });

        const { sparqlBlocks } = extractFromMarkdown(sparqlResult.text);

        if (!sparqlBlocks || sparqlBlocks.length === 0) {
          if (iteration === maxIterations) {
            throw new Error(
              'The AI did not return a SPARQL code block after multiple attempts. Please try rephrasing your question.'
            );
          }
          previousFeedback =
            'No SPARQL code block was generated. Please ensure the response contains a valid SPARQL query in a code block.';
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

        // Evaluate results
        const evaluation = evaluateQueryResults(
          rawData,
          question,
          executionError
        );

        setIterationFeedback(
          `Iteration ${iteration}/${maxIterations}: ${evaluation.feedback}`
        );

        previousQuery = combineSparqlBlocks(sparqlBlocks);

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

      return {
        sparqlBlocks: bestSparqlBlocks,
        rawData: bestRawData,
        finalPrompt: currentPrompt,
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

  return {
    generateQueryWithRefinement,
    executeQueriesRaw,
    currentIteration,
    iterationFeedback,
  };
};
