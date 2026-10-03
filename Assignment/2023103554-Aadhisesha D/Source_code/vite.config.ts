import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), {
    name: 'placementpilot-favicon-redirect',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/favicon.ico') return next();
        res.statusCode = 302;
        res.setHeader('Location', '/favicon.svg');
        res.end();
      });
    },
  }],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
});
