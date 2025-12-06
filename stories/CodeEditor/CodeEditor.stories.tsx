import type { Meta, StoryObj } from '@storybook/react-vite';
import CodeEditor from '../../src/components/CodeEditor/CodeEditor';

const meta: Meta<typeof CodeEditor> = {
  title: 'CodeEditor/CodeEditor',
  component: CodeEditor,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '1000px', width: '100%', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`CodeEditor` is a Monaco-based code editor component with support for multiple languages including SPARQL, JavaScript, TypeScript, JSON, and more. Features include syntax highlighting, copy-to-clipboard, code formatting, and fullscreen mode. The component is used throughout the application for editing SPARQL queries, data processing functions, and configuration files.',
      },
    },
  },
  argTypes: {
    value: {
      control: 'text',
      description:
        'The code content to display and edit in the Monaco editor. Supports any text content with language-specific syntax highlighting. Changes are emitted via the onChange callback as the user types.',
      table: {
        type: { summary: 'string' },
      },
    },
    language: {
      control: 'select',
      options: [
        'sparql',
        'html',
        'javascript',
        'typescript',
        'json',
        'sql',
        'markdown',
        'plaintext',
      ],
      description:
        "The programming language for syntax highlighting and IntelliSense. SPARQL language support is custom-registered with keyword highlighting for SELECT, WHERE, FILTER, PREFIX, etc. Other languages use Monaco's built-in language definitions.",
      table: {
        type: { summary: 'CodeLanguage' },
        defaultValue: { summary: 'plaintext' },
      },
    },
    onChange: {
      action: 'changed',
      description:
        'Callback fired when the code content is modified by the user. Receives the new code string as an argument. Called on every keystroke with debouncing handled by Monaco internally.',
      table: {
        type: { summary: '(value: string) => void' },
      },
    },
    height: {
      control: 'text',
      description:
        'Height of the editor container. Accepts any CSS height value (e.g., "400px", "50vh", "100%"). In fullscreen mode, this is overridden to fill the viewport.',
      table: {
        type: { summary: 'string | number' },
        defaultValue: { summary: '"400px"' },
      },
    },
    readOnly: {
      control: 'boolean',
      description:
        'When true, the editor is read-only and users cannot modify the code. The editor remains interactive for selection and copying. The format button is hidden in read-only mode.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    theme: {
      control: 'select',
      options: ['vs', 'vs-dark', 'hc-black'],
      description:
        'Monaco editor color theme. "vs" is the light theme, "vs-dark" is the dark theme, and "hc-black" is the high-contrast theme for accessibility.',
      table: {
        type: { summary: '"vs" | "vs-dark" | "hc-black"' },
        defaultValue: { summary: '"vs"' },
      },
    },
    showMinimap: {
      control: 'boolean',
      description:
        'Controls visibility of the minimap (code overview) on the right side of the editor. Useful for navigating large files but can be distracting for smaller code snippets.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    showLineNumbers: {
      control: 'boolean',
      description:
        'Controls visibility of line numbers in the gutter. When false, the editor displays code without line numbers for a cleaner appearance.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    label: {
      control: 'text',
      description:
        'Optional label text displayed in the toolbar above the editor. Used to provide context about what code is being edited (e.g., "SPARQL Query", "Data Processing Function").',
      table: {
        type: { summary: 'string | undefined' },
      },
    },
    copyable: {
      control: 'boolean',
      description:
        'When true, displays a copy-to-clipboard button in the toolbar. Clicking the button copies the entire editor content to the clipboard and shows a "Copied!" tooltip confirmation.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    formattable: {
      control: 'boolean',
      description:
        "When true, displays a format button in the toolbar that triggers Monaco's built-in code formatter. Only shown when readOnly is false. Formatting behavior depends on the selected language.",
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    fullscreenable: {
      control: 'boolean',
      description:
        'When true, displays a fullscreen toggle button in the toolbar. Clicking expands the editor to fill the entire viewport with a fixed position overlay. Useful for editing large code files.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    minHeight: {
      control: 'text',
      description:
        "Minimum height of the editor container. Useful for ensuring the editor doesn't collapse too small when used in flexible layouts.",
      table: {
        type: { summary: 'string | number | undefined' },
      },
    },
    placeholder: {
      control: 'text',
      description:
        'Placeholder text shown when the editor is empty. Automatically cleared when the user starts typing.',
      table: {
        type: { summary: 'string | undefined' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CodeEditor>;

const sampleSPARQL = `PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX orkgc: <http://orkg.org/orkg/class/>
PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?year (COUNT(DISTINCT ?paper) AS ?paperCount)
WHERE {
  # Find papers that are contributions to the KG-EmpiRE template
  ?contribution orkgp:P31 orkgr:R54312 .
  ?paper orkgp:P31 ?contribution .
  
  # Get publication year
  ?paper orkgp:P29 ?year .
  
  # Filter for valid years
  FILTER(BOUND(?year) && ?year != "")
}
GROUP BY ?year
ORDER BY ?year`;

const sampleJavaScript = `// Process ORKG query results for visualization
export const processQueryResults = (rawData = []) => {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const paperKey = 'paper';
  const labelKey = 'evaluation_metricLabel';
  const topK = 3;

  // Deduplicate by paper (keeps first occurrence)
  const seen = new Set();
  const rows = rawData.filter((row) => {
    const pid = String(row[paperKey] ?? '').trim();
    if (!pid || seen.has(pid)) return false;
    seen.add(pid);
    return true;
  });

  // Count occurrences per label
  const counts = new Map();
  for (const row of rows) {
    const label = String(row[labelKey] ?? '').trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  // Convert to array and sort by count
  const entries = Array.from(counts.entries()).map(([label, count]) => ({
    label,
    count,
  }));
  entries.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  // Take top K and calculate normalized ratios
  const selected = topK ? entries.slice(0, topK) : entries;
  const base = selected.reduce((s, it) => s + it.count, 0);
  
  return selected.map(({ label, count }) => ({
    label,
    count,
    normalizedRatio: base > 0 ? Number(((count * 100) / base).toFixed(3)) : 0,
  }));
};`;

const sampleTypeScript = `// Type definitions for ORKG query results
export interface RawDataItem {
  [key: string]: unknown;
}

type CommonResult = { 
  label: string; 
  count: number; 
  normalizedRatio: number 
};

export type BoxPlotItem = {
  label: string;
  values: number[];
};

type ProcessOptions = {
  paperKey: string;
  labelKey: string;
  uniqueValueKey?: string | null;
  excludeValues?: string[];
  requiredValues?: string[];
  dedupeByPaper?: boolean;
  topK?: number | null;
};

// Generic query processing function
const processQuery = (
  rawData: RawDataItem[] = [],
  opts: ProcessOptions
): CommonResult[] => {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const {
    paperKey,
    labelKey,
    uniqueValueKey = null,
    excludeValues = [],
    requiredValues = [],
    dedupeByPaper = true,
    topK = null,
  } = opts;

  // Deduplicate by paper if requested
  let rows = rawData;
  if (dedupeByPaper) {
    const seen = new Set<string>();
    rows = rawData.filter((row) => {
      const pid = String(row[paperKey] ?? '').trim();
      if (!pid || seen.has(pid)) return false;
      seen.add(pid);
      return true;
    });
  }

  // Process based on whether we're counting unique values
  if (uniqueValueKey) {
    const map = new Map<string, Set<string>>();
    for (const row of rows) {
      const label = String(row[labelKey] ?? '').trim();
      const val = String(row[uniqueValueKey] ?? '').trim();
      if (!label || !val) continue;
      if (excludeValues.includes(label) || excludeValues.includes(val)) continue;
      if (!map.has(label)) map.set(label, new Set<string>());
      map.get(label)!.add(val);
    }
    
    // Ensure required labels exist
    for (const req of requiredValues) {
      if (!map.has(req)) map.set(req, new Set<string>());
    }
    
    const entries = Array.from(map.entries()).map(([label, s]) => ({
      label,
      count: s.size,
    }));
    entries.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    const selected = topK ? entries.slice(0, topK) : entries;
    const base = selected.reduce((s, it) => s + it.count, 0);
    
    return selected.map(({ label, count }) => ({
      label,
      count,
      normalizedRatio: base > 0 ? Number(((count * 100) / base).toFixed(3)) : 0,
    }));
  }

  // Standard counting logic
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = String(row[labelKey] ?? '').trim();
    if (!label) continue;
    if (excludeValues.includes(label)) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  for (const req of requiredValues) {
    if (!counts.has(req)) counts.set(req, 0);
  }
  
  const entries = Array.from(counts.entries()).map(([label, count]) => ({
    label,
    count,
  }));
  entries.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const selected = topK ? entries.slice(0, topK) : entries;
  const base = selected.reduce((s, it) => s + it.count, 0);
  
  return selected.map(({ label, count }) => ({
    label,
    count,
    normalizedRatio: base > 0 ? Number(((count * 100) / base).toFixed(3)) : 0,
  }));
};`;

export const Default: Story = {
  args: {
    value: sampleJavaScript,
    language: 'javascript',
    height: '400px',
    label: 'Data Processing Function',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default code editor showing a realistic data processing function from the application. This function processes ORKG query results by deduplicating papers, counting occurrences, and calculating normalized ratios for visualization. Features copy-to-clipboard and format buttons in the toolbar.',
      },
    },
  },
};

export const SPARQLQuery: Story = {
  args: {
    value: sampleSPARQL,
    language: 'sparql',
    height: '400px',
    label: 'SPARQL Query Editor',
    fullscreenable: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Editor with custom SPARQL language support showing a realistic query from the application. The query analyzes empirical studies over time using ORKG-specific prefixes (orkgp, orkgc, orkgr). Features keyword highlighting for SELECT, WHERE, FILTER, PREFIX, GROUP BY, etc. Fullscreen mode is enabled for editing complex queries.',
      },
    },
  },
};

export const TypeScriptDataProcessing: Story = {
  args: {
    value: sampleTypeScript,
    language: 'typescript',
    height: '500px',
    label: 'TypeScript Data Processing Module',
    showMinimap: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'TypeScript editor showing the actual data processing helper functions from the application. Includes type definitions for RawDataItem, CommonResult, and BoxPlotItem, plus a generic processQuery function with options for deduplication, filtering, and top-K selection. Minimap is enabled for navigating the longer code file.',
      },
    },
  },
};

export const ReadOnlyMode: Story = {
  args: {
    value: sampleSPARQL,
    language: 'sparql',
    height: '350px',
    readOnly: true,
    label: 'Read-Only SPARQL Query',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Read-only editor mode used for displaying generated queries that users should not modify directly. Users can still select text, copy to clipboard, and view syntax highlighting, but cannot edit the content. The format button is hidden in read-only mode.',
      },
    },
  },
};
