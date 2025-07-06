import type { Meta, StoryObj } from '@storybook/react';
import ErrorState from '../../src/components/ErrorState';

const meta: Meta<typeof ErrorState> = {
  title: 'Feedback/ErrorState',
  component: ErrorState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `ErrorState` component displays an error message in a styled Paper component. It is used to inform users when data fetching fails or an unexpected issue occurs.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

export const Default: Story = {
  args: {
    message: 'Failed to load data.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Displays the `ErrorState` with a sample error message. The component also includes secondary guidance for users to retry or contact support.',
      },
    },
  },
};
