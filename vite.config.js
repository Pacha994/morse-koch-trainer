import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Base necesario para GitHub Pages:
  // La app se sirve desde https://pacha994.github.io/morse-koch-trainer/
  // sin este base, los assets (JS/CSS) no cargan correctamente.
  base: '/morse-koch-trainer/',
});
