import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks: a site update no longer forces returning visitors to
        // re-download React and Firebase (content-hashed files can be cached for a year).
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|react-helmet-async)\//.test(id)) return 'vendor-react';
          if (/node_modules\/@firebase\/(auth|app|util|component|logger)\//.test(id) || /node_modules\/firebase\/(app|auth)\//.test(id)) return 'vendor-firebase-core';
          if (/node_modules\/@firebase\/database\//.test(id) || /node_modules\/firebase\/database\//.test(id)) return 'vendor-firebase-db';
          return undefined;
        },
      },
    },
  },
});
