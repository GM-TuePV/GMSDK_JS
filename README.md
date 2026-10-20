# GMSDK JS kit

Bộ chuẩn để gắn **gmsdkjs** vào một game web (JS / TS), hoặc làm game mới theo chuẩn. Cả kit nằm trong một folder, kể cả cấu hình của game (`config.json`): chép folder sang dự án khác là dùng được.

**gmsdkjs** là một file duy nhất do template của platform nạp: `https://games.1games.io/lib/1games/gmsdkjs/gmsdkjs.js`. Nó lo:
- licence, màn khoá và chuyển hướng theo API;
- quảng cáo mọi network (AdSense H5, GameDistribution, CrazyGames, Poki, WeeGoo): preroll, xen giữa, thưởng, tạm dừng, giãn cách, chặn quảng cáo;
- tracking GMA, lưu trữ một key `azgames.<gameCode>`, thương hiệu publisher.

Game chỉ gọi vài hàm, qua `getSDK()`.

## Bắt đầu từ đâu

Ba bước, cho mọi trường hợp: game mới, gắn SDK vào game có sẵn, nâng cấp kit.

1. **Chép folder kit** vào repo game thành `docs/GMSDK_JS/`. Nâng cấp thì chép đè, **giữ `config.json`, `analytics.json` và `licenses.json`** (ba file riêng của game).
2. **Cấu hình:** chép `config.example.json` thành `config.json` ngay trong folder kit, điền giá trị chủ game cấp ([AI_INSTALL.md](AI_INSTALL.md) Bước 0). Game mới thì điền thêm `brief`. Kiểm ở gốc repo: `node docs/GMSDK_JS/tools/check-export.mjs` phải báo `OK`.
3. **Checkout đúng nhánh**, mở Claude Code ở gốc repo, **kéo [PROMPT.md](PROMPT.md) vào khung chat** rồi Enter. Nếu VS Code mở file thay vì chèn vào khung chat, giữ Shift khi thả. Hoặc gõ `@docs/GMSDK_JS/PROMPT.md`.

**Cách nhanh, một lệnh:** cài lệnh `/gmsdk` của Claude Code một lần trên máy (api.1games.io `GMSDK_JS/claude/gmsdk.md` → `~/.claude/commands/gmsdk.md`). Từ đó, ở gốc repo game bất kỳ chỉ cần gõ `/gmsdk`. Lệnh tự chép kit mới nhất từ api.1games.io vào `docs/GMSDK_JS/` (giữ `config.json`, `analytics.json`, `licenses.json`), hỏi giá trị nếu chưa có `config.json`, rồi làm theo `PROMPT.md`. Gõ `/gmsdk marketing` để dựng marketing kit theo `PROMPT_MARKETING.md`. Lời nhắn thêm gõ sau lệnh, ví dụ `/gmsdk chỉ rà UX`.

AI tự nhận trường hợp, khảo sát, đưa plan và chờ bạn duyệt rồi mới sửa code. Nó làm trên nhánh hiện tại, commit từng bước, không push. Muốn việc hẹp hơn thì gõ kèm một câu sau file, ví dụ "chỉ rà trải nghiệm người chơi theo UX.md".

| Việc | Đọc |
| --- | --- |
| Làm game mới theo kit | [docs/NEW_GAME.md](docs/NEW_GAME.md): từng bước, từ repo trống tới gói xuất |
| Gắn kit vào game có sẵn, nâng cấp kit | [AI_INSTALL.md](AI_INSTALL.md), [CHANGELOG.md](CHANGELOG.md) |
| Người mới hiểu game, không bỏ sót tính năng | [docs/UX.md](docs/UX.md): phiên đầu từng bước, 5 lớp hướng dẫn, bản đồ tính năng, tính năng mới |
| Kiểm trước khi giao portal | [docs/QA.md](docs/QA.md) |
| Bàn giao: gói build, QA, marketing kit (brief + ảnh store / portal) | [docs/HANDOFF.md](docs/HANDOFF.md); thiếu marketing kit thì kéo [PROMPT_MARKETING.md](PROMPT_MARKETING.md) vào khung chat |

## Chạy thử trong 2 phút

```bash
npx --yes http-server docs/GMSDK_JS -p 8080
```

Mở `http://localhost:8080/example/`. Một game nhỏ dùng đủ mọi phần của SDK, có quảng cáo test thật của Google: preroll, xen giữa, thưởng, lưu trữ, hai ngôn ngữ, More Games, trademark.

## Trong kit

| Đường dẫn | Là gì |
| --- | --- |
| [AI_INSTALL.md](AI_INSTALL.md) | Các bước gắn SDK vào một game, cho người hoặc AI làm theo |
| [PROMPT.md](PROMPT.md) | Lệnh cho AI: kéo vào khung chat là chạy, cho mọi trường hợp |
| [PROMPT_MARKETING.md](PROMPT_MARKETING.md) | Lệnh cho AI: dựng marketing kit (brief VN / EN / HTML, ảnh PNG + JPG), viết prompt Codex cho ảnh còn thiếu |
| [config.example.json](config.example.json) | Mẫu `config.json`: giá trị riêng của từng game (id, gameCode, key GD, ngôn ngữ, mô tả game mới, luật riêng). Chép thành `config.json` ngay trong folder kit |
| [licenses.example.json](licenses.example.json) | Định dạng của `licenses.json` (cạnh `config.json`): nguồn và giấy phép của mọi font, âm thanh, ảnh trong game ([docs/ASSETS.md](docs/ASSETS.md)) |
| [analytics.example.json](analytics.example.json) | Định dạng của `analytics.json`, từ điển sự kiện mà AI **sinh ra** sau khi gắn tracking (cạnh `config.json`). Không ai viết tay |
| [VERSION](VERSION), [CHANGELOG.md](CHANGELOG.md) | Phiên bản kit (`MAJOR.MINOR.PATCH`) và việc game phải làm khi nâng cấp, mỗi mục có dấu hiệu để AI biết game còn thiếu |
| [docs/INTEGRATION.md](docs/INTEGRATION.md) | Gắn SDK theo thứ tự game chạy: khởi động, tạm dừng, quảng cáo, lưu trữ, ngôn ngữ, More Games |
| [docs/API.md](docs/API.md) | Tra cứu từng hàm |
| [docs/ENGINES.md](docs/ENGINES.md) | Phần khác nhau theo engine: JS thuần, Phaser, PixiJS, Three.js…; xuất gói có / không bundler |
| [docs/ANALYTICS.md](docs/ANALYTICS.md) | Tracking để phân tích và cải thiện game: sự kiện SDK tự gửi, bộ chuẩn nhà phát hành, bộ phân tích bắt buộc (phiên, màn, phễu người mới, level / chết / thoát, tiền, item, tính năng, quảng cáo), từ điển `analytics.json`, câu hỏi và KPI khi phân tích qua GMA / MCP |
| [docs/EXPORT.md](docs/EXPORT.md) | Gói xuất của game: `game.json`, `game.js`, `i18n/`, `assets/` |
| [docs/TESTING.md](docs/TESTING.md) | Cách chạy thử: trang dev, chế độ thử quảng cáo, preset từng portal |
| [docs/NEW_GAME.md](docs/NEW_GAME.md) | Làm game mới theo kit: các bước, các màn bắt buộc, điều kiện xong |
| [docs/UX.md](docs/UX.md) | Trải nghiệm người chơi: vào chơi ngay, hướng dẫn người mới từng bước, gợi ý đúng lúc, lý do thua, chấm đỏ, tính năng mới, bản đồ tính năng |
| [docs/QA.md](docs/QA.md) | Tiêu chuẩn QA đạt / không đạt trước khi giao portal (GD, CrazyGames, Poki): thiết bị, checklist, trải nghiệm người mới, hiệu năng, lỗi hay gặp, mẫu báo cáo |
| [docs/ASSETS.md](docs/ASSETS.md) | Asset và giấy phép: `licenses.json`, giấy phép dùng được / cấm (game có quảng cáo là thương mại), ghi công CC-BY, asset chưa rõ nguồn, art gen bằng AI |
| [docs/HANDOFF.md](docs/HANDOFF.md) | Tiêu chuẩn bàn giao: gói build, báo cáo QA, ghi chú bàn giao, marketing kit (`marketing/<id>/`: content brief 10 mục, 8 cỡ ảnh store / portal: PNG trong `images/`, JPG trong `images/jpg/`), mẫu prompt Codex cho ảnh |
| [docs/LEADERBOARD.md](docs/LEADERBOARD.md) | Bảng xếp hạng: gửi điểm, top theo kỳ, hạng của người chơi, tên + cờ, màn hình mặc định, thử trên máy |
| `sdk/` | Chép vào `src/sdk/` của game: `gmsdkjs-shim.js` (+ `.d.ts`), `i18n.js`, `net.js`. JS thuần, không cần build |
| `leaderboard/` | Game có bảng xếp hạng: `leaderboard.js`, `hmac.js`, `ui.js` (+ `.d.ts`) chép vào `src/sdk/leaderboard/`; `flags/`, `countries.json` chép vào `public/assets/leaderboard/` |
| `template/index.html` | Trang dev, chép về gốc repo game |
| `template/vite.config.mjs` | Cấu hình Vite xuất đúng gói |
| `tools/check-export.mjs` | Kiểm `config.json`, `analytics.json`, `licenses.json` (tự tìm cạnh kit) và gói xuất trước khi giao (Node 18+, không cần cài gì) |
| `tools/bump-version.mjs` | Version `yyyymmddXX`, tăng 1 mỗi lần build |
| `tools/assemble.mjs` | Ghép trang gm (`index.html` + `preview.html`) vào gói. Trang của từng portal do tool build trên API làm |
| `tools/check-marketing.mjs` | Kiểm marketing kit `marketing/<id>/` trước khi giao: đủ file, ảnh đúng pixel, nền đặc, brief đủ mục, HTML tự chứa ([HANDOFF.md §7](docs/HANDOFF.md)) |
| `tools/zip.mjs` | Bước cuối của build: đóng gói thành `export/<id>-<version>/<id>-<version>.zip` để upload lên tool build trên API |
| `example/` | Game mẫu chạy được |

## Ai lo phần nào

| Phần | Ai lo |
| --- | --- |
| Licence, màn khoá, chuyển hướng, SDK quảng cáo, GMA, giãn cách quảng cáo | `gmsdkjs.js` |
| Trang HTML theo platform, `GMSDKJS_OPTIONS`, obfuscate, khoá domain, nén, CDN | Trang **Build SDK JS** và khung **SOURCE** của form game trên admin API: xem thử ở `game.1games.io`, phát hành lên CDN `gdn.1games.io` (api.1games.io `GMSDK_JS/docs/GUIDE.md`) |
| Giá trị theo publisher (1games, azgames, ofree: API, trang chủ, GMA, thương hiệu) và theo portal (GD, CrazyGames, Poki) | `presets.json` của tool build (api.1games.io `lib/1games/gmsdkjs/templates/`). Game không chứa |
| Bảng xếp hạng: gửi điểm, đọc bảng, tên + cờ (trên GMA, dùng lần đăng nhập của gmsdkjs) | `leaderboard/` của kit, chép vào game ([docs/LEADERBOARD.md](docs/LEADERBOARD.md)) |
| Gameplay, màn loading, chỗ đặt quảng cáo, tạm dừng khi có quảng cáo, bảng dịch, nút More Games, nút bảng xếp hạng, sự kiện của game, hướng dẫn người chơi | Game, theo kit này |

## Cập nhật

- `gmsdkjs.js` cập nhật trên server, game không phải làm gì.
- `sdk/gmsdkjs-shim.js` và `.d.ts` hiếm khi đổi. Bản mới nhất ở `https://games.1games.io/lib/1games/gmsdkjs/gmsdkjs-shim.js` (và `.d.ts`); chép lại vào kit và vào game khi API thêm hàm.
- **Bản gốc của kit: repo api.1games.io, `GMSDK_JS/kit/`** (cùng thư mục `GMSDK_JS/` với tool build `build/` và thiết kế `docs/`). Sửa kit ở đó, rồi chép sang game thành `docs/GMSDK_JS/`; bản trong repo game chỉ là bản chép. Bản gốc **không có `config.json`, `analytics.json`, `licenses.json`**, chỉ có các file mẫu `*.example.json`.
- **Nâng cấp kit trong một game:** chép đè folder (giữ `config.json`, `analytics.json`, `licenses.json`), rồi kéo `PROMPT.md` vào khung chat. AI xét repo còn dấu hiệu của mục nào trong `CHANGELOG.md` thì làm mục đó.
- **Sửa kit mà game phải làm theo** (đổi file, đổi bước build, đổi API): tăng `VERSION` (MAJOR / MINOR / PATCH theo bảng đầu `CHANGELOG.md`), thêm mục vào đầu `CHANGELOG.md` với "Thay đổi", "Dấu hiệu" và "Game cần làm".
- Nguồn của SDK: repo api.1games.io, `lib/1games/gmsdkjs/` (`GMSDK_JS/README.md`). Thiết kế: `GMSDK_JS/docs/gmsdkjs-design.md`.
