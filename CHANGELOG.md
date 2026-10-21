# Thay đổi của kit

[VERSION](VERSION) là phiên bản của kit, dạng **`MAJOR.MINOR.PATCH`** (semver). Phiên bản của **game** là chuyện khác: `yymmddXX` trong `game.json`, do `tools/bump-version.mjs` tăng mỗi lần build ([EXPORT.md §2](docs/EXPORT.md)). Game **không** ghi phiên bản kit nào: AI nhìn vào repo để biết còn thiếu gì.

| Tăng | Khi |
| --- | --- |
| **MAJOR** (`2.0.0`) | Thay đổi phá vỡ: game không sửa theo thì build hỏng hoặc `check-export` báo lỗi (đổi cấu trúc, đổi hàm bắt buộc) |
| **MINOR** (`1.1.0`) | Thêm yêu cầu hoặc tính năng mà game phải làm theo (mục có "Game cần làm") |
| **PATCH** (`1.0.1`) | Sửa lỗi tool, SDK hay tài liệu; game chỉ cần chép đè kit |

**Nâng cấp một game:**
1. Chép đè cả folder kit mới vào `docs/GMSDK_JS/`, **giữ `config.json`, `analytics.json` và `licenses.json`**.
2. Kéo [PROMPT.md](PROMPT.md) vào khung chat.

AI xét từng mục, từ cũ (dưới cùng) tới mới. Repo còn **dấu hiệu** của mục nào thì làm phần "Game cần làm" của mục đó. Không còn dấu hiệu nào là game đã theo kịp kit.

**Người sửa kit:** mỗi thay đổi mà game phải làm theo thì:
- tăng `VERSION` theo bảng trên;
- thêm một mục ở đầu danh sách, tiêu đề `## <x.y.z> — <yyyy-mm-dd>`, gồm "Thay đổi", "Dấu hiệu" (kiểm được trên repo: file, khoá, lệnh) và "Game cần làm".

Thay đổi chỉ ở tài liệu thì không cần mục.

## 1.0.1 — 2026-10-21

### `loader.js` đi đầu, gmsdkjs bắt buộc; lưu dữ liệu về kit, nén + mã hoá

Số `1.0.1` do chủ kit chọn (kit còn chưa phát hành chính thức); thay đổi này game **phải làm theo**. Cần **gmsdkjs ≥ 1.0.1** và **template 1.0.1** trên server ([OVERVIEW.md](docs/OVERVIEW.md) §4): gmsdkjs cũ còn ghi vào `azgames.<gameCode>` và đè save mới.

**Thay đổi**
- **`loader.js`** (`loading/loader.js` → `public/loader.js`, trong gói ở gốc): script **duy nhất** trang nạp. Hiện màn loading GM Loader v1 ngay (ảnh `Icons/`), tải `gmsdkjs.js` (`GMSDKJS_OPTIONS.sdkUrl`) và `game.js` **song song**, mỗi file tối đa 3 lần (10 giây mỗi lần, nghỉ 1 rồi 2 giây). gmsdkjs **bắt buộc**: 3 lần vẫn lỗi thì "Connection problem… reload the page" + nút Reload, game không chạy; chỉ trang dev (`platform: 'dev'`) chạy tiếp không SDK. Hai file chạy thanh 0 → 30 %, game báo phần còn lại ([LOADING.md](docs/LOADING.md)).
- `loading/loading.js`: chỉ còn điều khiển màn của `loader.js` (`createLoader()` không tham số; `hide()` gọi luôn `sdk.loadingDone()`; `error(text?)` hiện màn Reload).
- `sdk/gmsdkjs-shim.js`: kit giữ; thêm **`loadSDK({ gameCode })`** (chờ `loader.js` có gmsdkjs); mỗi hàm tìm `window.GMSDKJS` lúc gọi; bỏ bộ lưu chép từ gmsdkjs.
- **`sdk/storage.js`** (mới): `sdk.storage` là bộ lưu **của game**. Key vẫn `azgames.<gameCode>`; giá trị `gm1` + mã kiểm + JSON nén LZ (UTF-16, lz-string 1.5.0, MIT) trộn theo key: nhỏ khoảng 10 lần, không đọc được, sửa tay một ký tự là save bị bỏ (`save_tampered`). Thêm `dump()`, `tampered`; tracking `save_failed`, `save_large`. Đồng bộ hoàn toàn. Trang dev có `gmSave.dump()` ở console ([INTEGRATION.md §6](docs/INTEGRATION.md)).
- gmsdkjs 1.0.1 (server) không còn lưu dữ liệu game, chỉ giữ tên GMA ở `gma_<gameCode>.name`, và bỏ `sdk.storage`.
- Template của portal 1.0.1: bỏ thẻ `gmsdkjs.js` và `game.js`, chỉ nạp `loader.js`; thêm `sdkUrl` và `language: "<!--LANGUAGE-->"`.
- Tool: `check-export` đòi `loader.js` (bằng bản của kit, khác thì cảnh báo) và `Icons/` trong mọi gói, báo lỗi template cũ / màn loading tự dựng trong `game.js`, cho phép `src/sdk/storage.js` dùng `localStorage`; `assemble` báo lỗi template cũ. `template/index.html` nạp `loader.js` với `data-entry="src/main.js" data-module`. QA 1.4, 1.6, 5.1 viết lại, thêm 5.6.

**Dấu hiệu** (còn một trong các điều này là phải làm)
- Không có `public/loader.js`, hoặc nó khác `docs/GMSDK_JS/loading/loader.js`.
- `index.html` (trang dev) còn thẻ `gmsoft-jssdk` / `gmsdkjs.js`, hoặc nạp entry trực tiếp thay vì qua `loader.js`.
- Code gọi `getSDK(` ở đầu entry mà không có `loadSDK(`; gọi `createLoader({ sdk` (tham số cũ); gọi `sdk.loadingDone()` cạnh `loader.hide()`.
- Không có `src/sdk/storage.js`, hoặc `src/sdk/gmsdkjs-shim.js` còn chứa `createStorage({ key, getLs`.

**Game cần làm**
1. Chép `loading/loader.js` → `public/loader.js`; chép lại `loading/loading.js` (+ `.d.ts`) và `sdk/` (thêm `storage.js` + `.d.ts`) vào `src/sdk/`.
2. Trang dev `index.html`: bỏ thẻ `gmsdkjs.js`; thay thẻ entry bằng `<script src="loader.js" data-entry="src/main.js" data-module></script>` (như `template/index.html`).
3. Entry: `sdk = await loadSDK({ gameCode })` là việc đầu tiên trong hàm khởi động (không `await` cấp cao nhất: gói IIFE), thay `getSDK(...)`; `const loader = createLoader()`; bỏ `sdk.loadingDone()` sau `loader.hide()`. Game có màn loading riêng thì bỏ, dùng màn của `loader.js` ([LOADING.md](docs/LOADING.md)).
4. Save: không phải sửa code (`sdk.storage` giữ nguyên hàm). Rà luật lưu gọn ở [INTEGRATION.md §6](docs/INTEGRATION.md). Save dạng JSON cũ của `azgames.<gameCode>` không đọc được nữa (chưa có người chơi thật nên không chuyển).
5. Build, `check-export` → `OK`; thử QA 1.4 (chặn `gmsdkjs.js` trên gói xuất → màn Reload), 1.6, 5.1, 5.6.

## 1.0.0 — 2026-10-20

### Bản đầu: mọi game cài mới theo kit này

**Thay đổi**
- Kit gắn `gmsdkjs` (file trên server: licence, quảng cáo, tracking GMA, lưu trữ một key, thương hiệu) vào game web: `config.json`, `i18n/<thẻ BCP 47>.json`, một gói xuất cho mọi portal (Vite → `assemble` → `check-export` → `zip`), QA, UX, giấy phép asset, marketing kit.
- **Bảng xếp hạng** ([docs/LEADERBOARD.md](docs/LEADERBOARD.md)): `leaderboard/` (`leaderboard.js` gửi điểm có ký HMAC, top theo hôm nay / tuần / tháng / mọi lúc, hạng của người chơi, tên + cờ; `ui.js` màn hình mặc định; 252 cờ). Dùng `GMGameSDK` mà gmsdkjs đã đăng nhập; `config.json` thêm `leaderboardId`, `bump-version` chép sang `game.json`, `check-export` kiểm.
- **Ngôn ngữ lúc mở game do trang quyết:** lựa chọn đã lưu → `GMSDKJS_OPTIONS.language` của `index.html` → `defaultLanguage`. Không theo ngôn ngữ trình duyệt, không đọc `?lang=` (người chơi đổi trong game). `template/index.html` có `language: '<!--LANGUAGE-->'`; `bump-version` điền khi còn trống, `assemble` điền khi ghép trang, `check-export` kiểm thẻ có trong `languages`.
- **Mã game tạm:** chủ game chưa có `gameCode` thì `config.json` để `null`; `bump-version` đặt `g` + năm tháng ngày giờ phút giây và ghi vào `config.json` một lần. `check-export` cảnh báo mã tạm. Đổi mã thật ở `config.json`, hoặc `gameCode` trong `index.html` của gói.
- **Nén khi build (`tools/compress.mjs`):** sau bundler, PNG → WebP và nhạc → MP3 ở mức vừa phải, sửa tên file trong code, in bảng dung lượng. Mức ở `config.json` `compress` (`normal` mặc định, `more`, `lossless`, `off`, `keep`), hỏi chủ game một lần lúc cài. Cần `sharp`, `ffmpeg-static`.
- **Gói chỉ chứa thứ game dùng:** game tự rà `public/`, bỏ asset không dùng và báo lại (EXPORT.md §3, AI_INSTALL.md Bước 5, QA 6.7); `check-export` cảnh báo file chắc chắn không phải tài nguyên (thiết kế, tạm, hệ thống, ghi chú).
- **Màn loading mặc định** (`loading/`, [docs/LOADING.md](docs/LOADING.md)): GM Loader v1 của kit 2.x, giữ nguyên giao diện; dựng bởi `game.js` ở dòng đầu (gói không có trang riêng); ảnh của màn nằm riêng trong `public/Icons/` (`loading.webp` = key art, `logo.webp`; tên cố định, trong gói là `Icons/` ở gốc) để dễ tìm, dễ thay; không logo publisher trên trang GD / CrazyGames / Poki. `check-export` kiểm ảnh.
- **Dòng bản quyền mặc định `© 2026 Azgames.io`** (`sdk/copyright.js`, `copyrightText(sdk)`): server đổi thì theo server, tắt thì không hiện. `check-export` chỉ chấp nhận chữ bản quyền của file này.
- **Quy chuẩn repo game** ([INTEGRATION.md §1](docs/INTEGRATION.md)): game ở gốc (`src/` + `public/`), không `web/`; tài liệu `docs/gdd/` (thiết kế, có bản đồ tính năng), `docs/plan/` (kế hoạch, spec), `docs/qa/<version>.md` (báo cáo QA), kit `docs/GMSDK_JS/`, marketing `marketing/<id>/`. AI ghi đúng chỗ kể cả khi công cụ quen ghi `docs/superpowers/`. `check-export` cảnh báo khi thiếu `docs/gdd/README.md`, `docs/plan/README.md` hoặc còn `docs/superpowers/`.
- **Sau khi build: hỏi rồi mới commit và đẩy git** ([EXPORT.md §9](docs/EXPORT.md)): đồng ý thì commit `Build <version>` (chỉ thứ thuộc bản build), `fetch` kiểm máy chủ có commit mới chưa (có thì dừng), đẩy, in khối thông tin git (tên game — Build, Git, Nhánh, Commit) như kit 2.x; không đồng ý thì thôi.
- Số phiên bản đánh lại từ `1.0.0`; các số cũ (`1.x`, `2.0.0`, số dạng ngày trước 20/10/2026) không còn dùng.
- **Phiên bản game `yymmddXX`** (8 số, như kit 2.x, ví dụ `26102001`), do `bump-version` tăng mỗi lần build; `check-export` kiểm.

**Dấu hiệu:** game chưa có `docs/GMSDK_JS/` hoặc `src/sdk/gmsdkjs-shim.js`; còn `JS_GMSDK/`, `JS_SDK_*/`, `gmsdkv2.js`, `AZ_SETTINGS`, `Language/`; hoặc game có bảng xếp hạng mà `config.json` chưa có `leaderboardId` / còn `JS_GMSDK/Leaderboard`.

**Game cần làm:** cài kit theo [AI_INSTALL.md](AI_INSTALL.md) (trường hợp "Gắn SDK"), kể cả Bước 4 bỏ SDK cũ. Game có bảng xếp hạng: thêm `leaderboardId` vào `config.json`, làm theo [LEADERBOARD.md §2](docs/LEADERBOARD.md), bỏ `JS_GMSDK/Leaderboard`.
