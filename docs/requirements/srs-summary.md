# TASK 1.2 – YÊU CẦU CHỨC NĂNG VÀ PHI CHỨC NĂNG (SRS RÚT GỌN)

- **Học phần:** Công nghệ Phần mềm (SWE 2026–2027)
- **Đề tài:** BrewLite – Requirements to Deployment (Ver 1.0)
- **Tài liệu:** `docs/requirements/srs-summary.md`
- **Giai đoạn:** Task 1.2 – Yêu cầu chức năng (FR), Yêu cầu phi chức năng (NFR), MoSCoW, Tiêu chí chấp nhận (AC) & Sơ đồ Use-case tổng quát
- **Thành viên thực hiện phần việc:** **6. Sang (Scrum Master – SM)**
- **Phân hệ phụ trách:** **Chức năng 6 (`FR-07`, `FR-08`, `FR-10`): Xem Biên nhận Điện tử, Tra cứu Lịch sử Đơn hàng, Quản lý Tiến trình Trạng thái Đơn (`OrderStatusStepper`) & Tích lũy / Đổi Điểm thưởng (`LoyaltyTransaction`)** + **Sơ đồ Use Case Tổng quát Toàn hệ thống (`system-usecase.puml / .svg`)**
- **Liên kết tài liệu truy vết:**
  - [Bối cảnh, Stakeholder và Phạm vi (Task 1.1)](./context-and-scope.md)
  - [Đặc tả Use Case Chi tiết (Task 1.3)](./usecase-checkout-spec.md)
  - [Sơ đồ Use Case Tổng quát Toàn hệ thống (PUML)](../diagrams/system-usecase.puml) | [Ảnh Vector SVG](../diagrams/system-usecase.svg)
  - [Sơ đồ Use Case Phân hệ Chức năng 6 (PUML)](../diagrams/uc-06-history-loyalty.puml) | [Ảnh Vector SVG](../diagrams/uc-06-history-loyalty.svg)

---

## 1. Bản đồ Phân bổ 6 Module Chức năng Toàn hệ thống BrewLite

Hệ thống BrewLite được thiết kế theo mô hình **Vertical Slice** cho 6 thành viên, bao phủ trọn vẹn toàn bộ luồng nghiệp vụ End-to-End từ lúc khách hàng xem thực đơn cho đến khi hoàn tất thanh toán, nhận biên nhận và tích điểm thành viên:

| Module | Mã FR | Tên Phân hệ Chức năng | Thành viên phụ trách | Mức ưu tiên (MoSCoW) | Phạm vi Sprint |
| :---: | :---: | :--- | :---: | :---: | :---: |
| **1** | `FR-01`, `FR-02` | Hiển thị Thực đơn (Menu), Tìm kiếm theo từ khóa, Lọc theo Danh mục & Hiển thị Tồn kho Khả dụng theo Nguyên liệu (`Ingredient` / `RecipeItem`) | **1. Duy** | **Must** | Sprint 1 (MVP) |
| **2** | `FR-03`, `FR-09` | Tùy biến Đồ uống (`Size`/`Topping`/Đường/Đá), Quản lý Giỏ hàng (`Zustand` + `localStorage`) & Thẩm định Mã Khuyến mãi (`Promotion`) | **2. Quỳnh** | **Must** | Sprint 2 |
| **3** | `FR-04` | Đăng ký, Đăng nhập, Quản lý Hồ sơ, Xác thực Phân quyền `JWT` (`Bcrypt`) & Giám sát Sức khỏe Hệ thống (`GET /api/v1/health`) | **3. Hiếu (PO)** | **Must** | Sprint 1 (Health) / Sprint 2 (Auth) |
| **4** | `FR-05` | Khởi tạo Đơn hàng (`POST /api/v1/orders`), Tính lại 100% Giá tại Business Layer & Khóa Tồn kho Nguyên liệu Đồng thời (`Optimistic Lock`) | **4. Chiến** | **Must** | Sprint 2 |
| **5** | `FR-06`, `NFR-01..05` | Thanh toán Sandbox/Webhook 2 bước (`POST /api/v1/payments` & `/webhook`), Chống Trừ tiền Trùng lặp (`Idempotency-Key`) & Hoàn kho Tự động | **5. Quang** | **Must** | Sprint 2 |
| **6** | **`FR-07`, `FR-08`, `FR-10`** | **Biên nhận Điện tử, Lịch sử Đơn hàng (`/orders/my-orders`), Theo dõi & Cập nhật Trạng thái Đơn (`OrderStatusStepper`) & Điểm thưởng (`LoyaltyTransaction`)** | **6. Sang (SM)** | **Must** | **Sprint 2** |

---

## 2. Sơ đồ Use Case Tổng quát Toàn hệ thống (`system-usecase`)

Đáp ứng yêu cầu mục 5 của **Task 1.2** trong đề bài Assignment 2 (*"Sơ đồ use-case tổng quát của toàn hệ thống"*), sơ đồ dưới đây tổng hợp đầy đủ 4 tác nhân chính/phụ và 6 cụm Use Case cốt lõi (`UC-01` đến `UC-06`) theo chuẩn đơn sắc đen-trắng phục vụ in ấn báo cáo kỹ thuật LaTeX:

![Sơ đồ Use Case Tổng quát Toàn hệ thống BrewLite](../diagrams/system-usecase.svg)

- **Tệp nguồn PlantUML:** [`docs/diagrams/system-usecase.puml`](../diagrams/system-usecase.puml)
- **Tệp ảnh kết xuất SVG:** [`docs/diagrams/system-usecase.svg`](../diagrams/system-usecase.svg)

---

## 3. Đặc tả Yêu cầu Chức năng Phân hệ 6: FR-07, FR-08 & FR-10 (Phụ trách: Sang – SM)

### 3.1 Mô tả Nghiệp vụ Tổng quan

Phân hệ Chức năng 6 đảm nhận giai đoạn hậu thanh toán (Post-Checkout) và duy trì gắn kết khách hàng thân thiết (Customer Retention) của chuỗi đồ uống BrewLite, bao gồm 3 nhóm yêu cầu chức năng liên kết chặt chẽ:

1. **`FR-07` – Biên nhận Điện tử & Tra cứu Lịch sử Đơn hàng Cá nhân:** Ngay sau khi đơn hàng chuyển sang trạng thái `PAID` (tại `UC-05`), khách hàng được cung cấp biên nhận điện tử chi tiết (`/checkout/success?orderId=...`) và có thể tra cứu lại toàn bộ danh sách các đơn hàng đã đặt (`GET /api/v1/orders/my-orders`) sắp xếp theo thời gian từ mới nhất đến cũ nhất, kèm cơ chế bảo vệ quyền sở hữu nghiêm ngặt (chống lỗ hổng IDOR).
2. **`FR-08` – Theo dõi Tiến trình & Quản lý Trạng thái Đơn hàng (`OrderStatusStepper`):** Hiển thị trực quan vòng đời trạng thái đơn hàng theo máy trạng thái hữu hạn (`PENDING` → `PAID` → `PREPARING` → `COMPLETED` hoặc `CANCELLED`), đồng thời cho phép Nhân viên pha chế / Quản lý cửa hàng cập nhật tiến trình chế biến món hợp lệ.
3. **`FR-10` – Tích lũy & Quy đổi Điểm thưởng Thành viên (`LoyaltyTransaction`):** Tự động tính toán và cộng điểm thưởng tích lũy (`EARN`) vào tài khoản người dùng ngay khi đơn hàng thanh toán thành công, lưu vết minh bạch mọi biến động điểm (`EARN`, `REDEEM`, `REFUND`) trong bảng `LoyaltyTransaction` và kiểm soát chặt chẽ không để xảy ra tình trạng âm số dư điểm (`loyaltyPoints < 0`).

---

### 3.2 Bảng Phân loại Yêu cầu Chức năng (FR-07, FR-08, FR-10) & Mức ưu tiên MoSCoW

| Mã yêu cầu | Nội dung yêu cầu có thể kiểm chứng | Mức ưu tiên (MoSCoW) | Ghi chú kỹ thuật / Endpoint liên quan |
| :--- | :--- | :---: | :--- |
| **FR-07.1** | Hiển thị màn hình Biên nhận điện tử (`/checkout/success?orderId=:id`) ngay sau khi thanh toán thành công, bao gồm: mã đơn chuẩn `#BL-YYYYMMDD-XXXX`, thời gian đặt, danh sách món (kèm Size, Topping, đơn giá lịch sử `unitPrice`), tổng tiền tạm tính, mức giảm giá, tổng thanh toán cuối cùng (`finalAmount`), phương thức thanh toán và số điểm thưởng vừa tích lũy được. | **Must** | `GET /api/v1/orders/:id` |
| **FR-07.2** | Cung cấp trang Lịch sử đơn hàng cá nhân (`/orders/my-orders`) và API `GET /api/v1/orders/my-orders` trả về danh sách toàn bộ đơn hàng thuộc tài khoản đang đăng nhập, mặc định sắp xếp giảm dần theo thời gian tạo (`createdAt DESC`). | **Must** | `GET /api/v1/orders/my-orders` |
| **FR-07.3** | Kiểm soát quyền sở hữu đơn hàng nghiêm ngặt tại tầng Business Logic Layer: Khi người dùng gọi `GET /api/v1/orders/:id`, hệ thống bắt buộc đối chiếu `order.userId === currentUser.sub` (trừ vai trò `STAFF` / `ADMIN`). Nếu truy cập đơn hàng của người khác, lập tức chặn và trả về `HTTP 403 Forbidden`. | **Must** | Chống lỗ hổng bảo mật IDOR (Insecure Direct Object Reference). |
| **FR-07.4** | Hiển thị trọn vẹn 3 trạng thái giao diện chuẩn (`Skeleton Loading` khi đang tải lịch sử đơn, `EmptyState` kèm nút "Đặt món ngay" khi khách chưa có đơn hàng nào, và `ErrorState` kèm nút "Thử lại" khi mất kết nối mạng). | **Must** | Đồng bộ chuẩn UI/UX toàn hệ thống. |
| **FR-08.1** | Hiển thị thanh tiến trình trạng thái đơn hàng trực quan (`OrderStatusStepper`) trên trang Biên nhận và Chi tiết đơn hàng theo đúng 4 bước tiêu chuẩn: `Chờ thanh toán (PENDING)` → `Đã thanh toán (PAID)` → `Đang pha chế (PREPARING)` → `Hoàn tất (COMPLETED)` (hoặc trạng thái rẽ nhánh `Đã hủy (CANCELLED)`). | **Must** | Component `OrderStatusStepper.tsx`. |
| **FR-08.2** | Cung cấp API `PATCH /api/v1/orders/:id/status` (bảo vệ bởi `JwtAuthGuard` và `RolesGuard` dành cho `STAFF` / `ADMIN`) để nhân viên quầy cập nhật trạng thái chế biến đơn hàng theo đúng quy tắc chuyển trạng thái một chiều hợp lệ (`PAID` → `PREPARING` → `COMPLETED`). | **Must** | Ngăn chặn chuyển ngược trạng thái hoặc nhảy cóc sai quy trình. |
| **FR-10.1** | Tự động tính toán và cộng điểm thưởng tích lũy (`EARN`) khi đơn hàng chuyển sang trạng thái `PAID` theo công thức: $\text{earnedPoints} = \lfloor \text{finalAmount} / 10.000 \rfloor$ (mỗi $10.000\text{đ}$ thực trả được cộng $+1$ điểm). | **Must** | Thực thi nguyên tử trong cùng Database Transaction cập nhật `PAID`. |
| **FR-10.2** | Ghi nhận mọi biến động điểm thưởng vào bảng `LoyaltyTransaction` (gồm `id`, `userId`, `orderId`, `type: EARN | REDEEM | REFUND`, `points`, `description`, `createdAt`) và đồng bộ tức thời với cột `User.loyaltyPoints`. | **Must** | Thực thể bắt buộc trong Task 2.3 của đề bài. |
| **FR-10.3** | Cung cấp API `GET /api/v1/loyalty/balance` và `GET /api/v1/loyalty/history` để khách hàng tra cứu tổng điểm hiện có (`loyaltyPoints`) và danh sách lịch sử cộng/đổi điểm thưởng trên giao diện (`LoyaltyBadge` & trang Lịch sử). | **Must** | `src/loyalty/loyalty.controller.ts` |
| **FR-10.4** | Hỗ trợ khách hàng sử dụng điểm thưởng hiện có để giảm giá trực tiếp khi đặt đơn (`REDEEM`, tỷ lệ quy đổi $1\text{ điểm} = 1.000\text{đ}$). Hệ thống kiểm tra nghiêm ngặt `user.loyaltyPoints >= pointsToRedeem` trong Database Transaction, tuyệt đối không cho phép số dư điểm bị âm (`loyaltyPoints < 0`). | **Should** | Tích hợp cùng Transaction tạo đơn hoặc API `/loyalty/redeem`. |
| **FR-10.5** | Hỗ trợ lọc danh sách lịch sử đơn hàng theo trạng thái (`ALL`, `PENDING`, `PAID`, `PREPARING`, `COMPLETED`, `CANCELLED`). | **Could** | Nâng cao trải nghiệm tra cứu trên di động. |
| **FR-10.6** | Không thực hiện phân hạng thẻ thành viên đa cấp (Bạc / Vàng / Kim Cương) hoặc chuyển nhượng điểm thưởng giữa các tài khoản khác nhau trong phạm vi MVP. | **Won't (MVP)** | Thuộc phạm vi mở rộng sau MVP. |

---

### 3.3 Bảng Quy tắc Nghiệp vụ (Business Rules – BR)

| Mã quy tắc | Tên & Nội dung quy tắc nghiệp vụ | Công thức / Ràng buộc kỹ thuật |
| :--- | :--- | :--- |
| **BR-06.1** | **Quy tắc Chuyển đổi Trạng thái Đơn hàng (Order State Machine):**<br>Trạng thái của một đơn hàng chỉ được phép dịch chuyển theo đồ thị có hướng hợp lệ, không được phép quay ngược từ trạng thái đã kết thúc (`COMPLETED`, `CANCELLED`) về trạng thái trước đó. | • Luồng chuẩn: `PENDING` → `PAID` → `PREPARING` → `COMPLETED`<br>• Luồng hủy: `PENDING` → `CANCELLED` (khi thanh toán lỗi hoặc quá hạn 15 phút)<br>• Mọi yêu cầu chuyển trạng thái sai quy tắc (ví dụ `PENDING` → `COMPLETED` hoặc `CANCELLED` → `PAID`) đều bị từ chối với mã lỗi `HTTP 400 Bad Request`. |
| **BR-06.2** | **Quy tắc Bảo vệ Quyền Sở hữu Đơn hàng (Anti-IDOR Authorization):**<br>Một khách hàng (`role = CUSTOMER`) chỉ được phép xem chi tiết đơn hàng của chính mình. | Điều kiện kiểm tra bắt buộc tại `OrdersService.findOne(orderId, currentUser)`:<br>`if (currentUser.role === 'CUSTOMER' && order.userId !== currentUser.id) throw new ForbiddenException();` |
| **BR-06.3** | **Công thức Tích lũy Điểm thưởng Tự động (`EARN`):**<br>Điểm thưởng chỉ được tính và cộng khi đơn hàng đã thanh toán thành công (`Order.status === 'PAID'`), dựa trên tổng số tiền thực tế khách hàng thanh toán (`finalAmount` sau khi đã trừ khuyến mãi). | $$\text{earnedPoints} = \left\lfloor \frac{\text{Order.finalAmount}}{10.000} \right\rfloor$$<br>• Mỗi `orderId` chỉ được phát sinh tối đa **01** bản ghi `LoyaltyTransaction` loại `EARN` (chống cộng điểm trùng lặp khi Webhook gọi lại). |
| **BR-06.4** | **Công thức Quy đổi Điểm thưởng & Chống Âm Điểm (`REDEEM`):**<br>Khách hàng chỉ được đổi số điểm nguyên dương không vượt quá số dư điểm hiện có. Tỷ lệ quy đổi cố định: $1\text{ điểm} = 1.000\text{ VNĐ}$. | 1. Điều kiện: $0 < \text{pointsToRedeem} \le \text{User.loyaltyPoints}$<br>2. Số tiền giảm từ điểm: $\text{loyaltyDiscount} = \text{pointsToRedeem} \times 1.000\text{đ}$<br>3. Bắt buộc cập nhật `User.loyaltyPoints` và thêm bản ghi `LoyaltyTransaction (type = REDEEM)` trong cùng một `prisma.$transaction()`. |
| **BR-06.5** | **Quy tắc Hoàn trả Điểm thưởng khi Đơn hàng bị Hủy (`REFUND`):**<br>Nếu một đơn hàng có sử dụng điểm thưởng (`loyaltyPointsUsed > 0`) bị hủy trước khi hoàn tất, hệ thống phải tự động hoàn lại đúng số điểm đã dùng vào `User.loyaltyPoints` và ghi nhận bản ghi `LoyaltyTransaction (type = REFUND)`. | Đảm bảo khách hàng không bị mất điểm oan khi giao dịch thanh toán thất bại. |

---

### 3.4 Bảng Tiêu chí Chấp nhận (Acceptance Criteria – AC)

| Mã AC | Điều kiện tiền đề (Given) | Hành động kích hoạt (When) | Kết quả kỳ vọng (Then) | Truy vết |
| :--- | :--- | :--- | :--- | :--- |
| **AC-06.01** | Đơn hàng `#BL-20261101-0001` của khách hàng A có `finalAmount = 85.000đ` vừa nhận Webhook xác nhận chuyển sang trạng thái `PAID`. | Hệ thống hoàn tất Transaction thanh toán và điều hướng khách hàng tới `/checkout/success?orderId=...`. | 1. Hiển thị biên nhận đầy đủ mã đơn, danh sách món, tổng tiền `85.000đ` và thanh `OrderStatusStepper` sáng ở bước `Đã thanh toán (PAID)`.<br>2. Tự động tạo 1 bản ghi `LoyaltyTransaction (type = EARN, points = +8)` và tăng `User.loyaltyPoints` thêm `8` điểm. | FR-07.1, FR-08.1, FR-10.1, BR-06.3 |
| **AC-06.02** | Khách hàng A đã đăng nhập và có 3 đơn hàng trong CSDL (tạo lúc 08:00, 09:30 và 11:15). | Khách hàng A mở trang `/orders/my-orders` (gọi `GET /api/v1/orders/my-orders`). | API trả về `HTTP 200 OK` gồm đúng 3 đơn hàng của khách A theo thứ tự: đơn 11:15 đứng đầu, tiếp theo là 09:30 và 08:00. Không lẫn bất kỳ đơn hàng nào của khách B. | FR-07.2, BR-06.2 |
| **AC-06.03** | Khách hàng A (`userId = "user-A"`) cố tình nhập URL hoặc gọi API `GET /api/v1/orders/:id` với `id` là đơn hàng thuộc về Khách hàng B (`userId = "user-B"`). | Gửi request kèm JWT của khách hàng A. | Hệ thống phát hiện `order.userId !== currentUser.sub`, lập tức chặn truy cập và trả về mã lỗi `HTTP 403 Forbidden` ("Bạn không có quyền truy cập đơn hàng này"). | FR-07.3, BR-06.2 |
| **AC-06.04** | Đơn hàng đang ở trạng thái `PAID`. Nhân viên pha chế (`role = STAFF`) đăng nhập và bấm nút "Bắt đầu pha chế". | Gọi `PATCH /api/v1/orders/:id/status` với body `{ "status": "PREPARING" }`. | Trạng thái đơn chuyển thành `PREPARING`, trả về `HTTP 200 OK`; thanh `OrderStatusStepper` trên màn hình khách hàng cập nhật sang bước `Đang pha chế`. | FR-08.1, FR-08.2, BR-06.1 |
| **AC-06.05** | Đơn hàng đang ở trạng thái `PENDING` (chưa thanh toán) hoặc đã `CANCELLED`. | Có request gọi `PATCH /api/v1/orders/:id/status` để ép chuyển thẳng sang `COMPLETED`. | Hệ thống từ chối do vi phạm máy trạng thái `BR-06.1`, trả về `HTTP 400 Bad Request` ("Chuyển đổi trạng thái đơn hàng không hợp lệ"). | FR-08.2, BR-06.1 |
| **AC-06.06** | Khách hàng A đang có số dư điểm thưởng `loyaltyPoints = 15` điểm. | Khách hàng A yêu cầu đổi `20` điểm thưởng (`pointsToRedeem = 20`) để giảm giá đơn hàng. | Hệ thống chặn thao tác, trả về `HTTP 400 Bad Request` ("Số dư điểm thưởng không đủ, hiện có 15 điểm"), tuyệt đối không tạo bản ghi `REDEEM` và không để `loyaltyPoints` bị âm. | FR-10.4, BR-06.4 |
| **AC-06.07** | Khách hàng A đang có `loyaltyPoints = 20` điểm, thực hiện đổi `10` điểm hợp lệ cho đơn hàng tạm tính `65.000đ`. | Xác nhận áp dụng điểm thưởng khi đặt đơn. | Số tiền giảm từ điểm là `10.000đ` (`finalAmount` còn `55.000đ`); `User.loyaltyPoints` giảm còn `10` điểm; bảng `LoyaltyTransaction` ghi nhận 1 dòng `type = REDEEM, points = -10`. | FR-10.2, FR-10.4, BR-06.4 |
| **AC-06.08** | Tài khoản mới đăng ký chưa từng đặt đơn hàng nào (`orders.length === 0`, `loyaltyPoints === 0`). | Mở trang `/orders/my-orders` và xem mục Điểm thưởng. | Giao diện hiển thị component `EmptyState` ("Bạn chưa có đơn hàng nào") kèm nút chuyển về `/menu`; huy hiệu `LoyaltyBadge` hiển thị `0 điểm`. | FR-07.4, FR-10.3 |

---

## 4. Sơ đồ Use Case Phân hệ Chức năng 6 (`uc-06-history-loyalty`)

Sơ đồ dưới đây mô hình hóa chi tiết các Use Case thành phần của Chức năng 6 (`UC-06.1` đến `UC-06.4`) cùng các mối quan hệ `<<include>>` và `<<extend>>` theo chuẩn đơn sắc đen-trắng:

![Sơ đồ Use Case Phân hệ Chức năng 6](../diagrams/uc-06-history-loyalty.svg)

- **Tệp nguồn PlantUML:** [`docs/diagrams/uc-06-history-loyalty.puml`](../diagrams/uc-06-history-loyalty.puml)
- **Tệp ảnh kết xuất SVG:** [`docs/diagrams/uc-06-history-loyalty.svg`](../diagrams/uc-06-history-loyalty.svg)
