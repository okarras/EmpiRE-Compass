import type { Meta, StoryObj } from '@storybook/react-vite';
import StatisticsTab from '../../src/components/Admin/StatisticsTab';
import { StatisticData } from '../../src/firestore/TemplateManagement';

// mock statistics data matching actual ORKG/Firestore structure
const mockStatistics: StatisticData[] = [
  {
    id: 'PAPERS_BY_YEAR',
    name: 'Papers Published Per Year',
    description:
      'Counts the total number of papers in the KG-EmpiRE knowledge graph grouped by publication year. Used to visualize publication trends over time.',
    sparqlQuery: `PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?year (COUNT(DISTINCT ?paper) AS ?count)
WHERE {
  ?paper orkgp:P31 orkgr:R12345 ;
         orkgp:P29 ?year ;
         rdfs:label ?label .
  FILTER(BOUND(?year))
}
GROUP BY ?year
ORDER BY ?year`,
  },
  {
    id: 'UNIQUE_AUTHORS',
    name: 'Unique Authors Count',
    description:
      'Counts the number of unique authors across all papers in the knowledge graph.',
    sparqlQuery: `PREFIX orkgp: <http://orkg.org/orkg/predicate/>

SELECT (COUNT(DISTINCT ?author) AS ?count)
WHERE {
  ?paper orkgp:P27 ?author .
  FILTER(BOUND(?author))
}`,
  },
  {
    id: 'PUBLICATION_VENUES',
    name: 'Publication Venues',
    description:
      'Counts the number of distinct publication venues (conferences, journals) in the knowledge graph.',
    sparqlQuery: `PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT (COUNT(DISTINCT ?venue) AS ?count)
WHERE {
  ?paper orkgp:P28 ?venueResource .
  ?venueResource rdfs:label ?venue .
}`,
  },
  {
    id: 'RESEARCH_METHODS',
    name: 'Research Methods Distribution',
    description:
      'Analyzes the distribution of research methods used across empirical studies.',
    sparqlQuery: `PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?method (COUNT(DISTINCT ?paper) AS ?count)
WHERE {
  ?paper orkgp:P31 orkgr:R12345 ;
         orkgp:P32 ?methodResource .
  ?methodResource rdfs:label ?method .
}
GROUP BY ?method
ORDER BY DESC(?count)`,
  },
  {
    id: 'TOTAL_RESOURCES',
    name: 'Total Resources',
    sparqlQuery: `SELECT (COUNT(DISTINCT ?resource) AS ?count)
WHERE {
  ?resource ?p ?o .
}`,
  },
];

const meta: Meta<typeof StatisticsTab> = {
  title: 'Admin/StatisticsTab',
  component: StatisticsTab,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "`StatisticsTab` displays a list of statistical SPARQL queries in an accordion format within the admin panel. Each statistic is shown as an expandable accordion item displaying its name, ID chip, description (if available), and the full SPARQL query. The component provides Add, Edit, and Delete actions for managing statistics. Statistics are stored in Firestore under the template's Statistics subcollection.",
      },
    },
  },
  argTypes: {
    statistics: {
      control: 'object',
      description:
        'Array of StatisticData objects to display. Each object must have id (unique identifier), name (display name), sparqlQuery (the SPARQL query string), and optionally description. The statistics are rendered as accordion items that can be expanded to view details.',
      table: {
        type: { summary: 'StatisticData[]' },
      },
    },
    loading: {
      control: 'boolean',
      description:
        'When true, displays a LinearProgress indicator instead of the statistics list. Used while fetching statistics from Firestore or during save/delete operations.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onAddStatistic: {
      action: 'add statistic clicked',
      description:
        'Callback fired when the "Add Statistic" button is clicked. The parent component should open the StatisticEditDialog in create mode (with statistic prop set to null).',
      table: {
        type: { summary: '() => void' },
      },
    },
    onEditStatistic: {
      action: 'edit statistic',
      description:
        'Callback fired when the Edit button is clicked for a specific statistic. Receives the complete StatisticData object. The parent component should open the StatisticEditDialog with this statistic for editing.',
      table: {
        type: { summary: '(statistic: StatisticData) => void' },
      },
    },
    onDeleteStatistic: {
      action: 'delete statistic',
      description:
        'Callback fired when the Delete button is clicked for a specific statistic. Receives the statistic ID string. The parent component should confirm deletion and then remove the statistic from Firestore.',
      table: {
        type: { summary: '(statisticId: string) => void' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatisticsTab>;

export const Default: Story = {
  args: {
    statistics: mockStatistics,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Statistics tab with multiple statistics displayed in accordion format. Each accordion shows the statistic name and ID chip in the summary, and expands to reveal the description and SPARQL query with action buttons (Edit, Delete). Includes statistics with and without descriptions.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    statistics: [],
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Statistics tab with no statistics configured. Only the "Add Statistic" button is visible, allowing administrators to create the first statistic for a template.',
      },
    },
  },
};
