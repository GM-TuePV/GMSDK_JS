# Hướng dẫn cho dev: gắn GMSDK JS vào game

Dành cho người làm game (dev, chủ game) dùng kit cùng AI (Claude Code / Codex). AI làm phần code theo kit; bạn **cung cấp thông tin, trả lời câu hỏi, duyệt plan và kiểm kết quả**. File này nói bạn cần chuẩn bị gì và sẽ nhận được gì ở từng giai đoạn. Chi tiết kỹ thuật ở các file được dẫn.

| Giai đoạn | Bạn làm | Kết quả |
| --- | --- | --- |
| 1. Gắn SDK | Cung cấp giá trị của game + ảnh, trả lời câu hỏi, duyệt plan | Game chạy với SDK: loading, quảng cáo, lưu, tracking, ngôn ngữ |
| 2. Build | Chạy `npm run build` (hoặc nút Build của app GMaker) | Gói `export/build/<version>-<id>/<version>-<id>.zip` để upload |
| 3. QA | Chơi thử trên máy thật, đọc báo cáo QA | `docs/qa/<version>.md`, 0 lỗi Major thì được giao |
| 4. Marketing | Trả lời 3 câu hỏi, chạy prompt vẽ ảnh, duyệt ảnh | `export/marketing/<version>-<id>/`: brief + 8 cỡ ảnh |
| 5. Bàn giao | Gửi 5 phần cho bên vận hành | Game lên portal |

## 1. Gắn SDK: cần cung cấp gì

### 1.1 Giá trị của game

Ghi trong `docs/GMSDK_JS/config.json` (app GMaker: thẻ **GM Build Tool** ghi giúp). AI dùng đúng giá trị bạn đưa, **không tự đoán**; ô nào còn trống thì AI hỏi.

| Giá trị | Ví dụ | Ai cấp | Ghi chú |
| --- | --- | --- | --- |
| `name`: tên hiển thị | `Wheelie Spooky` | Chủ game | Đúng như trên logo |
| `id`: slug trên portal | `wheelie-spooky` | Chủ game / vận hành | Chữ thường, số, gạch nối |
| `gameCode` | `g131` | Bên vận hành | Chưa có thì để trống: build tự đặt mã tạm, **phải thay mã thật trước khi phát hành** |
| `languages`, `defaultLanguage` | `["en", "vi"]`, `en` | Chủ game | Mỗi ngôn ngữ một file `public/i18n/<mã>.json` |
| `leaderboardId` | `leaderboard-topscore` | Bên vận hành (GMA) | Game không có bảng xếp hạng: `null` |
| `gdKey` | 32 ký tự hex | GameDistribution | Chưa lên GD: `null` |
| `compress` | `normal` | Chủ game | Mức nén ảnh / nhạc khi build; AI hỏi một lần |
| `loadingScreen` | `kit` / `game` | Chủ game | Màn loading mẫu của kit, hay giao diện riêng của game; AI hỏi một lần |
| `brief` | `"Đua xe một bánh, giữ thăng bằng"` | Chủ game | Chỉ game mới: AI dựng game theo mô tả này |
| `notes` | `["Save cũ ở azgames.g0"]` | Chủ game | Yêu cầu riêng; AI báo lại từng dòng |

### 1.2 Ảnh

Nằm trong `public/icons/` (chữ thường, tên cố định). App GMaker: kéo ảnh vào ô trên thẻ.

| File | Là gì | Cần |
| --- | --- | --- |
| `loading.webp` | Key art của game, nền màn loading | **Bắt buộc thay** ảnh mẫu: 16:9 hoặc vuông, cạnh dài ≥ 1024 |
| `logo.webp` | Logo góc màn loading | Thường giữ nguyên: tool build tự thay bằng logo của publisher |
| `web.png` | Icon trang (favicon) | Ảnh vuông, ≤ 256 × 256 |
| `loader.css` | Giao diện màn loading | Chọn "của game" thì AI viết theo giao diện cũ / art của game ([LOADING.md §1.1](docs/LOADING.md)) |

### 1.3 Câu AI sẽ hỏi bạn

Trả lời rõ, AI làm đúng theo đó:
- Giá trị còn trống ở 1.1.
- Nén ảnh / nhạc theo mức kit khuyên không.
- Màn loading: mẫu của kit hay giao diện của game.
- **Game có sẵn đang tự lưu dữ liệu:** "Game đang lưu dữ liệu kiểu cũ… Có 3 phương án: 1 Kệ, 2 làm bộ chuyển đổi data cũ theo chuẩn mới, 3 người cũ vẫn lưu kiểu cũ, người mới lưu kiểu mới?" Game đã có người chơi thì nên chọn 2 hoặc 3.
- Asset (font, nhạc, ảnh) không rõ nguồn: lấy từ đâu, giấy phép gì ([ASSETS.md](docs/ASSETS.md)).
- Duyệt **plan**: AI khảo sát rồi đưa plan (bỏ / sửa / thêm gì), chờ bạn duyệt mới sửa code.

### 1.4 Máy cần có

- Node.js 18+ và npm; Claude Code (hoặc Codex) mở ở gốc repo game.
- Gói cho build: `npm i -D vite sharp ffmpeg-static`. Chụp ảnh QA: thêm `playwright` (hoặc dùng Edge / Chrome có sẵn).
- Mạng: trang dev và gói build tải gmsdkjs từ server.

### 1.5 Bắt đầu

- **App GMaker:** mở dự án → thẻ GM Build Tool → điền giá trị, kéo ảnh → **Init SDK** → **Giao cho AI**.
- **Không dùng app:** chép kit vào `docs/GMSDK_JS/`, chép `config.example.json` thành `config.json` và điền, mở Claude Code ở gốc repo, kéo `docs/GMSDK_JS/PROMPT.md` vào khung chat ([README.md](README.md)).

**Chạy thử khi đang làm:** `npm run dev` rồi mở `http://localhost:5173/`. App GMaker: nút Chạy phải dùng lệnh `npm run dev` (bấm ▾ cạnh nút Chạy → "Thông tin dự án / sửa lệnh…"); server tĩnh của app không chạy được game theo kit. Trên trang dev, nút More Games luôn hiện (mở `https://azgames.io`) để kiểm chỗ đặt; console có `gmSave.dump()` để xem dữ liệu lưu.

**AI làm gì:** `loader.js` (màn loading, tải gmsdkjs + game, thử lại 3 lần), khởi động bằng `loadSDK()`, quảng cáo (preroll, xen giữa, thưởng), tạm dừng khi có quảng cáo, lưu qua `sdk.storage` (nén + mã hoá), ngôn ngữ, tracking sự kiện (`analytics.json`), bảng xếp hạng, giấy phép asset (`licenses.json`), bỏ SDK cũ, rà trải nghiệm người mới ([UX.md](docs/UX.md)).

## 2. Build: có gì

```bash
npm run build
```

Chuỗi lệnh của kit, đúng thứ tự: tăng version → Vite → nén ảnh / nhạc → ghép trang gm → `check-export` (kiểm gói) → đóng zip ([EXPORT.md](docs/EXPORT.md)).

```
export/build/<version>-<id>/          version = yymmddXX: ngày build + lần build trong ngày (vd 26102201)
├── index.html, preview.html         trang gm để thử (tool build thay bằng trang của từng portal)
├── loader.js                        màn loading + tải gmsdkjs, game.js
├── game.js                          toàn bộ code game, 1 file, đã minify
├── game.json                        id, gameCode, version, ngôn ngữ, bảng xếp hạng
├── icons/  i18n/  assets/           ảnh màn loading, bảng dịch, tài nguyên (đã nén)
└── <version>-<id>.zip               ← file upload lên tool build trên api.1games.io
```

- `check-export` phải báo **`OK`**. Lỗi thì build dừng, AI sửa. Nó kiểm cả tên file đúng chữ hoa / thường (CDN phân biệt), file tải từ tên miền khác, dòng bản quyền, giấy phép, sự kiện tracking.
- Thử gói: upload rồi mở `preview.html?debug` (quảng cáo, licence, GMA thật).
- **Sau build, AI hỏi bạn:**
  - commit và đẩy git không ([EXPORT.md §9](docs/EXPORT.md));
  - chụp ảnh QA 8 cỡ màn hình không (**một lần mỗi game**, cần đồ hoạ bản cuối);
  - viết marketing không (**một lần**, sau ảnh QA, cần bản game hoàn thiện).
  Chưa sẵn sàng thì trả lời "không", lần build sau AI hỏi lại.
- Upload: giao file zip cho người vận hành API; tool build làm trang từng portal (gm, GD, CrazyGames, Poki), obfuscate, đẩy CDN ([EXPORT.md §6](docs/EXPORT.md)).

## 3. QA: là gì

Kiểm game đạt chuẩn của portal (GameDistribution, CrazyGames, Poki) trước khi giao ([QA.md](docs/QA.md)). Mỗi mục có mức:
- **Major:** bắt buộc sửa. Còn một Major thì **không giao**.
- **Minor:** nên sửa; được giao nếu ghi trong báo cáo.

| Nhóm kiểm | Ví dụ |
| --- | --- |
| Khởi chạy, ổn định | Chạy trên Windows / macOS / Android / iOS, không sập trong 10–15 phút, console sạch |
| Màn hình | Xoay máy, đổi cỡ, game phủ kín, chữ không bị cắt; **8 cỡ màn hình** (chụp một lần, ảnh ở `export/qa/<version>-<id>/`) |
| Âm thanh | Đúng nhạc, không chồng bài; dừng khi chuyển tab; có tiếng sau cú chạm đầu; tắt tiếng rồi xem quảng cáo vẫn tắt |
| Quảng cáo, SDK | Preroll, xen giữa ở chỗ nghỉ, thưởng chỉ khi bấm; gmsdkjs bị chặn thì màn "tải lại trang" |
| Lưu, ngôn ngữ | Tiến trình còn sau khi tải lại; save sửa tay bị bỏ; người chơi cũ giữ dữ liệu theo phương án đã chọn |
| Hiệu năng, dung lượng | Tải nhanh, gói gọn, máy yếu chạy được |
| Nội dung, thương hiệu | Không link ra ngoài trên Poki, dòng bản quyền đúng, More Games đúng chỗ, giấy phép asset đủ, chạy được trong iframe tên miền khác |
| Tracking | Đủ sự kiện, `analytics.json` |
| Trải nghiệm người mới | Vào chơi ngay hoặc ≤ 1 cú bấm, hiểu cách chơi, không bỏ sót tính năng |

- AI kiểm những gì làm được trên máy và viết **báo cáo `docs/qa/<version>.md`** theo mẫu (QA.md §6). Mục cần máy thật (iPhone, Android, Chromebook) hoặc portal thật thì AI ghi "chưa kiểm được": **bạn chơi thử và điền**.
- Trước khi gửi portal duyệt, người vận hành bật domain, tắt More Games / trademark cho GD, CrazyGames, Poki (QA.md §4).

## 4. Marketing: là gì

Bộ tài liệu để team marketing làm trang game, store, social, video ([HANDOFF.md](docs/HANDOFF.md)). Làm **một lần mỗi game**, khi game đã hoàn thiện; AI hỏi sau khi đã có ảnh QA. Muốn làm lại thì yêu cầu AI.

```
export/marketing/<version>-<id>/
├── <id>-content-brief.md         tiếng Việt
├── <id>-content-brief.en.md      tiếng Anh
├── <id>-content-brief.en.html    tiếng Anh, một trang có ảnh, gửi link được
└── images/  (+ images/jpg/)      8 cỡ ảnh, PNG + JPG
```

- **Brief, 10 mục:** pitch, thông tin nhanh, điểm bán hàng, core loop, chế độ chơi, trong màn chơi, level, progression, game feel, store description tiếng Anh (Short ≤ 160 ký tự, Long, tags). Chỉ quảng bá tính năng **đã mở**; không tên engine, không chữ kỹ thuật.
- **Ảnh 8 cỡ:** icon 1024×1024, cover 1920×1080 và 1080×1920, thumbnail 512×384, 512×512, 200×120, banner 1280×720 và 1280×550. Nền đặc, đúng pixel, vẽ theo **ảnh gameplay thật** (ảnh QA), không thêm thứ game không có.
- **AI hỏi bạn trước khi viết:** tính năng nào đã mở / chờ update; tên, IP, thương hiệu nào cấm nhắc; tên public chính xác.
- **Ảnh còn thiếu:** AI viết prompt cho Codex (`art/prompts/`); bạn chạy prompt, duyệt, chép ảnh vào `art/store/`; AI dựng lại kit. Cover 1920×1080 làm trước, các cỡ khác theo cover đã duyệt.
- Kiểm: `node docs/GMSDK_JS/tools/check-marketing.mjs` báo `OK`. Giao: zip cả thư mục lên form game trên API.

## 5. Bàn giao: 5 phần

| Phần | Ở đâu | Đạt khi |
| --- | --- | --- |
| Gói build | `export/build/<version>-<id>/<version>-<id>.zip` | `check-export` OK; `gameCode` thật (không phải mã tạm); có `gdKey` nếu lên GD |
| Báo cáo QA | `docs/qa/<version>.md` | 0 Major; Minor ghi rõ |
| Giấy phép asset | `docs/GMSDK_JS/licenses.json` | Không còn asset không rõ nguồn |
| Marketing kit | `export/marketing/<version>-<id>/` | `check-marketing` OK |
| Ghi chú bàn giao | Tin nhắn / mô tả commit | Theo mẫu [HANDOFF.md §2](docs/HANDOFF.md): bản build, git, QA, giấy phép, marketing, portal, mới trong bản này, coming soon, lỗi còn biết |

`export/` không commit vào git: gói, ảnh QA, marketing chỉ nằm trên máy build và nơi upload.

## Lưu ý hay gặp

- **Màn đen khi bấm Chạy trong app:** nút Chạy đang dùng server tĩnh; đổi sang `npm run dev` (mục 1.5).
- **Trang tự tải lại liên tục khi chạy `npm run dev`:** AI đang sửa code, Vite tải lại sau mỗi lần lưu. Xem ở trình duyệt ngoài hoặc chờ AI xong.
- **Ảnh / texture lỗi CORS khi game nhúng ở site khác:** [EMBED.md](docs/EMBED.md).
- **Thay ảnh loading sau khi build:** chép đè `public/icons/loading.webp` rồi build lại ([LOADING.md](docs/LOADING.md)).
- **Mã game tạm** (`g` + 14 số): build vẫn chạy để thử, nhưng **không upload phát hành**; đổi mã thật ở `config.json`.
