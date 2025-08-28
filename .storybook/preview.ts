import type { Preview } from '@storybook/react-vite';
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';

// Create theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#c0392b',
    },
    secondary: {
      main: '#2c3e50',
    },
  },
});

const preview: Preview = {
  parameters: {
    // Controls panel configuration
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
      sort: 'requiredFirst',
    },

    // Documentation configuration
    docs: {
      toc: {
        contentsSelector: '.sbdocs-content',
        headingSelector: 'h1, h2, h3',
        title: 'Table of Contents',
        disable: false,
      },
    },

    // Layout configuration
    layout: 'centered',

    // Accessibility testing
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },

    // Options panel
    options: {
      storySort: {
        order: [
          'Introduction',
          'Layout',
          'Home',
          'Data Visualization',
          'AI Components',
          'Utility',
          '*',
        ],
      },
    },
  },

  // Global decorators
  decorators: [
    (Story) =>
      React.createElement(
        ThemeProvider,
        { theme },
        React.createElement(CssBaseline),
        React.createElement(
          'div',
          { style: { margin: '1rem', fontFamily: 'Roboto, sans-serif' } },
          React.createElement(Story)
        )
      ),
  ],
};

export default preview;
