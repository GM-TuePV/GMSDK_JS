# Ghi chú cho bên sửa gmsdkjs (server)

Tổng quan luồng chạy và ai lo phần nào: [OVERVIEW.md](OVERVIEW.md).

## 1. Bắt buộc cho kit 1.0.2

Kit 1.0.2 trỏ **gmsdkjs 1.0.2** và **template 1.0.2**. Thư mục 1.0.1 giữ nguyên cho game đang chạy (quy ước §5).

| # | Việc | Vì sao |
| --- | --- | --- |
| 1 | Đưa **gmsdkjs 1.0.2** vào thư mục riêng `…/gmsdkjs/1.0.2/` (`games.1games.io/lib/1games/gmsdkjs/1.0.2/`, `api.azgame.io/static/lib/azgames/gmsdkjs/1.0.2/`), bản `_dev` và bản obfuscate. Không ghi đè `1.0.1/` | Thay đổi ở §6: lấy tên CrazyGames bằng `getUser()` một lần mỗi trang. `VERSION = "1.0.2"` |
| 2 | Thêm **template 1.0.2** `templates/1.0.2/gamesforfree-{gm,gd,crazy,poki}.html` ở cả hai host: chép từ `1.0.1/`, chỉ đổi `sdkUrl` sang gmsdkjs 1.0.2 của chính host đó | `loader.js` của kit 1.0.2 mặc định trỏ `1.0.2/`; `assemble` của kit đọc `templates/1.0.2/` |
| 3 | **Tool build:** gói của kit 1.0.2 dùng template 1.0.2; gói 1.0.1 vẫn dùng template 1.0.1 | Gói 1.0.2 trên template 1.0.1 thì chạy gmsdkjs 1.0.1 (không có phần CrazyGames) |

**Thứ tự:** đưa gmsdkjs 1.0.2 + template 1.0.2 lên **trước**, kiểm một game, rồi mới phát kit 1.0.2 cho dev game.

Kiểm sau khi đưa lên: mở một gói 1.0.2 với `?debug` → log ghi gmsdkjs `1.0.2`; trên CrazyGames làm theo phần "Kiểm" của §6.

### Kit 1.0.1 (đã triển khai 21/10/2026)

**Server làm thế này (2026-10-21):** gmsdkjs 1.0.1 nằm ở thư mục riêng `gmsdkjs/1.0.1/` (`https://games.1games.io/lib/1games/gmsdkjs/1.0.1/gmsdkjs.js`, az: `https://api.azgame.io/static/lib/azgames/gmsdkjs/1.0.1/gmsdkjs.js`). `gmsdkjs/gmsdkjs.js` giữ nguyên 1.0.0 cho game kit 1.0.0 đang chạy và các gói đã gửi portal. `loading/loader.js` của kit mặc định trỏ `1.0.1/`; trang build ghi `sdkUrl` của publisher. gmsdkjs 1.0.1 của server làm thêm một việc: chưa có `gma_<gameCode>.name` thì lấy tên GMA mà 1.0.0 để trong `azgames.<gameCode>` (JSON, vùng `sdk`), không đụng tới save `gm1…`. Tool build nhận cả hai thế hệ: gói có `loader.js` build theo 1.0.1, không có thì build theo 1.0.0 như trước.

Game theo kit 1.0.1 **chỉ chạy đúng khi server đã có đủ ba thứ dưới đây**. Bản sửa sẵn nằm ở thư mục bàn giao `gmsdkjs-server/` (cạnh kit, ngoài repo kit):

| # | Việc | File bàn giao | Vì sao |
| --- | --- | --- | --- |
| 1 | Đưa **gmsdkjs 1.0.1** lên cả hai host, vào **thư mục riêng** `…/gmsdkjs/1.0.1/` (`games.1games.io/lib/1games/gmsdkjs/1.0.1/`, `api.azgame.io/static/lib/azgames/gmsdkjs/1.0.1/`), bản `_dev` và bản obfuscate. Không ghi đè `gmsdkjs/gmsdkjs.js` (1.0.0) | `gmsdkjs_dev.js` (bản dev đã sửa; obfuscate ra `gmsdkjs.js` như mọi lần) | gmsdkjs 1.0.0 ghi vùng `sdk` vào `azgames.<gameCode>` bằng JSON rõ: **đè mất save đã mã hoá của game**. 1.0.1 chỉ giữ tên GMA ở `gma_<gameCode>.name` |
| 2 | Thay **8 template** (`templates/gamesforfree-{gm,gd,crazy,poki}.html` ở cả hai host) | `templates/1games/`, `templates/az/` | Template cũ nạp `gmsdkjs.js` đồng bộ trong `<head>` (màn đen tới khi tải xong) và `game.js` trực tiếp. Bản mới chỉ nạp `loader.js`, ghi `sdkUrl` (host của gmsdkjs) và `language: "<!--LANGUAGE-->"`. `assemble` / `check-export` của kit báo lỗi khi gặp template cũ |
| 3 | **Tool build** (trang Build SDK JS): gói có **2 file JS** `loader.js` + `game.js`; obfuscate cả hai; thay `icons/logo.webp` (chữ thường) bằng logo brand của publisher, giữ nguyên các file khác trong `icons/` (`loading.webp`, `loader.css`, ảnh giao diện của game); điền `<!--LANGUAGE-->` bằng `defaultLanguage` của `game.json` (hoặc ngôn ngữ chọn ở form game) | | Thiếu `loader.js` trong trang = game không chạy; `loader.js` không obfuscate = lộ cách tải |

Kiểm sau khi đưa lên: mở một gói 1.0.1 trên `game.1games.io` → màn loading hiện ngay; DevTools chặn `gmsdkjs.js` → "Connecting again (2/3)…" rồi màn Reload; Local Storage chỉ có `azgames.<gameCode>` (chuỗi `gm1…`) và `gma_<gameCode>.name`.

**CORS trên CDN (bắt buộc):** mọi file của gói trên CDN (ảnh, font, JSON, âm thanh, model, `.wasm`) trả `Access-Control-Allow-Origin: *`, `.wasm` trả `Content-Type: application/wasm`. Trang của site (`game.1games.io/<id>/`) tải gói từ CDN `gdn.1games.io` qua `<base href>`: mọi file của gói khác tên miền với trang, thiếu header này thì ảnh làm texture, font, `fetch` hỏng. Đổi header thì xoá cache CDN ([EMBED.md](EMBED.md) §3).

**Thứ tự:** đưa gmsdkjs 1.0.1 lên **trước** khi game 1.0.1 đầu tiên lên portal. gmsdkjs 1.0.1 vẫn chạy với game 1.0.0 (shim 1.0.0 thấy `GMSDKJS.storage` không còn thì dùng bộ lưu dự phòng của nó, cùng key), nên đưa sớm không hỏng gì. Template mới chỉ hợp với gói 1.0.1 (có `loader.js`).

## 2. gmsdkjs 1.0.1 đã sửa gì (so với 1.0.0)

Trong `gmsdkjs_dev.js` (bản bundle; nguồn `lib/1games/gmsdkjs/src/` sửa tương ứng):

- `src/storage.js` → **`src/gmaStore.js`**: bỏ hẳn bộ lưu dữ liệu game (`createStorage`, `migrate`, gom ghi, vùng). Thay bằng `createGmaStore({ key, getLs })` chỉ đọc / ghi một chuỗi: tên người chơi ẩn danh của GMA, key **`gma_<gameCode>.name`** (`gma_dev.name` khi chưa có mã thật), có bộ nhớ dự phòng khi localStorage bị chặn.
- `src/gma.js` (`createTracker`): nhận `gmaStore` thay `storage`; `playerName()` đọc / ghi qua `gmaStore` thay vùng `sdk`.
- Chưa có `gma_<gameCode>.name` thì đọc tên GMA mà 1.0.0 để trong `azgames.<gameCode>` (JSON, vùng `sdk`) và chép sang key mới (`legacyKey`); save `gm1…` không phải JSON nên bị bỏ qua, không bị đụng.
- `src/options.js`: `storageKey` → `gmaNameKey`; cảnh báo `gameCode` sai dạng đổi chữ.
- `src/index.js`: bỏ `storageDelayMs`; bỏ `storage` khỏi đối tượng `GMSDKJS` (game lưu bằng `sdk/storage.js` của kit); `VERSION = "1.0.1"`.
- Không đổi: licence, màn khoá, chuyển hướng, quảng cáo, giãn cách, tạm dừng, tracking, thương hiệu. gmsdkjs chạy đúng khi được `loader.js` chèn bằng code thay vì thẻ trong HTML (đã thử: bình thường, lỗi 3 lần, lần 1 treo).
- Shim `gmsdkjs-shim.js` trên server **không còn dùng**: từ 1.0.1 shim là của kit.

## 3. Không bắt buộc (làm khi rảnh)

| # | Hiện tại | Đề xuất | Lợi |
| --- | --- | --- | --- |
| 1 | Đăng nhập GMA lần đầu bằng `{ name: player<6 ký tự>, country: "US" }` | Dùng tên / cờ người chơi đã chọn (vùng `leaderboard` trong save của game: `{ name, country }`), chưa có mới dùng mặc định. Thêm `GMDualSlot.onAppStart()` sau `refreshSession()` như bản Unity | Người mới không mang cờ Mỹ trên bảng; khớp luồng Unity |
| 2 | Không báo lúc GMA đăng nhập xong; game chờ biến toàn cục `GMGameSDK` có `getPlayerId()` | Thêm `sdk.gma()` → `Promise<GMGameSDK \| null>` | `leaderboard.js` bỏ vòng chờ 250 ms |
| 3 | Khi `gmsdkjs.js` không tải được, server không biết | `loader.js` gửi `navigator.sendBeacon` tới một endpoint của API khi báo lỗi lần cuối (cần endpoint) | Biết tỉ lệ người chơi kẹt ở bước tải |

## 4. Hai bản gmsdkjs

`gmsdkjs.js` có hai bản: `https://games.1games.io/lib/1games/gmsdkjs/` (trang 1games) và `https://api.azgame.io/static/lib/azgames/gmsdkjs/` (trang az). Ngày 21/10/2026 hai bản `_dev` giống hệt (chỉ khác kiểu xuống dòng). **Sửa gmsdkjs thì cập nhật cả hai chỗ cùng lúc**, kể cả template. Mỗi host có bản 1.0.0 ở gốc (`gmsdkjs/gmsdkjs.js`) và bản 1.0.1 trong `gmsdkjs/1.0.1/`. Template của mỗi host ghi `sdkUrl` trỏ về gmsdkjs 1.0.1 của chính host đó. **Bản az 1.0.1 phải có trên server trước khi đưa template az 1.0.1 lên** (thiếu thì `loader.js` thử 3 lần rồi báo tải lại trang).

## 5. Quy ước phiên bản gmsdkjs

- Thay đổi gmsdkjs mà game cũ không chịu được (đổi lưu trữ, đổi API bắt buộc) thì **làm thư mục mới** (`1.0.2/`, `1.1.0/`…). Không bao giờ ghi đè thư mục đang có game dùng.
- Mỗi thư mục mới cần: URL mặc định trong `loading/loader.js`, `sdkUrl` trong template portal, mục CHANGELOG ghi rõ "Cần gmsdkjs ≥ x.y.z ở `…/gmsdkjs/x.y.z/`".
- Sửa lỗi không phá vỡ thì vá ngay trong thư mục đang dùng. Bản 1.0.0 ở gốc (`gmsdkjs/gmsdkjs.js`) đóng băng: chỉ vá khi lỗi làm hỏng game kit 1.0.0 đang chạy.
- Mỗi lần đổi gmsdkjs, cập nhật cả hai host (1games, az).

## 6. gmsdkjs 1.0.2: tên người chơi trên CrazyGames

Theo cách Wacky Flip (Unity) đã qua duyệt CrazyGames. Chỉ khi `sdkType === "crazy"`; game và kit không gọi gì.

**Hiện tại:** gmsdkjs tạo tài khoản GMA ẩn danh bằng `playerName()` (tên lưu ở `gma_<gameCode>.name`, chưa có thì `player` + 6 ký tự ngẫu nhiên); không đọc tài khoản CrazyGames.

**Cần sửa:**
1. Adapter `crazy`: sau `init()` thành công, **mỗi lần mở trang gọi `CrazyGames.SDK.user.getUser()` đúng một lần**, kể cả khi đã có tài khoản GMA (yêu cầu của CrazyGames). Lưu promise trong trang (ví dụ `window.__gmsdkCrazyUser`), các chỗ khác dùng lại; chỉ gọi lại khi lần đó lỗi. Không gọi khi đổi màn, không gắn auth listener. Gọi 2 lần là CrazyGames trả bản build về.
2. Tạo tài khoản GMA (`signIn()` → `signInAnonymously({ name, country })`), chỉ khi **chưa có tài khoản** (chưa có `getPlayerId()` hoặc token hết hạn): chờ kết quả `getUser()` tối đa **1,5 giây**; có người dùng thì `name = user.username`; khách (`null`), lỗi hay quá giờ thì như hiện tại (`playerName()`).
3. **Đã có tài khoản GMA:** giữ tên GMA, **không** đè bằng `username` (kể cả khi khác hoặc vừa đổi). `username` chỉ dùng một lần, lúc tạo tài khoản.
4. `tracker.start()` đang chạy song song với `adapter.init()`: trên Crazy, `signIn` đợi adapter init xong (vẫn trong giới hạn 1,5 giây cho phần tên) rồi mới tạo tài khoản.
5. Tên `username` không qua bộ lọc phía client: máy chủ GMA kiểm như mọi tên; bị từ chối thì tạo tài khoản bằng tên mặc định như hiện tại.

**Không cần:** Data module (`SDK.data`), nút đăng nhập, theo dõi đăng nhập / đăng xuất, avatar, userId.

**Kiểm** (trang thử của CrazyGames hoặc `dev-crazygames`, `?debug`): đăng nhập CrazyGames, xoá dữ liệu trang, mở game → tài khoản GMA mới mang đúng `username`; mỗi lần mở trang log có **đúng một** lần `getUser`; đổi tên trong game rồi tải lại → giữ tên đã đổi; chưa đăng nhập → tên `playerXXXXXX` như cũ.

## 7. gmsdkjs 1.0.2: tắt tiếng theo CrazyGames (`muteAudio`)

Mục "The game supports CrazyGames muting audio through SDK" của CrazyGames ([docs.crazygames.com/sdk/game](https://docs.crazygames.com/sdk/game/), *Game settings*): CrazyGames có thể bắt game tắt tiếng, lệnh này đứng trên nút âm thanh của game và đổi được giữa lúc chơi.

- Adapter `crazy`: sau `init()` đọc `SDK.game.settings.muteAudio`, nghe `SDK.game.addSettingsChangeListener`.
- `GMSDKJS.portalMuted()` (`boolean`) và `GMSDKJS.onPortalMuted(fn)` (`fn(muted)` mỗi lần đổi). Portal khác luôn `false`.
- Game dùng theo [INTEGRATION.md §3](INTEGRATION.md), QA 4.15. Shim của kit trả `false` khi trang chạy gmsdkjs cũ.

**Kiểm:** mở game trên CrazyGames với `?muteAudio=true` (`?debug` có dòng `portal mute true`): game im, bấm nút âm thanh vẫn im.
