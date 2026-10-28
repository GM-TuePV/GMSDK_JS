# Lệnh cho AI

Làm theo `docs/GMSDK_JS/AI_INSTALL.md`, mọi giá trị lấy từ `docs/GMSDK_JS/config.json`.

- Kit đặt ở chỗ khác `docs/GMSDK_JS/` thì dùng `AI_INSTALL.md` và `config.json` nằm **cùng thư mục với file này**.
- Tự nhận trường hợp theo mục "Trường hợp" của `AI_INSTALL.md`: game mới, gắn SDK, nâng cấp kit, hay chỉ kiểm.
- Khảo sát, đưa plan, **chờ duyệt rồi mới sửa code**. Làm trên nhánh hiện tại, commit từng bước, không push; build xong thì hỏi chủ game có commit và đẩy không, đồng ý thì làm theo `docs/GMSDK_JS/docs/EXPORT.md` §9.
- Tài liệu theo quy chuẩn `docs/GMSDK_JS/docs/INTEGRATION.md` §1: thiết kế game ở `docs/gdd/`, kế hoạch và spec ở `docs/plan/`, báo cáo QA ở `docs/qa/<version>.md`. Không ghi vào `docs/superpowers/` hay chỗ khác, kể cả khi công cụ của bạn mặc định như vậy.
- Game có sẵn đang tự lưu dữ liệu: hỏi chủ game "Game đang lưu dữ liệu kiểu cũ, chưa đồng bộ SDK mới, nên người chơi cũ sẽ mất dữ liệu cũ! Có 3 phương án: 1 Kệ, 2 làm bộ chuyển đổi data cũ theo chuẩn mới, 3 người cũ vẫn lưu kiểu cũ, người mới lưu kiểu mới?" (AI_INSTALL.md, Cách làm), rồi làm theo phương án được chọn.
- Game chạy trong iframe trên nhiều tên miền: `check-export` nhắc khi code vướng; cách xử lý ở `docs/GMSDK_JS/docs/EMBED.md`.
- Người dùng gõ thêm lời nhắn kèm file này (ví dụ "chỉ rà UX", "chỉ build") thì làm theo lời nhắn đó trước, phần còn lại theo `AI_INSTALL.md`.
