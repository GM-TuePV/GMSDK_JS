# Ghi chú cho bên sửa gmsdkjs (server)

Kit 1.0.0 chạy đủ bảng xếp hạng **không cần sửa `gmsdkjs.js`**: `leaderboard/leaderboard.js` dùng lại `GMGameSDK` mà gmsdkjs đã init và đăng nhập ([LEADERBOARD.md §1](LEADERBOARD.md)). Bốn việc dưới đây chỉ làm cho gọn và bền hơn; không có cũng không hỏng game.

| # | Hiện tại (gmsdkjs 1.0.0, `src/gma.js`) | Đề xuất | Lợi |
| --- | --- | --- | --- |
| 1 | Đăng nhập lần đầu bằng `{ name: player<6 ký tự>, country: "US" }` | Dùng tên / cờ người chơi đã chọn (vùng lưu `leaderboard` của kit: `{ name, country }`), chưa có mới dùng mặc định. Thêm `GMDualSlot.onAppStart()` sau `refreshSession()` như bản Unity | Người mới không mang cờ Mỹ trên bảng; khớp luồng Unity |
| 2 | Không báo lúc GMA đăng nhập xong; game phải chờ biến toàn cục `GMGameSDK` có `getPlayerId()` | Thêm `sdk.gma()` → `Promise<GMGameSDK \| null>`: đối tượng đã đăng nhập, `null` khi trang không có `gma` / không nạp được | `leaderboard.js` bỏ vòng chờ 250 ms; không phụ thuộc biến toàn cục |
| 3 | `GMGameSDK` không có trong shim | Shim chuyển tiếp `sdk.gma()` (bản dự phòng trả `null`) + `.d.ts` | Game TypeScript có kiểu |
| 4 | Template của trang (`templates/gamesforfree-<portal>.html`) không có ngôn ngữ | Thêm `language: "<!--LANGUAGE-->"` vào `GMSDKJS_OPTIONS` (tool build điền `defaultLanguage` của `game.json`, hoặc ngôn ngữ chọn ở form game của portal) | Ngôn ngữ mặc định đặt theo từng trang như kit cũ (`AZ_SETTINGS.language`); `sdk/i18n.js` đọc nó. Chưa có thì game dùng `defaultLanguage` |

Khi có (2), `leaderboard.js` đổi chỗ lấy `GMGameSDK` sang `sdk.gma()`; game không phải sửa gì (cùng `createLeaderboard`).

## Hai bản gmsdkjs

`gmsdkjs.js` có hai bản: `https://games.1games.io/lib/1games/gmsdkjs/` (trang 1games) và `https://api.azgame.io/static/lib/azgames/gmsdkjs/` (trang az). Ngày 20/10/2026 hai bản giống hệt (bản `_dev` và shim chỉ khác kiểu xuống dòng). **Sửa gmsdkjs thì cập nhật cả hai chỗ cùng lúc**, kể cả `gmsdkjs-shim.js` và `gmsdkjs_dev.js`, nếu không game trên az và 1games chạy khác nhau. Kit chỉ kiểm thẻ `id="gmsoft-jssdk"`, không kiểm link, nên trang nạp bản nào cũng qua `check-export`.
