import { useState, useCallback } from 'react';
import { useAIService } from '../services/backendAIService';
import { extractFromMarkdown } from '../utils/queryParser';

export type DataProcessingFn = (
  data: Record<string, unknown>[] | Record<string, Record<string, unknown>[]>
) => Record<string, unknown>[];

interface UseDataProcessingProps {
  updateProcessingFunctionCode: (code: string, prompt?: string) => void;
  templateId?: string;
}

/**
 * Template-specific domain knowledge for data processing
 * Add entries here for each template that requires specific guidance
 * Key: Template ID (e.g., 'R186491')
 * Value: Domain knowledge string that will be injected into the prompt
 */
const TEMPLATE_DOMAIN_KNOWLEDGE: Record<string, string> = {
  // Empirical Research Practice Template (R186491)
  R186491: `
## Domain-Specific Knowledge: Empirical Research Practice

**CRITICAL: Understanding "Empirical Studies"**
In this domain, an empirical study is defined as a paper that has BOTH:
1. Data collection that is NOT "no collection" (check: dc_label !== "no collection")
2. Data analysis that is NOT "no analysis" (check: da_label !== "no analysis")

Both conditions MUST be true for a study to be considered empirical.

**Common Data Fields and Their Meanings:**
- \`dc_label\`: Data collection method label. The value "no collection" indicates no empirical data collection was performed.
- \`da_label\`: Data analysis method label. The value "no analysis" indicates no empirical data analysis was performed.
- \`dc_method_type_label\`: The type/category of data collection method (e.g., "case study", "experiment", "survey").
- \`da_method_type_label\`: The type/category of data analysis method.
- \`year\`: Publication year (may be string or number).
- \`venue_name\`: Conference or venue name.
- \`paper\`: Paper identifier (typically a URI).

**Important Field Value Semantics:**
- When filtering for empirical methods, exclude "no collection" and "no analysis" values
- Method type labels should be counted/aggregated only if they represent actual empirical methods
- Boolean fields (like threat types) may be true/false or present/absent
- Year fields should be converted to integers for proper sorting and grouping

**Critical Mistakes to Avoid:**
- DO NOT check if dc_label or da_label equals "empirical" - no such value exists
- DO NOT forget that BOTH dc_label and da_label conditions must be checked for empirical studies
- DO NOT assume all rows have all fields - use optional chaining or existence checks
- DO NOT perform calculations without checking for valid numeric values
`,
};

export const useDataProcessing = ({
  updateProcessingFunctionCode,
  templateId,
}: UseDataProcessingProps) => {
  const aiService = useAIService();
  const [processingFn, setProcessingFn] = useState<DataProcessingFn | null>(
    null
  );
  const [processingCode, setProcessingCode] = useState<string | null>(null);

  /**
   * Compile a processing function from JS code block with error handling
   */
  const compileProcessingFunction = useCallback(
    (jsCode: string): DataProcessingFn | null => {
      try {
        const normalized = jsCode.replace(/export\s+default\s+/g, '');
        const factory = new Function(
          `"use strict";\n${normalized}\nreturn typeof processData === 'function' ? processData : null;`
        );
        const fn = factory();

        if (typeof fn === 'function') {
          return ((
            data:
              | Record<string, unknown>[]
              | Record<string, Record<string, unknown>[]>
          ) => {
            try {
              if (data === null || data === undefined) {
                console.warn(
                  'AI processing function received null/undefined data, returning empty array'
                );
                return [];
              }
              return fn(data);
            } catch (error) {
              console.error('Error in AI processing function:', error);
              console.error('Function code:', jsCode);
              console.error('Input data:', data);
              return [];
            }
          }) as DataProcessingFn;
        }
        return null;
      } catch (error) {
        console.error('Error compiling processing function:', error);
        console.error('JS code:', jsCode);
        return null;
      }
    },
    []
  );

  /**
   * Generate data processing function based on actual data structure
   */
  const generateProcessingFunction = useCallback(
    async (
      rawData: Record<string, unknown>[],
      question: string,
      skipIfExists: boolean = false
    ): Promise<DataProcessingFn | null> => {
      // Skip generation if we already have processing code and skipIfExists is true
      if (skipIfExists && processingCode && processingCode.trim()) {
        return processingFn;
      }

      try {
        // Safety check for raw data
        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
          console.warn(
            'generateProcessingFunction received invalid data:',
            rawData
          );
          return null;
        }

        // Create a sample of the data structure for the LLM
        const dataSample = rawData.slice(0, 5);
        const dataStructure = {
          totalRows: rawData.length,
          columns: Object.keys(rawData[0] || {}),
          sampleData: dataSample,
          dataTypes: Object.fromEntries(
            Object.keys(rawData[0] || {}).map((key) => [
              key,
              typeof rawData[0]?.[key],
            ])
          ),
        };

        // Get template-specific domain knowledge if available
        const domainKnowledge =
          templateId && TEMPLATE_DOMAIN_KNOWLEDGE[templateId]
            ? TEMPLATE_DOMAIN_KNOWLEDGE[templateId]
            : '';

        const processingPrompt = `You are a data processing expert for the Open Research Knowledge Graph (ORKG) research analysis. Given the following research question and raw data structure from a SPARQL query, generate a JavaScript function to transform the data for visualization.

**Research Question:** ${question}

**Raw Data Structure:**
- Total rows: ${dataStructure.totalRows}
- Columns: ${dataStructure.columns.join(', ')}
- Data types: ${JSON.stringify(dataStructure.dataTypes, null, 2)}

**Sample Data (first 5 rows):**
${JSON.stringify(dataSample, null, 2)}
${domainKnowledge}
## Task Requirements:

1. **Input Validation (MANDATORY - First Lines of Function):**
   - Check if input is null, undefined, or not an array
   - Return empty array [] for invalid input
   - Handle rows with missing or null field values gracefully throughout processing

2. **Analyze the Research Question:**
   - Understand what the question is asking for (counts, proportions, trends, distributions, etc.)
   - Determine if it's about empirical studies specifically or all studies
   - Identify if temporal analysis (by year) is needed
   - Determine appropriate grouping dimensions

3. **Data Transformation Strategy:**
   - Apply the correct definition of "empirical study" if relevant to the question
   - Group/aggregate data according to what the question asks
   - Calculate appropriate metrics (counts, proportions, percentages, etc.)
   - Handle edge cases like empty groups or missing years

4. **Output Format:**
   - Return an array of objects suitable for visualization
   - Use descriptive, chart-friendly property names (lowercase_with_underscores)
   - Ensure numeric values are actual numbers, not strings
   - Sort results logically (typically by year for temporal data, or by count for rankings)
   - Include all necessary fields for the visualization

5. **Safety and Robustness:**
   - Always check denominators before division to avoid division by zero
   - Validate that field values exist before accessing nested properties
   - Convert string numbers to integers/floats with proper validation
   - Handle null, undefined, and empty string values appropriately
   - DO NOT assume all rows have all fields - use optional chaining or existence checks

**Output ONLY the JavaScript code block with no explanations before or after:**

\`\`\`javascript
function processData(rows) {
  // Your implementation here
}
\`\`\``;

        const result = await aiService.generateText(processingPrompt, {
          temperature: 0.2,
          maxTokens: 2000,
        });

        const { javascript } = extractFromMarkdown(result.text);

        if (javascript) {
          setProcessingCode(javascript);
          updateProcessingFunctionCode(javascript, processingPrompt);
          const compiled = compileProcessingFunction(javascript);
          setProcessingFn(compiled);
          return compiled;
        }

        return null;
      } catch (error) {
        console.error('Error generating data processing function:', error);
        return null;
      }
    },
    [
      aiService,
      processingCode,
      processingFn,
      compileProcessingFunction,
      updateProcessingFunctionCode,
      templateId,
    ]
  );

  /**
   * Update processing code and recompile
   */
  const updateProcessingCode = useCallback(
    (code: string) => {
      setProcessingCode(code);
      const compiled = compileProcessingFunction(code);
      setProcessingFn(compiled);
      return compiled;
    },
    [compileProcessingFunction]
  );

  /**
   * Hydrate processing function from persisted code
   */
  const hydrateProcessingFunction = useCallback(
    (code: string) => {
      if (code && code.trim()) {
        setProcessingCode(code);
        const compiled = compileProcessingFunction(code);
        setProcessingFn(compiled);
      } else {
        setProcessingCode(null);
        setProcessingFn(null);
      }
    },
    [compileProcessingFunction]
  );

  return {
    processingFn,
    processingCode,
    generateProcessingFunction,
    updateProcessingCode,
    hydrateProcessingFunction,
  };
};
