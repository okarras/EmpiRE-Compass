import type { Meta, StoryObj } from '@storybook/react-vite';
import LoadingState from '../../src/components/LoadingState';

// Meta configuration
const meta: Meta<typeof LoadingState> = {
  title: 'Feedback/LoadingState',
  component: LoadingState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `LoadingState` component is a simple placeholder UI indicating that data is being loaded. It includes a circular progress spinner and a text message, and is centered with spacing.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingState>;

// Default loading state
export const Default: Story = {
  render: () => <LoadingState />,
  parameters: {
    docs: {
      description: {
        story: 'Displays the default loading UI used across the application.',
      },
    },
  },
};
