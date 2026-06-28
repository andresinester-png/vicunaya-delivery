import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Unique build id, baked into the bundle and written to dist/version.json.
// The running app compares its own id against the deployed version.json to
// detect when a new build has been published.
const APP_VERSION = String(Date.now());

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'write-version-json',
      apply: 'build',
      writeBundle(options) {
        writeFileSync(resolve(options.dir, 'version.json'), JSON.stringify({ version: APP_VERSION }));
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
  },
});
