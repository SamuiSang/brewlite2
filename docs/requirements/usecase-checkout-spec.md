# TASK 1.3 – ĐẶC TẢ USE-CASE TRỌNG TÂM: ĐẶT HÀNG & THANH TOÁN (CHECKOUT SPECIFICATION)

- **Dự án:** BrewLite – Hệ thống Đặt đồ uống Trực tuyến (Mobile-first / PWA)
- **Tài liệu:** `docs/requirements/usecase-checkout-spec.md`
- **Giai đoạn:** Task 1 – Khai thác và Đặc tả Yêu cầu (Task 1.3)
- **Use Case Trọng tâm Toàn hệ thống:** **Luồng Đặt hàng & Thanh toán Đơn hàng (Checkout Flow)**
- **Phân bổ Thực hiện:** Hợp nhất giữa **Chiến** (phụ trách `UC-04: Khởi tạo Đơn hàng`) và **Quang** (phụ trách `UC-05: Thanh toán Mô phỏng & Chống Trừ tiền Trùng lặp`).
- **Phạm vi Trọng tâm của Tài liệu này:** **Đặc tả chi tiết và chuyên sâu toàn bộ Use Case `UC-05` do Quang phụ trách**, thể hiện đầy đủ các trường thông tin chuẩn mực theo yêu cầu của Đề bài Assignment 2 (Actor, Trigger, Tiền/Hậu điều kiện, Luồng chính, Luồng phụ/thay thế, Luồng ngoại lệ, Quy tắc nghiệp vụ và Hợp đồng API).
- **Tạo phẩm Sơ đồ đi kèm:**
  - [Sơ đồ Use Case Thanh toán UC-05 (.puml)](file:///c:/Users/shuut/Downloads/brewlit2/brewlite2/docs/diagrams/uc-05-payment.puml)
  - [Sơ đồ Use Case Thanh toán UC-05 (.svg)](file:///c:/Users/shuut/Downloads/brewlit2/brewlite2/docs/diagrams/uc-05-payment.svg)

---

## 1. Tổng quan Luồng Use Case Trọng tâm Đặt hàng & Thanh toán

Luồng Đặt hàng và Thanh toán là luồng nghiệp vụ xương sống, mang lại giá trị cốt lõi và kiểm nghiệm toàn bộ các thách thức kỹ thuật phức tạp nhất của đồ án môn Công nghệ Phần mềm (tính toán đơn giá độc lập tại máy chủ, khóa tồn kho đồng thời chống bán âm, cơ chế chống trừ tiền trùng lặp và tính toàn vẹn dữ liệu trong Database Transaction).

Luồng trọng tâm này được cấu thành từ 2 Use Case then chốt:

```
[Giỏ hàng Zustand] 
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ UC-04: Khởi tạo Đơn hàng & Khóa Tồn kho Đồng thời      │ ── (Chiến phụ trách)
│ • Tính lại đơn giá gốc tại Business Logic Layer        │
│ • Trừ kho sản phẩm/nguyên liệu bằng Optimistic Locking │
│ • Tạo Order trạng thái PENDING                         │
└────────────────────────────────────────────────────────┘
       │
       │ (orderId ở trạng thái PENDING)
       ▼
┌────────────────────────────────────────────────────────┐
│ UC-05: Thanh toán Mô phỏng & Chống Trừ tiền Trùng lặp  │ ── (Quang phụ trách - Trọng tâm tài liệu này)
│ • Kiểm tra khóa bất biến Idempotency-Key trong DB      │
│ • Quy trình 2 bước: PENDING -> Nhận Webhook Callback   │
│ • Cập nhật Payment SUCCESS & Order PAID                │
│ • Tự động hoàn kho Restock Rollback khi thất bại       │
└────────────────────────────────────────────────────────┘
       │
       │ (Order đã chuyển trạng thái PAID)
       ▼
[UC-06: Xuất Biên nhận Đơn hàng & Tích lũy Điểm thưởng]  ── (Sang phụ trách)
```

---

## 2. Đặc tả Chi tiết Use Case Trọng tâm: UC-05 (Phụ trách: Quang - Dev Team)

### 2.1 Thuộc tính Định danh (Identification)
- **Mã Use Case:** `UC-05`
- **Tên Use Case:** **Thanh toán Đơn hàng Mô phỏng và Chống Trừ tiền Hai lần (Idempotency)**
- **Phân hệ Trực thuộc:** Phân hệ Thanh toán & Chống Trừ tiền Trùng lặp (`PaymentsModule` - `FR-06`)
- **Mức độ Ưu tiên:** **Must Have** (Bắt buộc trong MVP Sprint 2)
- **Độ phức tạp Kỹ thuật:** Cao (Xử lý giao dịch phân tán 2 bước, Database Transaction, đối soát chữ ký số Webhook và cơ chế khóa bất biến Idempotency).

---

### 2.2 Tác nhân (Actors)

| Loại Tác nhân | Tên Tác nhân | Vai trò và Trách nhiệm đối với Use Case |
| :--- | :--- | :--- |
| **Tác nhân Chính<br>(Primary Actor)** | **Khách hàng đã đăng nhập<br>(Authenticated Customer)** | • Sở hữu đơn hàng hợp lệ đang ở trạng thái `PENDING`.<br>• Lựa chọn phương thức thanh toán phù hợp (Ví MoMo, VNPay, Thẻ ATM/Visa nội địa).<br>• Thực hiện thao tác bấm nút "Xác nhận thanh toán" tại giao diện `/checkout` và xác nhận giao dịch trên cổng thanh toán Sandbox. |
| **Tác nhân Phụ / Đối tác<br>(Secondary / External Actor)** | **Cổng thanh toán Mô phỏng<br>(Mock Payment Gateway / Sandbox Service)** | • Đóng vai trò hệ thống đối tác tài chính bên ngoài (mô phỏng cổng MoMo, VNPay, VietQR Sandbox).<br>• Khởi tạo phiên thanh toán, cung cấp URL cổng hoặc mã QR giao dịch.<br>• Tiếp nhận yêu cầu thanh toán và phản hồi bản tin Webhook Callback (`POST /api/v1/payments/webhook`) có kèm chữ ký số xác thực để Backend đối soát. |

---

### 2.3 Sự kiện Kích hoạt (Trigger)
Khách hàng sau khi hoàn tất bước Đặt hàng (tạo thành công đơn hàng `PENDING` ở màn hình Giỏ hàng) được hệ thống điều hướng tự động sang trang `/checkout`. Tại đây, khách hàng chọn một trong các phương thức thanh toán (Ví MoMo, VNPay hoặc Thẻ ngân hàng) và bấm nút **"Xác nhận thanh toán"**.

---

### 2.4 Tiền điều kiện (Pre-conditions)
Để Use Case `UC-05` có thể bắt đầu thực thi hợp lệ, hệ thống đòi hỏi bắt buộc phải thỏa mãn 3 điều kiện tiên quyết sau:
1. **Trạng thái Phiên làm việc (Session Auth):** Khách hàng đã đăng nhập thành công vào hệ thống và sở hữu chuỗi mã xác thực `accessToken` (JWT) còn hiệu lực trong header `Authorization: Bearer <token>`.
2. **Trạng thái Đơn hàng Hợp lệ:** Đơn hàng mục tiêu (`orderId`) đã được khởi tạo bởi `UC-04`, thuộc quyền sở hữu của chính người dùng đang đăng nhập, và đang ở trạng thái chính xác là `PENDING`. Số lượng tồn kho và nguyên liệu tương ứng đã được tạm khóa thành công trong CSDL.
3. **Mã khóa Bất biến Client (Idempotency-Key):** Phía giao diện Frontend (Next.js) đã chủ động sinh một chuỗi định danh duy nhất theo chuẩn UUID phiên bản 4 (ví dụ: `d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a`) gắn liền với phiên thanh toán của đơn hàng này trước khi bắn request sang Backend.

---

### 2.5 Hậu điều kiện (Post-conditions)

> [!IMPORTANT]
> **Quy định Sống còn của Bài giảng Thầy Phiêu:**
> Tuyệt đối KHÔNG tự ý gán khống trạng thái `Order = PAID` ngay khi vừa nhận request thanh toán từ Client (lỗi bị đánh giá 0 điểm kiến trúc). Hệ thống bắt buộc phải trải qua quy trình xác thực 2 bước nghiêm ngặt.

Hệ thống cam kết đạt được các trạng thái sau khi Use Case kết thúc:
1. **Trường hợp Thanh toán Thành công (Success Completion):**
   - Bản ghi `Payment` trong PostgreSQL được chuyển sang trạng thái `SUCCESS`, lưu vết mã giao dịch đối soát của cổng thanh toán (`transactionRef`) và thời điểm hoàn tất (`paidAt`).
   - Bản ghi `Order` tương ứng được chuyển sang trạng thái `PAID` và cập nhật `updatedAt`.
   - Giỏ hàng phía Client được dọn sạch (`clearCart` trong Zustand Store).
   - Hệ thống điều hướng khách hàng sang trang Biên nhận đơn hàng thành công (`/checkout/success`).
2. **Trường hợp Thanh toán Thất bại (Failure & Restock Rollback):**
   - Bản ghi `Payment` được đánh dấu `FAILED`, lưu vết lý do lỗi (`failureReason`).
   - Bản ghi `Order` được chuyển sang trạng thái `CANCELLED`.
   - **Kích hoạt Cơ chế Hoàn trả Tồn kho Tức thì (Restock Rollback):** Toàn bộ số lượng tồn kho sản phẩm (`Product.stock`) và nguyên liệu thô pha chế (`Ingredient.stockQuantity` theo định mức `RecipeItem`) được cộng hoàn trả lại 100% nguyên vẹn trong cùng một Database Transaction.
   - Giao diện hiển thị thông báo lỗi chi tiết và hướng dẫn khách hàng chọn phương thức thanh toán khác hoặc thử lại.
3. **Trường hợp Gửi trùng Lặp (Idempotency Protection):**
   - Nếu nhận request có cùng `Idempotency-Key` trong vòng 24 giờ, hệ thống trả về ngay kết quả giao dịch đã có trong CSDL (HTTP 200 OK) mà không khởi tạo thêm giao dịch mới và không trừ tiền lần 2.

---

### 2.6 Luồng Sự kiện Chính (Main Flow)

| Bước | Thực thể Thực hiện | Hành động Chi tiết |
| :-: | :--- | :--- |
| **1** | Khách hàng (Client) | Tại trang `/checkout`, khách hàng chọn phương thức thanh toán mong muốn (Ví MoMo, VNPay hoặc Thẻ ngân hàng nội địa) và bấm nút **"Xác nhận thanh toán"**. |
| **2** | Next.js UI (Frontend) | Giao diện tự động sinh một mã `Idempotency-Key` (chuẩn UUID v4), đóng gói payload DTO `{ orderId: string, paymentMethod: string }` và gửi HTTP request `POST /api/v1/payments` kèm theo: <br>• Header `Authorization: Bearer <accessToken>`<br>• Header `Idempotency-Key: <UUIDv4>`. |
| **3** | NestJS Controller | `PaymentsController` tiếp nhận request. `JwtAuthGuard` giải mã xác thực token người dùng, `ValidationPipe` thẩm định cấu trúc dữ liệu đầu vào theo `ProcessPaymentDto`, đồng thời kiểm tra sự hiện diện của Header `Idempotency-Key`. |
| **4** | PaymentsService (Core) | `PaymentsService` thực thi câu lệnh SQL truy vấn trong CSDL PostgreSQL:<br>`SELECT * FROM "Payment" WHERE "idempotencyKey" = $1`. |
| **5** | PaymentsService (Core) | Hệ thống xác định đây là một giao dịch thanh toán hoàn toàn mới (mã khóa `idempotencyKey` chưa từng tồn tại trong CSDL). |
| **6** | PaymentsService (Core) | Hệ thống truy vấn thông tin đơn hàng theo `orderId`, xác thực đơn hàng thuộc quyền sở hữu của khách hàng đang đăng nhập và xác nhận đơn hàng đang ở đúng trạng thái `PENDING`. |
| **7** | PaymentsService & DB | Hệ thống tạo một bản ghi `Payment` mới trong bảng `Payment` với trạng thái ban đầu là `PENDING`, lưu trữ `orderId`, `idempotencyKey`, `amount` (lấy từ `Order.finalAmount`), `paymentMethod` và thời điểm tạo `createdAt`. |
| **8** | PaymentsService & Gateway | `PaymentsService` gọi sang Dịch vụ Thanh toán Mô phỏng (`MockPaymentGateway.charge(...)`) gửi thông tin đơn hàng và số tiền để khởi tạo phiên giao dịch bên thứ ba; Mock Gateway trả về đường dẫn thanh toán (`paymentUrl`) hoặc mã QR Sandbox. |
| **9** | Mock Gateway & Webhook | Khách hàng thực hiện thao tác quét mã/xác nhận trên giao diện Sandbox. Sau khi xử lý hoàn tất, Cổng thanh toán bên thứ ba gửi bản tin đối soát Webhook Callback `POST /api/v1/payments/webhook` về máy chủ Backend kèm `orderId`, `transactionRef`, trạng thái `SUCCESS` và chữ ký số xác thực. |
| **10** | PaymentsService & DB | `PaymentsService` tiếp nhận Webhook, xác thực tính toàn vẹn của chữ ký số đối soát và mở một PostgreSQL Transaction (`prisma.$transaction()`):<br>1. Cập nhật bản ghi `Payment`: `status = SUCCESS`, `transactionRef = txRef`, `paidAt = now()`.<br>2. Cập nhật bản ghi `Order`: `status = PAID`, `updatedAt = now()`.<br>3. Commit Transaction thành công vào CSDL. |
| **11** | Backend & Next.js UI | Backend phản hồi mã trạng thái `HTTP 201 Created` kèm `PaymentSuccessDto`. Giao diện Frontend dọn sạch giỏ hàng trong Zustand Store và tự động điều hướng khách hàng sang trang Biên nhận đơn hàng thành công (`/checkout/success`). |

---

### 2.7 Các Luồng Sự kiện Thay thế (Alternative Flows)

#### Luồng Thay thế 3a: Xử lý Sự cố Rớt mạng hoặc Khách bấm Đúp nút Thanh toán (Idempotency Cache Hit)
- **Hoàn cảnh xảy ra:** Khách hàng sử dụng mạng 4G/WiFi chập chờn hoặc mất kiên nhẫn bấm liên tiếp 2 lần vào nút "Thanh toán", khiến giao diện gửi lên máy chủ 2 request có cùng Header `Idempotency-Key` trong khoảng thời gian rất ngắn.
- **Quy trình xử lý của Hệ thống:**
  1. Ở request thứ nhất: Hệ thống tiếp nhận và đang tiến hành xử lý bình thường theo Luồng chính.
  2. Ở request thứ hai: Tại Bước 4, `PaymentsService` truy vấn CSDL và phát hiện `idempotencyKey` này **đã tồn tại** trong bảng `Payment`.
  3. Hệ thống lập tức bỏ qua toàn bộ các Bước 6, 7, 8 (tuyệt đối KHÔNG gọi lại cổng thanh toán `MockPaymentGateway`, KHÔNG sinh thêm giao dịch mới và KHÔNG trừ tiền lần 2).
  4. Hệ thống trích xuất bản ghi `Payment` đã được tạo trước đó từ CSDL và lập tức hoàn trả kết quả về cho Client với mã trạng thái `HTTP 200 OK` (thay vì 201 Created).
  5. Giao diện người dùng nhận được phản hồi, tiếp tục quy trình hiển thị bình thường mà không gây ra bất kỳ xung đột tài chính nào.

#### Luồng Thay thế 4a: Khách hàng Thay đổi Phương thức Thanh toán trước khi Xác nhận
- **Hoàn cảnh xảy ra:** Khách hàng ban đầu chọn Ví MoMo nhưng sau đó đổi ý muốn thanh toán qua Thẻ ATM nội địa trước khi thực hiện giao dịch.
- **Quy trình xử lý:** Khách hàng chọn lại phương thức thanh toán trên giao diện. Frontend Next.js tự động hủy phiên hiện tại, sinh ra một mã `Idempotency-Key` hoàn toàn mới tương ứng với phương thức mới và gửi yêu cầu thanh toán lại từ đầu.

---

### 2.8 Các Luồng Ngoại lệ (Exception Flows)

#### Luồng Ngoại lệ 5a: Thanh toán Thất bại từ Cổng Thanh toán (Kích hoạt Restock Rollback)
- **Hoàn cảnh xảy ra:** Khách hàng mô phỏng kịch bản thanh toán thất bại (chọn thẻ không đủ số dư, thẻ hết hạn, nhập sai mã xác thực OTP) hoặc Cổng thanh toán Sandbox phản hồi giao dịch bị từ chối (`{ success: false, errorCode: "INSUFFICIENT_FUNDS" }`).
- **Quy trình xử lý Hoàn kho Nguyên tử (Restock Rollback):**
  1. Tại Bước 9, bản tin Webhook từ Cổng thanh toán gửi về thông báo giao dịch thất bại.
  2. `PaymentsService` lập tức mở một PostgreSQL Database Transaction (`prisma.$transaction()`) để thực thi chuỗi hành động hoàn kho:
     - **Cập nhật Payment:** `UPDATE "Payment" SET "status" = 'FAILED', "failureReason" = $errorCode WHERE "id" = $paymentId;`
     - **Cập nhật Order:** `UPDATE "Order" SET "status" = 'CANCELLED' WHERE "id" = $orderId;`
     - **Hoàn trả Tồn kho Sản phẩm:** Duyệt qua toàn bộ danh sách `OrderItem` của đơn hàng và cộng trả lại số lượng:
       ```sql
       UPDATE "Product"
       SET "stock" = "stock" + $itemQty
       WHERE "id" = $itemProductId;
       ```
     - **Hoàn trả Tồn kho Nguyên liệu Thô:** Dựa vào công thức pha chế (`RecipeItem`), cộng hoàn trả lại số lượng nguyên liệu thô (`Ingredient`):
       ```sql
       UPDATE "Ingredient"
       SET "stockQuantity" = "stockQuantity" + $requiredQty
       WHERE "id" = $ingredientId;
       ```
     - **Commit Transaction:** Toàn bộ trạng thái cập nhật và khôi phục tồn kho được ghi nhận nguyên tử và vĩnh viễn vào CSDL.
  3. Backend trả về mã trạng thái lỗi `HTTP 402 Payment Required` (hoặc `HTTP 400 Bad Request`) kèm thông điệp chi tiết: *"Giao dịch thanh toán không thành công. Đơn hàng đã được tự động hủy và toàn bộ số lượng tồn kho đã được hoàn trả nguyên vẹn."*
  4. Giao diện Next.js hiển thị thông báo lỗi rõ ràng, cung cấp nút "Chọn phương thức khác" và nút "Thử lại".

#### Luồng Ngoại lệ 2a: Request Thiếu Header Idempotency-Key hoặc Định dạng UUID Không Hợp lệ
- **Hoàn cảnh xảy ra:** Client gửi request gọi API `POST /api/v1/payments` nhưng quên đính kèm Header `Idempotency-Key`, hoặc giá trị truyền vào không tuân thủ định dạng chuẩn UUID v4.
- **Quy trình xử lý:** Bộ lọc `ValidationPipe` và Guard tại tầng Controller phát hiện lỗi vi phạm, lập tức chặn đứng request và trả về mã phản hồi `HTTP 400 Bad Request` kèm thông báo lỗi:
  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Header 'Idempotency-Key' is required and must be a valid UUID v4."
  }
  ```
  Không có bất kỳ thao tác đọc/ghi CSDL hay trừ tiền nào diễn ra.

#### Luồng Ngoại lệ 6a: Đơn hàng Không Tồn tại hoặc Không ở Trạng thái PENDING
- **Hoàn cảnh xảy ra:** Request gửi kèm `orderId` không tìm thấy trong hệ thống, hoặc đơn hàng đó đã ở trạng thái `PAID` (đã thanh toán rồi), hoặc đã ở trạng thái `CANCELLED` (đã bị hủy).
- **Quy trình xử lý:** Tại Bước 6, `PaymentsService` kiểm tra trạng thái đơn hàng. Nếu `Order.status !== 'PENDING'`, hệ thống lập tức từ chối và phản hồi mã lỗi `HTTP 409 Conflict`:
  ```json
  {
    "statusCode": 409,
    "error": "Conflict",
    "message": "Đơn hàng không ở trạng thái hợp lệ để thanh toán (trạng thái hiện tại: PAID/CANCELLED)."
  }
  ```

#### Luồng Ngoại lệ 9a: Bản tin Webhook Callback Không Hợp lệ (Sai Chữ ký Đối soát)
- **Hoàn cảnh xảy ra:** Kẻ xấu thực hiện tấn công giả mạo bắn request callback vào endpoint `POST /api/v1/payments/webhook` nhằm mục đích biến đổi trạng thái đơn hàng thành `PAID` mà không thông qua thanh toán thực.
- **Quy trình xử lý:** Tại Bước 10, Backend thực hiện tính toán lại mã băm HMAC-SHA256 của payload kết hợp với Shared Secret Key. Nếu chữ ký không trùng khớp, hệ thống lập tức từ chối, ghi log cảnh báo an ninh và trả về mã lỗi `HTTP 403 Forbidden`. Tuyệt đối không thay đổi trạng thái của CSDL.

---

### 2.9 Bảng Tổng hợp Quy tắc Nghiệp vụ (Business Rules - BR)

| Mã Quy tắc | Tên Quy tắc Nghiệp vụ | Nội dung Chi tiết & Ràng buộc Kỹ thuật |
| :---: | :--- | :--- |
| **`BR-PAY-01`** | **Tính Bất biến & Duy nhất của Idempotency-Key** | Mã `Idempotency-Key` bắt buộc phải là một chuỗi UUID v4 chuẩn. Cột `idempotencyKey` trong bảng `Payment` được đánh chỉ mục duy nhất (`UNIQUE INDEX`). Trong khung thời gian 24 giờ kể từ thời điểm tạo, mọi request có cùng key đều trả về nguyên trạng kết quả giao dịch trước đó, không được phép trừ tiền lần 2. |
| **`BR-PAY-02`** | **Quy tắc 2 Bước (Cấm Gán PAID Khống)** | Nghiêm cấm tuyệt đối việc gán trạng thái `Order = PAID` ngay tại thời điểm nhận request thanh toán từ Client. Việc chuyển trạng thái sang `PAID` bắt buộc phải trải qua 2 bước độc lập: (1) Khởi tạo bản ghi `Payment` trạng thái `PENDING`; (2) Chỉ cập nhật sang `PAID` khi nhận được bản tin Webhook Callback hợp lệ có đối soát chữ ký số từ Cổng thanh toán Sandbox. |
| **`BR-PAY-03`** | **Hoàn kho Nguyên tử (Atomic Restock Rollback)** | Khi một giao dịch thanh toán bị xác định thất bại hoặc hủy bỏ, việc cập nhật `Payment = FAILED`, `Order = CANCELLED` và việc cộng trả lại số lượng tồn kho sản phẩm (`Product.stock`) và nguyên liệu thô (`Ingredient.stockQuantity`) bắt buộc phải được đóng gói trong **cùng 1 Database Transaction duy nhất**. Nếu transaction gặp sự cố, hệ thống phải rollback toàn bộ. |
| **`BR-PAY-04`** | **Bảo toàn Đơn giá phía Máy chủ** | Số tiền thanh toán (`Payment.amount`) bắt buộc phải được lấy trực tiếp từ trường `Order.finalAmount` đã được tính toán độc lập tại tầng Business Logic Layer (`OrdersService`), tuyệt đối không chấp nhận bất kỳ số tiền nào do Client tự ý gửi lên trong payload. |
| **`BR-PAY-05`** | **Thời hạn Hết hạn Thanh toán (Payment Timeout)** | Một phiên thanh toán có thời hạn hiệu lực tối đa là **15 phút**. Nếu sau 15 phút không nhận được bản tin Webhook Callback xác thực từ cổng thanh toán, đơn hàng sẽ tự động hết hạn, chuyển sang trạng thái `CANCELLED` và kích hoạt luồng hoàn trả tồn kho tự động. |

---

### 2.10 Đặc tả Hợp đồng Giao diện API (API Contracts / DTO Specifications)

#### Endpoint 1: Khởi tạo Giao dịch Thanh toán
- **Phương thức:** `POST`
- **Đường dẫn:** `/api/v1/payments`
- **Xác thực:** Bắt buộc có Header `Authorization: Bearer <accessToken>`
- **Header Chống Trùng lặp:** Bắt buộc có Header `Idempotency-Key: <UUIDv4>`
- **Request Body (ProcessPaymentDto):**
  ```json
  {
    "orderId": "c3a9f7d2-4e6b-4c8a-9a1d-2b3e4f5a6b7c",
    "paymentMethod": "MOMO" // Hoặc "VNPAY", "CREDIT_CARD"
  }
  ```
- **Response Thành công – Tạo mới (HTTP 201 Created):**
  ```json
  {
    "statusCode": 201,
    "success": true,
    "data": {
      "paymentId": "p1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "orderId": "c3a9f7d2-4e6b-4c8a-9a1d-2b3e4f5a6b7c",
      "idempotencyKey": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
      "amount": 75000,
      "method": "MOMO",
      "status": "PENDING",
      "paymentUrl": "https://sandbox.brewlite.vn/pay/momo?token=mock_token_123",
      "createdAt": "2026-10-31T12:00:00.000Z"
    }
  }
  ```
- **Response Thành công – Gửi trùng Idempotency-Key (HTTP 200 OK):**
  ```json
  {
    "statusCode": 200,
    "success": true,
    "message": "Idempotent request recognized. Returning existing payment record.",
    "data": {
      "paymentId": "p1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "orderId": "c3a9f7d2-4e6b-4c8a-9a1d-2b3e4f5a6b7c",
      "idempotencyKey": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
      "amount": 75000,
      "method": "MOMO",
      "status": "SUCCESS",
      "transactionRef": "MOCK-MOMO-987654",
      "paidAt": "2026-10-31T12:00:15.000Z"
    }
  }
  ```

#### Endpoint 2: Tiếp nhận Webhook Callback từ Cổng Thanh toán
- **Phương thức:** `POST`
- **Đường dẫn:** `/api/v1/payments/webhook`
- **Bảo mật:** Bắt buộc Header `x-signature: <hmac_sha256_signature>`
- **Request Body (WebhookCallbackDto):**
  ```json
  {
    "orderId": "c3a9f7d2-4e6b-4c8a-9a1d-2b3e4f5a6b7c",
    "transactionRef": "MOCK-MOMO-987654",
    "status": "SUCCESS", // Hoặc "FAILED"
    "amount": 75000,
    "timestamp": 1793450000
  }
  ```
- **Response Thành công (HTTP 200 OK):**
  ```json
  {
    "statusCode": 200,
    "success": true,
    "message": "Webhook processed successfully. Order updated to PAID."
  }
  ```

---

## 3. Sơ đồ Use Case Phân hệ Thanh toán (UC-05 Sơ đồ Chi tiết)

Toàn bộ luồng tương tác và quan hệ nghiệp vụ giữa Khách hàng, Cổng thanh toán Sandbox và các use case thành phần của `FR-06` được thể hiện đồng bộ trong sơ đồ dưới đây (chuẩn đen - trắng phục vụ in ấn theo mẫu hướng dẫn):

![Sơ đồ Use Case Thanh toán UC-05](file:///c:/Users/shuut/Downloads/brewlit2/brewlite2/docs/diagrams/uc-05-payment.svg)

> - **Mã nguồn PlantUML:** [`docs/diagrams/uc-05-payment.puml`](file:///c:/Users/shuut/Downloads/brewlit2/brewlite2/docs/diagrams/uc-05-payment.puml)
> - **Ảnh Vector SVG:** [`docs/diagrams/uc-05-payment.svg`](file:///c:/Users/shuut/Downloads/brewlit2/brewlite2/docs/diagrams/uc-05-payment.svg)

