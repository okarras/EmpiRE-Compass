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
        Please generate a chart using Chart.js to visualize the relevant data. Follow these specific instructions for the chart:
        1. Put ALL chart-related code (canvas and Chart.js initialization script) inside a single <div class="chart-code"> tag.
        2. You MUST inline all data and options directly inside the new Chart(ctx, { ... }) configuration object. Do NOT declare separate variables like const data = ... or const options = ... outside the Chart object.
        3. Choose the most appropriate chart type to visually represent a ${chartType}:
           - Use 'line' for trends over time
           - Use 'bar' for comparing quantities across categories
           - Use 'pie' or 'doughnut' for showing proportions
           - Use 'scatter' for showing relationships between variables
           - Use 'radar' for comparing multiple variables
           - If a Heatmap is requested or appropriate, use type: 'matrix'. Format dataset data as [{x: 1, y: 1, v: 10}] where 'v' is the value.
           - If a Box Plot is requested or appropriate, use type: 'boxplot'. Format dataset data as an array of raw numbers (e.g. data: [1, 2, 3, 4, 5]).
        3. The chart code should be complete and self-contained
        4. Use proper indentation and formatting
        5. Make the chart responsive and use appropriate colors
        6. Include proper axis labels and title
        7. Format the chart code like this example:
        <div class="chart-code">
          <canvas id="myChart"></canvas>
          <script>
            const ctx = document.getElementById('myChart').getContext('2d');
            new Chart(ctx, {
              type: //choose the most appropriate type (e.g. 'bar', 'matrix', 'boxplot')
              data: {
                labels: ['Category 1', 'Category 2'],
                datasets: [{
                  label: 'Dataset',
                  data: [10, 20],
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
            });
          </script>
        </div>

        Important instructions:
        1. Keep your response under 300 words and maximum 2 paragraphs
        2. Base your answer ONLY on the data and analysis provided above
        3. Do not make assumptions or include information not present in the data
        4. Focus on the most relevant findings from the data
        5. Use clear and direct language
        6. Format your response using HTML tags (<p>, <ul>, <li>) to structure your response
        7. Do not include any markdown code blocks or backticks in your response
        8. Answer based on the data and analysis provided above
        9. The chart width should be 100%`;
