import type { Meta, StoryObj } from '@storybook/react-vite';
import ChatMessage from '../../src/components/AI/ChatMessage';
import { AIAssistantProvider } from '../../src/context/AIAssistantContext';

const meta: Meta<typeof ChatMessage> = {
  title: 'AI/ChatMessage',
  component: ChatMessage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`ChatMessage` displays a chat message bubble with support for user/assistant styling, code blocks, reasoning sections, and chart rendering. Messages are styled differently based on whether they are from the user or the AI assistant. User messages appear with a red background (#e86161) and are right-aligned, while assistant messages have a white background with a border and are left-aligned. The component automatically extracts `<pre>` blocks from HTML content and renders them as interactive CodeBlock components when `showChart` is enabled.',
      },
    },
  },
  argTypes: {
    content: {
      control: 'text',
      description:
        'HTML content of the message. Supports paragraphs, lists, code blocks (`<pre>`), and inline formatting. Code blocks are automatically extracted and rendered with copy functionality when `showChart` is true. The content is parsed and processed to separate code blocks from regular text content.',
      table: {
        type: { summary: 'string (HTML)' },
      },
    },
    isUser: {
      control: 'boolean',
      description:
        'Determines message styling and alignment. When true: red background (#e86161), right-aligned, white text. When false: white background, left-aligned, dark text with border. This prop is also passed to child components (CodeBlock, MessageContent, ReasoningSection) to maintain consistent styling.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    reasoning: {
      control: 'text',
      description:
        'AI reasoning text displayed in a collapsible section at the bottom of the message. Shows the thought process behind the AI response. Only visible when `showReasoning` is true. Typically contains step-by-step analysis of how the AI approached the query.',
      table: {
        type: { summary: 'string | undefined' },
      },
    },
    showReasoning: {
      control: 'boolean',
      description:
        'Controls visibility of the reasoning section. When true and `reasoning` prop is provided, displays the ReasoningSection component. Typically toggled via the PsychologyIcon button in the AIAssistant header.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    chartHtml: {
      control: 'text',
      description:
        'HTML string containing Chart.js configuration for rendering interactive charts. The component extracts the chart config from a `new Chart()` call pattern and renders it in a canvas element. Chart height adjusts based on the expanded state of the AIAssistant (200px collapsed, 400px expanded).',
      table: {
        type: { summary: 'string | undefined' },
      },
    },
    showChart: {
      control: 'boolean',
      description:
        'Controls visibility of code blocks and charts. When true: `<pre>` blocks in content are rendered as CodeBlock components with copy functionality, and `chartHtml` is rendered as an interactive Chart.js chart. When false, code blocks remain as plain HTML.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
  decorators: [
    (Story) => (
      <AIAssistantProvider>
        <div style={{ maxWidth: '800px', padding: '20px' }}>
          <Story />
        </div>
      </AIAssistantProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatMessage>;

// user message asking about ORKG data analysis
const userMessageContent = `<p>Can you analyze the publication trends for machine learning papers in the ORKG knowledge graph from 2020 to 2023? I'd like to see how the research output has evolved over time.</p>`;

// assistant message with ORKG analysis results
const assistantMessageContent = `<p>Based on my analysis of the ORKG knowledge graph data, here are the key findings about machine learning publication trends:</p>
<ul>
  <li><strong>2020:</strong> 1,245 papers published</li>
  <li><strong>2021:</strong> 1,567 papers published (+26% year-over-year growth)</li>
  <li><strong>2022:</strong> 2,103 papers published (+34% year-over-year growth)</li>
  <li><strong>2023:</strong> 2,891 papers published (+37% year-over-year growth)</li>
</ul>
<p>The data shows a consistent upward trend with accelerating growth rates. The total increase from 2020 to 2023 represents a <strong>132% growth</strong> in machine learning research output indexed in ORKG.</p>
<p>Key observations:</p>
<ol>
  <li>Natural Language Processing papers show the highest growth rate (45%)</li>
  <li>Computer Vision maintains steady growth at approximately 30% annually</li>
  <li>Reinforcement Learning papers doubled between 2022-2023</li>
</ol>`;

// Message with SPARQL query for ORKG
const messageWithSparqlContent = `<p>I'll query the ORKG knowledge graph to fetch the publication data. Here's the SPARQL query I'm using:</p>
<pre>
PREFIX orkgr: &lt;http://orkg.org/orkg/resource/&gt;
PREFIX orkgp: &lt;http://orkg.org/orkg/predicate/&gt;
PREFIX rdfs: &lt;http://www.w3.org/2000/01/rdf-schema#&gt;

SELECT ?year (COUNT(DISTINCT ?paper) AS ?paperCount)
WHERE {
  ?paper a orkgr:Paper ;
         rdfs:label ?title ;
         orkgp:P29 ?year .
  
  # Filter for machine learning related papers
  FILTER(CONTAINS(LCASE(?title), "machine learning") || 
         CONTAINS(LCASE(?title), "deep learning") ||
         CONTAINS(LCASE(?title), "neural network"))
  
  # Filter for years 2020-2023
  FILTER(?year &gt;= "2020" &amp;&amp; ?year &lt;= "2023")
}
GROUP BY ?year
ORDER BY ?year
</pre>
<p>This query groups papers by publication year and counts distinct papers containing machine learning related terms in their titles.</p>`;

export const UserMessage: Story = {
  args: {
    content: userMessageContent,
    isUser: true,
    showChart: false,
    showReasoning: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A message from the user asking about ORKG data analysis. Displayed with red background (#e86161), white text, and right-aligned. User messages typically contain questions or requests for the AI assistant.',
      },
    },
  },
};

export const AssistantMessage: Story = {
  args: {
    content: assistantMessageContent,
    isUser: false,
    showChart: false,
    showReasoning: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A response from the AI assistant with ORKG analysis results. Displayed with white background, dark text, border, and left-aligned. Contains formatted HTML with lists and emphasis for presenting research findings.',
      },
    },
  },
};

export const WithSparqlQuery: Story = {
  args: {
    content: messageWithSparqlContent,
    isUser: false,
    showChart: true,
    showReasoning: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'An assistant message containing a SPARQL query for the ORKG endpoint. When `showChart` is true, the `<pre>` block is rendered as an interactive CodeBlock component with copy-to-clipboard functionality. This is the typical format for showing query code to users.',
      },
    },
  },
};
