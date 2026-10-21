# Tổng quan: kit GMSDK JS 1.0.1 + gmsdkjs 1.0.1

Một trang để thấy cả hệ thống: game chạy từ lúc mở trang tới lúc chơi qua những bước nào, phần nào nằm ở đâu, và bản 1.0.1 đã đổi gì so với 1.0.0. Chi tiết từng phần ở các file được dẫn.

## 1. Gói game

```
<id>-<version>/
├── index.html      template của portal (tool build ghép; kit ghép trang gm bằng assemble)
├── loader.js       của kit (loading/loader.js, chép nguyên): script DUY NHẤT trang nạp
├── game.js         code game + các module của kit, Vite bundle thành 1 file
├── game.json       id, gameCode, name, version (yymmddXX), languages, leaderboardId…
├── Icons/          loading.webp (key art), logo.webp: ảnh màn loading, tên cố định
├── i18n/           <thẻ ngôn ngữ>.json
└── assets/         ảnh, nhạc, dữ liệu
```

## 2. Luồng chạy

```
1. Trình duyệt mở index.html
   └─ GMSDKJS_OPTIONS (inline: platform, sdkType, gameId, gameCode, sdkUrl, language, api, gma, brand…)
      + <div id="game"> + <script src="loader.js">           (không còn thẻ gmsdkjs.js chặn trang)

2. loader.js chạy ngay
   ├─ dựng màn loading: Icons/loading.webp, logo (không có trên gd / crazy / poki), tên game, thanh %
   ├─ tải SONG SONG, mỗi file tối đa 3 lần (10 giây mỗi lần, nghỉ 1 rồi 2 giây):
   │    ├─ gmsdkjs.js (sdkUrl)          kiểm thêm: phải có window.GMSDKJS
   │    └─ game.js
   │   hai file này chạy thanh 0 → 30 %
   ├─ gmsdkjs 3 lần vẫn lỗi → "Connection problem. Please check your network and reload the page." + nút Reload; DỪNG
   │    (chỉ trang dev, platform 'dev', chạy tiếp không SDK để làm game khi mất mạng)
   └─ đủ hai file → window.GMLoader.ready() trả SDK cho game

3. gmsdkjs.js chạy (ngay khi tải xong)
   ├─ licence: chuyển trang nếu mở ngoài portal; màn khoá nếu site không được phép
   ├─ quảng cáo: tải SDK của mạng (H5 / GD / CrazyGames / Poki / WeeGoo), giãn cách, tạm dừng game khi có quảng cáo
   └─ GMA: tải gm-sdk.js, đăng nhập ẩn danh (tên ở key gma_<gameCode>.name), tracking

4. game.js chạy
   ├─ boot(): sdk = await loadSDK({ gameCode })          chờ bước 2 xong
   ├─ sdk.storage (bộ lưu của kit) mở key azgames.<gameCode>, giải mã
   ├─ initI18n: bảng dịch theo lựa chọn đã lưu → language của trang → defaultLanguage
   ├─ tải tài nguyên → loader.progress(p)               thanh 30 → 100 %, chuyển cho gmsdkjs → portal
   ├─ dựng menu
   └─ loader.hide()                                     ẩn màn + sdk.loadingDone() → preroll → người chơi thấy menu

5. Trong lúc chơi
   ├─ quảng cáo, tạm dừng, tracking: gmsdkjs (qua sdk.*)
   ├─ lưu: sdk.storage (ghi sau 300 ms, ghi ngay khi tab ẩn / đóng)
   └─ bảng xếp hạng: leaderboard/ của kit, dùng GMGameSDK mà gmsdkjs đã đăng nhập
```

## 3. Phần nào ở đâu

| Việc | Ở đâu | Ai giữ |
| --- | --- | --- |
| Template từng portal (`GMSDKJS_OPTIONS`, nạp `loader.js`) | Server, `templates/gamesforfree-<portal>.html` (hai host) | Server |
| Màn loading, thanh %, tải và thử lại gmsdkjs + `game.js`, màn Reload | `loading/loader.js` → `loader.js` | Kit |
| Licence, màn khoá, chuyển trang | `gmsdkjs.js` | Server |
| Quảng cáo mọi mạng, giãn cách, tạm dừng, adblock | `gmsdkjs.js` | Server |
| Tracking GMA, sự kiện tự gửi, đăng nhập ẩn danh (`gma_<gameCode>.name`) | `gmsdkjs.js` | Server |
| Thương hiệu, More Games, trademark | `gmsdkjs.js` | Server |
| **Lưu dữ liệu game** (`azgames.<gameCode>`, nén + mã hoá, chống sửa tay) | `sdk/storage.js` (trong `game.js`) | Kit |
| `loadSDK()` / `getSDK()`, bọc mọi hàm an toàn, `sdk.storage` | `sdk/gmsdkjs-shim.js` | Kit |
| Điều khiển màn loading từ game | `loading/loading.js` | Kit |
| Ngôn ngữ, tải file có thử lại, dòng bản quyền | `sdk/i18n.js`, `net.js`, `copyright.js` | Kit |
| Bảng xếp hạng | `leaderboard/` | Kit |
| Gameplay, tài nguyên, tiến độ tải, chỗ đặt quảng cáo | Code game | Game (AI theo kit) |
| Build: bump-version → Vite → nén → `assemble` → `check-export` → zip | `tools/` | Kit |
| Obfuscate `loader.js` + `game.js`, khoá domain, trang từng portal, CDN | Tool build trên API | Server |

## 4. gmsdkjs 1.0.1 đã sửa gì (so với 1.0.0)

File: `gmsdkjs-server/gmsdkjs_dev.js` (bàn giao cho server). Chi tiết và thứ tự đưa lên: [SERVER_NOTES.md](SERVER_NOTES.md).

| Trước (1.0.0) | Sau (1.0.1) |
| --- | --- |
| Có bộ lưu dữ liệu game (`sdk.storage`): key `azgames.<gameCode>`, JSON rõ, có vùng `sdk` của GMA | **Bỏ.** Lưu dữ liệu game là của kit. gmsdkjs chỉ giữ tên GMA ở key riêng **`gma_<gameCode>.name`** |
| Template nạp `gmsdkjs.js` bằng thẻ đồng bộ trong `<head>`, rồi `game.js` | `loader.js` của game chèn `gmsdkjs.js` bằng code (đã thử chạy đúng: licence, quảng cáo, GMA) |
| `VERSION = "1.0.0"` | `"1.0.1"` |

**Template 1.0.1** (8 file: 4 portal × 2 host, `gmsdkjs-server/templates/`): bỏ thẻ `gmsdkjs.js` và `game.js`; chỉ còn `<script src="loader.js">`; thêm `sdkUrl` (gmsdkjs của chính host đó) và `language: "<!--LANGUAGE-->"`.

**Tool build** phải nhận gói có 2 file JS (`loader.js`, `game.js`) và obfuscate cả hai.

## 5. Kit 1.0.1 đã sửa gì (so với 1.0.0)

| Phần | Trước (1.0.0) | Sau (1.0.1) |
| --- | --- | --- |
| Màn loading | `game.js` tự dựng ở dòng đầu: chỉ hiện sau khi tải xong `gmsdkjs.js` và `game.js` (màn đen trước đó) | **`loader.js`** dựng ngay khi trang mở; `loading.js` chỉ còn điều khiển (`progress`, `setTitle`, `error`, `hide`) |
| Tải gmsdkjs | Thẻ trong template; lỗi thì game chạy không SDK; chậm thì treo màn đen | `loader.js` tải song song với `game.js`, 3 lần, rồi báo **tải lại trang**. Bắt buộc có (trừ trang dev) |
| Bắt đầu game | `const sdk = getSDK()` ở đầu module | `sdk = await loadSDK()` là việc đầu tiên trong `boot()` (không await cấp cao nhất: gói IIFE) |
| Lưu dữ liệu | Bộ lưu của gmsdkjs (shim chép lại làm dự phòng), JSON rõ, sửa tay được | **`sdk/storage.js`** của kit: nén LZ (UTF-16) + trộn + mã kiểm. Nhỏ khoảng 10 lần, không đọc được, sửa tay là save bị bỏ. Đồng bộ (ghi chắc lúc đóng tab). Báo `save_tampered`, `save_failed`, `save_large` |
| Shim | Sinh từ mã gmsdkjs, chụp SDK một lần lúc gọi `getSDK()` | Kit giữ; tìm `window.GMSDKJS` mỗi lần gọi; `loadSDK()`; dev có `gmSave.dump()` |
| Gói | `game.js` là JS duy nhất | `loader.js` + `game.js` |
| `check-export` | Kiểm `Icons/` chỉ khi dùng màn của kit | Đòi `loader.js` (bằng bản kit) + `Icons/` mọi gói; báo lỗi template cũ, màn loading tự dựng; cho phép `localStorage` trong `src/sdk/storage.js` |
| `assemble` | Template phải nạp `game.js` | Template phải nạp `loader.js`; template cũ → báo lỗi |
| Trang dev | Thẻ `gmsdkjs.js` + `<script type="module" src="src/main.js">` | `<script src="loader.js" data-entry="src/main.js" data-module>` |
| QA | 1.4: chặn gmsdkjs vẫn chơi được | 1.4: chặn gmsdkjs → màn Reload sau 3 lần; 1.6: màn loading hiện ngay; 5.1: save không đọc được; 5.6 mới: sửa tay save → bỏ |
| QA 8 cỡ màn hình | Không có | §2.1: 8 cỡ (4 máy tính, 3 điện thoại, 1 iPad); `tools/screens.mjs` chụp menu, AI chụp lúc chơi; ảnh ở `export/qa-<version>/`, không commit; bảng kết quả trong báo cáo QA |
| Marketing | Cover / banner vẽ theo mô tả + art của game | Bắt buộc 3–5 ảnh gameplay thật (`export/marketing-ref/`) đính kèm mọi prompt; ảnh phải sát gameplay, không thêm thứ game không có, không UI; duyệt cạnh ảnh gameplay |
| Code game | | **Không `await` ở cấp ngoài cùng của file** (gói IIFE): mọi `await` trong `boot()`; `check-export --src` cảnh báo |

Việc game phải làm để lên 1.0.1: [CHANGELOG.md](../CHANGELOG.md) mục 1.0.1.

## 6. Con số đã đo (máy dev, Edge)

| Việc | Kết quả |
| --- | --- |
| Màn loading hiện sau khi mở trang | ~110 ms |
| gmsdkjs bị chặn → màn Reload (3 lần, lỗi nhanh) | ~3,4 giây |
| Lần 1 treo, lần 2 được | vào game sau ~10 giây |
| Save JSON 9 KB → lưu | ~1 KB (11 %) |
| Save JSON 40 KB: mã hoá / giải mã | ~8 ms / ~2 ms |
