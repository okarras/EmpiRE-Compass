import type { Meta, StoryObj } from '@storybook/react';
import KeyFeatures from './KeyFeatures';

const meta: Meta<typeof KeyFeatures> = {
  title: 'Pages/KeyFeatures',
  component: KeyFeatures,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `KeyFeatures` component lists and highlights the main strengths of the EmpiRE-Compass dashboard. It uses a clean Paper layout with animated hover behavior and responsive typography.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof KeyFeatures>;

export const Default: Story = {
  render: () => <KeyFeatures />,
  parameters: {
    docs: {
      description: {
        story:
          'Displays the key features of EmpiRE-Compass, including its community-driven model, FAIR principles, analytical depth, and institutional support.',
      },
    },
  },
};