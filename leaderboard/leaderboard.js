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

/**
 * A name the GMA server accepts: 1-20 characters of A-Z a-z 0-9 _ - (it answers "invalid name" otherwise). Spaces
 * become "_", accents are dropped (é → e), anything else is removed. '' when nothing is left.
 */
export function cleanName(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, (c) => (c === 'đ' ? 'd' : 'D'))
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, NAME_MAX);
}

/**
 * A portal username as the player sees it there (kit 1.0.3): cleanName's rule plus the period (CrazyGames usernames:
 * letters, digits, period, underscore; the GMA server takes the period). Names typed in the game keep cleanName.
 */
export function cleanPortalName(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, (c) => (c === 'đ' ? 'd' : 'D'))
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_.-]/g, '')
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

  /**
   * gmsdkjs's rules for the player (playerPolicy, gmsdkjs 1.0.2): on CrazyGames the name is the CrazyGames username
   * and cannot change, and a guest's score is not sent (their rules). Older gmsdkjs: no rule, everything allowed.
   * gmsdkjs 1.0.3 adds guest (no one signed in on the portal) and country (the portal's, the default flag).
   */
  const policy = () => {
    try {
      const p = g.GMSDKJS?.playerPolicy?.();
      return p && typeof p === 'object' ? p : {};
    } catch {
      return {};
    }
  };
  const nameEditable = () => policy().nameEditable !== false;
  /** The portal's name for the player now (locked: the username, the period kept), or ''. */
  const portalName = () => (nameEditable() ? '' : cleanPortalName(policy().name));
  /** A name as this board keeps it: the portal's rule where the portal owns the name, cleanName elsewhere. */
  const nameOf = (n) => (nameEditable() ? cleanName(n) : cleanPortalName(n));
  /**
   * A guest where the portal owns the name (kit 1.0.3): the portal says so, or has not given a username yet (the board
   * may open before getUser answers): shown as Guest with the US flag, never under its GMA player's random name.
   */
  const guestNow = () => policy().guest === true || (!nameEditable() && !portalName());

  /**
   * A guest's best score, per board (kit 1.0.4), kept in the save (sdk.storage, this module's area, key pending). On
   * CrazyGames the save is the player's data (Data module): at a sign-in CrazyGames copies the guest's data to an
   * account that has none, this score with it, and the account sends it once its board is ready; an account with
   * data of its own never gets the guest's, so nothing of the guest is sent. Written at once (flush): the sign-in
   * may come right after.
   */
  const pending = {
    all() {
      const o = saved().pending;
      return o && typeof o === 'object' && !Array.isArray(o) ? { ...o } : {};
    },
    put(o) {
      try {
        if (sdk?.storage?.patch(AREA, { pending: o })) sdk.storage.flush?.();
      } catch {
        // no storage: nothing kept
      }
    },
    keep(value, metadata) {
      const o = this.all();
      if (!(o[id]?.score >= value)) o[id] = metadata === undefined ? { score: value } : { score: value, metadata };
      this.put(o);
    },
    take() {
      const o = this.all();
      const p = o[id];
      if (!p) return null;
      delete o[id];
      this.put(o);
      return p && Number.isFinite(Number(p.score)) ? p : null;
    },
  };

  /** The GM SDK gmsdkjs loaded, once a player is signed in; null after waitMs (no gma on this page, offline, blocked). */
  async function signedIn() {
    const until = Date.now() + waitMs;
    for (;;) {
      const s = g.GMGameSDK;
      try {
        // gmsdkjs 1.0.4 says when the player is settled (its session chosen): before, the id may still change
        if (s && typeof s.leaderboard === 'function' && s.getPlayerId?.() && !s.isTokenExpired?.() && policy().ready !== false) return s;
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
    // The GMA profile is the player's real name and flag: the one they set in any game that shares this GMA player
    // shows here too. The copy in this game's save is only a cache, used when the server cannot be read. One case
    // goes the other way: the server still has gmsdkjs's random first name (playerXXXXXX) and this device has a
    // name the player chose (a new GMA player on a new site / after cleared data): the chosen one is sent up.
    let p = null;
    try {
      p = (await gm.getMyProfile()) ?? null;
    } catch (e) {
      console.warn('[leaderboard] profile:', reason(e));
    }
    const mine = saved();
    const serverName = nameOf(p?.name);
    const serverCountry = cleanCountry(p?.country);
    const chosenHere = cleanName(mine.name);
    const seed = nameEditable() && p && chosenHere && (!serverName || DEFAULT_NAME.test(serverName)) && !DEFAULT_NAME.test(chosenHere);
    profile = {
      id: String(gm.getPlayerId() ?? ''),
      name: portalName() || (seed ? chosenHere : serverName || chosenHere),
      // no flag anywhere yet: the portal's country (gmsdkjs 1.0.3), the player can still pick another
      country: (seed ? cleanCountry(mine.country) || serverCountry : serverCountry || cleanCountry(mine.country)) || cleanCountry(policy().country),
    };
    if (seed) {
      try {
        await gm.updateMyProfile({ name: profile.name, country: profile.country });
      } catch (e) {
        console.warn('[leaderboard] profile update:', reason(e));
      }
    }
    if (p) save(profile); // keep the cache in line with the server
    track('leaderboard_ready', { ok: 1 });
    if (!guestNow()) {
      // a guest's score in this save: the account took the guest's data (CrazyGames copies it to an account with none)
      const kept = pending.take();
      if (kept) {
        console.info(`[leaderboard] the guest's best score, in the data this account took: ${kept.score}`);
        void sendScore(Number(kept.score), kept.metadata);
      }
    }
    return true;
  }

  const board = () => gm.leaderboard(id);
  /** Sign and send a score (submit, or a guest's score of this tab after a sign-in). */
  async function sendScore(value, metadata) {
    try {
      const playerId = gm.getPlayerId();
      const opts = { token: scoreToken(playerId, value) };
      if (metadata !== undefined) opts.metadata = metadata;
      const r = await board().submitScore(value, opts);
      // Logged in release builds too: "my score is not on the board" is answered by this line.
      console.info(`[leaderboard] submitted ${value} as ${playerId} to ${id}: rank ${r?.rank}`);
      noScore.clear();
      track('leaderboard_submit', { ok: 1, score: value });
      return { rank: Number(r?.rank ?? 0), score: Number(r?.score ?? value) };
    } catch (e) {
      console.warn('[leaderboard] submit failed:', reason(e), e);
      track('leaderboard_submit', { ok: 0, score: value, reason: reason(e) });
      return null;
    }
  }

  // Periods where the server said "no score yet" (204 No Content; 404 before): asked once per page, until a score is
  // submitted. Each ask is a request for nothing (with 404, a red line in the console), and a tab / mode switch asks again.
  const noScore = new Set();

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

    /**
     * { id, name, country } of the signed-in player; null before ready(). `name` may be the random default. Where the
     * portal owns the name it is the portal's now (a late answer of the portal shows at once).
     */
    player() {
      if (!profile) return null;
      // a guest has no id here (kit 1.0.4): a screen that marks the player's own row marks none for it
      if (guestNow()) return { ...profile, id: '', name: '', country: 'US' };
      const live = (() => {
        try {
          return String(gm?.getPlayerId?.() ?? '');
        } catch {
          return '';
        }
      })();
      const now = portalName();
      return { ...profile, id: live || profile.id, ...(now ? { name: now } : {}) };
    },

    /**
     * True for a CrazyGames guest (gmsdkjs 1.0.3: no one signed in on the portal, or no username yet): shown as
     * "Guest" with the US flag, not on the board, no flag change.
     */
    isGuest: guestNow,

    /** True when the player has not picked a name yet (still gmsdkjs's "playerXXXXXX"); never where the name is locked. */
    needsName() {
      if (!nameEditable()) return false;
      return !profile || !profile.name || DEFAULT_NAME.test(profile.name);
    },

    /** False where the portal owns the name (CrazyGames): no name field, only the flag. */
    nameEditable,

    /** False where this player's score is not sent (a CrazyGames guest): the board still shows. */
    canSubmit() {
      return policy().leaderboard !== false;
    },

    /** Change the name and / or flag. The local copy changes only when the server accepts it. */
    async setPlayer({ name, country } = {}) {
      if (!(await this.ready())) return false;
      if (guestNow()) return false; // a guest signs in on the portal for a name and a flag of its own
      const named = nameEditable(); // else the portal's name: only the flag changes, the name is never sent
      const next = {
        name: !named || name === undefined ? profile.name : cleanName(name),
        country: country === undefined ? profile.country : cleanCountry(country),
      };
      if (named && !next.name) return false;
      try {
        await gm.updateMyProfile(named ? { name: next.name, country: next.country } : { country: next.country });
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
      if (!this.canSubmit()) {
        console.info('[leaderboard] not submitted: a guest (sign in on the portal to be on the board)');
        track('leaderboard_submit', { ok: 0, score: value, reason: 'guest' });
        if (guestNow()) pending.keep(value, metadata);
        return null;
      }
      if (!(await this.ready())) return null;
      return sendScore(value, metadata);
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
      if (guestNow()) return null; // kit 1.0.4: a guest has no row of its own
      if (noScore.has(period)) return null;
      if (!(await this.ready())) return undefined;
      try {
        // "no score yet": the server answers 204 No Content (404 before); gm-sdk.js throws { status: 204, error:
        // 'no score' } for it (below), an empty result is taken the same way
        const r = await board().getMyScore({ period });
        if (r == null) {
          noScore.add(period);
          return null;
        }
        return entry(r);
      } catch (e) {
        if (e?.status === 204 || e?.status === 404) {
          noScore.add(period);
          return null;
        }
        console.warn('[leaderboard] my score failed:', reason(e));
        return undefined;
      }
    },
  };
}
