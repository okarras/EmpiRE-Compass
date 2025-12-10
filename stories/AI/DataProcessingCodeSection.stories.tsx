import type { Meta, StoryObj } from '@storybook/react-vite';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DataProcessingCodeSection from '../../src/components/AI/DataProcessingCodeSection';
import { DynamicQuestionProvider } from '../../src/context/DynamicQuestionContext';
import questionReducer from '../../src/store/slices/questionSlice';
import aiReducer from '../../src/store/slices/aiSlice';

// mock store for Storybook
const mockStore = configureStore({
  reducer: {
    questions: questionReducer,
    ai: aiReducer,
  },
});

const meta: Meta<typeof DataProcessingCodeSection> = {
  title: 'AI/DataProcessingCodeSection',
  component: DataProcessingCodeSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`DataProcessingCodeSection` displays and manages a JavaScript data processing function that transforms SPARQL query results for visualization. It supports manual editing via a code editor, AI-assisted modifications through a dialog interface, code regeneration, and version history tracking. The component is typically used in the dynamic question workflow to transform raw ORKG query results into chart-ready data formats.',
      },
    },
  },
  argTypes: {
    processingCode: {
      control: 'text',
      description:
        'The JavaScript code string for the data processing function. Must follow the signature `function processData(rows)` where `rows` is an array of SPARQL result bindings. The function should return an array of objects suitable for Chart.js visualization. When null or undefined, the component renders nothing.',
      table: {
        type: { summary: 'string | null' },
        defaultValue: { summary: 'null' },
      },
    },
    loading: {
      control: 'boolean',
      description:
        'Controls the loading state of the regenerate button. When true, displays a CircularProgress spinner on the regenerate button and disables it. Used during AI code generation or when fetching new processing functions.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onCodeChange: {
      action: 'codeChanged',
      description:
        'Callback fired when the processing code is modified, either through manual editing or AI modification. Receives the new code string as the argument. The parent component should update its state and potentially re-run the data processing pipeline.',
      table: {
        type: { summary: '(code: string) => void | Promise<void>' },
      },
    },
    onRegenerateCode: {
      action: 'regenerateCode',
      description:
        'Callback fired when the user clicks the regenerate button (Refresh icon). Triggers the parent component to generate a new processing function, typically using AI based on the current research question and query results.',
      table: {
        type: { summary: '() => void' },
      },
    },
    onOpenHistory: {
      action: 'openHistory',
      description:
        'Optional callback fired when the user clicks the history button. Opens a dialog showing previous versions of the processing function with the ability to restore any version. The component also has its own internal history dialog.',
      table: {
        type: { summary: "(type: 'processing') => void" },
      },
    },
  },
  decorators: [
    (Story) => (
      <Provider store={mockStore}>
        <DynamicQuestionProvider>
          <div style={{ maxWidth: '900px', padding: '20px' }}>
            <Story />
          </div>
        </DynamicQuestionProvider>
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DataProcessingCodeSection>;

// data processing function for counting papers by year from ORKG SPARQL results
const papersByYearProcessingCode = `function processData(rows) {
  // Validate input - SPARQL results come as array of binding objects
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return [];
  }
  
  // Group papers by publication year and count
  const yearCounts = {};
  rows.forEach(row => {
    // SPARQL bindings have .value property for literal values
    const year = row.year?.value || row.publicationYear?.value || 'Unknown';
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });
  
  // Transform to Chart.js compatible format
  return Object.entries(yearCounts)
    .map(([year, count]) => ({
      year: parseInt(year) || year,
      count: count,
      label: year.toString()
    }))
    .filter(item => !isNaN(item.year))
    .sort((a, b) => a.year - b.year);
}`;

// Complex processing function for venue statistics from ORKG data
const venueStatisticsProcessingCode = `function processData(rows) {
  // Validate input from SPARQL query results
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return [];
  }
  
  // Extract and normalize paper data from SPARQL bindings
  const papers = rows.map(row => ({
    title: row.title?.value || row.label?.value || 'Untitled',
    year: parseInt(row.year?.value || row.publicationYear?.value) || null,
    venue: row.venue?.value || row.publishedIn?.value || 'Unknown Venue',
    citations: parseInt(row.citations?.value || row.citationCount?.value) || 0,
    doi: row.doi?.value || null
  })).filter(p => p.year !== null);
  
  // Group by venue and calculate statistics
  const venueStats = {};
  papers.forEach(paper => {
    if (!venueStats[paper.venue]) {
      venueStats[paper.venue] = {
        venue: paper.venue,
        paperCount: 0,
        totalCitations: 0,
        years: new Set(),
        papers: []
      };
    }
    venueStats[paper.venue].paperCount++;
    venueStats[paper.venue].totalCitations += paper.citations;
    venueStats[paper.venue].years.add(paper.year);
    venueStats[paper.venue].papers.push(paper);
  });
  
  // Transform to visualization-ready format
  return Object.values(venueStats)
    .map(stat => ({
      venue: stat.venue.length > 30 
        ? stat.venue.substring(0, 27) + '...' 
        : stat.venue,
      fullVenue: stat.venue,
      paperCount: stat.paperCount,
      avgCitations: Math.round(stat.totalCitations / stat.paperCount),
      totalCitations: stat.totalCitations,
      yearRange: \`\${Math.min(...stat.years)}-\${Math.max(...stat.years)}\`,
      yearSpan: Math.max(...stat.years) - Math.min(...stat.years) + 1
    }))
    .sort((a, b) => b.paperCount - a.paperCount)
    .slice(0, 15); // Top 15 venues for readability
}`;

export const Default: Story = {
  args: {
    processingCode: papersByYearProcessingCode,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default view showing a typical data processing function that transforms SPARQL query results into year-based paper counts. The function handles ORKG binding format where values are accessed via `.value` property. Includes input validation and sorting by year.',
      },
    },
  },
};

export const VenueStatistics: Story = {
  args: {
    processingCode: venueStatisticsProcessingCode,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A more complex processing function that calculates venue-level statistics from ORKG paper data. Demonstrates grouping, aggregation (average citations, year ranges), and data truncation for visualization. This pattern is common when analyzing publication venues in the knowledge graph.',
      },
    },
  },
};
