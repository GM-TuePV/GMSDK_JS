# Thay đổi của kit

[VERSION](VERSION) là phiên bản của kit, dạng **`MAJOR.MINOR.PATCH`** (semver). Phiên bản của **game** là chuyện khác: `yyyymmddXX` trong `game.json`, do `tools/bump-version.mjs` tăng mỗi lần build ([EXPORT.md §2](docs/EXPORT.md)). Game **không** ghi phiên bản kit nào: AI nhìn vào repo để biết còn thiếu gì.

| Tăng | Khi |
| --- | --- |
| **MAJOR** (`2.0.0`) | Thay đổi phá vỡ: game không sửa theo thì build hỏng hoặc `check-export` báo lỗi (đổi cấu trúc, đổi hàm bắt buộc) |
| **MINOR** (`1.8.0`) | Thêm yêu cầu hoặc tính năng mà game phải làm theo (mục có "Game cần làm") |
| **PATCH** (`1.7.2`) | Sửa lỗi tool, SDK hay tài liệu; game chỉ cần chép đè kit |

**Nâng cấp một game:**
1. Chép đè cả folder kit mới vào `docs/GMSDK_JS/`, **giữ `config.json`, `analytics.json` và `licenses.json`**.
2. Kéo [PROMPT.md](PROMPT.md) vào khung chat.

AI xét từng mục, từ cũ (dưới cùng) tới mới. Repo còn **dấu hiệu** của mục nào thì làm phần "Game cần làm" của mục đó. Không còn dấu hiệu nào là game đã theo kịp kit.

**Người sửa kit:** mỗi thay đổi mà game phải làm theo thì:
- tăng `VERSION` theo bảng trên;
- thêm một mục ở đầu danh sách, tiêu đề `## <x.y.z> — <yyyy-mm-dd>`, gồm "Thay đổi", "Dấu hiệu" (kiểm được trên repo: file, khoá, lệnh) và "Game cần làm".

Thay đổi chỉ ở tài liệu thì không cần mục.

**Số cũ:** tới 19/10/2026 kit đánh số `yyyymmddXX` như game. Commit và ghi chú cũ còn nhắc số đó:

| Số cũ | Số mới |
| --- | --- |
| `2026101905` | `1.7.1` |
| `2026101904` | `1.7.0` |
| `2026101903` | `1.6.0` |
| `2026101902` | `1.5.0` |
| `2026101901` | `1.4.0` |
| `2026101804` | `1.3.0` |
| `2026101803` | `1.2.0` |
| `2026101802` | `1.1.0` |
| `2026101801` | `1.0.0` |
| (trước `2026101801`) | `0.9.0` |

## 2.0.0 — 2026-10-19

### Ngôn ngữ theo chuẩn i18n chung: `i18n/<thẻ BCP 47>.json` (thay đổi phá vỡ)

**Thay đổi**
- Bảng dịch chuyển từ `Language/<mã>.json` sang **`i18n/<thẻ>.json`** ở gốc gói, như i18next / LayaAir. **`Language/` không còn được nhận:** `check-export` báo lỗi, `npm run build` dừng.
- **Thẻ BCP 47**, đúng chữ hoa / thường: `en`, `es`, `en-US`, `pt-BR`, `zh-CN`, `zh-TW`, `ko-KR`, `ar`… (`game.json` / `config.json` `languages`, `defaultLanguage`, tên file). `zh-tw`, `pt_BR` là lỗi, kèm cách viết đúng.
- **Bảng lồng theo nhóm được:** `{ "game": { "score": "Score" } }` gọi `t('game.score')`; bảng phẳng vẫn hợp lệ. Giá trị chỉ là chuỗi.
- **File của `defaultLanguage` đủ mọi key** (trước đây là `en.json`); phải có ít nhất một tiếng Anh (`en` hoặc `en-XX`). Thiếu chữ: thẻ đang dùng → ngôn ngữ gốc (`zh-TW` → `zh`) → `defaultLanguage` → key.
- **Ngôn ngữ lúc mở game:** lựa chọn đã lưu → `?lang=` → **ngôn ngữ trình duyệt** (`navigator.languages`) → `defaultLanguage`. Trước đây chỉ lựa chọn đã lưu → `defaultLanguage`.
- `sdk/i18n.js`: thêm `{name}` (tham số theo tên), `matchLanguage()`, `normalizeTag()`, `dir="rtl"` cho `ar` / `he` / `fa` / `ur`, tên menu cho thẻ có vùng (`简体中文`, `繁體中文`…). Bỏ `LANG_DIR`, `FALLBACK` (thay bằng `I18N_DIR`).
- `check-export`: kiểm thẻ, kiểm bảng lồng (so key theo đường dẫn `game.score` với file mặc định), cảnh báo file trong `i18n/` mà `languages` không liệt kê.

**Dấu hiệu:** còn thư mục `public/Language/` (hoặc `Language/` trong gói); `check-export` báo `Language/ is the layout before kit 2.0.0`; code nạp `Language/…json` hay import `LANG_DIR` / `FALLBACK` từ `sdk/i18n.js`.

**Game cần làm:**
1. Chuyển `public/Language/<mã>.json` → `public/i18n/<thẻ>.json` (`git mv`). Mã cũ 2 chữ vẫn là thẻ hợp lệ (`en`, `es`…); chỉ đổi khi cần vùng (`zh` → `zh-CN` / `zh-TW`).
2. Chép `sdk/i18n.js` mới. Game có bộ i18n riêng thì đổi đường dẫn nạp sang `i18n/`, nhận thẻ có vùng, theo ngôn ngữ trình duyệt như INTEGRATION.md §7.
3. Lưu `settings.language` nguyên thẻ (`zh-TW`), không cắt còn 2 chữ.
4. Sửa script / test / tài liệu còn trỏ `Language/`. `npm run build`: `check-export` OK.

## 1.7.1 — 2026-10-19

### Giấy phép asset (`licenses.json`)

**Thay đổi**
- `license: "none"` (đã biết là không có quyền với asset, ví dụ asset của game gốc mà công ty không sở hữu) giờ **chỉ là ghi chú**: `check-export` không cảnh báo, không báo lỗi, không chặn build hay phát hành. Trước đây (1.7.0) dòng này là cảnh báo Major "không được phát hành".
- Ghi `none` thế nào: `"origin": "third-party"` (hoặc `ai` nếu vẽ lại bám theo asset đó), `"license": "none"`, `notes` ghi nguồn gốc và kế hoạch nếu có. Dùng tiếp hay thay là do chủ game quyết ([ASSETS.md §5](docs/ASSETS.md)).
- Các luật khác của 1.7.0 giữ nguyên: lỗi khi có file trong `roots` không ai ghi, khi giấy phép NC / personal / editorial (hoặc ND đã sửa), khi CC-BY thiếu `attribution`; cảnh báo khi `unknown`, thiếu `source` / `proof`, AI thiếu `prompts` / `reviewedBy`.

**Dấu hiệu:** `check-export` còn in `no licence: no right to use it, replace it before release` (kit cũ); hoặc `notes` trong `licenses.json` còn ghi phải thay trước khi phát hành dù chủ game chưa quyết vậy.

**Game cần làm:** chép đè kit (lấy `tools/check-export.mjs` mới). Sửa `notes` của các dòng `none` cho đúng quyết định của chủ game. Không phải sửa code.

### Tool `assemble.mjs`

**Thay đổi:** `tools/assemble.mjs` không còn crash khi thoát trên Windows với Node 24. Nguyên nhân: `process.exit()` chạy ngay sau `fetch` template từ CDN, khi socket keep-alive còn mở, nên libuv dừng ở assertion `UV_HANDLE_CLOSING` (`src\win\async.c`). Giờ tool đặt `process.exitCode` và để Node tự thoát; mã thoát giữ nguyên (0 xong, 1 portal lỗi, 2 không có gói).

**Dấu hiệu:** `docs/GMSDK_JS/tools/assemble.mjs` còn gọi `process.exit(`.

**Game cần làm:** chép đè kit (lấy `tools/assemble.mjs` mới). Không phải sửa code.

### SDK `gmsdkjs.js` (trên server)

**Thay đổi:** quảng cáo vẫn còn trên màn hình thì game **không** được chạy tiếp. Trước đây, với quảng cáo test (và quảng cáo thật mà người chơi chưa đóng), giới hạn 15 s của preroll và giới hạn 30 s của tạm dừng gọi `onResume` khi quảng cáo vẫn đang hiện, nên nhạc game kêu dưới quảng cáo. Giờ preroll vẫn trả kết quả đúng hạn, nhưng game giữ tạm dừng tới khi quảng cáo đóng; SDK treo mà không có quảng cáo nào hiện thì vẫn chạy tiếp như cũ.

**Game cần làm:** không có (SDK nạp từ server sau khi bấm Sync SDK Lib). Thử quảng cáo test trên trang dev: nhạc game không kêu khi quảng cáo còn hiện, và chạy lại ngay khi đóng quảng cáo.

## 1.7.0 — 2026-10-19

**Thay đổi**
- Tiêu chuẩn asset và giấy phép [docs/ASSETS.md](docs/ASSETS.md): mỗi font, âm thanh, nhạc, ảnh ghi nguồn, tác giả, giấy phép và bằng chứng trong **`docs/GMSDK_JS/licenses.json`** (mẫu `licenses.example.json`), cạnh `config.json`. Art gen bằng AI ghi công cụ, prompt, ảnh tham chiếu và người duyệt.
- `check-export` kiểm `licenses.json`:
  - **lỗi** khi file trong `roots` không có dòng nào, khi giấy phép là NC / personal / editorial (hoặc ND mà đã sửa), khi CC-BY thiếu `attribution`;
  - **cảnh báo** khi chưa có file, khi asset `unknown` hoặc `none` (đã biết là không có quyền), khi thiếu bằng chứng. Từ 1.7.1, `none` chỉ là ghi chú, không cảnh báo.
- Nâng cấp kit: giữ cả `licenses.json`.

**Dấu hiệu:** chưa có `docs/GMSDK_JS/licenses.json`; `check-export` cảnh báo `no …licenses.json`.

**Game cần làm:** rà mọi asset (thư mục asset của game làm `roots`), viết `licenses.json` theo ASSETS.md §2. Nguồn nào không chắc thì ghi `unknown` và hỏi chủ game, không đoán. CC-BY thì hiện dòng ghi công cho người chơi (§4). `npm run build` không còn lỗi về giấy phép.

## 1.6.0 — 2026-10-19

**Thay đổi**
- Ảnh của marketing kit: bản chính **PNG nằm ngay trong `images/`**, bản JPG nằm trong `images/jpg/` (trước đây JPG ở `images/`, PNG ở `images/png/`). Image kit của bản HTML ghi đường dẫn `images/<id>-<w>x<h>.png`.

**Dấu hiệu:** `marketing/<id>/images/png/` còn tồn tại, hoặc còn file `.jpg` nằm ngay trong `images/`. `check-marketing` báo `the earlier layout`.

**Game cần làm:** sửa script dựng kit (ví dụ `npm run marketing`) để ghi PNG vào `images/` và JPG vào `images/jpg/`, Image kit ghi đường dẫn `.png`. Xoá `images/png/` và các JPG cũ trong `images/`, chạy lại script, rồi chạy `check-marketing`.

## 1.5.0 — 2026-10-19

**Thay đổi**
- Tiêu chuẩn bàn giao [docs/HANDOFF.md](docs/HANDOFF.md): gói build, báo cáo QA, ghi chú bàn giao và **marketing kit** `marketing/<id>/`. Kit gồm content brief 10 mục (`<id>-content-brief.md`, `.en.md`, `.en.html` tự chứa), và 8 cỡ ảnh store / portal, mỗi cỡ một JPG và một PNG, đúng pixel, nền đặc (bố cục thư mục: mục 1.6.0).
- [PROMPT_MARKETING.md](PROMPT_MARKETING.md): kéo vào khung chat để AI dựng kit. Ảnh còn thiếu thì AI viết prompt Codex (`art/prompts/MASTER.md`, `art/prompts/store/<id>-<w>x<h>.md`) từ art thật của game.
- `tools/check-marketing.mjs` kiểm kit.

**Dấu hiệu:** `node docs/GMSDK_JS/tools/check-marketing.mjs` không báo `OK` (chưa có `marketing/<id>/`, thiếu ảnh hay thiếu brief).

**Game cần làm:** kéo `PROMPT_MARKETING.md` vào khung chat (hỏi chủ game trước). Game đã có kit theo quy ước cũ thì đổi tên file sang `<id>-<w>x<h>`, thêm bản PNG (bố cục: mục 1.6.0), rồi chạy lại `check-marketing`.

## 1.4.0 — 2026-10-19

**Thay đổi**
- Chữ bản quyền (trademark) chỉ lấy từ `sdk.brand.trademark()`: API quyết `0` không hiện, `1` (mặc định) `azgames.io`, `2` `AZ Games`. Chủ bản quyền (`copyright { domain, name }`) nằm trong preset của tool build, là AZ Games cho mọi publisher, kể cả 1games.
- `check-export` **cảnh báo** khi `game.js` hay `Language/*.json` tự viết chủ bản quyền / publisher (`©`, `AZ Games`, `azgames.io`, `1games.io`, `gamesforfree.io`, `ofree.io`) trong chuỗi. Gói vẫn OK.
- Trang dev (`template/index.html`) có thêm `copyright` để thử.

**Dấu hiệu:** `check-export` in `writes … itself: the copyright / trademark text must come from sdk.brand.trademark()`.

**Game cần làm:** bỏ chữ bản quyền viết cứng, hiện `sdk.brand.trademark()` (sau `ready()`, rỗng thì không hiện; [INTEGRATION.md §9](docs/INTEGRATION.md)). Trang dev của game (`index.html`) thêm dòng `copyright` như `template/index.html` nếu muốn thử.

## 1.3.0 — 2026-10-18

**Thay đổi**
- `config.json` bỏ `branch` (AI luôn làm trên nhánh đang checkout) và `kitVersion` (nâng cấp xét theo dấu hiệu).
- `analytics.json` **không ai viết tay**: AI gắn tracking theo quy trình [ANALYTICS.md §6](docs/ANALYTICS.md) rồi sinh file từ chính những gì đã gắn.
- `tools/bump-version.mjs` tạo `public/game.json` từ `config.json` nếu chưa có (`entry: game.js`, `orientation: any`), version bắt đầu từ `<hôm nay>01`.

**Dấu hiệu:** `config.json` còn khoá `branch` hoặc `kitVersion`.

**Game cần làm:** xoá hai khoá đó khỏi `config.json`. Ghi chú về nhánh, nếu cần, chuyển vào `notes`.

## 1.2.0 — 2026-10-18

**Thay đổi**
- **Không dùng `.env` nữa.** `gdKey` trong `config.json` là chuỗi 32 hex hoặc `null`.
- **`config.json` là nguồn duy nhất:** ở đầu mỗi lần build, `tools/bump-version.mjs` chép `id`, `gameCode`, `name`, `languages`, `defaultLanguage`, `gdKey` sang `public/game.json` và trang dev (`gameId`, `gameCode`).

**Dấu hiệu:** `gdKey` là object (`{ "from": … }`); hoặc repo còn file `.env*` chứa key GD.

**Game cần làm**
1. Ghi key GD thẳng vào `config.json` → `gdKey`.
2. Xoá file `.env.gd` (hay `.env.<portal>`) và mọi chỗ còn đọc nó.
3. `npm run build`: `public/game.json` được ghi lại từ `config.json`; `check-export` báo `OK`.

## 1.1.0 — 2026-10-18

**Thay đổi**
- [ANALYTICS.md](docs/ANALYTICS.md) có **bộ sự kiện phân tích bắt buộc** (§4), để phân tích và cải thiện game qua GMA / MCP:
  - tham số chung `session_index`, `days_since_install`, `progress`;
  - `session_start`, `screen_view`, `app_hidden`;
  - `onboarding_step`, `tutorial_step`;
  - `level_start` / `level_end` (`result`, `attempt`, `cause`, `progress_pct`), `death`;
  - `currency_earn` / `currency_spend`, `item_*`;
  - `feature_unlock` / `feature_open` / `feature_action`;
  - `ad_offer`, `setting_change`, `error`, `load_error`.
- Từ điển sự kiện **`docs/GMSDK_JS/analytics.json`**, cạnh `config.json` (mẫu `analytics.example.json`). `check-export` kiểm file này, và cảnh báo khi `game.js` không gửi một sự kiện bắt buộc.
- Câu hỏi phân tích, KPI và cách đánh giá một bản cải thiện: ANALYTICS §7.
- `feature_first_use`, `tutorial_done` (UX §8 cũ) thay bằng `feature_open { first: true }`, `tutorial_step`.

**Dấu hiệu:** chưa có `docs/GMSDK_JS/analytics.json`; hoặc `check-export` cảnh báo "never names these events".

**Game cần làm:** quy trình ANALYTICS §6.1, từ bước 1 tới 7:
- đọc code;
- gắn bộ §4 qua một module tracking, tự gắn tham số chung (bộ đếm phiên, ngày mở đầu tiên, các bước `onboarding_step` đã gửi lưu trong save);
- giữ bộ chuẩn §3; sự kiện cũ trùng nghĩa với §4 thì đổi tên theo §4, ví dụ `purchase` thành `currency_spend` + `item_get`;
- sinh `analytics.json`; chơi theo kịch bản §9; `npm run build` không còn cảnh báo về tracking.

## 1.0.0 — 2026-10-18

**Thay đổi**
- Giá trị của game chuyển từ `gmsdk.json` ở gốc repo sang **`docs/GMSDK_JS/config.json`**, nằm trong folder kit để chép kit sang dự án khác là mang theo cấu hình. Mẫu: `config.example.json` (thay cho `gmsdk.example.json`). Khoá mới: `brief` (mô tả ngắn khi làm game mới).
- `tools/check-export.mjs` tự đọc `config.json` cạnh kit; không cần `--config`.
- Build có thêm bước cuối **`tools/zip.mjs`**: đóng `export/<id>-<version>/` thành `export/<id>-<version>/<id>-<version>.zip`. Zip này là thứ upload lên tool build trên API ([EXPORT.md §8](docs/EXPORT.md)).
- [PROMPT.md](PROMPT.md) là lệnh cho AI: kéo file vào khung chat là chạy. Hướng dẫn cho người chuyển sang [README.md](README.md).

**Dấu hiệu:** có `gmsdk.json` ở gốc repo; hoặc script build không gọi `tools/zip.mjs`.

**Game cần làm**
1. `git mv gmsdk.json docs/GMSDK_JS/config.json`.
2. Sửa `config.json`: thêm `"brief": null`; sửa `$comment` theo `config.example.json`.
3. Đổi mọi chỗ trong repo game còn nhắc `gmsdk.json`: test, script, comment. Tìm bằng `grep -rn "gmsdk.json" --exclude-dir=node_modules --exclude-dir=docs .`
4. Trong lệnh `check-export`: bỏ `--config gmsdk.json`.
5. Thêm `node docs/GMSDK_JS/tools/zip.mjs` vào **cuối** script build, sau `check-export`.
6. `npm run build`: phải ra `export/<id>-<version>/<id>-<version>.zip` và báo `read back OK`.

## 0.9.0 — 2026-10-17

**Dấu hiệu:** script build thiếu một trong các bước của [EXPORT.md](docs/EXPORT.md):
- `bump-version` (§4);
- `assemble` (§7);
- `check-export` chạy sau `assemble` (§5).

**Game cần làm:** thêm bước còn thiếu, đúng thứ tự `bump-version` → build → `assemble` → `check-export` → `zip`.
