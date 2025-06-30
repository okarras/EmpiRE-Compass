import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import Header from './Header';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/questions/1']}>
        <ThemeProvider>
          <Routes>
            <Route path="*" element={<Story />} />
          </Routes>
        </ThemeProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The `Header` component is a responsive top navigation bar featuring breadcrumbs, a drawer toggle, and light/dark mode switching. It adapts to mobile devices and reflects the current route dynamically.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {
    handleDrawerOpen: () => alert('Drawer opened!'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story shows the `Header` component in a typical context where it displays breadcrumbs and toggles the color mode. It uses a mocked router location of `/questions/1`.',
      },
    },
  },
};