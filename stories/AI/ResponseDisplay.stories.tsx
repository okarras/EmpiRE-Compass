import type { Meta, StoryObj } from '@storybook/react';
import ResponseDisplay from '../../src/components/AI/ResponseDisplay';

const meta: Meta<typeof ResponseDisplay> = {
  title: 'Components/ResponseDisplay',
  component: ResponseDisplay,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`ResponseDisplay` renders AI-generated HTML content within a styled `Paper` component. It uses `HTMLRenderer` to support rich formatting (headings, lists, code, etc.). Returns `null` if `content` is not provided.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResponseDisplay>;

const mockHTML = `
  <p>The analysis suggests a <strong>positive trend</strong> in empirical research practices across the decade.</p>
  <ol>
    <li>Pre-2010: limited adoption</li>
    <li>2010–2019: steady increase</li>
    <li>2020–2023: near-complete adoption (~95%)</li>
  </ol>
  <blockquote>
    "Empirical studies are now central to software engineering."
  </blockquote>
`;

export const Default: Story = {
  args: {
    content: mockHTML,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Displays formatted AI output with lists, blockquote, and emphasis.',
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
        story: 'Renders nothing if the content is null.',
      },
    },
  },
};
