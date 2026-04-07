import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  tsconfig: './tsconfig.json',
});
