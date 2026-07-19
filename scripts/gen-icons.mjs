import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, '../public/kyvra-app-icon.png');
const pub = resolve(__dirname, '../public');

const sizes = [
  { name: 'favicon-16.png',        size: 16  },
  { name: 'favicon-32.png',        size: 32  },
  { name: 'apple-touch-icon.png',  size: 180 },
  { name: 'icon-192.png',          size: 192 },
  { name: 'icon-512.png',          size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(src)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .png({ compressionLevel: 9 })
    .toFile(`${pub}/${name}`);
  console.log(`✓ ${name} (${size}x${size})`);
}
