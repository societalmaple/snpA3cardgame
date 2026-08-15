import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Project pages are served from /snpA3cardgame/; dev and preview use "/".
  base: process.env.VITE_BASE ?? '/',
  server: { port: 5173, host: true },
});
