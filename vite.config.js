import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        characterSelection: resolve(__dirname, 'characterSelection.html'),
        lookbook: resolve(__dirname, 'lookbook.html'),
        // Add other HTML pages here if needed in the future
      },
    },
  },
  // Ensure server serves files correctly in dev
  server: {
    // Optional: configure proxy, port, etc. if needed
  },
  // Ensure CSS and JS paths are handled correctly
  // Vite usually handles this automatically with absolute paths in HTML
}); 