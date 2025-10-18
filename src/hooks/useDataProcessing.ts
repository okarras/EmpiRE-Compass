import { useState, useCallback } from 'react';
import { useAIService } from '../services/aiService';
import { extractFromMarkdown } from '../utils/queryParser';

export type DataProcessingFn = (
  data: Record<string, unknown>[] | Record<string, Record<string, unknown>[]>
) => Record<string, unknown>[];

interface UseDataProcessingProps {
  updateProcessingFunctionCode: (code: string, prompt?: string) => void;
}

export const useDataProcessing = ({
  updateProcessingFunctionCode,
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

        const processingPrompt = `You are a data processing expert. Given the following research question and raw data structure from a SPARQL query, generate a JavaScript function to transform the data for visualization.

**Research Question:** ${question}

**Raw Data Structure:**
- Total rows: ${dataStructure.totalRows}
- Columns: ${dataStructure.columns.join(', ')}
- Data types: ${JSON.stringify(dataStructure.dataTypes, null, 2)}

**Sample Data (first 5 rows):**
${JSON.stringify(dataSample, null, 2)}

**Requirements:**
1. Create a function named \`processData\` that takes the raw data array as input
2. ALWAYS check if the input data is null, undefined, or not an array and handle gracefully
3. Transform the data into a format suitable for charting (typically grouped by year if available)
4. Return an array of objects where each object represents a data point for visualization
5. Clean up column names to be chart-friendly (no spaces, lowercase with underscores)
6. Convert string numbers to actual numbers where appropriate
7. Handle missing or null values gracefully

**Output only the JavaScript code block:**

\`\`\`javascript
function processData(rows) {
  // ALWAYS check for null/undefined input first
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return [];
  }
  
  // Your transformation logic here
  return transformedData;
}
\`\`\``;

        const result = await aiService.generateText(processingPrompt, {
          temperature: 0.2,
          maxTokens: 1500,
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
