# Sprint 2 Retrospective & Technical Defense Review (BrewLite 2)

- **Dự án:** BrewLite – Hệ thống đặt món trực tuyến & Tích điểm thành viên (Requirements to Deployment)
- **Giai đoạn:** Sprint 2 (Tasks 4 & 5 – Hoàn thiện toàn bộ 6 phân hệ chức năng, E2E/Unit Testing, CI/CD & Production Readiness)
- **Người tổng hợp:** Phan Tấn Sang (Scrum Master / DevOps & Module 6 Owner)
- **Ngày tổng kết:** 15/11/2026

---

## 1. Tổng kết những điểm làm tốt (What Went Well)

1. **Kiến trúc Modular Monolith 3 tầng & Đồng bộ tài liệu–mã nguồn 100%:**
   - Backend NestJS tách bạch 6 domain (`Auth`, `Products`, `Promotions`, `Orders`, `Payments`, `Loyalty`) qua Prisma ORM trên PostgreSQL với mô hình Optimistic Locking (`version`) và Idempotency Key (`UUID v4`).
   - Toàn bộ các luồng nghiệp vụ bám sát SRS (`docs/requirements/srs-summary.md`), Traceability Matrix (`docs/traceability-matrix.md`), sơ đồ UML (`docs/diagrams/*06*`), và giao diện chuẩn trên Figma `BrewLite-2`.
2. **Bảo mật & Toàn vẹn dữ liệu thực chiến:**
   - `Server-side Pricing`: Không tin bất kỳ đơn giá nào từ client; mọi tính toán giá cỡ, topping, voucher, điểm quy đổi được xác thực hoàn toàn trong PostgreSQL transaction.
   - `Anti-IDOR 403`: Khách hàng chỉ được xem và thao tác hủy đơn hàng thuộc `userId` của chính mình; thao tác chuyển pha chế `PAID -> PREPARING -> COMPLETED` khóa chặt chỉ cho `STAFF` / `ADMIN`.
   - `Payment Sandbox Webhook`: Tách 2 bước thanh toán VNPay Sandbox HMAC-SHA512 + IPN đối soát ngầm; tuyệt đối không tự động đánh dấu `PAID` ở bước bấm nút.
3. **Độ phủ kiểm thử tự động & CI Gate:**
   - Bộ test unit/integration Backend (`@brewlite/api`) và Frontend (`@brewlite/web`) được chạy bắt buộc qua `.github/workflows/ci.yml` trước khi build Docker image.

---

## 2. Khó khăn gặp phải & Cách khắc phục (What Didn't Go Well & Action Items)

| Vấn đề phát sinh trong Sprint 2 | Nguyên nhân gốc rễ | Giải pháp đã áp dụng |
|---|---|---|
| Tồn kho bị "treo" khi khách mở cổng thanh toán rồi bỏ ngang không quay lại | Đơn hàng giữ ở `PENDING` mà chưa có cơ chế TTL tự động hoàn nguyên liệu | Bổ sung `expiresAt` TTL + `expireOverdueOrders()` tự động chuyển `CANCELLED`, ghi `OrderStatusLog` và trả kho theo `RecipeItem` |
| Nguy cơ cộng trùng điểm Hạt thưởng khi VNPay IPN retry nhiều lần | Webhook gateway có thể gửi IPN lặp lại | Kiểm tra Idempotent theo `(orderId, type = EARN)` trước khi cộng `user.loyaltyPoints` |
| Xung đột đồng bộ gói thư viện monorepo (`lucide-react`, `@prisma/client`) giữa các máy Dev | Thiếu đồng bộ `npm ci` và `prisma generate` sau pull | Chuẩn hóa script kiểm tra trong CI/CD (`npm ci` + `prisma:generate` trước `lint/test/build`) |

---

## 3. Hồ sơ Bảo vệ Kỹ thuật (Technical Defense Q&A — Theo tiêu chí giảng viên)

### 3.1. Xử lý 4 Kịch bản Ngoại lệ Hủy đơn & Giải phóng Tồn kho

Hệ thống triển khai thống nhất trong `OrdersService.cancelOrder()` và `OrdersService.expireOverdueOrders()` qua cùng 1 transaction hoàn kho `restockOrderResources()`:

1. **Kịch bản 1 – Khách tự hủy đơn Online chưa thanh toán (`ONLINE_CUSTOMER_CANCEL`):**
   - Điều kiện: Chính chủ đơn hàng (`Anti-IDOR 403`), trạng thái bắt buộc là `PENDING`.
   - Hành động: Chuyển `Order -> CANCELLED`, cộng trả nguyên liệu theo công thức `RecipeItem`, giảm `Promotion.usedCount` nếu có voucher, hoàn Hạt đã tiêu (`LoyaltyTransaction.REFUND`), ghi `OrderStatusLog`.
2. **Kịch bản 2 – Hết hạn TTL phiên thanh toán QR/VNPay (`PAYMENT_TIMEOUT_TTL`):**
   - Điều kiện: Đơn `PENDING` có `expiresAt < now`.
   - Hành động: `expireOverdueOrders()` cập nhật nguyên tử `where: { id, status: PENDING }` -> `CANCELLED`, đánh dấu `Payment.FAILED`, nhả toàn bộ nguyên liệu giữ chỗ về kho và ghi `changedBy = 'SYSTEM_TTL_CRON'`.
3. **Kịch bản 3 – Khách hủy trực tiếp tại quầy Offline (`OFFLINE_COUNTER_CANCEL`):**
   - Điều kiện: Yêu cầu role `STAFF` hoặc `ADMIN` (chặn `CUSTOMER` với `403 Forbidden`).
   - Hành động: Hủy đơn từ `PENDING`/`PAID`/`PREPARING`, trả nguyên liệu về kho, đánh dấu `Payment.REFUNDED` nếu đã thu tiền trước đó.
4. **Kịch bản 4 – Hết nguyên liệu bất khả kháng sau khi đã `PAID` (`OUT_OF_STOCK_REFUND`):**
   - Điều kiện: `STAFF`/`ADMIN` xác nhận không thể pha chế món dù đơn đã thanh toán.
   - Hành động: Chuyển `Order -> CANCELLED`, cập nhật `Payment.status = REFUNDED`, giải phóng nguyên liệu các món còn lại trong đơn, hoàn trả điểm Hạt đã dùng và hiển thị UI tiến trình hoàn tiền 3 bước (`Frame 06e`).

### 3.2. Tránh giao dịch đồng thời gây âm kho & âm điểm (Concurrency Safety)
- **Nguyên liệu (`Ingredient`):** Sử dụng `updateMany` kèm điều kiện kép `where: { id, version, stockQuantity: { gte: required } }` để phát hiện race condition tức thời (ném `409 ConflictException`).
- **Điểm thưởng (`User.loyaltyPoints`):** Áp dụng `updateMany({ where: { id, loyaltyPoints: { gte: pointsCost } }, data: { loyaltyPoints: { decrement: pointsCost } } })` trong `$transaction`, ngăn triệt để âm điểm khi double-click.

### 3.3. Quy trình CD & Tự động Rollback (`ADR-006`)
- `.github/workflows/cd.yml` chia 3 stage: **Quality Gate** -> **GHCR Multi-stage Build (`brewlite-api`, `brewlite-web`)** -> **Deploy Production & Smoke Test**.
- Bước Smoke Test gọi `GET /api/v1/health` tối đa 6 lần (mỗi 5s, kiểm tra `SELECT 1` trên PostgreSQL). Nếu quá 30s không nhận HTTP 200, job tự động kích hoạt bước **Automated Rollback** về image SHA ổn định gần nhất.
