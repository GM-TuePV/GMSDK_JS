# Ghi chú cho bên sửa gmsdkjs (server)

Tổng quan luồng chạy và ai lo phần nào: [OVERVIEW.md](OVERVIEW.md).

## 1. Bắt buộc cho kit 1.0.1

Game theo kit 1.0.1 **chỉ chạy đúng khi server đã có đủ ba thứ dưới đây**. Bản sửa sẵn nằm ở thư mục bàn giao `gmsdkjs-server/` (cạnh kit, ngoài repo kit):

| # | Việc | File bàn giao | Vì sao |
| --- | --- | --- | --- |
| 1 | Đưa **gmsdkjs 1.0.1** lên cả hai host (`games.1games.io/lib/1games/gmsdkjs/`, `api.azgame.io/static/lib/azgames/gmsdkjs/`), bản `_dev` và bản obfuscate | `gmsdkjs_dev.js` (bản dev đã sửa; obfuscate ra `gmsdkjs.js` như mọi lần) | gmsdkjs 1.0.0 ghi vùng `sdk` vào `azgames.<gameCode>` bằng JSON rõ: **đè mất save đã mã hoá của game**. 1.0.1 chỉ giữ tên GMA ở `gma_<gameCode>.name` |
| 2 | Thay **8 template** (`templates/gamesforfree-{gm,gd,crazy,poki}.html` ở cả hai host) | `templates/1games/`, `templates/az/` | Template cũ nạp `gmsdkjs.js` đồng bộ trong `<head>` (màn đen tới khi tải xong) và `game.js` trực tiếp. Bản mới chỉ nạp `loader.js`, ghi `sdkUrl` (host của gmsdkjs) và `language: "<!--LANGUAGE-->"`. `assemble` / `check-export` của kit báo lỗi khi gặp template cũ |
| 3 | **Tool build** (trang Build SDK JS): gói có **2 file JS** `loader.js` + `game.js`; obfuscate cả hai; điền `<!--LANGUAGE-->` bằng `defaultLanguage` của `game.json` (hoặc ngôn ngữ chọn ở form game) | | Thiếu `loader.js` trong trang = game không chạy; `loader.js` không obfuscate = lộ cách tải |

Kiểm sau khi đưa lên: mở một gói 1.0.1 trên `game.1games.io` → màn loading hiện ngay; DevTools chặn `gmsdkjs.js` → "Connecting again (2/3)…" rồi màn Reload; Local Storage chỉ có `azgames.<gameCode>` (chuỗi `gm1…`) và `gma_<gameCode>.name`.

**Thứ tự:** đưa gmsdkjs 1.0.1 lên **trước** khi game 1.0.1 đầu tiên lên portal. gmsdkjs 1.0.1 vẫn chạy với game 1.0.0 (shim 1.0.0 thấy `GMSDKJS.storage` không còn thì dùng bộ lưu dự phòng của nó, cùng key), nên đưa sớm không hỏng gì. Template mới chỉ hợp với gói 1.0.1 (có `loader.js`).

## 2. gmsdkjs 1.0.1 đã sửa gì (so với 1.0.0)

Trong `gmsdkjs_dev.js` (bản bundle; nguồn `lib/1games/gmsdkjs/src/` sửa tương ứng):

- `src/storage.js` → **`src/gmaStore.js`**: bỏ hẳn bộ lưu dữ liệu game (`createStorage`, `migrate`, gom ghi, vùng). Thay bằng `createGmaStore({ key, getLs })` chỉ đọc / ghi một chuỗi: tên người chơi ẩn danh của GMA, key **`gma_<gameCode>.name`** (`gma_dev.name` khi chưa có mã thật), có bộ nhớ dự phòng khi localStorage bị chặn.
- `src/gma.js` (`createTracker`): nhận `gmaStore` thay `storage`; `playerName()` đọc / ghi qua `gmaStore` thay vùng `sdk`.
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

`gmsdkjs.js` có hai bản: `https://games.1games.io/lib/1games/gmsdkjs/` (trang 1games) và `https://api.azgame.io/static/lib/azgames/gmsdkjs/` (trang az). Ngày 21/10/2026 hai bản `_dev` giống hệt (chỉ khác kiểu xuống dòng). **Sửa gmsdkjs thì cập nhật cả hai chỗ cùng lúc**, kể cả template. Template của mỗi host ghi `sdkUrl` trỏ về gmsdkjs của chính host đó.
