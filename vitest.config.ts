import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
      // Root `npm test` does not install backend/node_modules. Backend unit
      // tests mock Firestore, so the real Admin SDK must not be resolved.
      'firebase-admin/firestore': path.resolve(
        __dirname,
        'backend/src/test/firebaseAdminFirestore.ts'
      ),
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
