import type { Meta, StoryObj } from '@storybook/react';
import HTMLRenderer from './HTMLRenderer';

const meta: Meta<typeof HTMLRenderer> = {
  title: 'Components/HTMLRenderer',
  component: HTMLRenderer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`HTMLRenderer` safely renders sanitized HTML content using `dangerouslySetInnerHTML`. It supports various HTML elements like headings, paragraphs, lists, code blocks, and tables, with custom MUI styling applied via `sx`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof HTMLRenderer>;

// Sample HTML content
const sampleHTML = `
  <h1>Empirical Software Engineering</h1>
  <p>This area of research focuses on studying how software is developed in the real world using <code>data-driven</code> methods.</p>
  <h2>Key Concepts</h2>
  <ul>
    <li>Data Collection</li>
    <li>Data Analysis</li>
    <li>Reproducibility</li>
  </ul>
  <blockquote>
    "Empirical studies are essential to validate software engineering practices."
  </blockquote>
  <pre><code>const isEmpirical = true;</code></pre>
  <h3>Publication Table</h3>
  <table>
    <thead>
      <tr>
        <th>Year</th>
        <th>Papers</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>2020</td>
        <td>45</td>
      </tr>
      <tr>
        <td>2021</td>
        <td>63</td>
      </tr>
    </tbody>
  </table>
`;

export const Default: Story = {
  args: {
    content: sampleHTML,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Displays HTML content with styling for headings, lists, code blocks, tables, and more.',
      },
    },
  },
};