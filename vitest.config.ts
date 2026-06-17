import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'shared/**/*.test.ts',
      'src/**/*.test.ts',
      'backend/src/**/*.test.ts',
    ],
  },
});
