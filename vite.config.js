import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
    minify: 'terser',
    terserOptions: {
      ecma: 2020,
      module: true,
      toplevel: true,
      compress: {
        passes: 3,
        unsafe: true,
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true,
        drop_console: true,
        drop_debugger: true,
        pure_getters: true,
      },
      mangle: {
        toplevel: true,
      },
      format: {
        comments: false,
      },
    },
    modulePreload: false,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
});
