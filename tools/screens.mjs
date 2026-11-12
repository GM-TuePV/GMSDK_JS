#!/usr/bin/env node
/**
 * QA on the 8 screen sizes (docs/QA.md §2.1): opens the export package's gm page (index.html, after
 * tools/assemble.mjs) in each size, waits until loader.js hides the loading screen (the menu is on), and saves a
 * screenshot. Phones and tablets are emulated with touch and their real pixel ratio.
 *
 *   node docs/GMSDK_JS/tools/screens.mjs [<packageDir>] [--channel msedge|chrome] [--wait <seconds>] [--same-origin]
 *
 * The page and the package run on two domains, as on the own site (page on game.1games.io, package on the CDN through
 * <base href>, docs/EMBED.md): errors of CORS, tainted canvases, workers and failed files land in the "Lỗi trang" column.
 * --same-origin: one domain (as on CrazyGames / Poki).
 *
 * <packageDir>: default export/build/<version>-<id> from public/game.json. Output: export/qa/<version>-<id>/ (outside
 * the package, so never in the zip; export/ is not committed): <w>x<h>.jpg per size + screens.md, the table to copy
 * into docs/qa/<version>.md. The AI then looks at every picture (text cut, buttons on top of each other, black bars,
 * the game not filling the screen) and adds gameplay shots of its own (docs/QA.md §2.1).
 *
 * Run once per game, on the final art: the shots are the reference for the banners (marketing). The AI asks the
 * owner after a build while export/qa/ has no folder yet; after that only when the owner asks for new shots.
 *
 *   node docs/GMSDK_JS/tools/screens.mjs --check [<packageDir>]
 *
 * --check (kit 1.0.4): a step of every build (docs/EXPORT.md §5), after check-export: one size, the two domains, no
 * screenshot; ERROR lines and exit 1 when the page has a CORS / tainted canvas / worker error, a file of the package
 * fails, or the loading screen never goes. It sees the loading and the menu only: QA.md 7.9 covers the other screens.
 *
 * Needs Playwright in the game repo: npm i -D playwright-core (then the Edge of Windows is used), or
 * npm i -D playwright + npx playwright install chromium; --channel msedge / chrome picks the browser. The page loads
 * gmsdkjs.js from the server (needs the internet, like a player).
 */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, createReadStream, writeFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

/** The 8 sizes (CSS pixels), docs/QA.md §2.1. */
export const SIZES = [
  { w: 1920, h: 1080, dpr: 1, label: 'Desktop Full HD' },
  { w: 1366, h: 768, dpr: 1, label: 'Laptop' },
  { w: 1536, h: 864, dpr: 1.25, label: 'Laptop Windows 125 %' },
  { w: 1280, h: 720, dpr: 1, label: 'Portal 16:9 frame' },
  { w: 390, h: 844, dpr: 3, mobile: true, label: 'iPhone portrait' },
  { w: 360, h: 800, dpr: 3, mobile: true, label: 'Android portrait' },
  { w: 844, h: 390, dpr: 3, mobile: true, label: 'Phone landscape' },
  { w: 1024, h: 768, dpr: 2, mobile: true, label: 'iPad landscape' },
];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
};

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const valueAt = new Set(['--channel', '--wait'].map((n) => args.indexOf(n)).filter((i) => i >= 0).map((i) => i + 1));

async function loadPlaywright() {
  for (const name of ['playwright', 'playwright-core']) {
    try {
      const url = pathToFileURL(join(process.cwd(), 'node_modules', name, 'index.mjs')).href;
      return await import(existsSync(new URL(url)) ? url : name);
    } catch {
      // next
    }
  }
  return null;
}

async function main() {
  let dir = args.find((a, i) => !a.startsWith('--') && !valueAt.has(i));
  if (!dir) {
    const g = JSON.parse(readFileSync('public/game.json', 'utf8').replace(/^\uFEFF/, ''));
    dir = `export/build/${g.version}-${g.id}`;
  }
  dir = resolve(dir);
  if (!existsSync(join(dir, 'index.html')) || !existsSync(join(dir, 'game.json'))) {
    console.error(`${dir}: no export package with its gm page (build it, then tools/assemble.mjs)`);
    process.exitCode = 2;
    return;
  }
  const game = JSON.parse(readFileSync(join(dir, 'game.json'), 'utf8').replace(/^\uFEFF/, ''));
  // export/build/<version>-<id> → export/qa/<version>-<id>
  const out = resolve(dir, '..', '..', 'qa', `${game.version}-${game.id}`);
  // --check (kit 1.0.4, a step of npm run build): one size, no screenshots; exit 1 on a page error (CORS, tainted
  // canvas, worker, a file that failed) or a loading screen that never goes
  const check = args.includes('--check');
  if (!check) mkdirSync(out, { recursive: true });
  const pw = await loadPlaywright();
  if (!pw) {
    console.error('Playwright is missing: npm i -D playwright-core (Edge of Windows is used then), or npm i -D playwright + npx playwright install chromium');
    process.exitCode = 2;
    return;
  }
  const waitMs = (Number(opt('--wait')) || (check ? 30 : 60)) * 1000;

  // The package as the CDN serves it (relative paths, CORS for every file). As on the own site (docs/EMBED.md), the
  // page is on another domain: 127.0.0.1 serves only index.html with <base href> on the package at localhost, so CORS,
  // tainted canvases, workers and URLs built on location.href fail here as they do there. --same-origin: one domain.
  const sameOrigin = args.includes('--same-origin');
  const server = createServer((req, res) => {
    const p = resolve(dir, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!(p === dir || p.startsWith(dir + sep)) || !existsSync(p) || statSync(p).isDirectory()) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': TYPES[extname(p).toLowerCase()] ?? 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
    createReadStream(p).pipe(res);
  });
  await new Promise((r) => server.listen(0, sameOrigin ? '127.0.0.1' : 'localhost', r));
  const cdn = `http://${sameOrigin ? '127.0.0.1' : 'localhost'}:${server.address().port}/`;
  let pageServer = null;
  let base = `${cdn}index.html`;
  if (!sameOrigin) {
    const html = readFileSync(join(dir, 'index.html'), 'utf8');
    const tag = `<base href="${cdn}">`;
    const page = /<meta\s+charset[^>]*>/i.test(html) ? html.replace(/(<meta\s+charset[^>]*>)/i, `$1\n  ${tag}`) : html.replace(/<head[^>]*>/i, (h) => `${h}\n  ${tag}`);
    pageServer = createServer((req, res) => {
      if (new URL(req.url, 'http://x').pathname !== '/index.html') return res.writeHead(404).end();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page);
    });
    await new Promise((r) => pageServer.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${pageServer.address().port}/index.html`;
  }
  console.log(sameOrigin ? `page and package on ${cdn}` : `page on ${base}, package on ${cdn} (two domains, as on the own site)`);

  // Chromium of Playwright, else the Edge every Windows has (playwright-core alone has no browser of its own)
  const launch = (channel) => pw.chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
  let browser;
  try {
    browser = await launch(opt('--channel'));
  } catch (e) {
    if (opt('--channel')) throw e;
    browser = await launch('msedge').catch(() => {
      throw e;
    });
  }
  const rows = [];
  try {
    for (const s of check ? SIZES.slice(0, 1) : SIZES) {
      const ctx = await browser.newContext({
        viewport: { width: s.w, height: s.h },
        deviceScaleFactor: s.dpr,
        isMobile: !!s.mobile,
        hasTouch: !!s.mobile,
      });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      // CORS, tainted canvas, worker: console errors, not page errors. Requests of the package that failed too.
      page.on('console', (m) => {
        if (m.type() === 'error' && /CORS|cross-origin|Access-Control|tainted|SecurityError|Worker/i.test(m.text())) errors.push(m.text().slice(0, 200));
      });
      page.on('requestfailed', (r) => {
        if (r.url().startsWith(cdn)) errors.push(`${r.url().slice(cdn.length)}: ${r.failure()?.errorText ?? 'failed'}`);
      });
      const t0 = Date.now();
      await page.goto(base, { waitUntil: 'commit' });
      const ok = await page
        .waitForSelector('#gmLoader[hidden]', { state: 'attached', timeout: waitMs })
        .then(() => true)
        .catch(() => false);
      await page.waitForTimeout(check ? 3000 : 1500); // let the menu settle (fonts, first frames, images it draws)
      const name = `${s.w}x${s.h}.jpg`;
      if (!check) await page.screenshot({ path: join(out, name), type: 'jpeg', quality: 80 });
      const state = await page.evaluate(() => (window.GMLoader ? window.GMLoader.state : null)).catch(() => null);
      const ms = Date.now() - t0;
      rows.push({ ...s, name, ok, ms, errors, state });
      console.log(`${s.w}x${s.h}: ${ok ? `menu after ${(ms / 1000).toFixed(1)} s` : 'loading screen still on'}${errors.length ? `, ${errors.length} page error(s)` : ''}`);
      await ctx.close();
    }
  } finally {
    await browser.close();
    server.close();
    pageServer?.close();
  }

  if (check) {
    const bad = rows.filter((r) => !r.ok || r.errors.length);
    for (const r of bad) {
      if (!r.ok) console.log(`ERROR: the loading screen never went (${waitMs / 1000} s)`);
      for (const e of [...new Set(r.errors)].slice(0, 10)) console.log(`ERROR: ${e}`);
    }
    console.log(bad.length ? `FAILED: the game breaks with page and package on two domains (own site): fix the code (docs/EMBED.md)` : 'OK: page and package on two domains, no page error');
    process.exitCode = bad.length ? 1 : 0;
    return;
  }

  const md = [
    `## Màn hình: ${game.name} ${game.version}`,
    '',
    `Ảnh: \`export/qa/${game.version}-${game.id}/\` (không commit). Cột "Kết quả" do người / AI điền sau khi xem từng ảnh: chữ bị cắt, nút chồng nhau, viền đen, game không phủ kín màn, chữ quá nhỏ.`,
    '',
    sameOrigin
      ? 'Chạy một tên miền (`--same-origin`): lỗi chỉ có khi trang và gói khác tên miền (site của mình) không hiện ở đây.'
      : 'Trang và gói ở hai tên miền như site của mình (`<base href>` lên CDN, docs/EMBED.md): cột "Lỗi trang" có CORS / canvas bẩn / Worker / file tải hỏng thì sửa trước khi lên site.',
    '',
    '| Cỡ (CSS px) | Máy | Vào menu | Lỗi trang | Kết quả | Ghi chú |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows.map(
      (r) =>
        `| ${r.w}×${r.h} (DPR ${r.dpr}) | ${r.label} | ${r.ok ? `${(r.ms / 1000).toFixed(1)} s` : 'KHÔNG (còn màn loading)'} | ${r.errors.length ? r.errors.slice(0, 2).join('; ').replace(/\|/g, '/') : '0'} | | ${r.name} |`,
    ),
    '',
  ].join('\n');
  writeFileSync(join(out, 'screens.md'), md);
  console.log(`${out}: ${rows.length} screenshots + screens.md`);
  process.exitCode = rows.every((r) => r.ok && !r.errors.length) ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
