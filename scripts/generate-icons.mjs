// Rasterize assets/logo.svg into the extension icon PNG set.
// Run with: npm run icons
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const svgPath = resolve(root, 'assets/logo.svg');
const outDir = resolve(root, 'public/icon');
const SIZES = [16, 32, 48, 96, 128];

const svg = await readFile(svgPath);

await Promise.all(
  SIZES.map(async (size) => {
    // Render the SVG at high density, then downsample for clean anti-aliasing.
    const png = await sharp(svg, { density: 384 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const out = resolve(outDir, `${size}.png`);
    await writeFile(out, png);
    console.log(`wrote ${out} (${png.length} bytes)`);
  }),
);
