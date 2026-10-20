// Types of loading.js (docs/LOADING.md). Copy next to it in src/sdk/loading/ when the game uses TypeScript.

export interface Loader {
  /** 0..1: the bar (spinner until the first count), "Almost there..." from 99 %. Also calls sdk.loadingProgress. */
  progress(fraction: number): void;
  /** The game's name, once game.json is loaded. */
  setTitle(name: string): void;
  /** Load failed: "Connection problem. Tap to retry."; tapping calls onRetry (default: reload the page). */
  error(onRetry?: () => void): void;
  /** The first screen of the game is ready. */
  hide(): void;
}

export function createLoader(o?: {
  /** getSDK() of the shim. */
  sdk?: { loadingProgress?(p: number): void };
  /** Default: the page <title>. */
  title?: string;
  /** Folder of loading.webp and logo.webp, default 'assets/loading/'. */
  assets?: string;
  /** Corner text, default GMSDKJS_OPTIONS.version. */
  version?: string;
}): Loader;
