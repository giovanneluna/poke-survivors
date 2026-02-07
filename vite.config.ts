import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 8080,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
