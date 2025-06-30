import type { Meta, StoryObj } from '@storybook/react';
import Contact from './Contact';

const meta: Meta<typeof Contact> = {
  title: 'Pages/Contact',
  component: Contact,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `Contact` component displays the contact details for Dr. Oliver Karras, including institutional affiliation, address, and email. It uses Material UI styling with a subtle hover animation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Contact>;

export const Default: Story = {
  render: () => <Contact />,
  parameters: {
    docs: {
      description: {
        story:
          'This story renders the `Contact` section with Dr. Oliver Karras’s information. It uses a responsive layout and soft background accents for visual hierarchy.',
      },
    },
  },
};