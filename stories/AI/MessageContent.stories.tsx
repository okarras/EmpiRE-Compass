import type { Meta, StoryObj } from '@storybook/react-vite';
import MessageContent from '../../src/components/AI/MessageContent';

const meta: Meta<typeof MessageContent> = {
  title: 'AI/MessageContent',
  component: MessageContent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`MessageContent` renders HTML content within chat messages with comprehensive styling for various HTML elements. Supports paragraphs, ordered/unordered lists, links, images, blockquotes, inline code, and tables. All styling adapts based on user vs assistant context to maintain proper contrast and visual consistency. Content is rendered using `dangerouslySetInnerHTML` for full HTML support.',
      },
    },
  },
  argTypes: {
    content: {
      control: 'text',
      description:
        'HTML content to render. Supports a wide range of HTML elements including: `<p>` paragraphs, `<ul>`/`<ol>` lists, `<a>` links, `<img>` images, `<blockquote>` quotes, `<code>` inline code, and `<table>` tables. Each element type has specific styling applied via MUI sx prop.',
      table: {
        type: { summary: 'string (HTML)' },
      },
    },
    isUser: {
      control: 'boolean',
      description:
        'Determines styling for proper contrast with parent message background. When true: white links, semi-transparent white borders/backgrounds for code and tables. When false: primary color links, gray borders/backgrounds. Affects: link color, blockquote border, code background, table borders and header background.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MessageContent>;

// ORKG analysis response
const simpleContent = `
<p>Based on my analysis of the ORKG knowledge graph, I found <strong>127 papers</strong> matching your criteria for machine learning research published between 2020 and 2023.</p>
<p>The data shows a consistent upward trend in publication volume.</p>
`;

// Content with lists showing ORKG findings
const listContent = `
<p>Here's a summary of the machine learning publication trends from the ORKG knowledge graph:</p>
<ul>
  <li><strong>2020:</strong> 1,245 papers published</li>
  <li><strong>2021:</strong> 1,567 papers published (+26% growth)</li>
  <li><strong>2022:</strong> 2,103 papers published (+34% growth)</li>
  <li><strong>2023:</strong> 2,891 papers published (+37% growth)</li>
</ul>
<p>Key observations:</p>
<ol>
  <li>Natural Language Processing papers show the highest growth rate (45%)</li>
  <li>Computer Vision maintains steady growth at approximately 30% annually</li>
  <li>Reinforcement Learning papers doubled between 2022-2023</li>
</ol>
<p>For more details, visit the <a href="https://orkg.org">ORKG website</a>.</p>
`;

// Content with table showing research statistics
const tableContent = `
<p>The SPARQL query returned the following publication statistics by research field:</p>
<table>
  <thead>
    <tr>
      <th>Research Field</th>
      <th>Papers</th>
      <th>Avg Citations</th>
      <th>Growth Rate</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Natural Language Processing</td>
      <td>342</td>
      <td>45.2</td>
      <td>+45%</td>
    </tr>
    <tr>
      <td>Computer Vision</td>
      <td>287</td>
      <td>38.7</td>
      <td>+30%</td>
    </tr>
    <tr>
      <td>Reinforcement Learning</td>
      <td>156</td>
      <td>52.1</td>
      <td>+89%</td>
    </tr>
    <tr>
      <td>Graph Neural Networks</td>
      <td>98</td>
      <td>61.3</td>
      <td>+67%</td>
    </tr>
  </tbody>
</table>
<p>The data indicates strong growth across all major ML subfields.</p>
`;

export const Default: Story = {
  args: {
    content: simpleContent,
    isUser: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default message content with assistant styling. Simple paragraphs with bold text showing basic ORKG analysis results.',
      },
    },
  },
};

export const WithLists: Story = {
  args: {
    content: listContent,
    isUser: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Message content with both unordered and ordered lists, plus a link. Shows typical AI response format with bullet points for data and numbered lists for observations.',
      },
    },
  },
};

export const WithTable: Story = {
  args: {
    content: tableContent,
    isUser: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Message content with a data table showing research statistics. Tables have styled headers with gray background and proper borders for readability.',
      },
    },
  },
};
