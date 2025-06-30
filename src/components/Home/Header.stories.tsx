import type { Meta, StoryObj } from '@storybook/react';
import Header from './Header';

const meta: Meta<typeof Header> = {
  title: 'Pages/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `Header` component introduces the EmpiRE-Compass dashboard with a bold title and a descriptive subtitle. It is fully responsive and designed for homepage or section headers.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  render: () => <Header />,
  parameters: {
    docs: {
      description: {
        story:
          'This story shows the responsive `Header` for the EmpiRE-Compass dashboard, featuring a large title and a concise subtitle centered within the layout.',
      },
    },
  },
};