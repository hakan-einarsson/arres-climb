import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function saveLevelsPlugin() {
  return {
    name: 'save-levels-api',
    configureServer(server) {
      server.middlewares.use('/api/save-levels', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            let fileContent = '';

            if (typeof data.code === 'string') {
              fileContent = data.code;
            } else if (Array.isArray(data.levels)) {
              const json = JSON.stringify(data.levels, null, 4);
              const formatted = json
                .replace(/"G"/g, 'G')
                .replace(/"R"/g, 'R')
                .replace(/"S"/g, 'S')
                .replace(/"RB"/g, 'RB')
                .replace(/"MX"/g, 'MX')
                .replace(/"MZ"/g, 'MZ')
                .replace(/"CLOUD"/g, 'C')
                .replace(/"C"/g, 'C');

              fileContent = `const G = 1, R = 2, S = 3, RB = 4, MX = 5, MZ = 6, C = 7;\n\nexport const LEVELS = ${formatted};\n\nexport default LEVELS;\n`;
            } else {
              throw new Error('Invalid payload: expected "code" string or "levels" array');
            }

            const targetPath = path.resolve(process.cwd(), 'src/levels/levels.js');
            await fs.promises.writeFile(targetPath, fileContent, 'utf-8');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            console.error('[saveLevelsPlugin] Error saving levels:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [saveLevelsPlugin()],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000,
    minify: 'terser',
    terserOptions: {
      ecma: 2020,
      module: true,
      toplevel: true,
      compress: {
        passes: 5,
        unsafe: true,
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_math: true,
        booleans_as_integers: true,
        hoist_vars: true,
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
