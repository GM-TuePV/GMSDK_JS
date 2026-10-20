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

## 1.0.0 — 2026-10-20

### Bản đầu: mọi game cài mới theo kit này

**Thay đổi**
- Kit gắn `gmsdkjs` (file trên server: licence, quảng cáo, tracking GMA, lưu trữ một key, thương hiệu) vào game web: `config.json`, `i18n/<thẻ BCP 47>.json`, một gói xuất cho mọi portal (Vite → `assemble` → `check-export` → `zip`), QA, UX, giấy phép asset, marketing kit.
- **Bảng xếp hạng** ([docs/LEADERBOARD.md](docs/LEADERBOARD.md)): `leaderboard/` (`leaderboard.js` gửi điểm có ký HMAC, top theo hôm nay / tuần / tháng / mọi lúc, hạng của người chơi, tên + cờ; `ui.js` màn hình mặc định; 252 cờ). Dùng `GMGameSDK` mà gmsdkjs đã đăng nhập; `config.json` thêm `leaderboardId`, `bump-version` chép sang `game.json`, `check-export` kiểm.
- **Ngôn ngữ lúc mở game do trang quyết:** lựa chọn đã lưu → `GMSDKJS_OPTIONS.language` của `index.html` → `defaultLanguage`. Không theo ngôn ngữ trình duyệt, không đọc `?lang=` (người chơi đổi trong game). `template/index.html` có `language: '<!--LANGUAGE-->'`; `bump-version` điền khi còn trống, `assemble` điền khi ghép trang, `check-export` kiểm thẻ có trong `languages`.
- **Mã game tạm:** chủ game chưa có `gameCode` thì `config.json` để `null`; `bump-version` đặt `g` + năm tháng ngày giờ phút giây và ghi vào `config.json` một lần. `check-export` cảnh báo mã tạm. Đổi mã thật ở `config.json`, hoặc `gameCode` trong `index.html` của gói.
- **Nén khi build (`tools/compress.mjs`):** sau bundler, PNG → WebP và nhạc → MP3 ở mức vừa phải, sửa tên file trong code, in bảng dung lượng. Mức ở `config.json` `compress` (`normal` mặc định, `more`, `lossless`, `off`, `keep`), hỏi chủ game một lần lúc cài. Cần `sharp`, `ffmpeg-static`.
- **Gói chỉ chứa thứ game dùng:** game tự rà `public/`, bỏ asset không dùng và báo lại (EXPORT.md §3, AI_INSTALL.md Bước 5, QA 6.7); `check-export` cảnh báo file chắc chắn không phải tài nguyên (thiết kế, tạm, hệ thống, ghi chú).
- **Màn loading mặc định** (`loading/`, [docs/LOADING.md](docs/LOADING.md)): GM Loader v1 của kit 2.x, giữ nguyên giao diện; dựng bởi `game.js` ở dòng đầu (gói không có trang riêng); key art `public/assets/loading/loading.webp`; không logo publisher trên trang GD / CrazyGames / Poki. `check-export` kiểm ảnh.
- **Dòng bản quyền mặc định `© 2026 Azgames.io`** (`sdk/copyright.js`, `copyrightText(sdk)`): server đổi thì theo server, tắt thì không hiện. `check-export` chỉ chấp nhận chữ bản quyền của file này.
- **Quy chuẩn repo game** ([INTEGRATION.md §1](docs/INTEGRATION.md)): game ở gốc (`src/` + `public/`), không `web/`; tài liệu `docs/gdd/` (thiết kế, có bản đồ tính năng), `docs/plan/` (kế hoạch, spec), `docs/qa/<version>.md` (báo cáo QA), kit `docs/GMSDK_JS/`, marketing `marketing/<id>/`. AI ghi đúng chỗ kể cả khi công cụ quen ghi `docs/superpowers/`. `check-export` cảnh báo khi thiếu `docs/gdd/README.md`, `docs/plan/README.md` hoặc còn `docs/superpowers/`.
- **Sau khi build: hỏi rồi mới commit và đẩy git** ([EXPORT.md §9](docs/EXPORT.md)): đồng ý thì commit `Build <version>` (chỉ thứ thuộc bản build), `fetch` kiểm máy chủ có commit mới chưa (có thì dừng), đẩy, in khối thông tin git (tên game — Build, Git, Nhánh, Commit) như kit 2.x; không đồng ý thì thôi.
- Số phiên bản đánh lại từ `1.0.0`; các số cũ (`1.x`, `2.0.0`, số dạng ngày trước 20/10/2026) không còn dùng.
- **Phiên bản game `yymmddXX`** (8 số, như kit 2.x, ví dụ `26102001`), do `bump-version` tăng mỗi lần build; `check-export` kiểm.

**Dấu hiệu:** game chưa có `docs/GMSDK_JS/` hoặc `src/sdk/gmsdkjs-shim.js`; còn `JS_GMSDK/`, `JS_SDK_*/`, `gmsdkv2.js`, `AZ_SETTINGS`, `Language/`; hoặc game có bảng xếp hạng mà `config.json` chưa có `leaderboardId` / còn `JS_GMSDK/Leaderboard`.

**Game cần làm:** cài kit theo [AI_INSTALL.md](AI_INSTALL.md) (trường hợp "Gắn SDK"), kể cả Bước 4 bỏ SDK cũ. Game có bảng xếp hạng: thêm `leaderboardId` vào `config.json`, làm theo [LEADERBOARD.md §2](docs/LEADERBOARD.md), bỏ `JS_GMSDK/Leaderboard`.
