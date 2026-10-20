// Types for window.GMSDKJS and the shim (spec §5). Copy next to gmsdkjs-shim.js in the game.

export interface GmsdkInfo {
  version: string;
  platform: string;
  sdkType: 'gm' | 'gd' | 'crazy' | 'poki';
  gameId: string;
  /** The ad adapter in use: h5, gd, crazy, poki, wg or none. */
  adType: string;
  /** false when the licence API locked this site (lock screen, ads off). */
  licensed: boolean;
  /** true when ads are blocked: ads are then off. */
  adblock: boolean;
  /** true in ads test mode (adsTest in the options block): Google's h5 test ads, the API's adsinfo unused. */
  adsTest: boolean;
  /** The licence API's adsinfo in force, or the template's ads. */
  adsInfo: Record<string, unknown> | null;
  /** The licence API's gameinfo (moregames_url, promotion, tracking_event, trademark…), or null. */
  gameInfo: Record<string, unknown> | null;
}

/** One localStorage key azgames.<gameCode>, split into areas (spec §9). */
export interface GmsdkStorage {
  readonly key?: string;
  get<T>(area: string, fallback: T): T;
  set(area: string, value: unknown): boolean;
  patch(area: string, part: Record<string, unknown>): boolean;
  /** { 'old.key': 'area' }: moved once, when azgames.<gameCode> did not exist yet; returns the areas moved. */
  migrate(legacy: Record<string, string>): string[];
  flush(): boolean;
}

export interface GmsdkBrand {
  name: string;
  logo: string;
  url: string;
  loadLogo(): Promise<HTMLImageElement | null>;
  /**
   * The copyright text to show ('' = show nothing), from the API's gameinfo.trademark: 0 '', 1 (default) the copyright
   * owner's domain (azgames.io), 2 its name (AZ Games). Never write the owner in the game: always this.
   */
  trademark(): string;
}

export interface Gmsdk {
  readonly version: string;
  readonly info: GmsdkInfo;
  readonly storage: GmsdkStorage;
  readonly brand: GmsdkBrand;
  ready(): Promise<GmsdkInfo>;
  loadingProgress(progress: number): void;
  loadingDone(): void;
  /** Only when the licence API sets enable_preroll 'yes' (h5, gd); false otherwise. Call it once, before the first run. */
  preroll(): Promise<boolean>;
  gameplayStart(): void;
  gameplayStop(): void;
  /** true when an ad was shown. */
  interstitial(placement?: string): Promise<boolean>;
  rewardedAvailable(): boolean;
  /** true only when the ad was watched to the end: give the reward then. */
  rewarded(placement?: string): Promise<boolean>;
  /** Mute, stop the loop and block input; called before every ad. */
  onPause(fn: () => void): void;
  onResume(fn: () => void): void;
  track(name: string, params?: Record<string, string | number | boolean | null | undefined>): void;
  moreGamesUrl(): string | null;
  happyTime(): void;
  setMuted(muted: boolean): void;
}

export declare const METHODS: readonly string[];
export declare function createFallback(g: object, gameCode?: string): Gmsdk;
export declare function getSDK(options?: { gameCode?: string; g?: object }): Gmsdk;

declare global {
  interface Window {
    GMSDKJS?: Gmsdk;
    GMSDKJS_OPTIONS?: Record<string, unknown>;
  }
}
