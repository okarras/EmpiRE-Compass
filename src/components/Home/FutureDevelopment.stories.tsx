import type { Meta, StoryObj } from '@storybook/react';
import FutureDevelopment from './FutureDevelopment';

const meta: Meta<typeof FutureDevelopment> = {
  title: 'Pages/FutureDevelopment',
  component: FutureDevelopment,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `FutureDevelopment` component outlines the project’s roadmap across short-, mid-, and long-term phases. Each phase includes a concise description of its intended goal, rendered in a styled card layout.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FutureDevelopment>;

export const Default: Story = {
  render: () => <FutureDevelopment />,
  parameters: {
    docs: {
      description: {
        story:
          'This story showcases the development roadmap of the project, presented as a responsive and structured list with distinct color-coded headings for each phase.',
      },
    },
  },
};