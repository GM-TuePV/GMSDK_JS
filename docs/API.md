# API: `getSDK()` và `window.GMSDKJS`

Tra cứu từng hàm. Cách dùng theo thứ tự trong một game: [INTEGRATION.md](INTEGRATION.md).

## 1. Lấy SDK

```js
import { getSDK } from './sdk/gmsdkjs-shim.js';
const sdk = getSDK({ gameCode: 'g131' }); // gameCode của game, xem bên dưới
```

- `gmsdkjs.js` do template của platform nạp: `<script id="gmsoft-jssdk" src="https://games.1games.io/lib/1games/gmsdkjs/gmsdkjs.js">`. Nó tạo `window.GMSDKJS` trước khi `game.js` chạy.
- **Game không gọi thẳng `window.GMSDKJS`**, mà luôn qua `getSDK()` của `sdk/gmsdkjs-shim.js` (JS thuần, không cần build):
  - Có `window.GMSDKJS` thì `getSDK()` trả nó, mỗi hàm được bọc: thiếu hàm, hàm throw hay promise reject thì dùng bản dự phòng.
  - Không có (CDN lỗi, adblock chặn, template thiếu thẻ) thì trả **bản dự phòng cùng API**: quảng cáo trả `false`, tracking bỏ qua, **lưu trữ vẫn lưu thật** vào đúng key `azgames.<gameCode>`.
  - Game vì thế không bao giờ lỗi vì thiếu SDK, và tiến trình không mất.
- `gameCode`: mã `g<số>` của game (ví dụ `g131`). Thường template đã có trong `GMSDKJS_OPTIONS.gameCode`; tham số này chỉ dùng khi trang không có khối tuỳ chọn. Lấy từ `game.json` của game.
- Gọi `getSDK()` sau khi `gmsdkjs.js` đã chạy: trong `game.js` (template nạp SDK trước) là đúng. Mỗi trang một SDK; gọi lại trả cùng đối tượng.
- Khai báo kiểu cho TypeScript: `sdk/gmsdkjs-shim.d.ts` (và `sdk/net.d.ts` cho `net.js`), đặt cạnh file `.js` cùng tên.

**Mọi hàm an toàn khi chưa `ready()`** (chờ bên trong) và **không bao giờ throw ra game**. Mọi lần chờ đều có giới hạn.

## 2. Khởi động

| Hàm | Trả về | Ghi chú |
| --- | --- | --- |
| `ready()` | `Promise<Info>` | Chờ API licence **tối đa 5 s**, gộp cấu hình quảng cáo, khởi động network quảng cáo và GMA. Không bao giờ reject. Gọi nhiều lần trả cùng một promise. SDK quảng cáo có thể còn đang khởi động sau đó, nên `info.adblock` và `rewardedAvailable()` có thể đổi về sau |
| `loadingProgress(p)` | | Tiến độ tải `0..1`. Chuyển cho portal nếu cần |
| `loadingDone()` | | Gọi **khi menu thật sự hiện ra**. Gửi `loaded_game { load_time_ms }` (một lần) |
| `info` | `Info` | Cấu hình đang dùng (đọc sau `ready()`) |
| `version` | `string` | Phiên bản gmsdkjs, `'fallback'` khi là bản dự phòng |

`Info`:

| Trường | Ý nghĩa |
| --- | --- |
| `adType` | Network quảng cáo đang chạy: `h5`, `gd`, `crazy`, `poki`, `wg` hoặc `none` |
| `licensed` | `false` khi API khoá site này (SDK tự tắt quảng cáo và hiện màn khoá) |
| `adblock` | `true` khi quảng cáo bị chặn: mọi quảng cáo trả `false` |
| `adsTest` | `true` ở chế độ thử quảng cáo (quảng cáo test của Google) |
| `adsInfo`, `gameInfo` | Cấu hình quảng cáo và `gameinfo` của API, hoặc `null`. Game thường không cần |
| `version`, `platform`, `sdkType`, `gameId` | Từ khối tuỳ chọn của template |

## 3. Quảng cáo

| Hàm | Trả về | Ghi chú |
| --- | --- | --- |
| `preroll()` | `Promise<boolean>` | Quảng cáo đầu game. **Chỉ chạy khi API bật cờ** (`h5`, `gd`); không có cờ thì trả `false` ngay. Tối đa **15 s** tính từ lúc gọi. Một lần mỗi trang |
| `interstitial(placement?)` | `Promise<boolean>` | Quảng cáo xen giữa. `true` khi đã hiện. SDK tự giữ khoảng cách thời gian (`time_show_inter` của API); vừa xem quảng cáo thưởng thì cũng chưa hiện xen giữa. Quảng cáo không bắt đầu trong 10 s thì trả `false` |
| `rewardedAvailable()` | `boolean` | Có quảng cáo thưởng sẵn sàng, qua giãn cách, không bị chặn. Dùng để **hiện hay ẩn nút** xem quảng cáo |
| `rewarded(placement?)` | `Promise<boolean>` | **`true` chỉ khi xem hết**: chỉ thưởng khi `true`. Gọi **ngay trong handler click** của người chơi |
| `onPause(fn)` / `onResume(fn)` | | SDK gọi `fn` trước và sau **mọi** quảng cáo, kể cả quảng cáo network tự chạy. Game tắt tiếng, dừng vòng lặp, chặn input. Quảng cáo treo thì sau 30 s SDK tự gọi `onResume` |
| `setMuted(muted)` | | Người chơi bật / tắt tiếng. AFG chọn quảng cáo có tiếng hay không |

- `placement` là tên chỗ đặt quảng cáo (`'run_end'`, `'revive'`, `'double_coins'`…). Được ghi vào tracking.
- Chỉ một quảng cáo một lúc: gọi khi đang có quảng cáo thì trả `false` ngay. Bấm hai lần không chạy hai quảng cáo.
- Không có cấu hình quảng cáo, bị chặn quảng cáo, hay site bị khoá: mọi hàm trả `false`, game chơi bình thường.

## 4. Portal

| Hàm | Ghi chú |
| --- | --- |
| `gameplayStart()` / `gameplayStop()` | Báo lúc người chơi **đang chơi thật** (không tính menu, màn kết thúc, tạm dừng). Poki / CrazyGames bắt buộc. Gọi trùng thì bỏ qua. `gameplayStart()` đầu tiên của trang gửi `start_game` |
| `happyTime()` | Khoảnh khắc vui (kỷ lục mới, thắng lớn). Chỉ CrazyGames dùng |
| `moreGamesUrl()` | URL "More games" của API (chỉ http/https), hoặc `null`: **`null` thì ẩn nút**. Trên GD, CrazyGames, Poki luôn là `null` (template tắt) |

## 5. Tracking

| Hàm | Ghi chú |
| --- | --- |
| `track(name, params?)` | Sự kiện riêng của game, gửi GMA. Tên ≤ 40 ký tự, tối đa 25 tham số, chuỗi ≤ 100 ký tự, boolean thành `1` / `0`, `null` / `undefined` bị bỏ |

SDK tự gửi các sự kiện chuẩn. Danh sách và quy tắc đặt tên: [ANALYTICS.md](ANALYTICS.md).

## 6. Lưu trữ: `sdk.storage`

Một key `localStorage` duy nhất cho mỗi game: **`azgames.<gameCode>`**, giá trị `{ "v": 1, "<vùng>": … }`.

| Hàm | Trả về | Ghi chú |
| --- | --- | --- |
| `get(area, fallback)` | bản sao giá trị | `fallback` khi vùng chưa có |
| `set(area, value)` | `boolean` | Ghi cả vùng. `value` phải là dữ liệu JSON. `set(area, undefined)` xoá vùng |
| `patch(area, part)` | `boolean` | Gộp `part` (object) vào vùng |
| `migrate({ 'key.cũ': 'vùng' })` | `string[]` | Chuyển key cũ của game sang vùng, **một lần**, chỉ khi `azgames.<gameCode>` chưa có. Xoá key cũ sau khi chuyển |
| `flush()` | `boolean` | Ghi ngay (bình thường SDK gộp ghi sau 300 ms và ghi ngay khi tab ẩn / đóng) |

- Vùng chuẩn: `settings` (âm thanh, ngôn ngữ…), `profile` (tiến trình, điểm, tiền). **`sdk` là của GMA** (tên người chơi ẩn danh): game không ghi vào. `v` là tên dành riêng.
- `localStorage` bị chặn (iframe sandbox, chặn cookie): SDK lưu trong bộ nhớ suốt phiên, không lỗi.
- **Game không gọi `localStorage` trực tiếp.** `tools/check-export.mjs --src` kiểm điều này.

## 7. Thương hiệu: `sdk.brand`

| Thuộc tính / hàm | Ghi chú |
| --- | --- |
| `name`, `logo`, `url` | Publisher của template (ví dụ GamesForFree) |
| `loadLogo()` | `Promise<HTMLImageElement \| null>`: logo đã nạp (CORS, vẽ WebGL được), hoặc `null` |
| `trademark()` | Chữ bản quyền, theo `gameinfo.trademark` của API: `0` → `''` (**không hiện gì**); `1` (mặc định, cả khi API không trả lời) → tên miền chủ bản quyền (`azgames.io`); `2` → tên chủ bản quyền (`AZ Games`). Chủ bản quyền là `copyright` trong preset của tool build, giống nhau ở mọi publisher. Trên GD, CrazyGames, Poki luôn là `''` (template tắt). **Game không tự viết chữ bản quyền**: dùng `copyrightText(sdk)` của `sdk/copyright.js` (mặc định `© 2026 Azgames.io`, [LOADING.md §2](LOADING.md)) |

## 8. Bảng xếp hạng

Không nằm trong `sdk`: module `leaderboard/` của kit, dùng lần đăng nhập GMA của gmsdkjs. Hàm, lỗi, màn hình mặc định: [LEADERBOARD.md](LEADERBOARD.md).

## 9. Những gì SDK tự làm, game không đụng tới

- Kiểm licence với API; site không được phép thì tắt quảng cáo và hiện màn khoá.
- Chuyển hướng trang mở trực tiếp không qua portal (`force_redirect` của API).
- API chậm quá 5 s hay lỗi thì game vẫn được chơi; câu trả lời đến muộn không khoá, không chuyển hướng.
- Nạp SDK của network quảng cáo (AFG, GameDistribution, CrazyGames, Poki, WeeGoo) và GMA.
