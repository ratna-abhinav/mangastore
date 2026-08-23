import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const backend = 'http://localhost:8080';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': backend,
      '/img': backend,
      '/login': backend,
      '/logout': backend,
      '/signin': backend,
      '/register': backend,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
