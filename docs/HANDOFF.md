# Bàn giao game: tiêu chuẩn

Một game chỉ được coi là giao xong khi đủ **năm phần** dưới đây. Bên vận hành nhận gói build đưa lên portal. Team marketing nhận brief và ảnh để làm trang game, store, social, video. Không ai phải hỏi lại người làm game.

Thiếu marketing kit thì kéo [PROMPT_MARKETING.md](../PROMPT_MARKETING.md) vào khung chat. AI dựng phần chữ, và viết prompt Codex cho mọi ảnh còn thiếu (§6).

## 1. Năm phần bàn giao

| Phần | Ở đâu | Đạt khi |
| --- | --- | --- |
| Gói build | `export/build/<version>-<id>/<version>-<id>.zip` | `npm run build` báo `OK` ([EXPORT.md](EXPORT.md)); `config.json` có `gameCode` thật, có `gdKey` nếu lên GD |
| Báo cáo QA | Theo mẫu [QA.md §6](QA.md) | Không còn mục **Major**; mục Minor đã ghi rõ |
| Giấy phép asset | `docs/GMSDK_JS/licenses.json` | `check-export` không lỗi, không còn cảnh báo giấy phép (asset `unknown`, thiếu bằng chứng): [ASSETS.md](ASSETS.md) |
| Marketing kit | `export/marketing/<version>-<id>/` (làm một lần mỗi game, sau ảnh QA; không commit, [PROMPT_MARKETING.md](../PROMPT_MARKETING.md)); bên vận hành đưa lên hàng **Marketing kit** của form game trên API (zip cả thư mục, ảnh vào hàng Images) và gửi **link trang kit** cho team marketing | `node docs/GMSDK_JS/tools/check-marketing.mjs` báo `OK` (§3–§5) |
| Ghi chú bàn giao | Tin nhắn hoặc mô tả commit | Theo mẫu §2 |

`<id>` là `id` trong `config.json` (slug trên portal, ví dụ `wheelie-popper`). Mọi file của kit đều mang prefix này, nên file bị tách khỏi thư mục vẫn biết của game nào.

## 2. Ghi chú bàn giao

```
<Tên game> <version>: <id> / <gameCode>
- Gói: export/build/<version>-<id>/<version>-<id>.zip (check-export OK)
- Git: <url repo> · nhánh <nhánh> · commit Build <version> (<mã ngắn>) — nếu đã đẩy (EXPORT.md §9)
- QA: docs/qa/<version>.md: 0 Major, <n> Minor
- Giấy phép: licenses.json, 0 unknown; ghi công CC-BY hiện ở <Credits / store description>
- Marketing: export/marketing/<version>-<id>/ (check-marketing OK); zip thư mục này để đưa lên form game
- Portal: gm / GD (gdKey có hay chưa) / CrazyGames / Poki
- Mới trong bản này: …
- Coming soon (có trong code, chưa mở cho người chơi): …
- Còn biết (Minor, chưa sửa): …
```

## 3. Marketing kit: bố cục

Mọi thứ nằm trong **một thư mục**: gửi nguyên thư mục là đủ.

```
export/marketing/<version>-<id>/
  <id>-content-brief.md          tiếng Việt
  <id>-content-brief.en.md       tiếng Anh
  <id>-content-brief.en.html     tiếng Anh, một file tự chứa: hero + Image kit
  images/
    <id>-<rộng>x<cao>.png        mỗi cỡ một file, đúng pixel: bản chính
    jpg/
      <id>-<rộng>x<cao>.jpg      cùng ảnh, JPG (nhẹ, cho site đòi JPG)
```

- Không để file nào khác trong kit: ảnh nháp, file tạm, overlay kiểm tra.
- Bản gốc vẽ ra (PNG đúng cỡ) nằm ngoài kit, ở `art/store/<id>-<rộng>x<cao>.png`. Kit được **sinh ra** từ bản gốc bằng một script của game (ví dụ `npm run marketing`), không làm tay: sửa ảnh gốc rồi chạy lại là xong.

## 4. Bộ ảnh bắt buộc

| File (`images/`) | Cỡ | Dùng cho | Bố cục |
| --- | --- | --- | --- |
| `<id>-1024x1024` | 1024 × 1024 | Icon store, favicon | Nhân vật / xe chính + logo, nằm trong 80 % giữa (icon bị bo góc) |
| `<id>-1920x1080` | 1920 × 1080 | Cover ngang, hero của HTML | Logo một bên, hành động chính một bên |
| `<id>-1080x1920` | 1080 × 1920 | Cover dọc (mobile, story) | Logo trên, hành động dưới |
| `<id>-800x1200` | 800 × 1200 | Cover dọc 2:3 của cổng game (CrazyGames) | Logo to 1/3 trên, một nhân vật / vật chính đang hành động ở dưới; nền gọn |
| `<id>-800x800` | 800 × 800 | Cover vuông của cổng game (CrazyGames) | Một nhân vật / vật chính đang hành động 2/3, logo to ở 1/3 trên hoặc dưới; nền gọn, nhìn rõ khi thu nhỏ |
| `<id>-512x384` | 512 × 384 | Thumbnail cổng game 4:3 | Logo 1/3 trên phải, hành động từ dưới trái |
| `<id>-512x512` | 512 × 512 | Thumbnail vuông **không chữ** (Poki cấm chữ, cả tên game) | Một nhân vật / vật chính đang hành động chiếm 60–70 % khung, nền gọn; **không logo, không chữ** |
| `<id>-512x512_logo` | 512 × 512 | Thumbnail vuông **có logo** (CrazyGames, site của mình) | Cùng cảnh với `512x512`: vật chính 2/3, logo to ở 1/3 trên hoặc dưới (rộng 80–90 % khung); góc trên phải để trống (site đặt nhãn New / Trending ở đó) |
| `<id>-200x120` | 200 × 120 | Thumbnail rất nhỏ | **Không logo, không chữ**; cận cảnh hành động, bóng rõ, tương phản cao |
| `<id>-1280x720` | 1280 × 720 | Banner 16:9 | Hành động nửa trái, logo nửa phải |
| `<id>-1280x550` | 1280 × 550 | Banner ngang rộng | Hành động 1/3 trái, logo bên phải; mọi thứ quan trọng trong 80 % giữa theo chiều cao (cổng hay cắt trên dưới) |

Mỗi cỡ có bản chính `.png` trong `images/` và bản `.jpg` trong `images/jpg/`.

**Luật ảnh:**
- Đúng kích thước pixel ghi trong tên. sRGB (không CMYK). **Nền đặc**, không trong suốt.
- **Mỗi cỡ vẽ riêng cho đúng khung**, không cắt hay co từ ảnh lớn.
- Style giống art trong game. Nhân vật / xe đúng như trong game, không vẽ kiểu chung chung.
- Logo **chép đúng** logo game (chữ, màu, viền), không gõ lại.
- Không chữ nào ngoài logo. **Không** ký hiệu ©, tên publisher, tên miền hay watermark: cùng một bộ ảnh dùng cho mọi publisher, và chủ bản quyền do trang game hiện.
- JPG chất lượng khoảng 85–90.
- Không viền khung, không bo góc (cổng tự bo), không chữ "New", "Play", không icon store.

**Ảnh nhỏ phải đọc được (thumbnail, cover vuông, cover dọc):** ảnh hiện thành ô nhỏ trên trang danh sách, nhiều chi tiết thì thành nhoè và lẫn với game bên cạnh.
- **Một vật chính duy nhất**: nhân vật / xe / vật chính của game, đúng skin mặc định, tư thế đang hành động; chiếm 60–70 % khung. Thêm **tối đa một** vật phụ cho biết game làm gì. Không ghép đủ thứ của game.
- **Nền đơn giản**: 2–3 mảng màu lớn, hoặc cảnh của game làm mờ. Không đồ vật nhỏ, không hạt / tia bay khắp nơi, không chữ nhỏ, không UI.
- **Tương phản mạnh**: vật chính sáng, có viền sáng; nền tối hơn hoặc khác hẳn màu. Hình bóng (silhouette) nhận ra ngay. Tránh nền xanh ngọc gần `#83FFE7` (màu nền Poki).
- **Thử khi thu nhỏ**: xem ảnh ở 128 px và 96 px. Không nhận ra game, hay thấy rối, thì bỏ bớt chi tiết và vẽ lại.
- Ảnh to (cover 1920×1080, banner) được nhiều cảnh hơn, nhưng vẫn một tâm điểm rõ.

Cổng game đòi thêm cỡ nào thì thêm dòng vào bảng trong kit của game, đúng quy ước tên `<id>-<rộng>x<cao>` (hai ảnh cùng cỡ thì thêm đuôi, như `_logo`). `check-marketing` kiểm cả cỡ thêm (đúng pixel, không trong suốt).

## 5. Content brief

Ba file, **cùng 11 mục, cùng fact, cùng số liệu**. Viết cho team marketing (store page, social, video script), không phải tài liệu kỹ thuật.

| # | Mục (`## <số>. <tên>`) | Nội dung |
| --- | --- | --- |
| 1 | Elevator pitch | Một đoạn: đọc xong hiểu game và muốn thử |
| 2 | Thông tin nhanh (bảng) | Tên, thể loại, nền tảng, điều khiển (bàn phím và cảm ứng), thời lượng một lượt, người chơi hướng tới |
| 3 | Điểm bán hàng chính (USP) | 5–6 gạch đầu dòng, mỗi dòng một câu đắt |
| 4 | Core loop | 4–5 bước |
| 5 | Chế độ chơi (bảng) | Thêm một dòng **Coming soon** cho tính năng chờ. Không có thì ghi "chưa công bố", không bịa |
| 6 | Trong màn chơi | Vật phẩm, địa hình, hệ số điểm…, tả bằng trải nghiệm, không thuật ngữ nội bộ |
| 7 | Level / bản đồ (bảng) | Tên, độ khó, điều kiện mở, phần thưởng |
| 8 | Progression và phần thưởng | Tiền, mở khoá, nâng cấp, quà ngày, nhiệm vụ |
| 9 | Game feel | Chất liệu cho copywriter: cảm giác, nhịp, màu sắc, âm thanh |
| 10 | Store description (tiếng Anh, đăng ngay) | Short ≤ 160 ký tự, Long có Features, Tags / keywords |
| 11 | Control Guide (tiếng Anh, đăng ngay) | **Controls**: hướng dẫn điều khiển theo từng kiểu (bàn phím, chuột, cảm ứng); **How to play**: hướng dẫn chơi 3–6 bước. Dán thẳng vào ô Controls / How to play của các cổng game |

Mục 10 viết đúng dạng sau ở cả ba file, để `check-marketing` đếm được độ dài bản Short:

```
**Short (≤160 characters):**

> <một câu>

**Long:**

> <đoạn mở>
>
> **Features**
> - …

**Tags / keywords:** a, b, c
```

Mục 11 viết đúng dạng sau ở cả ba file (`check-marketing` đòi đủ hai phần):

```
**Controls:**

- Keyboard: ← → or A D to steer, Space to jump, Esc to pause
- Mouse: click to jump
- Touch: tap the left / right half to steer, swipe up to jump

**How to play:**

1. <mục tiêu của game, một câu>
2. <cách ghi điểm / qua màn>
3. <khi nào thua>
4. <mẹo, vật phẩm, nâng cấp>
```

- **Đúng phím thật:** lấy từ code xử lý input và màn hướng dẫn trong game, không bịa phím. Kiểu điều khiển nào game không có thì bỏ dòng đó (không có chuột thì không có dòng Mouse).
- **Controls** mỗi dòng một kiểu điều khiển, động tác trước rồi việc nó làm. Phím gọi đúng tên trên bàn phím (Space, Enter, Esc, Shift, ← ↑ → ↓).
- **How to play** 3–6 bước ngắn, đọc xong người chưa chơi biết phải làm gì để thắng: mục tiêu, cách ghi điểm / qua màn, khi nào thua, một hai mẹo.

**File HTML** (`<id>-content-brief.en.html`):
- **Tự chứa:** CSS viết trong file, ảnh nhúng base64, không tải gì từ ngoài. Mở trực tiếp bằng trình duyệt được, và in ra PDF vẫn đẹp.
- **Hero:** cover 1920×1080 hiện trọn khung 16:9 (logo trong ảnh không bị cắt). Tiêu đề và mô tả nằm ở dải riêng bên dưới, không đè lên ảnh.
- **Image kit**, phụ lục sau mục 11: mỗi ảnh trong bảng §4 là một thẻ gồm ảnh thu nhỏ, tên (ví dụ "Portal thumbnail 4:3"), kích thước, dung lượng và đường dẫn `images/<id>-<w>x<h>.png`. Ảnh chưa có hiện ô **Pending**. Script dựng kit sinh phụ lục này, nên chạy lại là cập nhật.
- Bảng có style, đọc được trên điện thoại.

**Luật nội dung:**
- Viết thuần góc nhìn **người chơi**. **Cấm** mọi chi tiết kỹ thuật: engine, framework, ngôn ngữ lập trình, thư viện vật lý, số test, tên file / code, pipeline. `check-marketing` cảnh báo các tên hay gặp (Phaser, Unity, PixiJS, Three.js, WebGL, TypeScript…).
- **Cấm** nhắc game, IP hay studio khác, và tên thương hiệu thật mà chủ game cấm. Cấm "clone", "reverse-engineered", "giống game X", "lấy cảm hứng từ X": game đứng như một sản phẩm nguyên bản.
- Chỉ quảng bá tính năng người chơi **dùng được hôm nay**. Tính năng chờ update chỉ nằm ở dòng Coming soon của mục 5.
- Mọi con số (giá, phần thưởng, số xe / level, hệ số) lấy từ data thật của game, và giống nhau ở cả ba file.
- Store copy tiếng Anh đăng thẳng lên portal được, không cần sửa.
- Không viết tên publisher hay chủ bản quyền: mỗi portal tự thêm.

## 6. Ảnh chưa có: prompt cho Codex

Ảnh được vẽ bằng **Codex** (công cụ gen ảnh): mỗi phiên dán prompt chung trước, rồi dán từng prompt ảnh, kèm ảnh tham chiếu. AI (qua [PROMPT_MARKETING.md](../PROMPT_MARKETING.md)) viết các prompt này **từ art thật của game**: màu, nét, nhân vật, logo. Không viết prompt chung chung.

**Ảnh gameplay thật làm tham chiếu (bắt buộc):** cover và banner phải **sát với gameplay**: người xem ảnh rồi vào game phải thấy đúng game đó (đúng nhân vật, đúng màn, đúng màu, đúng cảm giác chơi), không phải một game "đẹp hơn" do Codex tưởng tượng.
- Trước khi viết prompt, chọn **3–5 ảnh lúc chơi thật**: hành động chính của game, nhân vật / vật chính rõ nét, màn đặc trưng nhất, một khoảnh khắc gay cấn. Lấy từ ảnh QA ([QA.md §2.1](QA.md)) trong `export/qa/<version>-<id>/`, ưu tiên cỡ 1920×1080 và 390×844; thiếu thì chụp thêm vào cùng thư mục (`ref-<tên>.jpg`). Ảnh không có UI che (nếu game có chế độ ẩn HUD) thì tốt hơn.
- Ảnh không commit, và **liệt kê trong mục "Attach these images" của mọi prompt**, kể cả cover.
- Prompt nêu rõ phải giữ gì từ ảnh gameplay: nhân vật, màn / bối cảnh, màu, góc nhìn, hành động. Được bố cục lại cho vừa khung và làm đẹp ánh sáng; **không thêm** nhân vật, vật, hiệu ứng, cảnh mà game không có; **không đưa UI của game** (HUD, nút, điểm) vào ảnh.

**Thứ tự:**
1. Vẽ cover `<id>-1920x1080` trước. Chủ game duyệt rồi chép vào `art/store/`.
2. Mọi cỡ khác **kèm cover đã duyệt** làm tham chiếu: cùng nhân vật, cùng xe / vật chính, logo chép từ cover.
3. Codex lưu vào `art/incoming/store/<id>-<w>x<h>.png`. Duyệt xong thì chuyển sang `art/store/`, ghi vào `licenses.json` (`origin: ai`, công cụ, prompt, người duyệt: [ASSETS.md §6](ASSETS.md)), rồi chạy script dựng kit. Ảnh hỏng thì sửa prompt và vẽ lại, không sửa tay rồi để lệch style.

Các file AI viết, trong repo game:

```
art/prompts/MASTER.md                    prompt chung, dán đầu mỗi phiên Codex
art/prompts/store/<id>-<w>x<h>.md        một file cho mỗi cỡ còn thiếu
```

### Mẫu `art/prompts/MASTER.md`

~~~markdown
# Master prompt (paste first in every Codex session)

```
You are drawing the store and portal images of "<Game name>", <one line: genre and what the player does>, so that every image looks drawn by the same artist as the game itself.
Keep the game's existing style exactly (reference images from the game are attached with each image):
- Outlines: <colour, weight in px at a given size, joins: read them from the game's sprites>.
- Fills: <flat colours only / soft shading / …>; <what is never used: gradients, textures, glow…>.
- Palette: <hex colours of the hero, the main objects, the backgrounds, the UI accent>.
- Hero: <the main character / vehicle exactly as in the game: clothes, colours, proportions>. Never a generic replacement.
- Every image must look like the game's real gameplay (screenshots attached): same scenes, same colours, same action. Nothing the game does not have; no game UI (HUD, buttons, score).
- Logo: copy the attached logo exactly (lettering, colours, outline, stroke). Never retype it.
- No text anywhere except the logo. No watermark, signature, © mark, publisher name or web address.
- Opaque background (no transparency), sRGB.
- Compose every image for its exact frame; never crop or shrink a bigger image.
- Keep it simple and readable when small: ONE main subject in a dynamic pose, at most one secondary object, a simple background of a few large shapes. No clutter, no small props, no particles everywhere, no extra characters, no borders.
- Output a PNG at exactly the requested pixel size and save it under the exact file name given.
```

Then for each image: open `art/prompts/store/<file>.md`, attach the listed images, paste its prompt, save the result as told.
~~~

### Mẫu `art/prompts/store/<id>-<w>x<h>.md`

~~~markdown
# <id>-<w>x<h>: <Use, e.g. Portal thumbnail 4:3>

- Size: **<w> x <h> px**, opaque (no transparency)
- Save as: `art/incoming/store/<id>-<w>x<h>.png`

## Attach these images

- <the logo file of the game>
- <the hero's sprites: character, vehicle>
- <the background / level the scene is set in>
- export/qa/<version>-<id>/<gameplay shots>.jpg (real gameplay of this build: the scene, the hero, the colours to match)
- art/store/<id>-1920x1080.png (the approved cover; not for the cover itself)

## Prompt

```
<Use> for "<Game name>" (shown at <w>x<h> px): <the hero doing the core action of the game> in <the setting>, <the layout of this size from the table in docs/GMSDK_JS/docs/HANDOFF.md §4>. <The safe area of this size>. It must look like the attached gameplay screenshots: the same hero, the same level / setting, the same colours, the same action; recompose and light it for this frame, but add nothing the game does not have, and no game UI (HUD, buttons, score). Match the attached cover: the same hero as in the game, the same <vehicle / main object>, the logo copied from the cover exactly, not retyped. No other text. Opaque.

Style: match the attached game art exactly: <the outline and fill rules of MASTER.md in one sentence>. Output exactly <w>x<h> pixels.
```
~~~

Riêng cỡ `200x120` và `512x512`: thay phần logo bằng *"NO logo and no text at all; ONE subject (the hero) filling 60-70% of the frame in a dynamic pose, simple background of 2-3 large shapes, bold silhouette, high contrast; must still read at 96 px"*.

Cỡ `512x512_logo`, `800x800`, `800x1200`: thêm *"Readable as a small tile: ONE subject, at most one secondary object, simple background, no clutter. The logo big (80-90% of the width) in the top or bottom third; keep the top-right corner free of anything important"*. `512x512_logo` kèm `512x512` đã duyệt: cùng cảnh, chỉ thêm logo.

## 7. Kiểm trước khi giao

Ở gốc repo game:

```bash
npm run build                                   # gói build: check-export OK, zip
node docs/GMSDK_JS/tools/check-marketing.mjs    # export/marketing/<version>-<id>/: OK
```

`check-marketing` báo **lỗi** khi:
- thiếu file của chuẩn;
- ảnh lệch kích thước so với tên, không phải JPEG / PNG thật, có trong suốt, hoặc là CMYK;
- brief thiếu mục, mục 11 thiếu **Controls** / **How to play**, hoặc bản Short dài hơn 160 ký tự;
- HTML tải gì đó từ ngoài, hoặc Image kit thiếu ảnh.

Nó **cảnh báo** khi:
- brief có từ kỹ thuật, tên engine hoặc "clone";
- có file thừa trong kit.

Phần máy không kiểm được thì người tự soát:
- [ ] Grep chữ của ba file brief với danh sách tên cấm của chủ game (IP, thương hiệu, tính năng chưa mở): 0 kết quả.
- [ ] Ba file cùng 11 mục, cùng số liệu.
- [ ] Control Guide khớp game: chơi thử theo đúng các phím / thao tác đã ghi.
- [ ] Mở bản HTML: hero hiện trọn logo, Image kit đủ thẻ, đọc được trên điện thoại.
- [ ] Xem từng ảnh ở đúng cỡ: logo đọc được (trừ 200×120), không chữ lạ, nhân vật giống trong game, bố cục đúng bảng §4.
- [ ] **Đặt cover và từng banner cạnh ảnh gameplay** (`export/qa/<version>-<id>/`): một người chưa chơi nhìn hai ảnh phải nhận ra là cùng một game. Không có nhân vật, vật, cảnh hay hiệu ứng mà game không có; không có UI của game.
