# Lệnh cho AI: marketing kit

Dựng marketing kit cho game trong repo này, đúng chuẩn `docs/GMSDK_JS/docs/HANDOFF.md` §3–§7. Tên game và `<id>` lấy từ `docs/GMSDK_JS/config.json`. Kit dành cho team marketing (store page, social, video script, trang game trên các cổng), không phải tài liệu kỹ thuật.

- Kit đặt ở chỗ khác `docs/GMSDK_JS/` thì dùng `docs/HANDOFF.md` và `config.json` nằm **cùng thư mục với file này**.
- Làm trên nhánh hiện tại, commit từng bước, không push.
- Người dùng gõ thêm lời nhắn kèm file này (ví dụ "chỉ viết prompt ảnh", "chỉ cập nhật brief") thì làm theo lời nhắn đó trước.

## Bước 1. Khảo sát dữ liệu thật, không bịa

Đọc code và data của game, rút ra các fact nhìn từ phía người chơi:
- Level / bản đồ / campaign: tên hiển thị (lấy từ `i18n/`), độ khó, điều kiện mở, phần thưởng.
- Chế độ chơi, nhân vật / phương tiện, cách điều khiển bằng bàn phím và cảm ứng.
- Cơ chế trong màn: vật phẩm, địa hình, hệ số điểm, power-up.
- Progression: giá, phần thưởng, tuỳ biến, quà ngày, nhiệm vụ, lý do quay lại.
- Thời lượng một lượt, nền tảng, hướng màn hình.
- Art có sẵn: logo, nhân vật, nền, màu, nét vẽ. Ảnh store / portal nào đã có (`art/store/`, `marketing/<id>/`), và cỡ nào còn thiếu so với bảng HANDOFF.md §4.

## Bước 2. Hỏi chủ game trước khi viết (bắt buộc)

1. Tính năng nào **đã mở** cho người chơi, tính năng nào có trong code nhưng **chờ update**? Code có đủ không có nghĩa là đã ship.
2. Tên game gốc, IP, thương hiệu thật (xe, hãng, nhân vật…) nào **cấm nhắc** trong nội dung public?
3. Tên public chính xác của game (đúng như trên logo)?

Chờ trả lời rồi mới viết.

## Bước 3. Ảnh

1. **Ảnh còn thiếu:** viết `art/prompts/MASTER.md` và một `art/prompts/store/<id>-<w>x<h>.md` cho mỗi cỡ thiếu, theo mẫu HANDOFF.md §6.
   - Màu, nét, nhân vật, logo lấy từ **art thật** của game. Mỗi file ghi rõ những ảnh của game cần đính kèm.
   - Cover `1920x1080` đi trước, mọi cỡ khác đính kèm cover đã duyệt.
   - Dừng ở đây và báo chủ game: chạy prompt trong Codex, duyệt, chép ảnh vào `art/store/`.
2. **Ảnh đã có:** xuất vào `marketing/<id>/images/` (PNG, bản chính) và `images/jpg/` (JPG), đúng tên, đúng pixel, nền đặc.
   - Repo đã có script dựng kit (ví dụ `npm run marketing`) thì dùng nó.
   - Chưa có thì viết một script để lần sau chạy lại được, không làm tay. Script đọc `art/store/`, xuất JPG và PNG, sinh hero và Image kit của HTML; có thể dùng `sharp` làm devDependency.

## Bước 4. Ba file brief

Viết `marketing/<id>/<id>-content-brief.md` (tiếng Việt), `.en.md` và `.en.html` (tiếng Anh), đúng 10 mục, dạng mục 10, và luật nội dung của HANDOFF.md §5. Bản HTML tự chứa, có hero và Image kit; ảnh nào chưa có thì hiện ô Pending.

## Bước 5. Kiểm và báo cáo

- `node docs/GMSDK_JS/tools/check-marketing.mjs` phải báo `OK`. Đọc cả các cảnh báo.
- Grep chữ của ba file với danh sách tên cấm ở Bước 2, cộng các tính năng chưa mở: phải ra 0 kết quả.
- Mở bản HTML trong trình duyệt, chụp màn hình phần hero và Image kit để soát.
- Báo cáo:
  - đường dẫn kit;
  - ảnh đã có, ảnh còn thiếu kèm đường dẫn file prompt Codex của từng ảnh;
  - kết quả `check-marketing` và kết quả grep.
