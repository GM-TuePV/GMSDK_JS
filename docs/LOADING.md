# Màn loading và dòng bản quyền

## 1. Màn loading mặc định (GM Loader v1)

[`loading/loading.js`](../loading/loading.js) là màn loading của azgames ("GM Loader v1", bộ mà kit 2.x dùng), giữ nguyên giao diện: nền là key art làm mờ, ảnh nhỏ + tên game + vòng xoay → thanh % tô theo 3 màu nổi của key art → "Almost there..." từ 99%, phiên bản ở góc trái, logo publisher ở góc phải. Game dùng bộ này mặc định; muốn màn riêng thì bỏ module, tự vẽ theo [NEW_GAME.md Bước 2](NEW_GAME.md).

**Khác kit 2.x:** gói xuất không có trang HTML riêng (trang là template của portal, [EXPORT.md §1](EXPORT.md)), nên màn được dựng bởi chính `game.js` ở **dòng đầu tiên** của entry, thay vì viết sẵn trong `index.html`. Màn hiện ngay khi `game.js` chạy.

| Từ kit | Vào game |
| --- | --- |
| `loading/loading.js` (+ `loading.d.ts` nếu dùng TypeScript) | `src/sdk/loading/` |
| `loading/Icons/loading.webp`, `logo.webp` | `public/Icons/` (trong gói: `Icons/` ở gốc) |

- **Ảnh của màn loading nằm riêng trong `Icons/`, tên file cố định**, để sau này dễ tìm, dễ thay: thay ảnh là chép đè `public/Icons/loading.webp` rồi build lại (hoặc chép đè `Icons/loading.webp` trong gói đã build rồi đóng lại zip, [EXPORT.md §8](EXPORT.md)). Không để ảnh loading ở chỗ khác, không đổi tên.
- **`loading.webp` là key art của game** (16:9 hoặc vuông, cạnh dài ≥ 1024): thay ảnh mẫu của kit. `check-export` cảnh báo khi còn ảnh mẫu, báo lỗi khi thiếu file.
- **`logo.webp`** là logo AZGAMES của kit 2.x, dùng chung mọi game: không sửa. Trên trang GameDistribution / CrazyGames / Poki (`sdkType` `gd` / `crazy` / `poki`, hoặc `trademark: false`) màn tự bỏ logo (không thương hiệu publisher ở đó, [QA.md](QA.md) 7.4).
- Chữ trên màn (`Loading...`, `Almost there...`, `Connection problem. Tap to retry.`) **tiếng Anh cứng**: hiện trước khi `i18n/` tải xong.
- Font Nunito của template nạp từ Google Fonts chỉ cho màn này; chưa tải kịp thì dùng font hệ thống.

```js
import { getSDK } from './sdk/gmsdkjs-shim.js';
import { createLoader } from './sdk/loading/loading.js';

const sdk = getSDK({ gameCode });
const loader = createLoader({ sdk });            // dòng đầu: màn hiện ngay, tên = <title> của trang

async function boot() {
  const manifest = await loadJSON('game.json');
  loader.setTitle(manifest.name);
  await loadAssets((p) => loader.progress(p));   // 0..1; tự gọi sdk.loadingProgress(p)
  await sdk.ready();
  showMenu();
  loader.hide();                                 // menu đã hiện
  sdk.loadingDone();
}
boot().catch(() => loader.error());              // "Connection problem. Tap to retry." → tải lại trang
```

| Hàm | Làm gì |
| --- | --- |
| `createLoader({ sdk?, title?, assets?, version? })` | Dựng màn ngay. `assets` mặc định `Icons/`; `version` mặc định `GMSDKJS_OPTIONS.version` |
| `loader.progress(f)` | Thanh tiến độ (0..1): vòng xoay tới khi có số đầu tiên, rồi %, "Almost there..." từ 99%. Gọi luôn `sdk.loadingProgress(f)` |
| `loader.setTitle(name)` | Tên game (sau khi đọc `game.json`) |
| `loader.error(onRetry?)` | Tải lỗi: dòng "Connection problem. Tap to retry.", bấm thì `onRetry` (mặc định tải lại trang) |
| `loader.hide()` | Màn đầu của game đã sẵn: ẩn màn loading |

Tiến độ đếm theo **file đã tải xong**, không theo byte: thanh đi theo bước, CSS làm mượt. Tài nguyên nặng (atlas, nhạc) nên chiếm phần lớn thanh; chia tỉ lệ theo game.

## 2. Dòng bản quyền

Mặc định luôn là **`© 2026 Azgames.io`**; chỉ đổi khi server gửi khác. Lấy bằng [`sdk/copyright.js`](../sdk/copyright.js):

```js
import { copyrightText } from './sdk/copyright.js';
copyrightLabel.textContent = copyrightText(sdk);   // sau sdk.ready(); '' = không hiện gì
```

| Server (`gameinfo.trademark`, qua `sdk.brand.trademark()`) | Hiện |
| --- | --- |
| Không có SDK / API không trả lời / chủ bản quyền mặc định | `© 2026 Azgames.io` |
| Tên miền hoặc tên khác | `© 2026 <tên đó>` |
| `0` (tắt), và mọi trang GameDistribution / CrazyGames / Poki | Không hiện |

- Năm cố định `2026` (`COPYRIGHT_YEAR` trong `copyright.js`), đổi ở đó khi cần.
- Game **không tự viết** `©`, `Azgames.io`, `AZ Games`… ở chỗ khác: `check-export` cảnh báo (trừ chuỗi của `copyright.js`).
- Chỗ đặt: góc menu hoặc chân bảng Settings, cạnh `V<version>` ([INTEGRATION.md §9](INTEGRATION.md)).
