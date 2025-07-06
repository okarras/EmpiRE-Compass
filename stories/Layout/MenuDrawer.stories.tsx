import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import MenuDrawer from '../../src/components/MenuDrawer';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ✅ Storybook meta definition
const meta: Meta<typeof MenuDrawer> = {
  title: 'Layout/MenuDrawer',
  component: MenuDrawer,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="*" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The `MenuDrawer` is a persistent side drawer for navigating between key routes and individual research questions. It uses MUI components and tooltips, and supports highlighting the active route.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MenuDrawer>;

// ✅ Basic interactive story
export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <>
        <button onClick={() => setOpen(!open)} style={{ margin: '1rem' }}>
          Toggle Drawer
        </button>
        <MenuDrawer open={open} handleDrawerClose={() => setOpen(false)} />
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the `MenuDrawer` component in an open state with toggle interaction. It is wrapped in a `MemoryRouter` for route awareness simulation.',
      },
    },
  },
};
