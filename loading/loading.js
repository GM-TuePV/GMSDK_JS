// Default loading screen (docs/LOADING.md): GM Loader v1 of azgames (sdk10/azgames_v1), the screen the 2.x kit shipped,
// unchanged in look. Plain JS, no build step: copy the folder to src/sdk/loading/, its assets/ to public/assets/loading/.
//
// The export package has no page of its own (the platform template is the page, docs/EXPORT.md §1), so the screen is
// built by game.js itself: call createLoader() on the first line of the entry module, before anything heavy, so it is
// on screen as soon as the script runs. Everything it needs is inlined (CSS) or shipped with the game (key art, logo).
//
// Three states, as classes on #gmLoader: (none) spinner under the key art and the title, before the first count;
// .gmIsLoading the % bar, tinted with up to three strong colours of the key art; .gmAlmost from 99 %: "Almost there..."
// and the full bar shimmering. Texts are English and hard-coded on purpose: they show before i18n/ has loaded.

const CSS = `
#gmLoader{--gm-font:"Nunito","Segoe UI",system-ui,-apple-system,Arial,sans-serif;--gm-bg:#0c0d14;--gm-track:#000000;--gm-white:#ffffff;--gm-muted:#8f90a6}
#gmLoader,#gmLoader *,#gmLoader *::before,#gmLoader *::after{box-sizing:border-box}
#gmLoader[hidden]{display:none}
#gmLoader{position:fixed;font-family:var(--gm-font);color:var(--gm-white);-webkit-font-smoothing:antialiased;inset:0;z-index:10;overflow:hidden;background:var(--gm-bg);user-select:none;-webkit-user-select:none;--gm-c1:104,66,255;--gm-c2:140,96,255;--gm-c3:176,140,255}
.gmLoaderBackdrop{position:absolute;inset:0;z-index:0;background-position:center;background-size:cover;background-repeat:no-repeat;filter:blur(14px) brightness(.42) saturate(1.05);transform:scale(1.08)}
.gmLoaderBackdrop::after{content:"";position:absolute;inset:0;background:radial-gradient(90% 80% at 50% 45%,rgba(12,13,20,.15),rgba(12,13,20,.55))}
.gmLoaderStage{position:relative;z-index:1;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;text-align:center}
.gmLoaderThumb{display:block;height:clamp(80px,20vh,200px);width:auto;max-width:min(80vw,400px);object-fit:cover;border-radius:clamp(6px,1.2vh,10px);box-shadow:0 8px 28px rgba(0,0,0,.45);background:#1a1b26;animation:gmFadeUp .4s ease-out both}
.gmLoaderTitle{margin:clamp(10px,2.6vh,20px) 0 0;max-width:90vw;color:var(--gm-white);font-size:clamp(18px,4.6vh,34px);font-weight:800;line-height:1.2;letter-spacing:-.005em;text-shadow:0 2px 10px rgba(0,0,0,.5);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;animation:gmFadeUp .4s .05s ease-out both}
.gmLoaderProgress{position:relative;width:min(80vw,1010px);height:clamp(64px,13vh,96px);margin-top:clamp(14px,4.6vh,40px)}
.gmLoaderSpinner{position:absolute;left:50%;top:0;width:clamp(32px,7vh,48px);height:clamp(32px,7vh,48px);margin-left:calc(clamp(32px,7vh,48px) / -2);border-radius:50%;border:4px solid rgba(255,255,255,.18);border-top-color:rgba(255,255,255,.85);border-right-color:rgba(255,255,255,.85);animation:gmSpin .8s linear infinite}
.gmLoaderBar,.gmLoaderInfo{opacity:0;transition:opacity .25s ease}
.gmLoaderBar{width:100%;height:clamp(10px,2vh,14px);border-radius:999px;background:var(--gm-track);overflow:hidden}
#gmLoaderFill{position:relative;width:0;height:100%;border-radius:999px;background:linear-gradient(90deg,rgb(var(--gm-c1)),rgb(var(--gm-c2)) 55%,rgb(var(--gm-c3))) 0 0 / min(80vw,1010px) 100% no-repeat rgb(var(--gm-c1));box-shadow:0 0 12px rgba(var(--gm-c1),.45);transition:width .25s ease;overflow:hidden}
.gmLoaderInfo{margin-top:clamp(10px,2.2vh,16px);font-size:clamp(12px,2.4vh,16px);font-weight:600;line-height:1.2;color:var(--gm-white)}
.gmLoaderInfo b{font-weight:800}
#gmLoader.gmIsLoading .gmLoaderSpinner{display:none}
#gmLoader.gmIsLoading .gmLoaderBar,#gmLoader.gmIsLoading .gmLoaderInfo{opacity:1}
#gmLoader.gmAlmost #gmLoaderFill{width:100% !important}
#gmLoader.gmAlmost #gmLoaderFill::after{content:"";position:absolute;top:0;bottom:0;left:0;width:52%;border-radius:999px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.45) 60%,rgba(255,255,255,0));animation:gmAlmost 1.6s ease-in-out infinite}
#gmLoader.gmAlmost .gmLoaderInfo{color:var(--gm-muted);font-weight:800;animation:gmBlink 1.6s ease-in-out infinite}
#gmLoader.gmFailed .gmLoaderInfo{cursor:pointer;text-decoration:underline}
.gmLoaderBrand{position:absolute;z-index:1;right:clamp(10px,2vw,22px);bottom:clamp(8px,1.8vw,18px);opacity:.9;pointer-events:none}
.gmLoaderBrand img{display:block;height:clamp(30px,7.5vh,56px);width:auto;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))}
.gmLoaderVersion{position:absolute;z-index:1;left:clamp(10px,2vw,22px);bottom:clamp(8px,1.8vw,18px);font:600 11px/1 var(--gm-font);letter-spacing:.06em;color:var(--gm-white);opacity:.4;pointer-events:none}
@media (max-height:420px){.gmLoaderThumb{height:clamp(64px,26vh,120px)}.gmLoaderProgress{height:56px;margin-top:12px}.gmLoaderBrand img{height:28px}}
@keyframes gmSpin{to{transform:rotate(360deg)}}
@keyframes gmFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes gmAlmost{0%{transform:translateX(-105%)}100%{transform:translateX(200%)}}
@keyframes gmBlink{0%,100%{opacity:1}50%{opacity:.55}}
@media (prefers-reduced-motion: reduce){.gmLoaderThumb,.gmLoaderTitle,#gmLoader.gmAlmost .gmLoaderInfo,#gmLoader.gmAlmost #gmLoaderFill::after{animation:none}.gmLoaderSpinner{animation-duration:2.4s}#gmLoaderFill{transition:none}}
`;

/** The template's gmTintFromArt, unchanged: the bar takes up to 3 strong colours of the key art; failure keeps purple. */
function tintFromArt(img, root) {
  try {
    if (!img.naturalWidth) return;
    const n = 32;
    const c = document.createElement('canvas');
    c.width = n;
    c.height = n;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, n, n);
    const d = ctx.getImageData(0, 0, n, n).data;
    const bins = {};
    const order = [];
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      if (d[i + 3] < 200) continue;
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      if (mx < 50 || mx - mn < 40) continue;
      const k = `${r >> 5},${g >> 5},${b >> 5}`;
      let e = bins[k];
      if (!e) {
        e = bins[k] = { n: 0, r: 0, g: 0, b: 0 };
        order.push(e);
      }
      e.n++;
      e.r += r;
      e.g += g;
      e.b += b;
    }
    if (!order.length) return;
    for (const e of order) {
      const r = e.r / e.n;
      const g = e.g / e.n;
      const b = e.b / e.n;
      const m = Math.max(r, g, b);
      e.s = e.n * Math.pow((m - Math.min(r, g, b)) / m, 1.5);
    }
    order.sort((p, q) => q.s - p.s);
    const bright = (e) => {
      const v = [e.r / e.n, e.g / e.n, e.b / e.n];
      const m = Math.max(v[0], v[1], v[2]) || 1;
      const f = m < 225 ? 225 / m : 1;
      const avg = (v[0] + v[1] + v[2]) / 3;
      return v.map((x) => Math.max(0, Math.min(255, Math.round((avg + (x - avg) * 1.3) * f))));
    };
    const far = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 90;
    const pick = [];
    for (let j = 0; j < order.length && pick.length < 3; j++) {
      if (order[j].n < 3) break;
      const col = bright(order[j]);
      if (pick.every((p) => far(p, col))) pick.push(col);
    }
    if (!pick.length) pick.push(bright(order[0]));
    while (pick.length < 3) {
      const t = pick.length * 0.22;
      pick.push(pick[0].map((x) => Math.round(x + (255 - x) * t)));
    }
    root.style.setProperty('--gm-c1', pick[0].join(','));
    root.style.setProperty('--gm-c2', pick[1].join(','));
    root.style.setProperty('--gm-c3', pick[2].join(','));
  } catch {
    // keep the CSS default purple
  }
}

const el = (tag, cls) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
};

/**
 * Show the loading screen now. First line of the entry module:
 *
 *   const loader = createLoader({ sdk });
 *   ...each loaded asset:   loader.progress(done / total);   // also sdk.loadingProgress()
 *   ...game.json loaded:    loader.setTitle(manifest.name);
 *   ...menu on screen:      loader.hide();  sdk.loadingDone();
 *   ...load failed:         loader.error(); // "Connection problem. Tap to retry." → reloads the page
 *
 * @param {object} [o]
 * @param {object} [o.sdk]       getSDK(): progress is forwarded to sdk.loadingProgress
 * @param {string} [o.title]     game name; default the page <title> (the template's PRODUCT_NAME)
 * @param {string} [o.assets]    folder of loading.webp (the game's key art) and logo.webp, default assets/loading/
 * @param {string} [o.version]   corner text; default GMSDKJS_OPTIONS.version (game.json version)
 */
export function createLoader({ sdk, title, assets = 'assets/loading/', version } = {}) {
  let root = document.getElementById('gmLoader');
  if (root) root.remove(); // one screen per page
  if (!document.getElementById('gmLoaderStyle')) {
    // Nunito is the template's face; only this screen uses it, a canvas game keeps its own.
    const font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@600;800&display=swap';
    document.head.appendChild(font);
    const style = el('style');
    style.id = 'gmLoaderStyle';
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  const art = `${assets}loading.webp`;
  root = el('div');
  root.id = 'gmLoader';
  const backdrop = el('div', 'gmLoaderBackdrop');
  backdrop.style.backgroundImage = `url('${art}')`;
  const stage = el('div', 'gmLoaderStage');
  const thumb = el('img', 'gmLoaderThumb');
  thumb.src = art;
  const name = el('h1', 'gmLoaderTitle');
  const progressBox = el('div', 'gmLoaderProgress');
  const spinner = el('div', 'gmLoaderSpinner');
  spinner.setAttribute('aria-hidden', 'true');
  const bar = el('div', 'gmLoaderBar');
  const fill = el('div');
  fill.id = 'gmLoaderFill';
  bar.appendChild(fill);
  const info = el('div', 'gmLoaderInfo');
  info.textContent = 'Loading...';
  progressBox.append(spinner, bar, info);
  stage.append(thumb, name, progressBox);
  // The publisher's logo, as on the 2.x screen; not on GameDistribution / CrazyGames / Poki pages (no publisher
  // branding there: their templates turn the trademark off, docs/QA.md 7.4). The page's options say so at once.
  let opts = {};
  try {
    opts = globalThis.GMSDKJS_OPTIONS ?? {};
  } catch {
    opts = {};
  }
  const portalPage = ['gd', 'crazy', 'poki'].includes(String(opts.sdkType ?? '').toLowerCase()) || opts.trademark === false;
  const brand = el('div', 'gmLoaderBrand');
  brand.setAttribute('aria-hidden', 'true');
  if (!portalPage) {
    const logo = el('img');
    logo.alt = '';
    logo.src = `${assets}logo.webp`;
    logo.onerror = () => brand.remove();
    brand.appendChild(logo);
  }
  const corner = el('div', 'gmLoaderVersion');
  const v = version ?? opts.version;
  corner.textContent = typeof v === 'string' && !v.includes('<!--') ? v : '';
  root.append(backdrop, stage, brand, corner);
  (document.body ?? document.documentElement).appendChild(root);
  if (thumb.complete && thumb.naturalWidth) tintFromArt(thumb, root);
  else thumb.addEventListener('load', () => tintFromArt(thumb, root), { once: true });

  const setTitle = (t) => {
    name.textContent = t ?? '';
    thumb.alt = t ?? '';
  };
  setTitle(title ?? document.title);

  return {
    /** fraction 0..1: the bar (spinner until something is counted), "Almost there..." from 99 %. */
    progress(fraction) {
      const f = Math.min(Math.max(Number(fraction) || 0, 0), 1);
      try {
        sdk?.loadingProgress?.(f);
      } catch {
        // the screen goes on without the SDK
      }
      const pct = Math.round(f * 100);
      if (pct <= 0 || root.classList.contains('gmFailed')) return;
      root.classList.add('gmIsLoading');
      fill.style.width = `${pct}%`;
      if (pct >= 99) {
        root.classList.add('gmAlmost');
        info.textContent = 'Almost there...';
      } else {
        const b = el('b');
        b.textContent = `${pct}%`;
        info.replaceChildren(b);
      }
    },
    /** The game's name, once game.json is loaded. */
    setTitle,
    /** Load failed: "Connection problem. Tap to retry." (English: i18n/ may be what failed). */
    error(onRetry = () => location.reload()) {
      root.classList.remove('gmAlmost');
      root.classList.add('gmIsLoading', 'gmFailed');
      info.textContent = 'Connection problem. Tap to retry.';
      info.onclick = () => onRetry();
    },
    /** The first screen of the game is ready: hide (not empty) the screen. */
    hide() {
      root.hidden = true;
    },
  };
}
