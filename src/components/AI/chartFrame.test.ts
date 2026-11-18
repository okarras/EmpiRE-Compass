import { describe, expect, it } from 'vitest';
import { fitChartDocument } from './chartFrame';

const chartHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    html, body { display: flex; align-items: center; overflow: hidden; height: 100%; }
    canvas { width: 100% !important; height: 500px !important; }
  </style>
</head>
<body>
  <div class="chart-wrapper"><canvas id="studyChart"></canvas></div>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1"></script>
  <script>new Chart(document.getElementById('studyChart'), { type: 'bar' });</script>
</body>
</html>`;

describe('fitChartDocument', () => {
  it('stretches the canvas to the iframe and labels bars', () => {
    const fitted = fitChartDocument(chartHtml);

    expect(fitted).toContain('id="empire-chart-layout"');
    expect(fitted).toContain('height: 100% !important');
    expect(fitted).toContain('id="empire-chart-plugin"');
    expect(fitted).toContain('minBarLength');
    expect(fitted.indexOf('id="empire-chart-plugin"')).toBeGreaterThan(
      fitted.indexOf('cdn.jsdelivr.net/npm/chart.js')
    );
    expect(fitted.indexOf('id="empire-chart-plugin"')).toBeLessThan(
      fitted.indexOf('chartjs-plugin-zoom')
    );
    expect(fitted).toContain('id="empire-chart-resize"');
  });

  it('does not inject the layout twice', () => {
    const once = fitChartDocument(chartHtml);
    const twice = fitChartDocument(once);
    expect(twice.match(/empire-chart-layout/g)).toHaveLength(1);
    expect(twice.match(/empire-chart-plugin/g)).toHaveLength(1);
  });
});
