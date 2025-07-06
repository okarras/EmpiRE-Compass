import type { Meta, StoryObj } from '@storybook/react';
import Partners from '../../src/components/Home/Partners';

// Note: You must ensure your Storybook is configured to handle image imports (e.g., with file-loader or Vite asset support)

const meta: Meta<typeof Partners> = {
  title: 'Pages/Partners',
  component: Partners,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `Partners` component visually highlights the key contributors to the EmpiRE-Compass project, including logos and direct links to their websites. It uses `StatCard` as a wrapper for logos and hover effects.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Partners>;

export const Default: Story = {
  render: () => <Partners />,
  parameters: {
    docs: {
      description: {
        story:
          'Renders project partners TIB, ORKG, and ORKG Ask, each inside a `StatCard` with logo, link, and responsive layout. Ensure logos are accessible for full visual display.',
      },
    },
  },
};
