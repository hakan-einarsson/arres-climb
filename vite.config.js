import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
    modulePreload: false,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
});
