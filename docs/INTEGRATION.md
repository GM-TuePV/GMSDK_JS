# Gắn SDK vào game

Từng bước, theo thứ tự game chạy. Mẫu đầy đủ, chạy được: [`example/main.js`](../example/main.js). Tra cứu hàm: [API.md](API.md).

## 1. Cấu trúc trong repo game

```
<game>/
├── index.html            trang dev = template/index.html (KHÔNG nằm trong gói xuất)
├── vite.config.mjs       = template/vite.config.mjs (nếu dùng Vite)
├── public/
│   ├── game.json         manifest (EXPORT.md §2)
│   ├── i18n/en.json      (+ mỗi ngôn ngữ một file, tên theo thẻ BCP 47: en-US.json, zh-TW.json…)
│   └── assets/…
└── src/
    ├── main.js           entry của game
    └── sdk/              chép từ kit: gmsdkjs-shim.js, i18n.js, net.js (+ gmsdkjs-shim.d.ts, net.d.ts nếu dùng TypeScript)
        └── leaderboard/  chép từ kit khi game có bảng xếp hạng (LEADERBOARD.md §2); cờ ở public/assets/leaderboard/
```

- Các file trong `src/sdk/` **chép nguyên**, không sửa. Cập nhật thì chép lại từ kit (hoặc tải `https://games.1games.io/lib/1games/gmsdkjs/gmsdkjs-shim.js` và `.d.ts`).
- Không dùng Vite thì giữ đúng bố cục gói xuất ([EXPORT.md](EXPORT.md)) bằng bundler của game.

## 2. Thứ tự khởi động

```js
import { getSDK } from './sdk/gmsdkjs-shim.js';
import { initI18n } from './sdk/i18n.js';
import { loadJSON } from './sdk/net.js';

const sdk = getSDK({ gameCode: 'g131' });          // 1. SDK trước tiên
sdk.onPause(pauseGame);                            // 2. tạm dừng / chạy lại, trước mọi quảng cáo
sdk.onResume(resumeGame);

async function boot() {
  const manifest = await loadJSON('game.json');    // 3. manifest + tiếng Anh: lỗi thì "Try again"
  await initI18n({ languages: manifest.languages, defaultLanguage: manifest.defaultLanguage, storage: sdk.storage });
  sdk.storage.migrate({ 'mygame.save': 'profile' }); // 4. key cũ (nếu game từng lưu kiểu khác)
  await loadAssets((p) => sdk.loadingProgress(p)); // 5. tải tài nguyên, báo tiến độ 0..1
  await sdk.ready();                               // 6. licence + cấu hình quảng cáo (≤ 5 s)
  showMenu();
  sdk.loadingDone();                               // 7. menu đã hiện: gửi loaded_game
  await sdk.preroll();                             // 8. preroll nếu API bật (≤ 15 s), rồi cho chơi
}
boot().catch(showTryAgain);
```

- `sdk.ready()` có thể chạy song song với bước tải tài nguyên. Chỉ cần xong trước khi hiện menu.
- Không chờ quảng cáo trước khi hiện menu; preroll chạy khi menu đã hiện, game đã dừng nhờ `onPause`.
- Màn loading là của game: vẽ thanh tiến độ, có thể thêm logo publisher bằng `sdk.brand.loadLogo()` (trả `null` thì bỏ qua).

## 3. Tạm dừng khi có quảng cáo

```js
sdk.onPause(() => { audio.mute(); loop.stop(); input.block(); });
sdk.onResume(() => { audio.unmute(); loop.start(); input.unblock(); });
```

- SDK gọi hai hàm này quanh **mọi** quảng cáo, kể cả quảng cáo network tự chạy, và tự đếm lồng nhau. Game chỉ làm đúng việc tắt / bật.
- Quảng cáo treo thì sau 30 s SDK vẫn gọi `onResume`.
- Khi site bị khoá, SDK gọi `onPause` và không bao giờ gọi `onResume`: game đứng yên dưới màn khoá. Đó là ý muốn.
- Âm thanh: tắt bằng `onPause`, nhưng **giữ lựa chọn tắt tiếng của người chơi** (bật lại ở `onResume` chỉ khi người chơi không tắt).

## 4. Đang chơi

```js
function startRun() { sdk.gameplayStart(); sdk.track('PlayGame', { GameCount: ++runs }); /* … */ }
function endRun(score) { sdk.gameplayStop(); sdk.track('EndGame', { Score: score }); /* … */ }
```

- `gameplayStart()` khi người chơi bắt đầu điều khiển; `gameplayStop()` khi thua, thắng, về menu, mở bảng tạm dừng của game.
- **Trước mọi quảng cáo xen giữa phải là `gameplayStop()`**, sau quảng cáo mới `gameplayStart()` (luật của Poki / CrazyGames; SDK giữ đúng thứ tự gửi).

## 5. Quảng cáo

**Xen giữa:** ở chỗ nghỉ tự nhiên (hết ván, qua màn, về menu), **không bao giờ trong lúc chơi**.

```js
await sdk.interstitial('run_end'); // true / false đều đi tiếp; không chặn luồng game vì kết quả
```

- SDK giữ khoảng cách thời gian theo API. Luật riêng của game (không quảng cáo sau ván đầu, chỉ sau khi thua…) thì game tự kiểm trước khi gọi.

**Thưởng:**

```js
button.hidden = !sdk.rewardedAvailable();       // chỉ hiện nút khi có quảng cáo
button.onclick = () => {
  button.disabled = true;
  sdk.rewarded('revive').then((watched) => { if (watched) revive(); else backToMenu(); });
};
```

- Gọi `rewarded()` **ngay trong handler click**, không `await` gì trước đó (AFG cần lời gọi sát cú bấm).
- **Chỉ thưởng khi `true`.** Đóng sớm, không có quảng cáo hay bị chặn đều là `false`.
- Kiểm `rewardedAvailable()` mỗi lần hiện màn có nút (sau `ready()`, sau mỗi quảng cáo), và **cập nhật nút suốt lúc nó còn trên màn**: giá trị đổi theo thời gian. Bảng dựng ngay sau preroll mà chỉ đọc một lần thì nút xám mãi.

**Preroll:** chỉ `await sdk.preroll()` một lần sau khi menu hiện (§2). Không có cờ của API thì xong ngay.

## 6. Lưu trữ

```js
const profile = sdk.storage.get('profile', { best: 0, coins: 0 });
sdk.storage.patch('profile', { best: Math.max(profile.best, score) });
sdk.storage.patch('settings', { muted: true });
```

- Vùng `settings` cho cài đặt, `profile` cho tiến trình. Thêm vùng riêng nếu cần (ví dụ `levels`). Không ghi vùng `sdk`.
- `get` trả bản sao: sửa xong phải `set` / `patch` lại.
- Không cần tự gọi `flush()`; SDK ghi khi tab ẩn hoặc đóng. Gọi `flush()` ngay sau lúc quan trọng (mua hàng) nếu muốn chắc.
- Game cũ từng lưu key khác: gọi `migrate()` một lần lúc khởi động (§2).

## 7. Ngôn ngữ (`sdk/i18n.js`)

Chuẩn chung (như i18next, LayaAir `i18n/`): **`i18n/<thẻ>.json`** ở gốc gói, mỗi ngôn ngữ một file.

- **Thẻ ngôn ngữ BCP 47**, đúng chữ hoa / thường: ngôn ngữ viết thường (ISO 639-1), vùng viết hoa (ISO 3166). Ví dụ `en`, `es`, `en-US`, `pt-BR`, `zh-CN`, `zh-TW`, `ko-KR`, `ar`. Chỉ thêm vùng khi chữ thật sự khác (`zh-CN` giản thể / `zh-TW` phồn thể, `pt-BR` / `pt`); còn lại dùng mã ngôn ngữ (`es`, `fr`, `ja`).
- **Bảng** là object UTF-8 không BOM: phẳng `{ "play": "Play" }`, hoặc lồng theo nhóm `{ "game": { "score": "Score" }, "setting": { "sound_on": "Sound: ON" } }` và gọi `t('game.score')`. Key `snake_case`; giá trị chỉ là chuỗi (không số, không mảng).
- **Tham số:** `{0}`, `{1}` theo vị trí (`t('x_wins', name)`), hoặc `{name}` theo tên (`t('hi', { name })`).
- **File của `defaultLanguage` bắt buộc và đủ mọi key.** Phải có ít nhất một tiếng Anh (`en` hoặc `en-XX`).
- **Thiếu chữ:** ngôn ngữ đang dùng → ngôn ngữ gốc của nó (`zh-TW` → `zh`, nếu game có) → `defaultLanguage` → hiện key.
- `game.json` liệt kê `languages` (các thẻ) và `defaultLanguage`; truyền vào `initI18n()` (§2).
- **Lúc mở game:** lựa chọn đã lưu của người chơi → **ngôn ngữ của trang** (`GMSDKJS_OPTIONS.language` trong `index.html`, đặt theo từng portal: bên vận hành sửa ở trang, không cần build lại) → `defaultLanguage` của `game.json`. **Không** tự chọn theo ngôn ngữ trình duyệt, không đọc `?lang=`: trang quyết định, người chơi đổi trong game. Thẻ của trang không có trong `languages` thì lấy thẻ cùng ngôn ngữ (`zh` → `zh-TW`), không có thì bỏ qua. Lựa chọn lưu ở `settings.language` qua `sdk.storage` (lưu nguyên thẻ, ví dụ `zh-TW`).
- **Viết từ phải sang trái** (`ar`, `he`, `fa`, `ur`): `i18n.js` đặt `<html dir="rtl">`; game tự lật bố cục nếu cần.
- **Menu ngôn ngữ:** `languageList()` trả `[{ code, name }]`, `name` viết bằng chính ngôn ngữ đó (`繁體中文`, `한국어`). `setLang(code)` đổi và lưu; `onLangChange(fn)` để vẽ lại giao diện. `matchLanguage(tag, languages)` tìm thẻ gần nhất.
- Chữ trên màn loading (trước khi có bảng dịch) viết cứng tiếng Anh.

## 8. Tải không bao giờ treo (`sdk/net.js`)

- Mọi tải file đi qua `loadImage`, `loadJSON`, `loadArrayBuffer`, `fetchRetry`: mỗi lần thử tối đa 15 s, thử 3 lần, lần sau thêm `?r=n` để tránh cache lỗi.
- `fontsReady()` chờ font tối đa 4 s.
- Cache Promise thì xoá khi lỗi: `cache.set(k, loadJSON(url).catch((e) => { cache.delete(k); throw e; }))`.
- Khởi động lỗi (mất mạng): hiện "Try again" (`load_failed`, `try_again` trong `en.json`), bấm thì `location.reload()`. Không bao giờ để màn loading đứng mãi.

## 9. Nút More Games, trademark, phiên bản

```js
const url = sdk.moreGamesUrl();
moreButton.hidden = !url;                                   // null: không có nút
moreButton.onclick = () => window.open(url, '_blank', 'noopener');
trademarkLabel.textContent = sdk.brand.trademark();         // '' = không hiện gì
versionLabel.textContent = `V${manifest.version}`;          // từ game.json
```

- Đọc `moreGamesUrl()` và `trademark()` **sau `ready()`**: giá trị đến từ API.
- More Games mở tab mới, không bao giờ `location.href` (người chơi mất ván).
- Trademark và phiên bản thường đặt ở góc màn hình menu hoặc bảng Settings.
- **Chữ bản quyền chỉ lấy từ `sdk.brand.trademark()`.** Không viết `©`, `AZ Games`, `azgames.io`, `1games.io`… trong code hay `i18n/*.json`: API quyết hiện gì (`0` không hiện, `1` tên miền `azgames.io`, `2` tên `AZ Games`), mặc định `1`. `check-export` cảnh báo khi thấy chữ viết cứng. Thêm chữ trang trí (ví dụ `©` đứng trước) thì ghép trong code và bỏ khi `trademark()` là `''`.

## 10. Bảng xếp hạng

Game có `leaderboardId` trong `game.json`: tạo bảng sau khi đọc `game.json`, gửi điểm một lần mỗi ván (sau `gameplayStop`), mở bảng từ menu và tạm dừng game khi bảng mở. Chi tiết: [LEADERBOARD.md](LEADERBOARD.md).

```js
const board = manifest.leaderboardId ? createLeaderboard({ sdk, boardId: manifest.leaderboardId }) : null;
// hết ván
board?.submit(score).then((r) => r && showRank(r.rank));
// nút ở menu
openLeaderboard({ board, t, onClose: resumeMenu });
```

## 11. Không được làm

- Gọi thẳng `window.GMSDKJS`, `localStorage`, hay SDK của network (Poki, CrazyGames, AFG…): mọi thứ qua `sdk`.
- Nạp script ngoài, đường dẫn tuyệt đối (`/assets/…`), tự kiểm domain hay tự chuyển hướng.
- Tự đặt giờ giãn cách quảng cáo theo thời gian (SDK làm); chỉ thêm luật theo nhịp game.
- Đoán `gameId`, `gameCode` hay bất kỳ giá trị định danh nào: chủ game cung cấp.
- Để comment dev hay tiếng Việt trong code xuất ra (chỉ bảng dịch `i18n/` được có).
