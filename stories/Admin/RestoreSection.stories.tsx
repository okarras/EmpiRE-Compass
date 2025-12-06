import type { Meta, StoryObj } from '@storybook/react-vite';
import RestoreSection from '../../src/components/Admin/RestoreSection';

const meta: Meta<typeof RestoreSection> = {
  title: 'Admin/RestoreSection',
  component: RestoreSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`RestoreSection` handles the database restore functionality. It shows different states based on whether the database has data or needs to be restored from a backup file.',
      },
    },
  },
  argTypes: {
    hasData: {
      control: 'boolean',
      description: 'Whether the database already has data',
    },
    restoring: {
      control: 'boolean',
      description: 'Whether a restore operation is in progress',
    },
    restoreProgress: {
      description: 'Progress information during restore operation',
    },
    onRestoreFromBackup: {
      action: 'restore from backup',
      description: 'Callback fired when a backup file is selected for restore',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RestoreSection>;

export const EmptyDatabase: Story = {
  args: {
    hasData: false,
    restoring: false,
    restoreProgress: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the restore interface when the database is empty and needs to be populated. Users can upload a backup JSON file to restore the database.',
      },
    },
  },
};

export const Restoring: Story = {
  args: {
    hasData: false,
    restoring: true,
    restoreProgress: {
      currentStep: 'Processing templates...',
      templatesProcessed: 2,
      questionsProcessed: 15,
      statisticsProcessed: 8,
      usersProcessed: 0,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the restore progress with status chips indicating how many items have been processed. The current step is displayed along with counts for templates, questions, statistics, and users.',
      },
    },
  },
};
