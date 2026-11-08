import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base = nama repo, karena situsnya ada di cassieorcasey.github.io/waypoint/
export default defineConfig({
  plugins: [react()],
  base: '/waypoint/',
});
