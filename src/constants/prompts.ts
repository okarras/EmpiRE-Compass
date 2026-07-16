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

export const SILENT_CHART_GENERATION_PROMPT = (chartType: string) => `
        Based on the user's question and the provided data, generate a JavaScript function body that processes the data and returns a chart configuration object (compatible with our charting library). Do not return HTML, <canvas>, or <script> tags. Return ONLY the JavaScript code inside a Markdown code block (\`\`\`javascript ... \`\`\`). The code must conclude by returning the configuration object.

        Follow these specific instructions for the chart:
        1. Choose the most appropriate chart type to visually represent a ${chartType}:
           - Use 'line' for trends over time
           - Use 'bar' for comparing quantities across categories
           - Use 'pie' or 'doughnut' for showing proportions
           - Use 'scatter' for showing relationships between variables
           - Use 'radar' for comparing multiple variables
           - If a Heatmap is requested or appropriate, use type: 'matrix'. Format dataset data as [{x: 1, y: 1, v: 10}] where 'v' is the value.
           - If a Box Plot is requested or appropriate, use type: 'boxplot'. Note: If generating a 'boxplot', the 'data' property for each dataset MUST be an array of arrays containing strict NUMBERS, not strings (e.g., data: [ [2016, 2018, 2019] ]). Do not quote the numbers. You must also provide an overarching label in data.labels.
        2. The JavaScript code should assume 'inputData' is available as a variable containing the data.
        3. Make the chart responsive and use appropriate colors
        4. Include proper axis labels and title
        5. Format the JavaScript code like this example:
        \`\`\`javascript
        // You have access to 'inputData' array
        const labels = inputData.map(item => item.category || 'Category');
        const data = inputData.map(item => item.value || 0);

        const config = {
          type: 'bar', // or 'matrix', 'boxplot', etc.
          data: {
            labels: labels,
            datasets: [{
              label: 'Dataset',
              data: data,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Chart Title'
              }
            }
          }
        };
        
        return config;
        \`\`\`

        Important instructions:
        1. Keep your response purely to the code block.
        2. Do not write explanations unless absolutely necessary.
        3. Base your answer ONLY on the data and analysis provided above
        4. Do not make assumptions or include information not present in the data
        5. The chart width should be 100%
        
        CRITICAL JAVASCRIPT SYNTAX RULES:
        1. If you hardcode object keys that contain spaces or special characters, you MUST wrap them in quotes (e.g., {'case study': [], 'secondary research': []}). Never write case study: [] without quotes.
        2. Prefer dynamically building objects (e.g., if (!obj[method]) obj[method] = [];) rather than hardcoding specific string keys.
        3. Ensure all code is valid, compilable JavaScript. Do not include trailing commas or syntax errors.
        4. DEFENSIVE PROGRAMMING: When grouping data into nested objects or arrays, you MUST initialize the nested properties before pushing to them.
        Use this exact safe pattern:
        \`\`\`javascript
        if (!myObject[key]) myObject[key] = {};
        if (!myObject[key][subKey]) myObject[key][subKey] = [];
        myObject[key][subKey].push(value);
        \`\`\`
        Never assume a nested array exists. Always filter out undefined, null, or empty keys before grouping.
        
        CRITICAL BOXPLOT DATA RULES:
        A boxplot requires continuous, varying numerical data to calculate quartiles.
        If you are grouping data by category (e.g., 'method'), the array for each category MUST contain varying numbers — such as the specific year of each item (e.g., data: [[2016, 2018, 2021, 2015]]).
        NEVER fill the array with identical constants (like [1, 1, 1]). If the data has no variance, the boxplot will render as an invisible flat line.
        
        CRITICAL HEATMAP (MATRIX) RULES:
        If the user wants a heatmap, you MUST set type: 'matrix'.
        The data array for the dataset MUST be a single, flat array of objects containing x, y, and v keys.
        x is the column category (e.g., Year), y is the row category (e.g., Method), and v is the numerical value (count/frequency).
        Example: data: [{ x: '2016', y: 'Survey', v: 15 }, { x: '2017', y: 'Experiment', v: 8 }]`;
