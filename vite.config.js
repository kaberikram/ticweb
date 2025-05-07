import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ratalog: resolve(__dirname, 'ratalog.html'),
        lookbook: resolve(__dirname, 'lookbook.html'),
        cart: resolve(__dirname, 'cart.html'),
        success: resolve(__dirname, 'success.html'),
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