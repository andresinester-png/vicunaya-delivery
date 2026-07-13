import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
  server: { port: 3000 },
});
