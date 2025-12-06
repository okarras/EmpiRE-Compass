import type { Meta, StoryObj } from '@storybook/react-vite';
import CodeBlock from '../../src/components/AI/CodeBlock';

const meta: Meta<typeof CodeBlock> = {
  title: 'AI/CodeBlock',
  component: CodeBlock,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`CodeBlock` displays formatted code with a copy-to-clipboard button. The component renders code in a monospace font with syntax preservation and includes a floating copy button in the top-right corner. Styling adapts based on whether the code appears in a user or assistant message context. The copy button shows a checkmark icon for 2 seconds after successful copy.',
      },
    },
  },
  argTypes: {
    content: {
      control: 'text',
      description:
        'The code content to display. Rendered in a monospace font with `white-space: pre-wrap` for syntax preservation. Supports any text content including SPARQL queries, JavaScript, Python, SQL, etc. The content is displayed inside a `<pre><code>` block with a maximum height of 400px and scrollable overflow.',
      table: {
        type: { summary: 'string' },
      },
    },
    isUser: {
      control: 'boolean',
      description:
        'Affects the visual styling of the code block to maintain contrast with the parent message. When true: lighter background (`rgba(255,255,255,0.1)`) and white copy button for contrast against user message red background. When false: darker background (`rgba(0,0,0,0.05)`) and dark copy button for assistant messages with white background.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

// SPARQL query for ORKG knowledge graph
const sparqlQueryCode = `PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?paper ?title ?year ?venue
WHERE {
  ?paper a orkgr:Paper ;
         rdfs:label ?title ;
         orkgp:P29 ?year ;
         orkgp:P30 ?venue .
  
  FILTER(?year >= "2020")
  FILTER(CONTAINS(LCASE(?title), "machine learning"))
}
ORDER BY DESC(?year)
LIMIT 100`;

// Data processing JavaScript code used in ORKG analysis
const dataProcessingCode = `// Process ORKG SPARQL query results for visualization
const processQueryResults = (queryResults) => {
  // Transform raw SPARQL bindings to structured data
  const processedData = queryResults.results.bindings.map(item => ({
    id: item.paper.value.split('/').pop(),
    title: item.title.value,
    year: parseInt(item.year.value),
    venue: item.venue?.value || 'Unknown'
  }));

  // Group papers by year for trend analysis
  const groupedByYear = processedData.reduce((acc, paper) => {
    const year = paper.year;
    if (!acc[year]) {
      acc[year] = { count: 0, papers: [] };
    }
    acc[year].count++;
    acc[year].papers.push(paper);
    return acc;
  }, {});

  // Calculate year-over-year growth rates
  const years = Object.keys(groupedByYear).sort();
  const trendData = years.map((year, index) => {
    const currentCount = groupedByYear[year].count;
    const previousCount = index > 0 ? groupedByYear[years[index - 1]].count : currentCount;
    const growthRate = index > 0 ? ((currentCount - previousCount) / previousCount * 100).toFixed(1) : 0;
    
    return {
      year: parseInt(year),
      count: currentCount,
      growthRate: parseFloat(growthRate)
    };
  });

  return { processedData, groupedByYear, trendData };
};`;

// Complex SPARQL query with aggregation
const complexSparqlQuery = `PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?researchField (COUNT(DISTINCT ?paper) AS ?paperCount) 
       (AVG(?citationCount) AS ?avgCitations)
WHERE {
  ?paper a orkgr:Paper ;
         rdfs:label ?title ;
         orkgp:P29 ?year ;
         orkgp:P32 ?researchField .
  
  OPTIONAL {
    ?paper orkgp:P33 ?citationCount .
  }
  
  # Filter for recent papers (2020-2024)
  FILTER(?year >= "2020"^^xsd:gYear && ?year <= "2024"^^xsd:gYear)
  
  # Focus on empirical research
  FILTER(EXISTS { ?paper orkgp:P31 orkgr:EmpiricalStudy })
}
GROUP BY ?researchField
HAVING (COUNT(DISTINCT ?paper) > 10)
ORDER BY DESC(?paperCount)
LIMIT 20`;

// Simple code snippet
const simpleCode = `const result = await fetch('https://orkg.org/api/papers');
const papers = await result.json();
console.log(\`Found \${papers.length} papers\`);`;

export const Default: Story = {
  args: {
    content: simpleCode,
    isUser: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default code block with assistant styling. Uses a light gray background (`rgba(0,0,0,0.05)`) that provides good contrast on white assistant message backgrounds. The copy button appears in the top-right corner.',
      },
    },
  },
};

export const SparqlQuery: Story = {
  args: {
    content: sparqlQueryCode,
    isUser: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Code block displaying a SPARQL query for the ORKG knowledge graph. This is the most common use case in the AI assistant, showing queries that fetch paper metadata, filter by year, and search by title keywords.',
      },
    },
  },
};

export const DataProcessing: Story = {
  args: {
    content: dataProcessingCode,
    isUser: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Code block showing JavaScript data processing code. Demonstrates how SPARQL query results are transformed for visualization, including grouping by year and calculating growth rates. This type of code is shown when the AI explains its data processing logic.',
      },
    },
  },
};
