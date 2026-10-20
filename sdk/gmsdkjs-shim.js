var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};

// lib/1games/gmsdkjs/src/util.js
function attempt(fn, fallback) {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}

// lib/1games/gmsdkjs/src/storage.js
var SCHEMA = 1;
function storageKey(gameCode) {
  const code = String(gameCode != null ? gameCode : "").trim().toLowerCase();
  return /^g\d+$/.test(code) ? `azgames.${code}` : "azgames.dev";
}
var isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
var clone = (v) => v === void 0 ? void 0 : JSON.parse(JSON.stringify(v));
var validArea = (a) => typeof a === "string" && a !== "" && a !== "v";
function parse(text) {
  if (text === null || text === void 0) return void 0;
  try {
    return JSON.parse(text);
  } catch (e) {
    return void 0;
  }
}
function createStorage({ key, getLs, win, doc, delayMs = 300 }) {
  const memory = /* @__PURE__ */ new Map();
  function read(k) {
    try {
      const ls = getLs();
      if (ls) return ls.getItem(k);
    } catch (e) {
    }
    return memory.has(k) ? memory.get(k) : null;
  }
  function write(k, value) {
    memory.set(k, value);
    try {
      const ls = getLs();
      if (!ls) return false;
      ls.setItem(k, value);
      return true;
    } catch (e) {
      return false;
    }
  }
  function remove(k) {
    var _a;
    memory.delete(k);
    try {
      (_a = getLs()) == null ? void 0 : _a.removeItem(k);
    } catch (e) {
    }
  }
  let data;
  let existedAtLoad = false;
  let migrated = false;
  const dirty = /* @__PURE__ */ new Set();
  let timer;
  function load() {
    if (data === void 0) {
      const stored = parse(read(key));
      existedAtLoad = isObj(stored);
      data = existedAtLoad ? __spreadValues({}, stored) : {};
      delete data.v;
    }
    return data;
  }
  function flushNow() {
    clearTimeout(timer);
    timer = void 0;
    if (!dirty.size) return true;
    const stored = parse(read(key));
    const base = isObj(stored) ? stored : {};
    for (const area of dirty) {
      if (data[area] === void 0) delete base[area];
      else base[area] = data[area];
    }
    base.v = SCHEMA;
    if (!write(key, JSON.stringify(base))) return false;
    dirty.clear();
    return true;
  }
  function schedule() {
    if (timer === void 0) timer = setTimeout(flushNow, delayMs);
  }
  function get(area, fallback) {
    try {
      const v = load()[area];
      return v === void 0 ? fallback : clone(v);
    } catch (e) {
      return fallback;
    }
  }
  function set(area, value) {
    try {
      if (!validArea(area)) return false;
      const copy = clone(value);
      load()[area] = copy;
      dirty.add(area);
      schedule();
      return true;
    } catch (e) {
      return false;
    }
  }
  function patch(area, part) {
    try {
      if (!validArea(area) || !isObj(part)) return false;
      const cur = load()[area];
      return set(area, __spreadValues(__spreadValues({}, isObj(cur) ? cur : {}), part));
    } catch (e) {
      return false;
    }
  }
  function migrate(legacy) {
    try {
      load();
      if (existedAtLoad || migrated || !isObj(legacy)) return [];
      migrated = true;
      const moved = [];
      for (const [old, area] of Object.entries(legacy)) {
        if (!validArea(area)) continue;
        const raw = read(old);
        if (raw === null) continue;
        const v = parse(raw);
        data[area] = v === void 0 ? raw : v;
        dirty.add(area);
        moved.push(area);
      }
      if (moved.length && flushNow()) for (const old of Object.keys(legacy)) remove(old);
      return moved;
    } catch (e) {
      return [];
    }
  }
  function flush() {
    try {
      return flushNow();
    } catch (e) {
      return false;
    }
  }
  attempt(() => win.addEventListener("pagehide", flush));
  attempt(
    () => doc.addEventListener("visibilitychange", () => {
      if (doc.visibilityState === "hidden") flush();
    })
  );
  return { key, get, set, patch, migrate, flush };
}

// lib/1games/gmsdkjs/shim/shim.js
var METHODS = [
  "ready",
  "loadingProgress",
  "loadingDone",
  "preroll",
  "gameplayStart",
  "gameplayStop",
  "interstitial",
  "rewardedAvailable",
  "rewarded",
  "onPause",
  "onResume",
  "track",
  "moreGamesUrl",
  "happyTime",
  "setMuted"
];
var STORAGE_FNS = ["get", "set", "patch", "migrate", "flush"];
var noop = () => {
};
var no = async () => false;
function gameCodeOf(g, given) {
  var _a;
  try {
    const code = (_a = g.GMSDKJS_OPTIONS) == null ? void 0 : _a.gameCode;
    if (typeof code === "string" && /^g\d+$/i.test(code.trim())) return code;
  } catch (e) {
  }
  return given;
}
function createFallback(g, gameCode = "") {
  const info = { version: "fallback", platform: "unknown", sdkType: "gm", gameId: "", adType: "none", licensed: true, adblock: false, adsTest: false, adsInfo: null, gameInfo: null };
  let storage;
  return {
    version: "fallback",
    get info() {
      return info;
    },
    ready: async () => info,
    loadingProgress: noop,
    loadingDone: noop,
    preroll: no,
    gameplayStart: noop,
    gameplayStop: noop,
    interstitial: no,
    rewardedAvailable: () => false,
    rewarded: no,
    onPause: noop,
    onResume: noop,
    track: noop,
    moreGamesUrl: () => null,
    happyTime: noop,
    setMuted: noop,
    get storage() {
      storage != null ? storage : storage = createStorage({ key: storageKey(gameCodeOf(g, gameCode)), getLs: () => g.localStorage, win: g, doc: g.document });
      return storage;
    },
    brand: { name: "", logo: "", url: "", loadLogo: async () => null, trademark: () => "" }
  };
}
var cache = /* @__PURE__ */ new WeakMap();
function getSDK({ gameCode = "", g = globalThis } = {}) {
  if (cache.has(g)) return cache.get(g);
  const fallback = createFallback(g, gameCode);
  let real = null;
  try {
    real = g.GMSDKJS && typeof g.GMSDKJS === "object" ? g.GMSDKJS : null;
  } catch (e) {
    real = null;
  }
  let sdk = fallback;
  if (real) {
    sdk = {
      get version() {
        return typeof real.version === "string" ? real.version : "unknown";
      },
      get info() {
        var _a;
        try {
          return (_a = real.info) != null ? _a : fallback.info;
        } catch (e) {
          return fallback.info;
        }
      },
      get storage() {
        const s = real.storage;
        return s && STORAGE_FNS.every((m) => typeof s[m] === "function") ? s : fallback.storage;
      },
      get brand() {
        const b = real.brand;
        return b && typeof b.loadLogo === "function" && typeof b.trademark === "function" ? b : fallback.brand;
      }
    };
    for (const m of METHODS) {
      sdk[m] = (...args) => {
        const f = real[m];
        if (typeof f !== "function") return fallback[m](...args);
        try {
          const r = f.apply(real, args);
          return r && typeof r.then === "function" ? Promise.resolve(r).catch(() => fallback[m](...args)) : r;
        } catch (e) {
          return fallback[m](...args);
        }
      };
    }
  }
  cache.set(g, sdk);
  return sdk;
}
export {
  METHODS,
  createFallback,
  getSDK
};
