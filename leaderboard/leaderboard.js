// Leaderboard for games on gmsdkjs (docs/LEADERBOARD.md). Plain JS, no build step: copy the folder to src/sdk/leaderboard/.
//
// It rides on the GM SDK (gm-sdk.js) that gmsdkjs.js has already loaded, initialised with the portal's GMA host and
// key, and signed in for tracking: one GMGameSDK per page, so this module never calls init() itself. Every portal's
// key reaches the same board on the server, so the game only names the board (config.json leaderboardId).
//
// Like gmsdkjs, nothing here throws: a failure is false / null, and the reason goes to the console and to the
// leaderboard_* events. null from top() means "could not load", not "empty board".

import { hmacSha256, toHex } from './hmac.js';

/**
 * Score signing key of the GMA deployment (HMAC-SHA256). gm-sdk.js does not sign: without a valid token the server
 * refuses the submit. Not a secret (the Unity WebGL build ships it too); it lives here, not in the game.
 */
const SIGNING_KEY_HEX = '177733f1c6aab38d236300699d99516efc89758aff6f9498eea96b8af44cb582';

/** The board's periods, as the GMA API names them (UTC buckets). */
export const PERIODS = Object.freeze(['daily', 'weekly', 'monthly', 'alltime']);

/** The storage area of this module (sdk.storage): the player's chosen name and flag, for the next visit. */
const AREA = 'leaderboard';
/** Name gmsdkjs gives a new player: "player" + 6 characters. */
const DEFAULT_NAME = /^player[a-z0-9]{6}$/i;
const NAME_MAX = 20;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const reason = (e) => String(e?.error ?? e?.message ?? (e?.status ? `http ${e.status}` : e) ?? 'unknown').slice(0, 100);

/** A clean name: trimmed, inner spaces collapsed, at most 20 characters, no control characters. '' when unusable. */
export function cleanName(name) {
  return String(name ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX);
}

/** An ISO 3166 code as the flags are named (US, GB, GB-ENG); '' when it is not one. */
export function cleanCountry(code) {
  const c = String(code ?? '').trim().toUpperCase();
  return /^[A-Z]{2}(-[A-Z]{3})?$/.test(c) ? c : '';
}

/** The score token: HMAC-SHA256 of `{playerId}:{trunc(score * 1000)}:{floor(now / 30 s)}`, lowercase hex. */
export function scoreToken(playerId, score, now = Date.now()) {
  const key = Uint8Array.from(SIGNING_KEY_HEX.match(/../g), (h) => parseInt(h, 16));
  const msg = `${playerId}:${Math.trunc(score * 1000)}:${Math.floor(now / 30000)}`;
  return toHex(hmacSha256(key, new TextEncoder().encode(msg)));
}

/** A GMA LeaderboardEntry as the game sees it. */
function entry(r) {
  return {
    rank: Number(r?.rank ?? 0),
    playerId: String(r?.playerId ?? ''),
    name: String(r?.playerName ?? ''),
    country: cleanCountry(r?.playerCountry),
    score: Number(r?.score ?? 0),
  };
}

/**
 * The leaderboard of one board.
 *
 *   const board = createLeaderboard({ sdk, boardId: manifest.leaderboardId });
 *   if (await board.ready()) await board.submit(score);
 *
 * @param {object} o
 * @param {object} o.sdk          getSDK() of the shim: storage for the player's choice, track for events
 * @param {string} o.boardId      game.json leaderboardId
 * @param {number} [o.waitMs]     how long ready() waits for gmsdkjs to sign the player in (default 20 s)
 * @param {object} [o.g]          the global object (tests)
 */
export function createLeaderboard({ sdk, boardId, waitMs = 20000, g = globalThis } = {}) {
  const id = typeof boardId === 'string' ? boardId.trim() : '';
  let gm = null;
  let profile = null;
  let starting = null;

  const track = (name, params) => {
    try {
      sdk?.track?.(name, params);
    } catch {
      // tracking never breaks the game
    }
  };
  const saved = () => {
    try {
      return sdk?.storage?.get(AREA, {}) ?? {};
    } catch {
      return {};
    }
  };
  const save = (p) => {
    try {
      sdk?.storage?.patch(AREA, { name: p.name, country: p.country });
    } catch {
      // the server copy is the one that counts
    }
  };

  /** The GM SDK gmsdkjs loaded, once a player is signed in; null after waitMs (no gma on this page, offline, blocked). */
  async function signedIn() {
    const until = Date.now() + waitMs;
    for (;;) {
      const s = g.GMGameSDK;
      try {
        if (s && typeof s.leaderboard === 'function' && s.getPlayerId?.() && !s.isTokenExpired?.()) return s;
      } catch {
        // not ready yet
      }
      if (Date.now() >= until) return null;
      await sleep(250);
    }
  }

  async function start() {
    if (!id) {
      console.error('[leaderboard] no leaderboardId: set it in config.json (docs/LEADERBOARD.md)');
      return false;
    }
    gm = await signedIn();
    if (!gm) {
      console.warn('[leaderboard] the GM SDK did not sign in (no gma on this page, offline or blocked): leaderboard off');
      track('leaderboard_ready', { ok: 0 });
      return false;
    }
    // gmsdkjs signs a new player in with a random name and the US flag; the name and flag the player chose on this
    // device win, and the server copy is updated to them (as the Unity build seeds an empty profile).
    let p = {};
    try {
      p = (await gm.getMyProfile()) ?? {};
    } catch (e) {
      console.warn('[leaderboard] profile:', reason(e));
    }
    const mine = saved();
    profile = {
      id: String(gm.getPlayerId() ?? ''),
      name: cleanName(mine.name) || cleanName(p.name),
      country: cleanCountry(mine.country) || cleanCountry(p.country),
    };
    if ((mine.name && profile.name !== p.name) || (mine.country && profile.country !== p.country)) {
      try {
        await gm.updateMyProfile({ name: profile.name, country: profile.country });
      } catch (e) {
        console.warn('[leaderboard] profile update:', reason(e));
      }
    }
    track('leaderboard_ready', { ok: 1 });
    return true;
  }

  const board = () => gm.leaderboard(id);

  return {
    /** The board id this leaderboard uses. */
    boardId: id,

    /** Signed in and the board can be used. Waits for gmsdkjs (up to waitMs) the first time; never rejects. */
    ready() {
      starting ??= start().catch((e) => {
        console.warn('[leaderboard] start failed:', reason(e));
        return false;
      });
      return starting.then((ok) => {
        if (!ok) starting = null; // try again on the next call (the network may be back)
        return ok;
      });
    },

    /** { id, name, country } of the signed-in player; null before ready(). `name` may be the random default. */
    player() {
      return profile ? { ...profile } : null;
    },

    /** True when the player has not picked a name yet (still gmsdkjs's "playerXXXXXX"). */
    needsName() {
      return !profile || !profile.name || DEFAULT_NAME.test(profile.name);
    },

    /** Change the name and / or flag. The local copy changes only when the server accepts it. */
    async setPlayer({ name, country } = {}) {
      if (!(await this.ready())) return false;
      const next = {
        name: name === undefined ? profile.name : cleanName(name),
        country: country === undefined ? profile.country : cleanCountry(country),
      };
      if (!next.name) return false;
      try {
        await gm.updateMyProfile({ name: next.name, country: next.country });
        profile = { ...profile, ...next };
        save(profile);
        track('leaderboard_profile', { ok: 1 });
        return true;
      } catch (e) {
        console.warn('[leaderboard] profile rejected:', reason(e));
        track('leaderboard_profile', { ok: 0, reason: reason(e) });
        return false;
      }
    },

    /**
     * Submit a score (once per run is enough: the server keeps each period's best). Signed here.
     * @returns {Promise<{ rank: number, score: number } | null>} null when it did not reach the board
     */
    async submit(score, metadata) {
      const value = Number(score);
      if (!Number.isFinite(value)) return null;
      if (!(await this.ready())) return null;
      try {
        const playerId = gm.getPlayerId();
        const opts = { token: scoreToken(playerId, value) };
        if (metadata !== undefined) opts.metadata = metadata;
        const r = await board().submitScore(value, opts);
        // Logged in release builds too: "my score is not on the board" is answered by this line.
        console.info(`[leaderboard] submitted ${value} as ${playerId} to ${id}: rank ${r?.rank}`);
        track('leaderboard_submit', { ok: 1, score: value });
        return { rank: Number(r?.rank ?? 0), score: Number(r?.score ?? value) };
      } catch (e) {
        console.warn('[leaderboard] submit failed:', reason(e), e);
        track('leaderboard_submit', { ok: 0, score: value, reason: reason(e) });
        return null;
      }
    },

    /**
     * One page of the ranking of the current period.
     * @returns {Promise<{ period: string, total: number, entries: object[] } | null>} null = could not load
     */
    async top(period = 'alltime', { offset = 0, limit = 10 } = {}) {
      if (!PERIODS.includes(period)) period = 'alltime';
      if (!(await this.ready())) return null;
      try {
        const page = await board().getTopScores({ period, offset, limit });
        return {
          period,
          total: Number(page?.total ?? 0),
          entries: (Array.isArray(page?.results) ? page.results : []).map(entry),
        };
      } catch (e) {
        console.warn('[leaderboard] top failed:', reason(e));
        return null;
      }
    },

    /**
     * The player's own rank and score in the current period.
     * @returns {Promise<object | null | undefined>} the entry; null = no score yet; undefined = could not load
     */
    async me(period = 'alltime') {
      if (!PERIODS.includes(period)) period = 'alltime';
      if (!(await this.ready())) return undefined;
      try {
        return entry(await board().getMyScore({ period }));
      } catch (e) {
        if (e?.status === 404) return null;
        console.warn('[leaderboard] my score failed:', reason(e));
        return undefined;
      }
    },
  };
}
