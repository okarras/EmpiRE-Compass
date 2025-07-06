import type { Meta, StoryObj } from '@storybook/react';
import InitialAnalysis from './InitialAnalysis';

const meta: Meta<typeof InitialAnalysis> = {
  title: 'Components/InitialAnalysis',
  component: InitialAnalysis,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`InitialAnalysis` displays AI-generated HTML insights inside a styled `Paper`. It uses `HTMLRenderer` internally to format rich content such as lists, code, tables, and more. If no content is provided, it renders nothing.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof InitialAnalysis>;

const exampleHTML = `
  <p><strong>Initial Insight:</strong> Based on the dataset, the proportion of empirical studies has increased steadily over the last decade.</p>
  <ul>
    <li><em>Before 2010</em>: average ~60%</li>
    <li><em>2010–2019</em>: average ~80%</li>
    <li><em>2020–2023</em>: average ~90%</li>
  </ul>
`;

export const Default: Story = {
  args: {
    content: exampleHTML,
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders the initial HTML-based AI analysis in a styled box.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    content: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'If `content` is `null`, the component renders nothing.',
      },
    },
  },
};
