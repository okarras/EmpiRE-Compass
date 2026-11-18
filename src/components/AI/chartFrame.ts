const LAYOUT_STYLE = `<style id="empire-chart-layout">
  html, body {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    justify-content: flex-start !important;
    background: transparent !important;
  }
  body > div:has(canvas) {
    flex: 1 1 auto !important;
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 12px 16px !important;
    box-sizing: border-box !important;
  }
  canvas {
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    max-height: none !important;
  }
</style>`;

const VALUE_PLUGIN = `<script id="empire-chart-plugin">
(function () {
  if (!window.Chart || window.__empireChartPlugin) return;
  window.__empireChartPlugin = true;
  Chart.register({
    id: 'empireBarValues',
    beforeInit: function (chart) {
      if (chart.config.type !== 'bar') return;
      (chart.config.data.datasets || []).forEach(function (dataset) {
        if (dataset.minBarLength == null) dataset.minBarLength = 6;
      });
    },
    afterDatasetsDraw: function (chart) {
      if (chart.config.type !== 'bar') return;
      var datasets = chart.data.datasets || [];
      var points = datasets.reduce(function (sum, dataset) {
        return sum + ((dataset.data && dataset.data.length) || 0);
      }, 0);
      if (!points || points > 16) return;
      var horizontal = chart.options.indexAxis === 'y';
      var ctx = chart.ctx;
      datasets.forEach(function (dataset, datasetIndex) {
        var meta = chart.getDatasetMeta(datasetIndex);
        if (!meta || meta.hidden) return;
        meta.data.forEach(function (element, index) {
          var raw = dataset.data[index];
          var value = raw && typeof raw === 'object' ? raw.y != null ? raw.y : raw.x : raw;
          if (value == null || value === '') return;
          ctx.save();
          ctx.fillStyle = '#333';
          ctx.font = '12px Arial, Helvetica, sans-serif';
          ctx.textAlign = horizontal ? 'left' : 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(
            String(value),
            horizontal ? element.x + 6 : element.x,
            horizontal ? element.y + 4 : element.y - 8
          );
          ctx.restore();
        });
      });
    }
  });
})();
</script>`;

const RESIZE_SCRIPT = `<script id="empire-chart-resize">
(function () {
  function fit() {
    var ChartRef = window.Chart;
    if (!ChartRef || !ChartRef.instances) return;
    Object.keys(ChartRef.instances).forEach(function (id) {
      var chart = ChartRef.instances[id];
      if (chart && typeof chart.resize === 'function') chart.resize();
    });
  }
  if (document.readyState === 'complete') fit();
  else window.addEventListener('load', fit);
})();
</script>`;

const CHART_JS_SCRIPT =
  /<script\b[^>]*\bsrc=["'][^"']*\/chart(?:\.umd)?\.js(?:@[^"']*)?["'][^>]*>\s*<\/script>/i;

function insertOnce(
  html: string,
  marker: string,
  block: string,
  anchor: RegExp | string
): string {
  if (html.includes(marker)) return html;
  if (typeof anchor === 'string') {
    if (!html.includes(anchor)) return `${block}\n${html}`;
    return html.replace(anchor, `${block}\n${anchor}`);
  }
  const match = html.match(anchor);
  if (!match || match.index == null) return html;
  const at = match.index + match[0].length;
  return `${html.slice(0, at)}\n${block}${html.slice(at)}`;
}

/** Make generated Chart.js documents fill the iframe and keep zero bars visible. */
export function fitChartDocument(html: string): string {
  if (!html) return html;
  let doc = insertOnce(
    html,
    'id="empire-chart-layout"',
    LAYOUT_STYLE,
    '</head>'
  );
  doc = insertOnce(
    doc,
    'id="empire-chart-plugin"',
    VALUE_PLUGIN,
    CHART_JS_SCRIPT
  );
  doc = insertOnce(doc, 'id="empire-chart-resize"', RESIZE_SCRIPT, '</body>');
  return doc;
}
