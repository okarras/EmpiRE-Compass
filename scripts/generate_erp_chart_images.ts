/**
 * Fetch ORKG SPARQL for Empirical Research Practice questions, process with
 * the app's data-processing functions, and emit Chart.js specs + an HTML gallery
 * that can be screenshotted into PNGs for the PDF export.
 *
 * Usage: npx tsx scripts/generate_erp_chart_images.ts
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Avoid importing SPARQL_QUERIES.ts (uses Vite import.meta.env).
import { queries as codeQueries } from '../src/constants/queries_chart_info';
import type { Query, ChartSetting } from '../src/constants/queries_chart_info';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BACKUP = resolve(
  ROOT,
  'backups/firebase-backup-2026-03-30T08-56-42-479Z.json'
);
const OUT_DIR = resolve(ROOT, 'exports/charts');
const ENDPOINT = 'https://orkg.org/triplestore';
const PREFIXES = `
    PREFIX orkgr: <http://orkg.org/orkg/resource/>
    PREFIX orkgc: <http://orkg.org/orkg/class/>
    PREFIX orkgp: <http://orkg.org/orkg/predicate/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
`;
const ACCENT = '#e86161';
const MULTI_COLORS = [
  '#e86161',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ef4444',
  '#84cc16',
  '#ec4899',
  '#14b8a6',
  '#a855f7',
  '#f97316',
  '#64748b',
  '#0ea5e9',
  '#22c55e',
  '#eab308',
  '#d946ef',
];

/** Pull a named query body from SPARQL_QUERIES.ts without evaluating Vite env. */
function loadNamedSparql(uid: string): string | undefined {
  const src = readFileSync(resolve(ROOT, 'src/api/SPARQL_QUERIES.ts'), 'utf8');
  const re = new RegExp(`${uid}:\\s*\`([\\s\\S]*?)\`,\\s*\\n`, 'm');
  const m = src.match(re);
  return m?.[1];
}

type BindingRow = Record<string, string>;

interface ChartSpec {
  id: string;
  questionId: number;
  title: string;
  question: string;
  heading: string;
  layout: 'vertical' | 'horizontal';
  labels: string[];
  datasets: { label: string; data: number[]; color: string }[];
  yAxisLabel: string;
  xAxisLabel: string;
}

function prepareQuery(query: string): string {
  const lines = query.split('\n');
  const filtered = lines.filter((line) => {
    const t = line.trim();
    return !/^PREFIX\s+/i.test(t) && !/^define\s+sql:big-data-const/i.test(t);
  });
  return filtered.join('\n').trim();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchSPARQL(query: string, attempt = 1): Promise<BindingRow[]> {
  const fullQuery = `${PREFIXES.trim()}\n${prepareQuery(query)}`;
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/sparql-results+json',
        Connection: 'close',
      },
      body: new URLSearchParams({ query: fullQuery }),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(
        `SPARQL failed ${response.status}: ${errText.slice(0, 400)}`
      );
    }
    const data = (await response.json()) as {
      results: { bindings: Record<string, { value: string }>[] };
    };
    return data.results.bindings.map((binding) => {
      const row: BindingRow = {};
      for (const key of Object.keys(binding)) {
        row[key] = binding[key].value;
      }
      return row;
    });
  } catch (err) {
    if (attempt >= 5) throw err;
    const wait = attempt * 2000;
    console.warn(
      `  retry ${attempt}/5 in ${wait}ms: ${(err as Error).message}`
    );
    await sleep(wait);
    return fetchSPARQL(query, attempt + 1);
  }
}

function coerceRows(rows: BindingRow[]): Record<string, unknown>[] {
  // Keep most SPARQL values as strings — several processors call string methods
  // on method fields. Only coerce year (used numerically almost everywhere).
  return rows.map((row) => {
    const out: Record<string, unknown> = { ...row };
    if (
      row.year != null &&
      row.year !== '' &&
      !Number.isNaN(Number(row.year))
    ) {
      out.year = Number(row.year);
    }
    return out;
  });
}

function resolveSparql2(
  q: Query & { sparqlQuery2?: string }
): string | undefined {
  if (q.sparqlQuery2) return q.sparqlQuery2;
  const key = q.uid_2 || q.uid_2_merge;
  return key ? loadNamedSparql(key) : undefined;
}

function isHorizontal(settings: ChartSetting): boolean {
  if (settings.layout === 'horizontal') return true;
  const y = settings.yAxis?.[0];
  return y?.scaleType === 'band' && !!y?.dataKey;
}

function categoryKey(settings: ChartSetting, horizontal: boolean): string {
  if (horizontal) {
    return (
      settings.yAxis?.[0]?.dataKey || settings.xAxis?.[0]?.dataKey || 'label'
    );
  }
  return settings.xAxis?.[0]?.dataKey || 'year';
}

function buildSeries(
  settings: ChartSetting,
  normalized: boolean
): { dataKey: string; label: string }[] {
  const series = settings.series || [];
  if (series.length > 1 && normalized) {
    return series.map((s: { dataKey: string; label?: string }) => ({
      dataKey: `normalized_${s.dataKey}`,
      label: s.label || s.dataKey,
    }));
  }
  return series.map((s: { dataKey: string; label?: string }) => ({
    dataKey: normalized || series.length > 1 ? s.dataKey : 'count',
    label: s.label || s.dataKey,
  }));
}

function stripItems(
  dataset: Record<string, unknown>[]
): Record<string, unknown>[] {
  return dataset.map((row) => {
    const { itemsInGroup: _i, ...rest } = row;
    return rest;
  });
}

function toChartSpec(
  id: string,
  questionId: number,
  question: string,
  settings: ChartSetting,
  dataset: Record<string, unknown>[],
  normalized = true
): ChartSpec | null {
  if (!settings?.series?.length || !dataset?.length) return null;

  const horizontal = isHorizontal(settings);
  const catKey = categoryKey(settings, horizontal);
  const series = buildSeries(settings, normalized);
  const clean = stripItems(dataset);

  // Sort by category when numeric/year-like
  clean.sort((a, b) => {
    const av = a[catKey];
    const bv = b[catKey];
    const an = Number(av);
    const bn = Number(bv);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
    return String(av).localeCompare(String(bv), undefined, { numeric: true });
  });

  const labels = clean.map((row) => String(row[catKey] ?? ''));
  const datasets = series.map((s, idx) => ({
    label: s.label,
    data: clean.map((row) => {
      const v = row[s.dataKey];
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }),
    color:
      series.length === 1
        ? ACCENT
        : (settings.colors?.[idx] as string) ||
          MULTI_COLORS[idx % MULTI_COLORS.length],
  }));

  // Drop series that are all zeros to reduce clutter (optional for Q14 etc.)
  const active = datasets.filter((d) => d.data.some((v) => v !== 0));
  const finalDatasets = active.length ? active : datasets;

  const headingBase = settings.heading || `Question ${questionId} chart`;
  const heading =
    !settings.doesntHaveNormalization && normalized
      ? `Relative ${headingBase}`
      : !settings.doesntHaveNormalization
        ? `Absolute ${headingBase}`
        : headingBase;

  return {
    id,
    questionId,
    title: `Q${questionId}`,
    question,
    heading,
    layout: horizontal ? 'horizontal' : 'vertical',
    labels,
    datasets: finalDatasets,
    yAxisLabel: settings.yAxis?.[0]?.label || '',
    xAxisLabel: settings.xAxis?.[0]?.label || '',
  };
}

function processPrimary(
  codeQ: Query,
  data1: Record<string, unknown>[],
  data2: Record<string, unknown>[]
): Record<string, unknown>[] {
  if (
    codeQ.uid_2_merge &&
    typeof codeQ.dataProcessingFunction2 === 'function'
  ) {
    return codeQ.dataProcessingFunction2(data1, data2) ?? [];
  }
  if (typeof codeQ.dataProcessingFunction === 'function') {
    return codeQ.dataProcessingFunction(data1) ?? [];
  }
  return [];
}

function processSecondary(
  codeQ: Query,
  data2: Record<string, unknown>[]
): Record<string, unknown>[] {
  if (
    typeof codeQ.dataProcessingFunction2 === 'function' &&
    !codeQ.uid_2_merge
  ) {
    return codeQ.dataProcessingFunction2(data2) ?? [];
  }
  return [];
}

function galleryHtml(specs: ChartSpec[]): string {
  const payload = JSON.stringify(specs);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>ERP Charts</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; margin: 16px; background: #fff; color: #1a1a1a; }
    .chart-card {
      width: 1200px;
      margin: 0 auto 32px;
      padding: 16px 16px 8px;
      border: 1px solid #e5e5e5;
      page-break-after: always;
      background: #fff;
    }
    .chart-card h2 { margin: 0 0 4px; font-size: 16px; color: #b33a3a; }
    .chart-card h3 { margin: 0 0 12px; font-size: 14px; font-weight: 600; text-align: center; }
    .chart-card p { margin: 0 0 12px; font-size: 12px; color: #555; }
    .canvas-wrap { position: relative; height: 480px; width: 100%; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    const specs = ${payload};
    Chart.register(ChartDataLabels);
    const root = document.getElementById('root');
    window.chartsReady = false;
    const jobs = specs.map((spec, i) => {
      const card = document.createElement('div');
      card.className = 'chart-card';
      card.id = 'card-' + spec.id;
      card.innerHTML = '<h2>' + spec.title + '</h2><p>' + spec.question + '</p><h3>' + spec.heading + '</h3><div class="canvas-wrap"><canvas id="c-' + spec.id + '"></canvas></div>';
      root.appendChild(card);
      const ctx = document.getElementById('c-' + spec.id);
      const horizontal = spec.layout === 'horizontal';
      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels: spec.labels,
          datasets: spec.datasets.map(d => ({
            label: d.label,
            data: d.data,
            backgroundColor: d.color,
            borderWidth: 0,
            maxBarThickness: spec.datasets.length === 1 ? 36 : 18,
          })),
        },
        options: {
          indexAxis: horizontal ? 'y' : 'x',
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: { display: spec.datasets.length > 1, position: 'bottom' },
            datalabels: {
              color: '#222',
              anchor: horizontal ? 'end' : 'end',
              align: horizontal ? 'right' : 'top',
              font: { size: 9, weight: '600' },
              formatter: (v) => (v === 0 ? '' : v),
              clamp: true,
            },
            title: { display: false },
          },
          scales: {
            x: {
              title: { display: !!(horizontal ? spec.yAxisLabel : spec.xAxisLabel), text: horizontal ? spec.yAxisLabel : spec.xAxisLabel },
              ticks: { maxRotation: 90, minRotation: horizontal ? 0 : 45, font: { size: 10 } },
              beginAtZero: true,
            },
            y: {
              title: { display: !!(horizontal ? spec.xAxisLabel : spec.yAxisLabel), text: horizontal ? spec.xAxisLabel : spec.yAxisLabel },
              ticks: { font: { size: 10 } },
              beginAtZero: true,
            },
          },
        },
      });
    });
    requestAnimationFrame(() => { window.chartsReady = true; window.chartCount = specs.length; });
  </script>
</body>
</html>`;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const backup = JSON.parse(readFileSync(BACKUP, 'utf8'));
  const template = backup.Templates.find(
    (t: { id: string }) => t.id === 'R186491'
  );
  if (!template) throw new Error('R186491 missing from backup');

  const fbQuestions = [...template.Questions].sort(
    (a: { id: number }, b: { id: number }) => a.id - b.id
  );
  const codeById = new Map(codeQueries.map((q) => [q.id, q]));

  const specs: ChartSpec[] = [];
  const cache = new Map<string, Record<string, unknown>[]>();
  const rawCacheDir = resolve(OUT_DIR, 'raw');
  mkdirSync(rawCacheDir, { recursive: true });

  async function getData(key: string, sparql: string) {
    if (cache.has(key)) return cache.get(key)!;
    const diskPath = resolve(rawCacheDir, `${key}.json`);
    try {
      const fromDisk = JSON.parse(
        readFileSync(diskPath, 'utf8')
      ) as BindingRow[];
      const rows = coerceRows(fromDisk);
      cache.set(key, rows);
      console.log(`  cache hit ${key}: ${rows.length} rows`);
      return rows;
    } catch {
      /* fetch */
    }
    console.log(`  fetching ${key}...`);
    await sleep(800);
    const raw = await fetchSPARQL(sparql);
    writeFileSync(diskPath, JSON.stringify(raw));
    const rows = coerceRows(raw);
    cache.set(key, rows);
    console.log(`  ${key}: ${rows.length} rows`);
    return rows;
  }

  for (const fb of fbQuestions) {
    const codeQ = codeById.get(fb.id);
    if (!codeQ) {
      console.warn(`No code query for id ${fb.id}`);
      continue;
    }

    // Match the app merge: Firebase fields (incl. uid/SPARQL) + code processors.
    const merged: Query & { sparqlQuery?: string; sparqlQuery2?: string } = {
      ...codeQ,
      ...fb,
      dataProcessingFunction: codeQ.dataProcessingFunction,
      dataProcessingFunction2: codeQ.dataProcessingFunction2,
      uid_2_merge: fb.uid_2_merge || codeQ.uid_2_merge,
      sparqlQuery:
        fb.sparqlQuery || loadNamedSparql(fb.uid) || loadNamedSparql(codeQ.uid),
      sparqlQuery2:
        fb.sparqlQuery2 ||
        (fb.uid_2 ? loadNamedSparql(fb.uid_2) : undefined) ||
        (fb.uid_2_merge ? loadNamedSparql(fb.uid_2_merge) : undefined) ||
        (codeQ.uid_2 ? loadNamedSparql(codeQ.uid_2) : undefined) ||
        (codeQ.uid_2_merge ? loadNamedSparql(codeQ.uid_2_merge) : undefined),
    };

    const question =
      merged.dataAnalysisInformation?.question || merged.title || `Q${fb.id}`;
    console.log(`\nQ${fb.id}: ${question}`);

    const sparql1 = merged.sparqlQuery;
    if (!sparql1) {
      console.warn(`  no SPARQL for Q${fb.id}`);
      continue;
    }

    const data1 = await getData(merged.uid, sparql1);
    let data2: Record<string, unknown>[] = [];
    const sparql2 = resolveSparql2(merged);
    if (sparql2 && (merged.uid_2 || merged.uid_2_merge)) {
      const key = (merged.uid_2 || merged.uid_2_merge) as string;
      data2 = await getData(key, sparql2);
    }

    try {
      if (merged.chartSettings?.series?.length) {
        const dataset = processPrimary(merged, data1, data2);
        const spec = toChartSpec(
          `q${fb.id}-primary`,
          fb.id,
          question,
          merged.chartSettings,
          dataset,
          true
        );
        if (spec) specs.push(spec);
        else console.warn(`  primary chart skipped (empty)`);
      }

      if (merged.chartSettings2?.series?.length) {
        const dataset = processSecondary(merged, data2.length ? data2 : data1);
        const fallback =
          dataset.length === 0 &&
          typeof merged.dataProcessingFunction2 === 'function'
            ? (merged.dataProcessingFunction2(data2.length ? data2 : data1) ??
              [])
            : dataset;
        const spec = toChartSpec(
          `q${fb.id}-secondary`,
          fb.id,
          question,
          merged.chartSettings2,
          fallback,
          true
        );
        if (spec) specs.push(spec);
        else console.warn(`  secondary chart skipped (empty)`);
      }
    } catch (err) {
      console.warn(`  processing error for Q${fb.id}:`, (err as Error).message);
    }
  }

  writeFileSync(resolve(OUT_DIR, 'specs.json'), JSON.stringify(specs, null, 2));
  writeFileSync(resolve(OUT_DIR, 'gallery.html'), galleryHtml(specs));
  console.log(`\nWrote ${specs.length} chart specs to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
