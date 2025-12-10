import type { Meta, StoryObj } from '@storybook/react-vite';
import InstructionsCard from '../../src/components/Admin/InstructionsCard';

const meta: Meta<typeof InstructionsCard> = {
  title: 'Admin/InstructionsCard',
  component: InstructionsCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`InstructionsCard` displays a helpful guide card explaining how to use the Admin panel. It provides step-by-step instructions for restoring data, selecting templates, editing questions, managing statistics, and import/export functionality.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof InstructionsCard>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default instructions card showing all usage steps for the Admin panel.',
      },
    },
  },
};
