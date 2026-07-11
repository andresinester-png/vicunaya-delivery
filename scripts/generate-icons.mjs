import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dir, '..', 'public');

const svg = readFileSync(join(publicDir, 'icon.svg'));

// 512x512
await sharp(svg)
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(join(publicDir, 'icon-512.png'));
console.log('✓ icon-512.png');

// 192x192
await sharp(svg)
  .resize(192, 192)
  .png({ compressionLevel: 9 })
  .toFile(join(publicDir, 'icon-192.png'));
console.log('✓ icon-192.png');

// 32x32 para favicon
await sharp(svg)
  .resize(32, 32)
  .png({ compressionLevel: 9 })
  .toFile(join(publicDir, 'favicon-32.png'));
console.log('✓ favicon-32.png');

console.log('Done!');
