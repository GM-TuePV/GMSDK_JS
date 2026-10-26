// Types of copyright.js (docs/LOADING.md §2).

export const COPYRIGHT_YEAR: number;
export const COPYRIGHT_OWNER: string;
/** "© 2026 Azgames.io" */
export const COPYRIGHT_DEFAULT: string;
/** "https://azgames.io/privacy-policy/": the "Privacy Policy" button in Settings, every portal, new tab. */
export const PRIVACY_POLICY_URL: string;

/** The copyright line: the default unless the server says otherwise; '' = show nothing. */
export function copyrightText(sdk?: { version?: string; brand?: { trademark(): string } }): string;
