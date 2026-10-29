import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/inclusive-services-portal/',
  server: {
    port: 5173
  }
});
