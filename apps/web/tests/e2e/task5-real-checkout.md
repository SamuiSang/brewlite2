# Task 5 — Kiểm thử đặt đơn thật

Trạng thái: BLOCKED. Không coi giỏ dùng Menu fallback hoặc checkout mô phỏng là E2E thành công.

## Điều kiện trước khi chạy

- Products API chuẩn /api/v1/products hoạt động; món, RecipeItem và Ingredient có dữ liệu thật đã được cho phép dùng.
- Có API topping thật trả ID, tên, giá, trạng thái; schema hiện chưa có model Topping.
- Chiến xác nhận giá size/topping trùng preview: S +0, M +6000, L +10000; hiện Orders dùng quy tắc khác.
- Hiếu cung cấp Auth và danh tính xác thực cho kiểm tra đơn đầu tiên; không gửi userId tùy ý để vượt điều kiện WELCOME10.
- Orders route được nối đúng với frontend. Không đổi module Orders trong phạm vi Quỳnh.
- Người dùng xác nhận món, tài khoản và tác động trừ kho/tăng lượt voucher trước khi tạo đơn thật. Không seed/reset/xóa hoặc dùng dữ liệu giả.

## Kịch bản

1. Mở Menu bằng Playwright profile cô lập, viewport 1440x900. Xác nhận response Products thật, không fallback.
2. Chọn món còn hàng: size S giá gốc; M cộng 6000; L cộng 10000. Chọn topping thật, đối chiếu tên/giá/trạng thái.
3. Thêm cùng cấu hình hai lần: gộp dòng. Đổi thứ tự topping: vẫn gộp. Khác đường/đá hoặc size: tách dòng.
4. Tăng số lượng tổng cùng sản phẩm đến kho: nút + khóa. Tổng toàn giỏ không quá 100. Nhập vượt ngưỡng: báo lỗi, giữ số cũ. Giảm 1 về 0: yêu cầu xác nhận.
5. Sửa tùy chọn ngay trong giỏ: modal giữ giá trị hiện có, cập nhật/gộp đúng dòng. F5: giữ món, cấu hình, số lượng.
6. Sau khi làm mới sản phẩm: món ngừng bán hoặc thiếu kho phải được cảnh báo/chặn trước tạo đơn; không coi lỗi mạng là món đã bị xóa.
7. Áp voucher thật đủ điều kiện: đối chiếu tiền giảm từ API và usedCount không đổi. Bỏ áp dụng từ đúng thẻ mã: giảm về 0.
8. Áp lại mã, sửa giỏ: mã bị gỡ kèm lý do. Đổi hình thức nhận hàng không giữ voucher không còn phù hợp.
9. Mã hết hạn/hết lượt/thiếu tối thiểu/không tồn tại: HTTP 400 rõ lý do. Không chỉnh DB để dựng ca lỗi nếu chưa được phép; dùng unit test cho ca chưa có dữ liệu thật.
10. WELCOME10: khách đã xác thực chưa có đơn phù hợp được dùng; khách đã có đơn bị từ chối. Chạy sau khi thống nhất định nghĩa đơn đầu tiên với Hiếu/Chiến.
11. Sau khi có chấp thuận tạo đơn: gửi Orders thật, nhận ID đơn từ DB. Đối chiếu items, subtotalAmount, discountAmount, finalAmount với preview; kiểm tra kho và lượt voucher thay đổi đúng một lần.
12. Lưu bằng chứng HTTP status, ID đơn và kết quả đối chiếu không chứa secrets. Không công bố dữ liệu khách hàng.

## Bằng chứng hiện tại

- Unit test toàn repo: backend 32 + frontend 35 = 67 đạt, giữ 62 test cũ.
- Frontend lint đạt.
- Playwright giỏ hiện có: nhập 25 khi kho snapshot 25, nút + disabled; trả số lượng về 3 sau kiểm tra. Chỉ chứng minh UI, không chứng minh kho DB.
- Kiểm tra HTTP localhost:3001 ngày 2026-11-13: Products và Promotions đều fetch failed. Không tạo đơn, không thay đổi DB.
- Typecheck còn TS2709 trong .next/types: ResolvingMetadata và ResolvingViewport. Chưa xác nhận production build.
