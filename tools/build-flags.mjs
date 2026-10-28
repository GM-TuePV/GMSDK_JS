#!/usr/bin/env node
/**
 * For the kit's maintainers (games never run it): builds the flag atlas of the leaderboard, leaderboard/flags.webp +
 * leaderboard/flags.json (docs/LEADERBOARD.md §2), from a folder of flag PNGs named <code>.png. The flags are the
 * kit's own art, drawn by GM. One cell per code of leaderboard/countries.json, in its order; files that are not in
 * the list are left out. flags.json: { "cell": [w, h], "cols": n, "codes": [...] }: the code at index i sits at
 * column i % cols, row floor(i / cols).
 *
 *   node tools/build-flags.mjs <srcDir> [--cell 100x75] [--cols 16]
 *
 * Needs sharp: run it from a repo that has it (npm i -D sharp), as tools/compress.mjs does. The WebP is the smaller of
 * lossless and quality 90.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(dirname(fileURLToPath(import.meta.url))), 'leaderboard');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const src = args.find((a, i) => !a.startsWith('--') && !['--cell', '--cols'].includes(args[i - 1]));
if (!src) {
  console.error('usage: node tools/build-flags.mjs <srcDir> [--cell 100x75] [--cols 16]');
  process.exit(2);
}
const [W, H] = String(opt('--cell', '100x75')).split('x').map(Number);
const cols = Number(opt('--cols', 16));

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    return createRequire(join(process.cwd(), 'noop.js'))('sharp');
  }
}

const codes = JSON.parse(readFileSync(join(OUT, 'countries.json'), 'utf8')).map((c) => c.code);
if (!codes.includes('US')) throw new Error('countries.json has no US: it is the flag of a player who has not chosen one');
const missing = codes.filter((c) => !existsSync(join(src, `${c}.png`)));
if (missing.length) {
  console.error(`no image in ${src} for: ${missing.join(' ')}`);
  process.exit(1);
}

const sharp = await loadSharp();
const rows = Math.ceil(codes.length / cols);
const cells = await Promise.all(
  codes.map(async (code, i) => ({
    input: await sharp(join(src, `${code}.png`)).resize(W, H, { fit: 'fill' }).png().toBuffer(),
    left: (i % cols) * W,
    top: Math.floor(i / cols) * H,
  })),
);
const sheet = await sharp({ create: { width: cols * W, height: rows * H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(cells)
  .png()
  .toBuffer();
const lossless = await sharp(sheet).webp({ lossless: true, effort: 6 }).toBuffer();
const lossy = await sharp(sheet).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
const webp = lossless.length <= lossy.length ? lossless : lossy;
writeFileSync(join(OUT, 'flags.webp'), webp);
writeFileSync(join(OUT, 'flags.json'), `${JSON.stringify({ cell: [W, H], cols, codes })}\n`);
console.log(`leaderboard/flags.webp: ${codes.length} flags, ${cols * W}x${rows * H}, ${Math.round(webp.length / 1024)} KB (${webp === lossless ? 'lossless' : 'quality 90'}; lossless ${Math.round(lossless.length / 1024)} KB, quality 90 ${Math.round(lossy.length / 1024)} KB)`);
