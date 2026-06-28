export const CHART_GENERATION_SUGGESTION_PROMPT = `
          CRITICAL INSTRUCTION:
          Suggest at least 5 alternative ways to visualize this data.
          You MUST respond ONLY with a single JSON object matching the schema below.
          Do NOT include any markdown code blocks, backticks, comments, or surrounding text.
          The output must be pure, parsable JSON.

          JSON Schema:
          {
            "Suggestions": [
              {
                "chartType": "Bar chart",
                "chartDescription": "Explanation of why this fits the data."
              }
            ]
          }`;
