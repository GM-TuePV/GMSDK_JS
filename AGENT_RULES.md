## GMSDK_JS: luật cho mọi lần sửa game

Game dùng kit GMSDK_JS (`docs/GMSDK_JS/`). Luật dưới áp dụng cho **mọi** thay đổi, kể cả thêm một tính năng nhỏ, đổi ảnh, sửa giao diện, không chỉ lúc cài kit. Chi tiết: `docs/GMSDK_JS/docs/INTEGRATION.md`, `EMBED.md`, `EXPORT.md`.

- **Ảnh:** nạp bằng `loadImage()` của `src/sdk/net.js`. Tự tạo `new Image()` / `document.createElement('img')` thì đặt `img.crossOrigin = 'anonymous'` **trước** `img.src`. Trên site của mình trang và gói ở hai tên miền khác nhau: thiếu nó thì canvas "bẩn", `getImageData` / `toDataURL` / texture WebGL lỗi (`EMBED.md` §1).
- **Đường dẫn:** tương đối, hoặc `new URL(path, document.baseURI)`; không dựng từ `location.href` / `document.URL` / `location.origin`. Worker chạy từ blob (`EMBED.md` §4).
- **Tải file:** qua `src/sdk/net.js` (`loadImage`, `loadJSON`, `fetchRetry`…), không `fetch` / `new Image()` trần.
- **Lưu dữ liệu:** chỉ qua `sdk.storage`; không gọi `localStorage` / `sessionStorage`.
- **Quảng cáo:** qua SDK (`preroll`, `interstitial`, nút thưởng theo `rewardedAvailable()` + chỉ thưởng khi `rewarded()` trả `true`); không tự xét `info.adblock`, không tự làm popup chặn quảng cáo.
- **Chữ hiển thị:** trong `i18n/`, code chỉ dùng key.
- **Build:** `npm run build` (gồm `check-export --src` và kiểm hai tên miền). Báo lỗi thì sửa code; không bỏ bước kiểm, không sửa tool của kit để lọt.
