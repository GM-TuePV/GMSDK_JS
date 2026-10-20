# Thay đổi của kit

[VERSION](VERSION) là phiên bản của kit, dạng **`MAJOR.MINOR.PATCH`** (semver). Phiên bản của **game** là chuyện khác: `yyyymmddXX` trong `game.json`, do `tools/bump-version.mjs` tăng mỗi lần build ([EXPORT.md §2](docs/EXPORT.md)). Game **không** ghi phiên bản kit nào: AI nhìn vào repo để biết còn thiếu gì.

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
- Số phiên bản đánh lại từ `1.0.0`; các số cũ (`1.x`, `2.0.0`, `yyyymmddXX` trước 20/10/2026) không còn dùng.

**Dấu hiệu:** game chưa có `docs/GMSDK_JS/` hoặc `src/sdk/gmsdkjs-shim.js`; còn `JS_GMSDK/`, `JS_SDK_*/`, `gmsdkv2.js`, `AZ_SETTINGS`, `Language/`; hoặc game có bảng xếp hạng mà `config.json` chưa có `leaderboardId` / còn `JS_GMSDK/Leaderboard`.

**Game cần làm:** cài kit theo [AI_INSTALL.md](AI_INSTALL.md) (trường hợp "Gắn SDK"), kể cả Bước 4 bỏ SDK cũ. Game có bảng xếp hạng: thêm `leaderboardId` vào `config.json`, làm theo [LEADERBOARD.md §2](docs/LEADERBOARD.md), bỏ `JS_GMSDK/Leaderboard`.
