# TASK 1.2 – YÊU CẦU CHỨC NĂNG VÀ PHI CHỨC NĂNG (SRS RÚT GỌN)

- **Dự án:** BrewLite – Hệ thống Đặt đồ uống Trực tuyến (Mobile-first / PWA)
- **Tài liệu:** `docs/requirements/srs-summary.md`
- **Giai đoạn:** Task 1 – Khai thác và Đặc tả Yêu cầu (Task 1.2)
- **Thành viên thực hiện phần việc:**
  - **Quang (Dev Team):**
    1. Đặc tả chi tiết Yêu cầu Chức năng **`FR-06: Thanh toán mô phỏng (Mock Payment) & Chống trừ tiền trùng lặp (Idempotency-Key)`** kèm Tiêu chí chấp nhận (`AC-06.1` đến `AC-06.4`).
    2. Tổng hợp toàn diện Danh mục Yêu cầu Phi Chức năng **`NFR-01` đến `NFR-05`** cho toàn bộ hệ thống BrewLite theo đúng phân công Assignment 2.
    3. Thiết kế Sơ đồ Use Case phân hệ: `docs/diagrams/uc-05-payment.puml` (kèm kết xuất vector chuẩn `.svg` và `.png`).
- **Liên kết tài liệu liên quan:**
  - [Bối cảnh và Phạm vi Hệ thống (Task 1.1)](file:///c:/Users/shuut/Downloads/brewlit2/brewlite2/docs/requirements/context-and-scope.md)
  - [Đặc tả Use Case Trọng tâm Đặt hàng & Thanh toán (Task 1.3)](file:///c:/Users/shuut/Downloads/brewlit2/brewlite2/docs/requirements/usecase-checkout-spec.md)
  - [Sơ đồ Use Case Thanh toán UC-05 (PUML)](file:///c:/Users/shuut/Downloads/brewlit2/brewlite2/docs/diagrams/uc-05-payment.puml)
  - [Sơ đồ Use Case Thanh toán UC-05 (SVG)](file:///c:/Users/shuut/Downloads/brewlit2/brewlite2/docs/diagrams/uc-05-payment.svg)

---

## 1. Tổng quan Danh mục 6 Module Chức năng Hệ thống BrewLite

Theo quy chuẩn phân công 6 thành viên trong đồ án (mỗi người phụ trách trọn gói 1 Module Chức năng theo chiều dọc - *Vertical Slice* từ Khai thác yêu cầu -> Sơ đồ -> Kiến trúc -> Code FE & BE -> Kiểm thử), toàn bộ yêu cầu chức năng của hệ thống BrewLite được phân chia như sau:

| STT | Mã FR | Tên Module Chức năng | Thành viên phụ trách | Mức ưu tiên (MoSCoW) | Phạm vi Sprint |
| :-: | :---: | :--- | :---: | :---: | :---: |
| 1 | `FR-01`<br>`FR-02` | Hiển thị Thực đơn (Menu), Tìm kiếm theo tên & Lọc theo Danh mục sản phẩm | Duy | **Must Have** | Sprint 1 (MVP) |
| 2 | `FR-03`<br>`FR-09` | Tùy biến Món (Size/Toppings), Giỏ hàng (`Zustand Store`) & Khuyến mãi (`Promotion`) | Quỳnh | **Must Have** | Sprint 2 |
| 3 | `FR-04` | Đăng ký, Đăng nhập, Xác thực Phân quyền `JWT` & Giám sát Hệ thống (`GET /health`) | Hiếu (PO) | **Must Have** | Sprint 2 (Auth)<br>Sprint 1 (Health) |
| 4 | `FR-05` | Khởi tạo Đơn hàng, Tính tiền tại Business Layer & Khóa Tồn kho Đồng thời (`Optimistic Lock`) | Chiến | **Must Have** | Sprint 2 |
| **5** | **`FR-06`** | **Thanh toán Mô phỏng (`Mock Payment`) & Chống Trừ tiền Trùng lặp (`Idempotency-Key`)** | **Quang** | **Must Have** | **Sprint 2** |
| 6 | `FR-07`<br>`FR-08`<br>`FR-10` | Biên nhận Đơn hàng, Lịch sử Đơn (`/orders/my-orders`), Theo dõi Trạng thái & Tích lũy Điểm thưởng (`LoyaltyTransaction`) | Sang (SM) | **Must Have** | Sprint 2 |

> [!NOTE]
> *Quy ước mức độ ưu tiên theo khung MoSCoW:*
> - **Must Have (Bắt buộc):** Các chức năng cốt lõi bắt buộc phải có để hệ thống vận hành trọn vẹn luồng từ Đặt hàng đến Thanh toán và Xuất biên nhận trong phạm vi nghiệm thu Assignment 2.
> - **Should Have (Nên có):** Các tính năng nâng cao trải nghiệm (ví dụ: gợi ý món bán chạy, thanh toán qua Apple Pay).
> - **Could Have (Có thể có):** Đổi điểm thưởng trực tiếp thành quà tặng vật phẩm tại quầy.
> - **Won't Have (Chưa thực hiện):** Tích hợp máy in hóa đơn nhiệt phần cứng tại quầy vật lý, thanh toán tiền mặt qua POS quầy.

---

## 2. Đặc tả Chi tiết Yêu cầu Chức năng FR-06 (Phụ trách: Quang - Dev Team)

### 2.1 Thông tin Định danh & Mục tiêu Nghiệp vụ
- **Mã chức năng:** `FR-06`
- **Tên chức năng:** Thanh toán Mô phỏng (Mock Payment) & Chống Trừ tiền Trùng lặp (Idempotency-Key)
- **Phân hệ:** Phân hệ Thanh toán & Chống Trừ tiền Trùng lặp (`PaymentsModule`)
- **Người phụ trách:** **Quang (Dev Team)**
- **Mức độ ưu tiên:** **Must Have** (Chốt chặn tài chính cốt lõi của hệ thống)
- **Actor tham gia:**
  - *Actor chính (Primary Actor):* Khách hàng đã đăng nhập (`Authenticated Customer`).
  - *Actor phụ / Hệ thống ngoài (Secondary Actor / External Service):* Dịch vụ Thanh toán Mô phỏng (`Mock Payment Gateway` – Sandbox VNPay / MoMo / Thẻ ngân hàng nội địa).

### 2.2 Mô tả Chi tiết Chức năng (Functional Description)
Chức năng `FR-06` chịu trách nhiệm xử lý toàn bộ các giao dịch thanh toán trực tuyến mô phỏng cho những đơn hàng đã được khởi tạo thành công ở trạng thái `PENDING` (do phân hệ `FR-05` chuyển giao).

Chức năng giải quyết triệt để 3 bài toán kỹ thuật trọng tâm:
1. **Chống trừ tiền trùng lặp (Idempotency):** Triệt tiêu rủi ro khách hàng bị trừ tiền 2 lần khi mạng di động 4G chập chờn hoặc do khách hàng mất kiên nhẫn bấm liên tiếp nhiều lần vào nút "Thanh toán". Mọi request gửi lên bắt buộc mang theo Header `Idempotency-Key: <UUIDv4>`. Nếu gửi lặp key trong vòng 24 giờ, hệ thống lập tức hoàn trả kết quả giao dịch trước đó mà không gọi sang cổng thanh toán lần 2.
2. **Tuân thủ quy trình 2 bước nghiêm ngặt (Chống tự ý gán `PAID` một chiều):** Tuyệt đối tuân thủ nguyên tắc thiết kế được Thầy Phiêu nhấn mạnh trong bài giảng: *Khi khách hàng bấm thanh toán, Backend tuyệt đối KHÔNG tự ý gán ngay trạng thái `Order = PAID`*. Hệ thống bắt buộc phải qua 2 giai đoạn:
   - Giai đoạn 1: Tạo bản ghi thanh toán ở trạng thái `PENDING` và gọi cổng thanh toán Sandbox để lấy đường dẫn/mã QR.
   - Giai đoạn 2: Chỉ khi nhận được bản tin đối soát Webhook Callback (`POST /api/v1/payments/webhook`) có chữ ký hợp lệ từ cổng thanh toán, hệ thống mới mở Database Transaction để chuyển `Payment.status = SUCCESS` và `Order.status = PAID`.
3. **Hoàn trả tồn kho nguyên tử (Restock Rollback khi giao dịch lỗi):** Nếu cổng thanh toán phản hồi giao dịch thất bại (lỗi thẻ, không đủ số dư, timeout hoặc người dùng chủ động bấm Hủy), hệ thống tự động ghi nhận `Payment.status = FAILED`, chuyển `Order.status = CANCELLED`, đồng thời thực thi hoàn trả 100% số lượng tồn kho sản phẩm và nguyên liệu thô vào CSDL PostgreSQL trong cùng một Transaction duy nhất.

### 2.3 Phân rã Các Use Case Thành phần thuộc FR-06
- **`UC-05.1` (Thực hiện thanh toán đơn hàng):** Khách hàng chọn phương thức thanh toán (MoMo, VNPay, Thẻ ATM) và bấm xác nhận tại `/checkout`. Gửi request `POST /api/v1/payments` kèm Header `Idempotency-Key`.
- **`UC-05.2` (Kiểm tra khóa chống trùng lặp - Idempotency-Key Check):** Quan hệ `<<include>>` bắt buộc từ `UC-05.1`. Hệ thống truy vấn CSDL kiểm tra xem mã khóa đã được sử dụng hay chưa trước khi tiến hành trừ tiền.
- **`UC-05.3` (Hoàn trả tồn kho - Restock Rollback):** Quan hệ `<<extend>>` từ `UC-05.1`. Được kích hoạt tự động khi cổng thanh toán phản hồi thất bại hoặc hết hạn giao dịch, nhằm hoàn trả lại số lượng tồn kho nguyên vẹn cho hệ thống.

---

### 2.4 Tiêu chí Chấp nhận Chi tiết (Acceptance Criteria - AC) cho FR-06

Các tiêu chí nghiệm thu được chuẩn hóa theo định dạng **Given - When - Then** làm căn cứ viết kịch bản Integration Test (`test/orders-payments.integration-spec.ts`):

#### Tiêu chí AC-06.1: Cơ chế Chống Trừ tiền Trùng lặp (Idempotency Guarantee)
- **Given:** Khách hàng đã có một đơn hàng ở trạng thái `PENDING` với số tiền thanh toán xác thực `finalAmount = 75,000 VND`.
- **When:** Client gửi request thanh toán `POST /api/v1/payments` kèm Header `Idempotency-Key: e8a7d320-1b5f-4a89-b762-c1289df3821a`. Do sự cố gián đoạn mạng hoặc người dùng bấm đúp liên tục, Client gửi request thứ 2 có nội dung và `Idempotency-Key` hoàn toàn trùng khớp với request thứ nhất.
- **Then:**
  1. Ở request thứ nhất: Hệ thống tiếp nhận, tạo bản ghi thanh toán mới trong CSDL và phản hồi phiên thanh toán.
  2. Ở request thứ hai: `PaymentsService` phát hiện `idempotencyKey` đã tồn tại trong CSDL.
  3. Hệ thống KHÔNG gọi lại cổng thanh toán `MockPaymentGateway`.
  4. Hệ thống KHÔNG tạo thêm bản ghi `Payment` mới (chỉ duy nhất 1 bản ghi tồn tại trong bảng `Payment`).
  5. Hệ thống lập tức trả về mã trạng thái `HTTP 200 OK` chứa nguyên vẹn dữ liệu của phiên thanh toán trước đó, không gây trừ tiền lần 2.

#### Tiêu chí AC-06.2: Quy trình Thanh toán 2 Bước & Xác thực Webhook Callback
- **Given:** Khách hàng thực hiện thanh toán cho đơn hàng `#ORD-2026-001` đang ở trạng thái `PENDING`.
- **When:** Khách hàng bấm nút "Xác nhận thanh toán" tại giao diện `/checkout`.
- **Then:**
  1. Hệ thống Backend tạo bản ghi `Payment` với trạng thái ban đầu là `PENDING`.
  2. Trạng thái của đơn hàng `Order.status` vẫn được giữ nguyên là `PENDING` (tuyệt đối không được gán `PAID` khống).
  3. Cổng thanh toán Sandbox phản hồi kết quả người dùng đã chuyển khoản thành công bằng cách gửi bản tin Webhook Callback `POST /api/v1/payments/webhook` kèm `orderId`, `transactionRef` và chữ ký số hợp lệ.
  4. Backend xác thực chữ ký Webhook thành công và mở một `prisma.$transaction()`:
     - Cập nhật bản ghi `Payment`: `status = SUCCESS`, `transactionRef = "MOCK-TX-987654"`, `paidAt = DateTime.now()`.
     - Cập nhật bản ghi `Order`: `status = PAID`.
  5. Trả về mã phản hồi `HTTP 200 OK` cho Webhook và điều hướng Client sang trang `/checkout/success`.

#### Tiêu chí AC-06.3: Hoàn trả Tồn kho Tự động (Atomic Restock Rollback) khi Thanh toán Thất bại
- **Given:** Đơn hàng `#ORD-2026-002` gồm 2 ly Cà phê sữa đá size M đã tạm khóa số lượng tồn kho (giảm 2 ly trong `Product.stock` và giảm 20g cà phê trong `Ingredient.stockQuantity`).
- **When:** Khách hàng mô phỏng kịch bản thanh toán thất bại (thẻ không đủ số dư, nhập sai mã OTP, thẻ hết hạn) hoặc Cổng thanh toán trả về mã lỗi `{ success: false, errorCode: "PAYMENT_FAILED" }`.
- **Then:**
  1. Trong cùng một Database Transaction duy nhất, hệ thống thực thi:
     - Cập nhật bản ghi `Payment`: `status = FAILED`, ghi nhận `failureReason`.
     - Chuyển trạng thái đơn hàng: `Order.status = CANCELLED`.
     - Thực hiện hoàn kho (`Restock Rollback`): Tăng lại tồn kho sản phẩm `Product.stock = Product.stock + 2` và tăng lại tồn kho nguyên liệu `Ingredient.stockQuantity = Ingredient.stockQuantity + 20`.
  2. Backend trả về mã lỗi `HTTP 402 Payment Required` (hoặc `400 Bad Request`) kèm thông báo rõ ràng cho người dùng.
  3. Kiểm tra CSDL xác nhận số lượng tồn kho của sản phẩm và nguyên liệu không bị thất thoát hoặc bị âm.

#### Tiêu chí AC-06.4: Ràng buộc Toàn vẹn Header và An toàn Giao dịch
- **Given:** Client gửi request gọi API `POST /api/v1/payments`.
- **When:** Request thiếu Header `Idempotency-Key`, hoặc giá trị Header không đúng chuẩn định dạng UUID v4, hoặc đơn hàng chỉ định đã ở trạng thái `PAID` / `CANCELLED`.
- **Then:** Hệ thống từ chối thực hiện giao dịch, trả về tương ứng mã lỗi `HTTP 400 Bad Request` hoặc `HTTP 409 Conflict`, không tạo ra bất kỳ bản ghi rác nào trong bảng `Payment`.

---

## 3. Danh mục Yêu cầu Phi Chức năng (NFR-01 đến NFR-05) (Do Quang tổng hợp toàn hệ thống)

Theo phân công của nhóm trong Đề bài Assignment 2 (Bảng I & Bảng III), **Quang** chịu trách nhiệm thiết lập và tổng hợp toàn bộ danh mục **Yêu cầu Phi Chức năng (Non-Functional Requirements - NFR)** từ `NFR-01` đến `NFR-05` cho toàn bộ hệ thống BrewLite, đảm bảo tính vững chắc từ kiến trúc đến triển khai thực tế.

```
+----------------------------------------------------------------------------------------------------+
|                         DANH MỤC YÊU CẦU PHI CHỨC NĂNG HỆ THỐNG BREWLITE                           |
+--------------------+-------------------------------------------------------------------------------+
| Mã Yêu cầu         | Trọng tâm Kỹ thuật                                                            |
+--------------------+-------------------------------------------------------------------------------+
| NFR-01             | Hiệu năng & Thời gian đáp ứng (Performance, Latency & Concurrency)            |
| NFR-02             | Độ tin cậy, Tính toàn vẹn dữ liệu & Tính bất biến (Reliability & Idempotency) |
| NFR-03             | An toàn, Bảo mật & Xác thực phân quyền (Security & Anti-Tampering)            |
| NFR-04             | Khả năng bảo trì, Kiến trúc phân tầng & Module hóa (Maintainability)           |
| NFR-05             | Khả năng sử dụng & Trải nghiệm người dùng di động (Usability & Mobile PWA)   |
+--------------------+-------------------------------------------------------------------------------+
```

---

### 3.1 NFR-01: Hiệu năng và Thời gian Đáp ứng (Performance, Latency & Concurrency)

- **Mục tiêu:** Đảm bảo hệ thống phản hồi cực nhanh trên thiết bị di động, chịu được lưu lượng truy cập đột biến vào các khung giờ cao điểm (8h00 - 9h30 sáng và 12h00 - 13h30 trưa).
- **Chỉ số Định lượng (SLI/SLO):**
  1. **Thời gian đáp ứng tác vụ đọc (Read Latency):** Thời gian phản hồi cho các yêu cầu lấy danh mục menu (`GET /api/v1/products`), tìm kiếm đồ uống, xem chi tiết món và tra cứu lịch sử đơn hàng phải đạt:
     $$\text{Response Time } (P_{95}) \le 200\text{ ms}$$
  2. **Thời gian đáp ứng tác vụ ghi và xử lý giao dịch (Write & Transaction Latency):** Thời gian xử lý các tác vụ phức tạp có can thiệp Database Transaction (khởi tạo đơn hàng, khóa tồn kho Optimistic Lock, kiểm tra Idempotency-Key và khởi tạo thanh toán) phải đạt:
     $$\text{Response Time } (P_{95}) \le 500\text{ ms}$$
  3. **Khả năng xử lý tải đồng thời (Concurrency Capacity):** Hệ thống trên môi trường máy chủ tiêu chuẩn (1 vCPU, 2GB RAM Docker Container) phải đáp ứng ổn định tối thiểu **100 concurrent requests/giây** với tỷ lệ phát sinh lỗi HTTP 5xx:
     $$\text{Error Rate } \le 0.1\%$$
  4. **Tối ưu hóa tải trang Frontend (Next.js PWA):**
     - Kích thước tải mã nguồn ban đầu (First Load JS bundle): $\le 150\text{ KB}$ gzipped.
     - Thời gian hiển thị nội dung đầu tiên (First Contentful Paint - FCP): $\le 1.2\text{ giây}$.
     - Điểm đánh giá hiệu năng Google Lighthouse Performance trên thiết bị di động: $\ge 90/100$.

---

### 3.2 NFR-02: Độ tin cậy, Tính toàn vẹn dữ liệu và Tính bất biến (Reliability, ACID & Idempotency)

- **Mục tiêu:** Bảo vệ dữ liệu tài chính và kho hàng nguyên vẹn 100%, không để xảy ra sai lệch số dư, âm kho hay trừ tiền lặp lại.
- **Quy chuẩn Kỹ thuật:**
  1. **Tuân thủ chuẩn ACID trong mọi giao dịch nhạy cảm:** Mọi luồng thay đổi trạng thái tồn kho và thanh toán bắt buộc phải được bọc trong PostgreSQL Transaction (`prisma.$transaction()`). Nếu bất kỳ một bước nào trong chuỗi xử lý gặp sự cố (ví dụ: trừ kho nguyên liệu thất bại hoặc ghi nhận payment lỗi), toàn bộ transaction phải được tự động **Rollback 100%**, không lưu lại dữ liệu rác.
  2. **Tính bất biến của giao dịch thanh toán (Idempotency Guarantee):**
     - Bảng `Payment` trong PostgreSQL bắt buộc đánh chỉ mục duy nhất (`UNIQUE INDEX`) trên cột `idempotencyKey`.
     - Cơ chế chốt chặn mức Database đảm bảo mọi nỗ lực ghi trùng lặp một mã `Idempotency-Key` đều bị chặn đứng, bảo vệ khách hàng không bao giờ bị trừ tiền 2 lần cho cùng một đơn hàng.
     - Thời gian duy trì hiệu lực của khóa (Idempotency Key Time-to-Live): Tối thiểu **24 giờ**.
  3. **Chống bán âm kho tuyệt đối (`stock < 0`):** Áp dụng giải pháp Khóa lạc quan (**Optimistic Locking**) thông qua trường `version` trên bảng `Product` và `Ingredient`. Câu lệnh SQL cập nhật trừ kho bắt buộc có điều kiện ràng buộc:
     ```sql
     UPDATE "Product"
     SET "stock" = "stock" - $qty, "version" = "version" + 1
     WHERE "id" = $productId AND "version" = $currentVersion AND "stock" >= $qty;
     ```
     Nếu 2 khách hàng cùng bấm mua ly cuối cùng tại cùng một tích tắc, câu lệnh của khách hàng thứ 2 trả về `affectedRows = 0`, hệ thống rollback ngay lập tức và báo hết hàng, triệt tiêu hoàn toàn rủi ro bán vượt kho.
  4. **Độ sẵn sàng hệ thống (System Availability):** Hệ thống đạt mức độ sẵn sàng tối thiểu **99.9% uptime** trong suốt thời gian hoạt động bán hàng của chuỗi.

---

### 3.3 NFR-03: An toàn, Bảo mật và Chống Gian lận (Security, Authentication & Anti-Tampering)

- **Mục tiêu:** Bảo vệ tài khoản người dùng, ngăn chặn các hành vi tấn công giả mạo đơn giá, can thiệp payload từ client và bảo vệ các kênh webhook đối soát.
- **Quy chuẩn Kỹ thuật:**
  1. **Xác thực và Phân quyền dựa trên JWT:**
     - Sử dụng JSON Web Token (chuẩn RFC 7519) ký bằng thuật toán HMAC-SHA256 với khóa bí mật an toàn (`JWT_SECRET`).
     - Thời hạn sống của AccessToken là **24 giờ**. Token mang payload chuẩn gồm `{ sub: user.id, email: user.email, role: user.role }`.
     - Mọi request đến các API cần bảo vệ (`/orders`, `/payments`, `/loyalty`) bắt buộc truyền qua HTTP Header chuẩn: `Authorization: Bearer <accessToken>`.
  2. **Mã hóa Mật khẩu một chiều bằng Bcrypt:**
     - Mật khẩu của người dùng bắt buộc phải được băm một chiều bằng thư viện `bcrypt` với hệ số muối:
       $$\text{saltRounds} \ge 10$$
     - Quá trình băm mật khẩu được thực thi tại tầng `AuthService` trước khi lưu vào CSDL PostgreSQL. Tuyệt đối không bao giờ lưu trữ, in ra console log hay truyền tải mật khẩu dưới dạng văn bản rõ (plain text).
  3. **Ngăn chặn triệt để Gian lận Đơn giá từ Client (Client-side Price Tampering):**
     - Tuân thủ nghiêm ngặt chỉ đạo của Giảng viên: **Tầng Client (Next.js) tuyệt đối không được phép quyết định giá tiền đơn hàng**.
     - Request tạo đơn hàng gửi lên từ trình duyệt chỉ chứa danh sách mã món (`productId`), số lượng (`quantity`), các tùy biến được chọn (`size`, `toppings`) và mã giảm giá (`promoCode`).
     - Tầng **Business Logic Layer (`OrdersService`)** trên máy chủ độc lập chịu trách nhiệm truy vấn đơn giá gốc từ bảng `Product`, tính toán lại toàn bộ thành tiền, áp dụng công thức chiết khấu và chốt tổng tiền thanh toán cuối cùng (`finalAmount`). Mọi can thiệp sửa đổi giá ở payload client đều vô hiệu.
  4. **Bảo mật Endpoint Webhook Callback từ Cổng thanh toán:**
     - Endpoint `POST /api/v1/payments/webhook` được bảo vệ bằng cơ chế xác thực chữ ký số HMAC (Signature Verification) dựa trên Shared Secret Key giữa Backend và Cổng thanh toán mô phỏng.
     - Kiểm tra mã giao dịch (`transactionRef`) và trạng thái đối soát trước khi cập nhật CSDL để chống các cuộc tấn công Replay Attack.
  5. **Chính sách CORS và Tiêu chuẩn An toàn Trình duyệt:**
     - Cấu hình CORS (Cross-Origin Resource Sharing) nghiêm ngặt tại Backend NestJS, chỉ cho phép tên miền hợp lệ của Frontend truy cập.
     - Thiết lập các HTTP Security Headers thông qua thư viện `helmet` (chống Clickjacking, XSS, MIME sniffing).

---

### 3.4 NFR-04: Khả năng Bảo trì, Kiến trúc Phân tầng & Module hóa (Maintainability & Layered Architecture)

- **Mục tiêu:** Đảm bảo mã nguồn dễ đọc, dễ kiểm thử tự động, dễ bảo trì và phân công công việc độc lập giữa 6 thành viên mà không gây xung đột mã nguồn.
- **Quy chuẩn Kỹ thuật:**
  1. **Tuân thủ Kiến trúc 3 tầng (3-Tier Layered Architecture):**
     - **Presentation Layer (Tầng Trình diễn):** Gồm giao diện người dùng Next.js (`apps/web`) và các API Controllers trong NestJS (`apps/api`). Chỉ làm nhiệm vụ điều phối request/response, validation cấu trúc DTO đầu vào, tuyệt đối không chứa logic nghiệp vụ tính toán hay truy vấn SQL trực tiếp.
     - **Business Logic Layer (Tầng Nghiệp vụ):** Nằm trọn vẹn trong các NestJS Services độc lập (`orders.service.ts`, `payments.service.ts`, `auth.service.ts`). Chứa toàn bộ các quy tắc nghiệp vụ, tính toán tiền, kiểm tra điều kiện khuyến mãi, cơ chế kiểm tra Idempotency và điều phối transaction.
     - **Data Access Layer - DAL (Tầng Truy cập Dữ liệu):** Được trừu tượng hóa qua Prisma ORM và CSDL PostgreSQL, quản lý các câu lệnh schema, migration, chỉ mục và transaction.
  2. **Cấu trúc Monorepo & Modular Monolith:**
     - Dự án tổ chức theo mô hình Monorepo rõ ràng: `apps/web` (Frontend), `apps/api` (Backend), `docs/` (Tài liệu & Sơ đồ), `tests/` (Kiểm thử).
     - Backend chia thành 6 module nghiệp vụ độc lập tương ứng với 6 thành viên: `AuthModule`, `ProductsModule`, `OrdersModule`, `PaymentsModule`, `PromotionsModule`, `LoyaltyModule`. Các module tương tác qua Service Interface được định nghĩa chặt chẽ.
  3. **Độ bao phủ Kiểm thử (Test Automation Coverage):**
     - Cam kết độ bao phủ kiểm thử tối thiểu **70%** đối với các hàm tính toán nghiệp vụ tại tầng Business Logic Layer.
     - Bắt buộc có đầy đủ 3 cấp độ kiểm thử: Unit Test (Jest), Integration Test luồng Đặt hàng – Thanh toán – Khóa đồng thời, và End-to-End Test (Playwright).

---

### 3.5 NFR-05: Khả năng Sử dụng và Trải nghiệm Người dùng Di động (Usability & PWA Mobile-first)

- **Mục tiêu:** Cung cấp trải nghiệm đặt đồ uống mượt mà, tiện lợi như một ứng dụng di động bản địa (Native Mobile App) ngay trên trình duyệt web.
- **Quy chuẩn Kỹ thuật:**
  1. **Thiết kế Mobile-first chuẩn mực:**
     - Toàn bộ giao diện người dùng được thiết kế ưu tiên hiển thị tối ưu trên màn hình điện thoại di động thông minh (chiều rộng màn hình từ 360px đến 430px), đồng thời co giãn mượt mà (*responsive*) trên máy tính bảng và desktop.
     - Kích thước vùng bấm cảm ứng (Touch Target Size) cho các nút hành động chính (Chọn size, Thêm vào giỏ, Thanh toán):
       $$\text{Touch Target Size } \ge 44 \times 44\text{ px}$$
       theo tiêu chuẩn Apple Human Interface Guidelines và Google Material Design.
  2. **Hỗ trợ Tính năng Ứng dụng Web Cấp tiến (Progressive Web App - PWA):**
     - Cung cấp tệp `manifest.json` đầy đủ thông tin tên ứng dụng, icon chuẩn đa kích thước, theme color thương hiệu BrewLite.
     - Hỗ trợ người dùng thêm ứng dụng vào màn hình chính điện thoại (*Add to Home Screen*) không cần thông qua App Store / Google Play.
     - Tích hợp Service Worker hỗ trợ lưu trữ bộ nhớ đệm (Cache Storage) cho danh mục menu và hình ảnh đồ uống, cho phép người dùng xem thực đơn ngay cả khi kết nối mạng tạm thời bị mất.
  3. **Hiện thực Trọn vẹn 3 Trạng thái Giao diện Chuẩn mực (UI States):**
     - **Trạng thái Đang tải (Loading State):** Hiển thị khung xương giao diện (Skeleton Screens) đồng dạng với card sản phẩm thật, tạo cảm giác hệ thống phản hồi tức thì thay vì để màn hình trắng hoặc con quay tải trang vô nghĩa.
     - **Trạng thái Dữ liệu trống (Empty State):** Khi giỏ hàng rỗng hoặc không tìm thấy đồ uống phù hợp với từ khóa, giao diện hiển thị hình minh họa trực quan kèm nút bấm kêu gọi hành động (Call To Action - *"Khám phá Menu ngay"*).
     - **Trạng thái Thông báo Lỗi (Error State):** Khi gặp sự cố mạng hoặc lỗi thanh toán, giao diện hiển thị thông báo lỗi rõ ràng bằng tiếng Việt kèm nút "Thử lại" (Retry) tiện lợi.

---

## 4. Sơ đồ Use Case Phân hệ Thanh toán (UC-05 Diagram)

Dưới đây là sơ đồ Use Case chi tiết của **Phân hệ Thanh toán & Chống Trừ tiền Trùng lặp (FR-06)** do Quang thiết kế, tuân thủ nghiêm ngặt chuẩn đen - trắng phục vụ in ấn báo cáo kỹ thuật và bài giảng của Giảng viên:

![UC-05 Diagram](file:///c:/Users/shuut/Downloads/brewlit2/brewlite2/docs/diagrams/uc-05-payment.svg)

> *Tệp mã nguồn PlantUML:* [`docs/diagrams/uc-05-payment.puml`](file:///c:/Users/shuut/Downloads/brewlit2/brewlite2/docs/diagrams/uc-05-payment.puml)  
> *Ảnh kết xuất Vector SVG:* [`docs/diagrams/uc-05-payment.svg`](file:///c:/Users/shuut/Downloads/brewlit2/brewlite2/docs/diagrams/uc-05-payment.svg)  
> *Ảnh kết xuất PNG:* [`docs/diagrams/uc-05-payment.png`](file:///c:/Users/shuut/Downloads/brewlit2/brewlite2/docs/diagrams/uc-05-payment.png)

### 4.1 Giải thích Các Thành phần trong Sơ đồ
1. **Ranh giới Phân hệ (System Boundary):** Khung chữ nhật bao quanh mang tên `BrewLite - Phân hệ Thanh toán & Chống Trừ tiền Trùng lặp (FR-06)`, bao bọc các tính năng nghiệp vụ của phân hệ.
2. **Tác nhân chính (Primary Actor):** `Khách hàng đã đăng nhập (Authenticated Customer)` tương tác trực tiếp với tính năng thanh toán đơn hàng (`UC-05.1`) và tính năng hủy đơn hoàn kho (`UC-05.3`).
3. **Tác nhân phụ bên ngoài (Secondary / External Actor):** `Cổng thanh toán Mô phỏng (Mock Payment Gateway)` tương tác trực tiếp với tính năng `Xác thực giao dịch qua Cổng thanh toán` để ủy quyền và đối soát giao dịch.
4. **Quan hệ `<<include>>` (Bắt buộc thực thi):**
   - `UC-05.1: Thanh toán đơn hàng qua Ví / Thẻ` bắt buộc phải `<<include>>` tính năng `UC-05.2: Kiểm tra chống trừ tiền trùng lặp (Idempotency-Key Check)` để đảm bảo tính bất biến.
   - `UC-05.1: Thanh toán đơn hàng qua Ví / Thẻ` bắt buộc phải `<<include>>` tính năng `Xác thực giao dịch qua Cổng thanh toán` để thực thi quy trình thanh toán mô phỏng 2 bước.
5. **Quan hệ `<<extend>>` (Kích hoạt khi có điều kiện phát sinh):**
   - `UC-05.3: Hủy đơn & Hoàn trả tồn kho (Restock Rollback)` mở rộng (`<<extend>>`) từ `UC-05.1` khi giao dịch thanh toán thất bại hoặc người dùng chủ động hủy thanh toán.
6. **Bố cục Luồng Mũi tên (Zero Intersection):** Các đường tương tác giữa tác nhân và use case, cùng các mũi tên `<<include>>` và `<<extend>>` được thiết kế song song, phân tầng rõ ràng, tuyệt đối không chằn chéo hay đè lên nhau, đảm bảo tính thẩm mỹ và dễ đọc khi in ấn báo cáo.

