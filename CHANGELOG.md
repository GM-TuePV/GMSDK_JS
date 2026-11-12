# Thay đổi của kit

[VERSION](VERSION) là phiên bản của kit, dạng **`MAJOR.MINOR.PATCH`** (semver). Phiên bản của **game** là chuyện khác: `yymmddXX` trong `game.json`, do `tools/bump-version.mjs` tăng mỗi lần build ([EXPORT.md §2](docs/EXPORT.md)). Game **không** ghi phiên bản kit nào: AI nhìn vào repo để biết còn thiếu gì.

| Tăng | Khi |
| --- | --- |
| **MAJOR** (`2.0.0`) | Thay đổi phá vỡ: game không sửa theo thì build hỏng hoặc `check-export` báo lỗi (đổi cấu trúc, đổi hàm bắt buộc) |
| **MINOR** (`1.1.0`) | Thêm yêu cầu hoặc tính năng mà game phải làm theo (mục có "Game cần làm") |
| **PATCH** (`1.0.2`) | Sửa lỗi tool, SDK hay tài liệu; game chỉ cần chép đè kit |

**Nâng cấp một game** (từ bản kit sau):
1. Chép đè cả folder kit mới vào `docs/GMSDK_JS/`, **giữ `config.json`, `analytics.json` và `licenses.json`**.
2. Kéo [PROMPT.md](PROMPT.md) vào khung chat.

AI xét từng mục, từ cũ (dưới cùng) tới mới. Repo còn **dấu hiệu** của mục nào thì làm phần "Game cần làm" của mục đó. Không còn dấu hiệu nào là game đã theo kịp kit.

**Người sửa kit:** mỗi thay đổi mà game phải làm theo thì:
- tăng `VERSION` theo bảng trên;
- thêm một mục ở đầu danh sách, tiêu đề `## <x.y.z> — <yyyy-mm-dd>`, gồm "Thay đổi", "Dấu hiệu" (kiểm được trên repo: file, khoá, lệnh) và "Game cần làm".

Thay đổi chỉ ở tài liệu thì không cần mục.

## 1.0.4 — 2026-11-06

### CrazyGames: khách đăng nhập trong lúc chơi

Cần **gmsdkjs 1.0.4** ở `…/gmsdkjs/1.0.4/` và **template 1.0.4** (`…/gmsdkjs/templates/1.0.4/`) trên server ([SERVER_NOTES.md §1](docs/SERVER_NOTES.md)). Chỉ bản build **CrazyGames** chạy khác; nơi khác như 1.0.3. Game đã build theo 1.0.3 không bị ảnh hưởng (vẫn gmsdkjs 1.0.3).

**Thay đổi**
- **Khách đăng nhập CrazyGames giữa lúc chơi** (CrazyGames không tự tải lại trang; yêu cầu "implement AuthListener"): gmsdkjs nghe `addAuthListener`, ghi lại người chơi GMA và save của khách trong tab, rồi **tải lại trang** để game chạy bằng tài khoản:
  - tài khoản **chưa có dữ liệu**: nhận hết của khách (save, tiến độ), có người chơi GMA mới tên username; **điểm cao nhất khách đã chơi trong tab này** được gửi lên bảng xếp hạng;
  - tài khoản **đã có dữ liệu**: dùng dữ liệu cũ của tài khoản, **không nhận gì của khách**, kể cả điểm.
- `leaderboard.js`:
  - khách gửi điểm: không lên bảng, điểm cao nhất được giữ trong save của kit (`sdk.storage`, vùng `leaderboard`, khoá `pending`; trên CrazyGames là dữ liệu người chơi). CrazyGames chép dữ liệu khách sang tài khoản chưa có dữ liệu, điểm theo cùng, và tài khoản gửi nó một lần khi bảng sẵn sàng; tài khoản đã có dữ liệu không nhận gì của khách nên không gửi gì. Kit không gọi thẳng `localStorage` / `sessionStorage` (`check-export --src` không báo lỗi file của kit);
  - khách: `player().id` rỗng, `me()` trả `null` (màn tự vẽ không tô dòng nào là "của mình");
  - chờ gmsdkjs chọn xong người chơi (`playerPolicy().ready`) rồi mới sẵn sàng; `player().id` là người chơi hiện tại của GM SDK (không giữ mã cũ khi mở bảng sớm).
- **Phiên bản ở Settings là `v1.0`, không phải số build:** trường mới `versionName` (chủ game đặt trong `config.json`, `bump-version.mjs` chép sang `game.json`, chưa có thì `"1.0"`); Settings hiện `v${manifest.versionName}`. `version` (`yymmddXX`) vẫn là số build: gửi GMA, tên gói, góc màn tải. `check-export` cảnh báo khi `game.json` thiếu `versionName` ([INTEGRATION.md §9](docs/INTEGRATION.md), [EXPORT.md §2](docs/EXPORT.md)).
- **Ảnh tải từ CDN (hai tên miền) không còn lọt kiểm tra:**
  - `sdk/net.js`: `loadImage()` đặt `crossOrigin = 'anonymous'` trước `src` (trước đây thiếu: canvas vẽ ảnh đó bị "bẩn" trên site của mình);
  - `check-export --src` **báo lỗi** từng chỗ code game tự tạo ảnh (`new Image()`, `createElement('img')`) mà không đặt `crossOrigin` trước `src`. Luật cũ dò chữ `crossOrigin` trên cả `game.js` nên Three.js / Phaser (tự có chữ đó) che mất chỗ game quên, và chỉ là cảnh báo;
  - `screens.mjs --check`: bước mới của `npm run build`, chạy gói trên hai tên miền như site của mình, dừng build khi có lỗi CORS / canvas bẩn / Worker / file hỏng ([EXPORT.md §4](docs/EXPORT.md)).
- **Luật của kit cho mọi phiên AI:** `AGENT_RULES.md`, được `bump-version.mjs` ghi vào `CLAUDE.md` và `AGENTS.md` của game mỗi lần build (giữa `GMSDK_JS:BEGIN` / `GMSDK_JS:END`, phần còn lại là của game; `tools/agent-rules.mjs`). Trước đây luật chỉ nằm trong `PROMPT.md` lúc cài kit, nên phiên làm thêm tính năng sau đó quên (ảnh thiếu `crossOrigin`).
- gmsdkjs 1.0.4: phiên GMA chỉ ghi kèm chủ khi đã kiểm xong; phiên của khách mang tên không phải dạng ngẫu nhiên (dữ liệu cũ lỗi) thì khách có người chơi mới.

**Dấu hiệu**
- `public/loader.js` trỏ `gmsdkjs/1.0.3/`.
- `src/sdk/leaderboard/leaderboard.js` không có `pending.take()`.
- `game.json` không có `versionName`, hoặc Settings hiện `V${manifest.version}` (số build).
- `src/sdk/net.js` không có `img.crossOrigin`; `CLAUDE.md` không có `GMSDK_JS:BEGIN`; script `build` không có `screens.mjs --check`.

**Game cần làm**
1. Chép lại `loading/loader.js` → `public/loader.js`, `leaderboard/leaderboard.js` (+ `.d.ts`) → `src/sdk/leaderboard/` (game có bảng xếp hạng).
2. Màn bảng tự vẽ: dòng "của mình" so với `board.player().id` như cũ (khách có id rỗng nên không dòng nào được tô); không cần đổi gì khác.
3. Settings: nhãn phiên bản đổi thành `v${manifest.versionName}` (không dùng `manifest.version`); thêm `"versionName": "1.0"` vào `docs/GMSDK_JS/config.json` (hỏi chủ game nếu game đã có số phiên bản riêng); chạy `bump-version` để chép sang `game.json`.
4. Chép lại `sdk/net.js` → `src/sdk/`; chép cả thư mục `tools/` và `AGENT_RULES.md` của kit (đã nằm trong `docs/GMSDK_JS/` nếu chép nguyên kit); chạy `node docs/GMSDK_JS/tools/agent-rules.mjs` rồi commit `CLAUDE.md` / `AGENTS.md`. Thêm `screens.mjs --check` vào script `build` sau `check-export` ([EXPORT.md §4](docs/EXPORT.md)), `npm i -D playwright-core`. Chạy `check-export --src src`: sửa mọi chỗ `makes an image without CORS` (đặt `crossOrigin` trước `src`, hoặc dùng `loadImage()`).
5. Không tự lưu tiến độ ngoài `sdk.storage` (như 1.0.3): trang tải lại lúc khách đăng nhập, thứ chỉ nằm trong bộ nhớ game sẽ mất.
6. Build lại; nộp CrazyGames có bật "Progress Save". Báo CrazyGames: khách đăng nhập thì game tải lại; tài khoản đã có dữ liệu thì giữ dữ liệu của tài khoản, không lấy điểm khách.

## 1.0.3 — 2026-11-04

### CrazyGames: người chơi là tài khoản CrazyGames, dữ liệu theo tài khoản

Cần **gmsdkjs 1.0.3** ở `…/gmsdkjs/1.0.3/` và **template 1.0.3** (`…/gmsdkjs/templates/1.0.3/`) trên server ([SERVER_NOTES.md §1](docs/SERVER_NOTES.md)). Chỉ bản build **CrazyGames** chạy khác; build cho site của mình, GD, Poki chạy như 1.0.2. Game đã build theo 1.0.2 không bị ảnh hưởng (vẫn gmsdkjs 1.0.2).

**Thay đổi**
- **Save của game lên dữ liệu người chơi CrazyGames** (module Data, "Progress Save"): `sdk/storage.js` đọc / ghi key `azgames.<gameCode>` ở đó thay vì `localStorage`, cả khi khách chơi. Khách đăng nhập mà tài khoản chưa có save thì CrazyGames tự chuyển save của khách lên; tài khoản đã có save (chơi máy khác) thì dùng save của tài khoản; cùng tài khoản mở máy nào cũng ra cùng save. Save cũ trong `localStorage` (bản build trước) được chép sang **một lần**. Không bật "Progress Save" thì vẫn `localStorage` như 1.0.2 ([INTEGRATION.md §6](docs/INTEGRATION.md)).
- `loading/loader.js`: trên CrazyGames, `GMLoader.ready()` chờ gmsdkjs biết dữ liệu người chơi (tối đa 8 giây) rồi game mới đọc save. Mặc định trỏ `gmsdkjs/1.0.3/`; `assemble` đọc `templates/1.0.3/`.
- **gmsdkjs 1.0.3 trên CrazyGames:** mỗi tài khoản CrazyGames là **một** người chơi GMA trên mọi máy (phiên GMA cất trong dữ liệu người chơi); hai tài khoản dùng chung trình duyệt không đè điểm nhau. `getUser()` trả chậm vẫn nhận tên, vẫn gửi được điểm. Game không gọi gì thêm.
- **Bảng xếp hạng** ([LEADERBOARD.md §3](docs/LEADERBOARD.md)):
  - tên CrazyGames giữ dấu chấm (`SingingCheese.TLNU`, `cleanPortalName()`); tên gõ trong game ở site khác giữ luật cũ;
  - khách hiện **"Guest"** (`board.isGuest()`, khoá `guest_name`), kể cả khi CrazyGames chưa trả username, không bao giờ hiện tên ngẫu nhiên `playerXXXXXX`; cờ của khách là **Mỹ**, không đổi được: khách bấm nút **Name & flag** thì không mở bảng sửa, chỉ hiện lời nhắn đăng nhập (`guest_flag`);
  - màn "Name & flag" trên CrazyGames **vẫn có ô tên** (1.0.2 giấu đi): ô chỉ đọc, hiện username; bấm vào thì hiện lời nhắn "đổi tên ở hồ sơ CrazyGames" (`name_portal`). Không có nút đăng nhập;
  - cờ mặc định của người đã đăng nhập theo nước của họ trên CrazyGames (`systemInfo.countryCode`), vẫn đổi được;
  - đổi cờ trên CrazyGames chỉ gửi cờ, không gửi tên.

**Dấu hiệu**
- `public/loader.js` trỏ `gmsdkjs/1.0.2/`, hoặc không có `portalData`.
- `src/sdk/storage.js` không có `portalDataNow`.
- Game có bảng xếp hạng mà `src/sdk/leaderboard/leaderboard.js` không có `isGuest`, hoặc nhóm `leaderboard` của `i18n` thiếu `guest_name` / `name_portal`.
- Code game tự đọc / ghi `localStorage` cho tiến độ chơi, ngoài `sdk.storage` (phần đó sẽ không theo tài khoản CrazyGames).

**Game cần làm**
1. Chép lại `loading/loader.js` → `public/loader.js` và `sdk/storage.js` → `src/sdk/`. Game có bảng xếp hạng: chép `leaderboard/leaderboard.js` (+ `.d.ts`) và `ui.js` → `src/sdk/leaderboard/`, thêm khoá `guest_name`, `name_portal`, `guest_flag` vào nhóm `leaderboard` của `i18n` (chữ tiếng Anh ở [LEADERBOARD.md §4](docs/LEADERBOARD.md)).
2. Màn bảng tự vẽ: khách (`board.isGuest()`) hiện chữ "Guest" và cờ Mỹ, không hiện `board.player().name`; không cho khách đổi tên / cờ: nút đổi tên / cờ của khách chỉ hiện lời nhắn `guest_flag`, không mở bảng sửa. Ô tên khi `board.nameEditable()` là `false`: **hiện, chỉ đọc**, bấm vào thì hiện lời nhắn `name_portal`; không giấu ô tên như 1.0.2.
3. Tiến độ chơi phải đi qua `sdk.storage`. Game còn tự lưu `localStorage` riêng thì chuyển vào `sdk.storage` (`sdk.storage.migrate`).
4. Build lại; nộp CrazyGames thì bật **"Progress Save"** ([EXPORT.md §6](docs/EXPORT.md)).

## 1.0.2 — 2026-10-27

### Theo yêu cầu CrazyGames (mẫu: Wacky Flip đã qua duyệt)

Cần **gmsdkjs 1.0.2** ở `…/gmsdkjs/1.0.2/` và **template 1.0.2** (`…/gmsdkjs/templates/1.0.2/`) trên server ([SERVER_NOTES.md §1](docs/SERVER_NOTES.md)). Kit 1.0.1 và game đã build theo 1.0.1 không bị ảnh hưởng.

**Thay đổi**
- **gmsdkjs 1.0.2:** trên CrazyGames gọi `user.getUser()` đúng một lần mỗi lần mở trang; tài khoản GMA tạo lần đầu mang `username` CrazyGames ([SERVER_NOTES.md §6](docs/SERVER_NOTES.md)); từ 2026-11-03 người đã đăng nhập luôn mang đúng username đó (tài khoản cũ cũng được đổi theo). Game không gọi gì; game **không được** tự gọi `CrazyGames.SDK.user.getUser()`.
- **Portal bắt tắt tiếng (CrazyGames `muteAudio`):** gmsdkjs 1.0.2 có `sdk.portalMuted()` và `sdk.onPortalMuted(fn)`; lệnh của portal đứng trên nút âm thanh của game, nút đó không bật lại tiếng khi portal đang bắt tắt ([INTEGRATION.md §3](docs/INTEGRATION.md), QA 4.15, [SERVER_NOTES.md §7](docs/SERVER_NOTES.md)). Làm xong thì tick được mục "muting audio through SDK" của CrazyGames.
- `loading/loader.js` mặc định trỏ `gmsdkjs/1.0.2/`; `assemble` mặc định đọc `templates/1.0.2/`.
- **`gameplayStart`** chỉ khi người chơi thật sự vào màn và điều khiển được, không khi hướng dẫn / popup / màn kết quả đang che; `gameplayStop` khi hết màn, về menu, pause, khi bảng che hiện giữa lúc chơi ([INTEGRATION.md §4](docs/INTEGRATION.md), QA 4.12).
- **Retry ở màn thắng** khi game cho chơi lại để lấy điểm cao hơn ([UX.md](docs/UX.md), QA 9.10).
- **Nút "Privacy Policy"** cạnh dòng bản quyền, **như More Games**: `privacyPolicyUrl(sdk)` trong `sdk/copyright.js` trả link `gameinfo.privacy_policy` của API giấy phép, rỗng thì `''` và game ẩn nút; trang dev luôn có nút (`PRIVACY_POLICY_URL`, `https://azgames.io/privacy-policy/`) ([INTEGRATION.md §9](docs/INTEGRATION.md), QA 7.11). `check-export --src` cảnh báo code còn mở thẳng `PRIVACY_POLICY_URL`; không báo nhầm link mặc định.
- **CrazyGames có dòng bản quyền** như trang nhà (theo `gameinfo.trademark`), chỉ là chữ, không link; GD, Poki vẫn không có (QA 7.4, [LOADING.md §2](docs/LOADING.md)). Cần preset `crazy` của tool build bỏ `trademark: false` và admin không tắt trademark cho domain CrazyGames. Code game không đổi.
- **Bố cục màn loading mặc định** ([LOADING.md](docs/LOADING.md)): logo publisher trên cùng giữa → tên game → key art khung 16:9 to ở giữa → thanh % ngắn ngay dưới ảnh; số build góc dưới phải. Màu, chữ, luồng giữ nguyên; tên class giữ nguyên nên `icons/loader.css` của game vẫn dùng được (logo giờ nằm trong `.gmLoaderStage`).
- **Cờ bảng xếp hạng: bộ mới, một atlas** ([LEADERBOARD.md](docs/LEADERBOARD.md)): 254 file PNG `leaderboard/flags/` thay bằng `leaderboard/flags.webp` (253 cờ do GM vẽ, ô 100×75, 241 KB) + `flags.json`; một lần tải thay cho từng cờ, và bước nén lúc build không đổi tên được nữa (bộ PNG cũ bị `compress` đổi sang WebP làm mất cờ nếu game không `keep`). Chưa chọn nước hiện cờ **US** (bỏ `GLOBE`). `countries.json` thêm England (`GB-ENG`). `ui.js` có `loadFlags()` cho màn tự vẽ. `tools/build-flags.mjs` dựng lại atlas.
- **Bàn phím trong iframe:** `preventDefault()` trên `pointerdown` / `mousedown` / `touchstart` chặn luôn việc iframe nhận focus, nên trên portal phím đi ra trang ngoài. `check-export` cảnh báo khi thấy dấu hiệu này; cách sửa ở [EMBED.md §8](docs/EMBED.md), QA 2.7.
- **Không tạm dừng theo `blur` rồi chờ `focus`:** trong iframe, bấm ra ngoài rồi bấm vào lại thì `focus` có thể không tới, game đứng mãi (gặp trên CrazyGames). Dừng theo `visibilitychange` / `sdk.onPause`, hoặc chạy lại ở cú bấm kế tiếp. `check-export` cảnh báo khi game nghe `blur`; [EMBED.md §8](docs/EMBED.md), QA 2.7.
- **Bảng xếp hạng: `board.me()` hỏi "chưa có điểm" một lần** mỗi kỳ mỗi lần mở trang (máy chủ trả 204 No Content cho trường hợp này, trước là 404 kèm dòng đỏ trong console; `me()` nhận cả hai, trước đó kit chỉ nhận 404 nên 204 thành "không tải được"), gửi điểm xong thì hỏi lại ([LEADERBOARD.md §3](docs/LEADERBOARD.md)).
- `PROMPT.md` gọn hơn: khối luật "game trong iframe" còn một dòng; `check-export` nhắc đúng lúc code vướng, chi tiết ở EMBED.md.
- **Sự kiện `LoadingFail { name }`** mỗi khi màn loading hiện Reload ([LOADING.md](docs/LOADING.md)): `name` là file tải lỗi (`gmsdkjs.js`, `game.js`, hoặc file game truyền vào `loader.error(text, file)`; không truyền thì `game`). Gửi như mọi sự kiện tracking; gmsdkjs.js hỏng thì giữ trên máy, gửi ở lần mở sau.
- **Marketing kit: thêm 3 ảnh, ảnh nhỏ bớt rối** ([HANDOFF.md §4, §6](docs/HANDOFF.md)): `800x800` và `800x1200` (cover vuông và dọc 2:3 CrazyGames đòi), `512x512_logo` (vuông có logo, cho CrazyGames và site của mình); `512x512` giờ **không chữ** (Poki cấm chữ). Luật "Ảnh nhỏ phải đọc được": một vật chính, nền gọn, tương phản mạnh, thử ở 128 / 96 px; mẫu prompt Codex có câu cấm rối. `check-marketing` đòi đủ 11 ảnh.
- **Content brief thêm mục 11 "Control Guide"** ([HANDOFF.md §5](docs/HANDOFF.md)): **Controls** (hướng dẫn điều khiển theo bàn phím / chuột / cảm ứng, đúng phím trong code) và **How to play** (hướng dẫn chơi 3–6 bước), tiếng Anh, dán thẳng lên cổng game. `check-marketing` đòi 11 mục và đủ hai phần.
- **Bảng xếp hạng trên CrazyGames** (Tap Road 2 bị trả về, 2026-11-03; [LEADERBOARD.md §3](docs/LEADERBOARD.md)):
  - Tên là username CrazyGames, không sửa được, kể cả khách. Khách (chưa đăng nhập) không lên bảng.
  - gmsdkjs 1.0.2 có `playerPolicy()` và chặn luôn ở GMA (đổi tên, điểm của khách đều bị từ chối).
  - `leaderboard.js` có `board.nameEditable()` và `board.canSubmit()`; `needsName()` luôn `false` ở đó.
  - `ui.js` chỉ còn nút **Flag**; khách thấy dòng "Sign in to put your score on the leaderboard." (khoá `edit_flag`, `guest`).
- **Không tự đếm giờ quảng cáo trên CrazyGames / Poki:** họ tự giãn cách (CrazyGames 3 phút giữa hai midgame). gmsdkjs 1.0.2 chuyển mọi `interstitial()` cho SDK của họ, template build đặt `time_show_inter: 0`. Game không tự đếm giờ giữa hai quảng cáo: gọi `sdk.interstitial()` ở mọi chỗ nghỉ hợp lý.
- **Nén ảnh / nhạc không làm hỏng game** ([EXPORT.md §4](docs/EXPORT.md)): `compress` đọc `src/` trước khi nén, thấy code ghép tên file lúc chạy (`'img/' + n + '.png'`, `` `${id}.ogg` ``, `"png"`) thì **dừng build, chưa đổi gì**, in file:dòng và cách xử lý. `check-export` **báo lỗi** khi `game.js` còn gọi `.png` / `.ogg`… mà gói chỉ có `.webp` / `.mp3`. Thêm `config.json` → `compress.dynamicPaths`: các file nguồn đã kiểm (file của nó nằm trong `keep`). Luật cho AI (`PROMPT.md`): mặc định giữ file (`keep`), không sửa code; sửa code tải chỉ khi chủ game đồng ý; luôn báo chủ game đã làm gì, gói nặng thêm bao nhiêu.
- **Quảng cáo bắt buộc:** plan có bảng "Chỗ quảng cáo" (`PROMPT.md`, AI_INSTALL Bước 3, NEW_GAME Bước 7); `check-export` **báo lỗi** khi `game.js` không gọi `preroll()` hoặc `interstitial()`, cảnh báo khi không có `rewarded()`.
- **Trang và gói ở hai tên miền** trên site của mình (trang `game.1games.io`, gói qua `<base href>` trên CDN `gdn.1games.io`): EMBED.md trước ghi sai là file trong gói cùng tên miền. Luật trong `PROMPT.md` và EMBED.md: ảnh đọc điểm ảnh / làm texture luôn `crossOrigin`, không dựng URL từ `location.href`, Worker từ blob. `check-export` cảnh báo các dấu hiệu này; `tools/screens.mjs` chạy hai tên miền như site (QA §2.1); SERVER_NOTES: CORS trên CDN là bắt buộc.

**Dấu hiệu** (còn một trong các điều này là phải làm)
- `public/loader.js` khác `docs/GMSDK_JS/loading/loader.js` (còn trỏ `gmsdkjs/1.0.1/`).
- `src/sdk/copyright.js` chưa có `privacyPolicyUrl`, màn Settings chưa có nút "Privacy Policy", hoặc nút mở thẳng `PRIVACY_POLICY_URL` / luôn hiện trên portal.
- Có chỗ gọi `gameplayStart` lúc tải, ở menu, hoặc khi bảng hướng dẫn / popup đang che.
- Game cho chơi lại để lấy điểm cao hơn mà màn thắng chưa có Retry.
- Code game có `CrazyGames.SDK` (gọi thẳng SDK của portal).
- Âm thanh của game không xét `sdk.portalMuted()` / không có `sdk.onPortalMuted`.
- Game có bảng xếp hạng mà `public/assets/leaderboard/` còn thư mục `flags/`, hoặc chưa có `flags.webp` + `flags.json`.
- Marketing kit thiếu `800x800`, `800x1200` hay `512x512_logo` (`check-marketing` báo), hoặc `512x512` còn logo / chữ.
- `check-export` báo `never calls sdk.preroll()` / `sdk.interstitial()`, hoặc cảnh báo đọc điểm ảnh không `crossOrigin`, URL dựng từ `location.href`, Worker từ file.
- `compress` dừng với `compress stopped … builds file names at run time`, hoặc `check-export` báo `asks for files that compress renamed`.
- Content brief chưa có mục `## 11. Control Guide` (`check-marketing` báo).
- `screens.mjs` có lỗi `cross-origin data` / CORS ở cột "Lỗi trang".
- Game có bảng xếp hạng mà `src/sdk/leaderboard/leaderboard.js` chưa có `canSubmit`, hoặc game có ô nhập tên riêng không xét `board.nameEditable()`.
- Code game tự đếm thời gian giữa hai lần `interstitial()` (biến kiểu `lastAdTime`, `adCooldown`).

**Game cần làm**
1. Chép lại `loading/loader.js` → `public/loader.js`, `loading/loading.js` (+ `.d.ts`) → `src/sdk/loading/` và `sdk/copyright.js` (+ `.d.ts`) → `src/sdk/`. Chỗ gọi `loader.error()` truyền file tải lỗi nếu biết: `loader.error(null, file)`.
2. Nút "Privacy Policy" trong Settings cạnh dòng bản quyền (chữ qua `i18n`, khoá `privacy_policy`, mọi ngôn ngữ): `const url = privacyPolicyUrl(sdk)` sau `ready()`, `hidden = !url`, bấm mở `url` ở tab mới.
3. Rà mọi chỗ gọi `gameplayStart` / `gameplayStop` theo luật mới.
4. Màn thắng có Retry nếu game cho chơi lại để lấy điểm cao hơn.
5. Chép lại `sdk/gmsdkjs-shim.js` (+ `.d.ts`) → `src/sdk/`; âm thanh xét thêm `sdk.portalMuted()` và nghe `sdk.onPortalMuted` ([INTEGRATION.md §3](docs/INTEGRATION.md)).
6. Game có bảng xếp hạng: chép lại `leaderboard/ui.js` và `flags.webp`, `flags.json`, `countries.json` vào `public/assets/leaderboard/`; xoá `public/assets/leaderboard/flags/` và mục `keep` cho thư mục đó trong `config.json` (nếu có). Màn tự vẽ có cờ: đổi sang `loadFlags()`.
7. Build lại (`npm run build`), `check-export` → `OK`; trang build dùng template 1.0.2.
8. Marketing kit đã làm: vẽ thêm `800x800`, `800x1200`, `512x512_logo`, vẽ lại `512x512` không chữ (prompt theo HANDOFF.md §6), dựng lại kit, `check-marketing` → `OK`.
9. Gắn đủ quảng cáo theo bảng "Chỗ quảng cáo" đã duyệt (`preroll`, `interstitial`, `rewarded` nếu có thưởng). Sửa các chỗ vướng hai tên miền (EMBED.md, đầu file), chạy `screens.mjs` không còn lỗi `cross-origin`.
10. Marketing kit đã làm: thêm mục 11 Control Guide vào cả ba file brief (HTML: trước Image kit), `check-marketing` → `OK`.
11. Build lại: `compress` dừng ở code ghép tên file thì xử lý theo EXPORT.md §4 (mặc định `keep` + `dynamicPaths`, không sửa code) và báo chủ game. Game đã tự `keep` các thư mục đó (ví dụ golfbattle) chỉ cần thêm `dynamicPaths`.
12. Game có bảng xếp hạng: chép lại `leaderboard/leaderboard.js` (+ `.d.ts`) và `ui.js` → `src/sdk/leaderboard/`, thêm khoá `edit_flag`, `guest` vào nhóm `leaderboard` của `i18n`. Màn tự vẽ / ô nhập tên riêng: ẩn ô tên khi `board.nameEditable()` là `false`, không mời gửi điểm khi `board.canSubmit()` là `false`.
13. Bỏ bộ đếm giờ quảng cáo riêng của game (nếu có): SDK và portal lo giãn cách.

## 1.0.1 — 2026-10-22

### Bản đầu

Kit gắn **gmsdkjs 1.0.1** (trên server ở thư mục riêng `…/gmsdkjs/1.0.1/`, template ở `…/gmsdkjs/templates/1.0.1/`: [SERVER_NOTES.md](docs/SERVER_NOTES.md)) vào game web. Tổng quan cả hệ thống: [OVERVIEW.md](docs/OVERVIEW.md).

**Có gì**
- **Màn loading đi đầu** ([LOADING.md](docs/LOADING.md)): `loader.js` (`loading/loader.js` → `public/loader.js`) là script **duy nhất** trang nạp. Hiện màn loading ngay, tải `gmsdkjs.js` và `game.js` song song, mỗi file tối đa 3 lần (10 giây mỗi lần, nghỉ 1 rồi 2 giây). gmsdkjs **bắt buộc**: 3 lần vẫn lỗi thì "Connection problem… reload the page" + nút Reload (trang dev chạy tiếp không SDK). Game điều khiển màn qua `loading/loading.js` (`createLoader()`: `progress`, `setTitle`, `error`, `hide`).
- **Giao diện màn loading: mẫu kit hoặc của game** ([LOADING.md §1.1](docs/LOADING.md)): AI luôn hỏi chủ game một lần, ghi `config.json` → `loadingScreen` (`"kit"` | `"game"`). Ảnh và giao diện nằm trong `public/icons/` (tên cố định: `loading.webp`, `logo.webp`, `loader.css`); `"game"` thì `loader.css` mang giao diện của game (ảnh, logo, thanh tải, vị trí, màu, font), luồng vẫn của kit. `loader.js` chờ `loader.css` tối đa 0,5 giây trước khi hiện màn.
- **Bắt đầu game:** `sdk = await loadSDK({ gameCode })` là việc đầu tiên trong `async function boot()`. **Không `await` ở cấp ngoài cùng của file** (gói IIFE; `check-export --src` cảnh báo).
- **Lưu dữ liệu là của kit** (`sdk/storage.js`, [INTEGRATION.md §6](docs/INTEGRATION.md)): key `azgames.<gameCode>`, giá trị `gm1` + mã kiểm + JSON nén LZ (lz-string 1.5.0, MIT) trộn theo key: nhỏ khoảng 10 lần, không đọc được, sửa tay là save bị bỏ. Đồng bộ; tracking `save_tampered`, `save_failed`, `save_large`; trang dev có `gmSave.dump()`. gmsdkjs chỉ giữ tên GMA ở `gma_<gameCode>.name`.
- **Bảng xếp hạng** ([LEADERBOARD.md](docs/LEADERBOARD.md)): `leaderboard/` gửi điểm có ký HMAC, top hôm nay / tuần / tháng / mọi lúc, hạng của người chơi; tên và cờ lấy từ hồ sơ GMA (save chỉ là bản sao dự phòng); `ui.js` màn hình mặc định, 252 cờ. `config.json` → `leaderboardId`.
- **Ngôn ngữ** ([INTEGRATION.md §7](docs/INTEGRATION.md)): `i18n/<thẻ BCP 47>.json`; lúc mở game theo lựa chọn đã lưu → `GMSDKJS_OPTIONS.language` → `defaultLanguage`.
- **Loại thiết bị** ([API.md §10](docs/API.md)): `GMGameSDK.getDeviceType()` (`desktop` | `mobile` | `tablet`); GMA tới sau `loadSDK()`, có hàm chờ mẫu.
- **Build một gói cho mọi portal** ([EXPORT.md](docs/EXPORT.md)): `bump-version` (version `yymmddXX`, mã game tạm khi chưa có) → Vite → `compress` (PNG → WebP, nhạc → MP3; không đụng `icons/`) → `assemble` (trang gm từ template 1.0.1) → `check-export` → `zip`. Ra **`export/build/<version>-<id>/<version>-<id>.zip`**. Hỏi rồi mới commit và đẩy git.
- **`check-export`** kiểm cả tên file **đúng chữ hoa / thường** (Windows không phân biệt, CDN có): chỉ chặn build khi chắc chắn hỏng trên CDN (code gọi tên khác chữ hoa / thường với file trong gói, kể cả thư mục trước `${…}` của đường dẫn ghép lúc chạy); không tìm thấy file chỉ cảnh báo (có thể là khoá atlas); file của kit không cần ghi trong `licenses.json`; `loader.js` đúng bản kit, `icons/` và skin của màn loading, dòng bản quyền chỉ từ `sdk/copyright.js` (mặc định `© 2026 Azgames.io`), giấy phép asset, sự kiện tracking, quy chuẩn repo.
- **Game trong iframe, nhiều tên miền** ([EMBED.md](docs/EMBED.md)): luật ngắn trong `PROMPT.md` (file khác tên miền, đọc điểm ảnh, worker, nhiều luồng, âm thanh, toàn màn hình, phím, trang cha: được dùng khi đủ điều kiện, có đường lui); `check-export` báo lỗi file `http://`, nhắc file từ tên miền khác, ảnh ngoài chưa đặt `crossOrigin`, Worker từ URL, `SharedArrayBuffer` chưa kiểm `crossOriginIsolated`; QA 7.9.
- **More Games trên trang dev:** server không trả link trên localhost nên nút bị ẩn, không kiểm được. Shim trả `https://azgames.io` (`DEV_MORE_GAMES`) trên trang dev (`platform: 'dev'`): nút luôn hiện để kiểm; trên portal vẫn theo server ([INTEGRATION.md §9](docs/INTEGRATION.md)).
- **Game có sẵn đang tự lưu dữ liệu:** AI hỏi chủ game 3 phương án (kệ / chuyển đổi / người cũ giữ kiểu cũ), làm theo phương án được chọn ([AI_INSTALL.md](AI_INSTALL.md), Cách làm). Code save cũ đặt ở `src/legacy-save.js`, file duy nhất ngoài kit `check-export` cho dùng `localStorage`.
- **QA** ([QA.md](docs/QA.md)): checklist theo portal; **ảnh 8 cỡ màn hình** (`tools/screens.mjs`) chụp **một lần mỗi game** khi chủ game đồng ý (cần đồ hoạ bản cuối), ra `export/qa/<version>-<id>/`.
- **Marketing kit** ([HANDOFF.md](docs/HANDOFF.md), [PROMPT_MARKETING.md](PROMPT_MARKETING.md)): làm **một lần mỗi game**, hỏi sau khi có ảnh QA (cần bản game hoàn thiện), ra `export/marketing/<version>-<id>/`; cover / banner vẽ theo ảnh gameplay thật.
- **Quy chuẩn repo game** ([INTEGRATION.md §1](docs/INTEGRATION.md)): game ở gốc (`src/` + `public/`), tài liệu `docs/gdd/`, `docs/plan/`, `docs/qa/<version>.md`, kit ở `docs/GMSDK_JS/`.

**Dấu hiệu:** game chưa có `docs/GMSDK_JS/` hoặc `src/sdk/gmsdkjs-shim.js`; còn SDK cũ (`JS_GMSDK/`, `JS_SDK_*/`, `gmsdkv2.js`, `AZ_SETTINGS`, `Language/`).

**Game cần làm:** cài kit theo [AI_INSTALL.md](AI_INSTALL.md) (game mới: [NEW_GAME.md](docs/NEW_GAME.md); game có sẵn: trường hợp "Gắn SDK", kể cả Bước 4 bỏ SDK cũ).
