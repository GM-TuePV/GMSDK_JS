// Types of copyright.js (docs/LOADING.md §2).

export const COPYRIGHT_YEAR: number;
export const COPYRIGHT_OWNER: string;
/** "© 2026 Azgames.io" */
export const COPYRIGHT_DEFAULT: string;
/** "https://azgames.io/privacy-policy/": the Privacy Policy link of the dev page (on a portal: privacyPolicyUrl). */
export const PRIVACY_POLICY_URL: string;

/**
 * The "Privacy Policy" button's link, like More Games: the server's gameinfo.privacy_policy; '' = hide the button.
 * The dev page always has one (the server's, else PRIVACY_POLICY_URL).
 */
export function privacyPolicyUrl(sdk?: {
  version?: string;
  info?: { version?: string; platform?: string; gameInfo?: { privacy_policy?: string } | null } | null;
}): string;

/** The copyright line: the default unless the server says otherwise; '' = show nothing. */
export function copyrightText(sdk?: { version?: string; brand?: { trademark(): string } }): string;
