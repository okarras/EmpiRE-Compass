import type { Meta, StoryObj } from '@storybook/react-vite';
import AboutProject from '../../src/components/Home/AboutProject';

const meta: Meta<typeof AboutProject> = {
  title: 'Pages/AboutProject',
  component: AboutProject,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `AboutProject` component introduces the purpose and scope of the EmpiRE-Compass dashboard. It outlines the structure of the underlying knowledge graph and the six key thematic areas it captures.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AboutProject>;

export const Default: Story = {
  render: () => <AboutProject />,
  parameters: {
    docs: {
      description: {
        story:
          'This story displays the styled AboutProject section, including animated hover effects and a responsive layout. It lists six core themes captured by the KG-EmpiRE knowledge graph.',
      },
    },
  },
};
