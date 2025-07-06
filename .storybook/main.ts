import type { StorybookConfig } from '@storybook/react-vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  viteFinal: async (config) => {
    return defineConfig({
      ...config,
      plugins: [
        react(),
        // Exclude PWA plugin for Storybook
        ...(config.plugins || []).filter(
          (plugin) =>
            plugin &&
            typeof plugin === 'object' &&
            'name' in plugin &&
            plugin.name !== 'vite-plugin-pwa'
        ),
      ],
    });
  },
};

export default config;
