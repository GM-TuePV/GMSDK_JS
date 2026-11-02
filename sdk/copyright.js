// The copyright line (docs/INTEGRATION.md §9). Default "© 2026 Azgames.io"; the SDK changes it only when the server says
// so (gameinfo.trademark of the licence API, through sdk.brand.trademark()):
//
//   no SDK / no answer / the default owner   → "© 2026 Azgames.io"
//   another domain or name from the server   → "© 2026 <that>"
//   trademark off (0, and GD / Poki templates)  → ''  (show nothing); CrazyGames shows it (text, never a link)
//
//   import { copyrightText } from './sdk/copyright.js';
//   label.textContent = copyrightText(sdk);   // after sdk.ready(): the server's answer is in
//
// The only place the game may name the owner: check-export accepts this default and warns on any other.

export const COPYRIGHT_YEAR = 2026;
export const COPYRIGHT_OWNER = 'Azgames.io';
export const COPYRIGHT_DEFAULT = `© ${COPYRIGHT_YEAR} ${COPYRIGHT_OWNER}`;

/**
 * The Privacy Policy link of the dev page (docs/INTEGRATION.md §9). On a portal the link is the server's, like More
 * Games: privacyPolicyUrl(sdk) below. check-export warns when the game writes the owner's domain itself.
 */
export const PRIVACY_POLICY_URL = 'https://azgames.io/privacy-policy/';

/**
 * The "Privacy Policy" button in Settings next to the copyright line (docs/INTEGRATION.md §9), like More Games: the
 * server decides (gameinfo.privacy_policy of the licence API, through sdk.info.gameInfo):
 *
 *   a link from the server        → that link
 *   empty, none, no answer        → ''  (hide the button)
 *   dev page (no SDK, or platform 'dev') → the server's link, else PRIVACY_POLICY_URL: the button always shows there
 *
 *   const url = privacyPolicyUrl(sdk);                 // after sdk.ready(): the server's answer is in
 *   privacyButton.hidden = !url;
 *   privacyButton.onclick = () => window.open(url, '_blank', 'noopener');
 *
 * @param {object} [sdk] getSDK() of the shim @returns {string} '' = no button
 */
export function privacyPolicyUrl(sdk) {
  let info = null;
  try {
    if (sdk && sdk.version !== 'fallback') info = sdk.info;
  } catch {
    info = null;
  }
  let url = '';
  try {
    const raw = info?.gameInfo?.privacy_policy;
    if (typeof raw === 'string' && raw.trim()) {
      const u = new URL(raw.trim());
      if (u.protocol === 'https:' || u.protocol === 'http:') url = u.href;
    }
  } catch {
    url = '';
  }
  // The dev page (the shim's fallback has no server; gmsdkjs on localhost gets no link): the default, so the button's
  // place and text can be checked.
  const dev = !info || info.version === 'fallback' || info.platform === 'dev';
  return url || (dev ? PRIVACY_POLICY_URL : '');
}

/** @param {object} [sdk] getSDK() of the shim @returns {string} '' = show nothing */
export function copyrightText(sdk) {
  let owner;
  try {
    // The shim's fallback (no gmsdkjs on the page) has no server to ask: the default.
    if (!sdk || sdk.version === 'fallback') return COPYRIGHT_DEFAULT;
    owner = sdk.brand.trademark();
  } catch {
    return COPYRIGHT_DEFAULT;
  }
  if (owner === '') return '';
  if (typeof owner !== 'string' || !owner.trim() || owner.trim().toLowerCase() === COPYRIGHT_OWNER.toLowerCase()) return COPYRIGHT_DEFAULT;
  return `© ${COPYRIGHT_YEAR} ${owner.trim()}`;
}
