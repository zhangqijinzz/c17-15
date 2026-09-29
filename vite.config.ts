import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // vitest reads this key directly; it is not part of vite's UserConfig type.
  test: {
    setupFiles: './src/tests/setup.ts',
  },
} as UserConfig);
