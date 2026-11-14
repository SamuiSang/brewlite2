# BREWLITE – ĐẶC TẢ CHI TIẾT CÁC PHÂN HỆ USE CASE & CỤM USE CASE TRỌNG TÂM CHECKOUT (UC-01 → UC-06 – TASK 1.3)

- **Học phần:** Công nghệ Phần mềm (CO3001 – SWE 2026–2027)
- **Đề tài:** BrewLite – Hệ thống Đặt đồ uống Trực tuyến (Mobile-first / PWA)
- **Tài liệu:** `docs/requirements/usecase-checkout-spec.md`
- **Giai đoạn:** Task 1.3 – Đặc tả Chi tiết Use Case Trọng tâm (Luồng Đặt hàng `UC-04` & Thanh toán `UC-05`) và Các Phân hệ Nghiệp vụ Liên kết (`UC-01`, `UC-02`, `UC-03`, `UC-06`)
- **Nhóm thực hiện (6 Thành viên – Mô hình Vertical Slice):**
  1. **Phương Duy (Dev Team):** Phụ trách **Mục 1 – `UC-01`:** Duyệt Thực đơn, Tìm kiếm, Lọc Danh mục & Kiểm tra Tồn kho Nguyên liệu (`FR-01`, `FR-02`).
  2. **Quỳnh (Dev Team):** Phụ trách **Mục 2 – `UC-02`:** Tùy biến Đồ uống, Quản lý Giỏ hàng (`Zustand`) & Thẩm định Mã Khuyến mãi (`FR-03`, `FR-09`).
  3. **Hàn Minh Hiếu (Product Owner):** Phụ trách **Mục 3 – `UC-03`:** Đăng ký, Đăng nhập, Hồ sơ cá nhân, Xác thực Phân quyền `JWT`/`Bcrypt` & Giám sát `GET /api/v1/health` (`FR-04`).
  4. **Chiến (Dev Team):** Chủ trì **Nửa đầu Use Case Trọng tâm (Mục 4 – `UC-04`):** Khởi tạo Đơn hàng, Tính lại 100% Tiền tại Business Layer & Khóa Tồn kho Nguyên liệu Đồng thời (`Optimistic Lock` trên `Ingredient` & `RecipeItem`, `FR-05`).
  5. **Quang (Dev Team):** Chủ trì **Nửa sau Use Case Trọng tâm (Mục 5 – `UC-05`):** Thanh toán Sandbox/Webhook 2 Bước, Chống Trừ tiền Trùng lặp (`Idempotency-Key`) & Hoàn trả Tồn kho Tự động (`Restock Rollback`, `FR-06`).
  6. **Sang (Scrum Master):** Phụ trách **Mục 6 – `UC-06`:** Biên nhận Điện tử, Lịch sử Đơn hàng, Theo dõi & Cập nhật Trạng thái Đơn (`OrderStatusStepper`) & Tích lũy / Quy đổi Điểm thưởng (`LoyaltyTransaction`, `FR-07`, `FR-08`, `FR-10`).
- **Liên kết tài liệu truy vết:**
  - [Bối cảnh, Stakeholder và Phạm vi (Task 1.1)](./context-and-scope.md)
  - [Tóm tắt Yêu cầu Phần mềm SRS (Task 1.2)](./srs-summary.md)
  - [Sơ đồ Use Case Tổng quát Toàn hệ thống (SVG)](../diagrams/system-usecase.svg)

---

## Tổng quan Chuỗi Quy trình Nghiệp vụ End-to-End & Cụm Use Case Trọng tâm Checkout

Tuân thủ chỉ đạo của Giảng viên hướng dẫn (Thầy Phiêu) về việc lựa chọn quy trình nghiệp vụ cốt lõi có độ phức tạp kỹ thuật cao nhất làm trọng tâm xuyên suốt hệ thống, cụm **`UC-04` (Khởi tạo đơn & Khóa kho nguyên liệu thô)** kết hợp với **`UC-05` (Thanh toán Sandbox/Webhook 2 bước & Chống trừ tiền trùng lặp)** đóng vai trò là **Cụm Use Case Trọng tâm** của đồ án, được đặt trong chuỗi liên kết chặt chẽ từ `UC-01` đến `UC-06`:

```text
[UC-01: Duyệt Menu, Lọc & Tìm kiếm món | Tính availableStock từ Ingredient/RecipeItem (Duy)]
                                           │
                                           ▼
[UC-02: Tùy biến Size/Topping, Giỏ hàng Zustand & Thẩm định Promotion Read-only (Quỳnh)]
                                           │
                                           ▼
[UC-03: Đăng ký / Đăng nhập (?redirect=/checkout) & Cấp phát JWT Token 24h (Hiếu - PO)]
                                           │
                                           ▼
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║                 CỤM USE CASE TRỌNG TÂM TOÀN HỆ THỐNG: QUY TRÌNH CHECKOUT                 ║
║                                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────────────────────┐  ║
║  │ GIAI ĐOẠN 1 – UC-04: KHỞI TẠO ĐƠN & KHÓA KHO NGUYÊN LIỆU (Chiến phụ trách)         │  ║
║  │ • POST /api/v1/orders: Bỏ qua giá Client, tính lại 100% tiền tại Business Layer    │  ║
║  │ • prisma.$transaction: Đối soát RecipeItem & Trừ kho Ingredient (Optimistic Lock)  │  ║
║  │ • Ghi nhận lượt dùng Voucher (usedCount + 1) & Tạo bản ghi Order (PENDING)         │  ║
║  └────────────────────────────────────────────────────────────────────────────────────┘  ║
║                                           │                                              ║
║                                           ▼ (orderId ở trạng thái PENDING)               ║
║  ┌────────────────────────────────────────────────────────────────────────────────────┐  ║
║  │ GIAI ĐOẠN 2 – UC-05: THANH TOÁN 2 BƯỚC & IDEMPOTENCY-KEY (Quang phụ trách)         │  ║
║  │ • POST /api/v1/payments: Kiểm tra UNIQUE Idempotency-Key (chống trừ tiền 2 lần)    │  ║
║  │ • Bước 1: Tạo Payment (PENDING) -> Bước 2: Nhận Webhook Callback hợp lệ            │  ║
║  │ • Thành công: Payment = SUCCESS, Order = PAID | Lỗi: CANCELLED & Restock Rollback  │  ║
║  └────────────────────────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
                                           │
                                           ▼ (Order = PAID)
[UC-06: Biên nhận, Lịch sử Đơn, OrderStatusStepper & Cộng điểm Loyalty EARN (Sang - SM)]
```

---

## Mục 1: Chức năng 1 – UC-01: Duyệt Thực đơn, Tìm kiếm, Lọc Danh mục và Xem Chi tiết Sản phẩm (Phương Duy)

### 1.1 Thông tin Tổng quan (Overview)

- **Mã Use Case:** `UC-01`
- **Tên Use Case:** Duyệt thực đơn, Lọc danh mục và Xem chi tiết sản phẩm *(Browse Menu, Filter Categories & View Product Details)*.
- **Mức độ trọng tâm:** Use Case trọng tâm của Chức năng 1 (Nhiệm vụ Task 1.3 trong Đồ án BrewLite 2).
- **Sơ đồ phân rã Use Case (PlantUML & SVG):**
  - Tệp nguồn PlantUML: [`docs/diagrams/uc-01-menu.puml`](../diagrams/uc-01-menu.puml)
  - Tệp bản vẽ Vector SVG: [`docs/diagrams/uc-01-menu.svg`](../diagrams/uc-01-menu.svg)
- **Phân rã các Use Case thành phần (Sub-use cases):**
  - `UC-01.1`: **Xem danh sách thực đơn đồ uống** (Use Case cơ sở / Base Use Case).
  - `UC-01.2`: **Lọc đồ uống theo danh mục** (Quan hệ `<<extend>>` từ UC-01.1 khi khách hàng bấm chọn tab danh mục).
  - `UC-01.3`: **Tìm kiếm đồ uống theo từ khóa tên món** (Quan hệ `<<extend>>` từ UC-01.1 khi khách hàng nhập từ khóa tìm kiếm).
  - `UC-01.4`: **Xem chi tiết thông tin món & trạng thái tồn kho** (Quan hệ `<<include>>` khi khách hàng bấm vào một thẻ món ăn cụ thể).
- **Tác nhân chính (Primary Actor):** Khách hàng *(Customer / Guest)* – Hệ thống cho phép cả khách vãng lai chưa đăng nhập và khách hàng thành viên đều có thể duyệt menu tự do.
- **Tác nhân phụ / Hệ thống hỗ trợ (Supporting Actor / Secondary System):**
  - Hệ quản trị CSDL PostgreSQL (Lưu trữ bảng sản phẩm `Product`, nguyên liệu `Ingredient`, công thức định mức `RecipeItem`).
  - Dịch vụ Backend API NestJS (`ProductsService`, `ProductsController`).
- **Mục đích (Goal):** Cho phép khách hàng khám phá toàn bộ danh mục thức uống của quán với thông tin trực quan (hình ảnh, tên món, giá niêm yết, thành phần hương vị), lọc và tìm kiếm món yêu thích theo nhu cầu, đồng thời nắm bắt chính xác trạng thái còn hàng/hết hàng được tính toán tự động theo thời gian thực từ kho nguyên liệu thô.
- **Điểm kích hoạt (Trigger):** Khách hàng truy cập vào trang chủ hoặc điều hướng đến màn hình Thực đơn `/menu` trên ứng dụng web BrewLite 2 (qua trình duyệt máy tính hoặc thiết bị di động).
- **Tiền điều kiện (Pre-conditions):**
  1. Ứng dụng web BrewLite 2 đang hoạt động bình thường trên môi trường triển khai.
  2. Cơ sở dữ liệu PostgreSQL đã hoàn tất khởi tạo schema và nạp dữ liệu mẫu ban đầu (`prisma db seed`) với tối thiểu 8 – 10 sản phẩm đồ uống đa dạng thuộc các danh mục (`COFFEE`, `TEA`, `FREEZE`, `PASTRY`).
  3. Bảng nguyên liệu thô `Ingredient` và bảng công thức định mức `RecipeItem` đã được cấu hình đầy đủ để phục vụ việc tính toán tồn kho động.
  4. Backend API sẵn sàng phản hồi endpoint `GET /api/v1/products`.
- **Hậu điều kiện (Post-conditions):**
  - **Trường hợp thành công (Success End Condition):**
    - Màn hình Menu kết xuất đầy đủ các thẻ món ăn (`ProductCard`) kèm hình ảnh, tên món, đơn giá gốc rõ ràng.
    - Nhãn trạng thái tồn kho hiển thị minh bạch: Món còn hàng cho phép bấm vào xem chi tiết để chuyển sang bước tùy biến Size/Topping (Chức năng 2); Món hết hàng tự động làm mờ và khóa nút bấm chọn món.
    - Bộ lọc danh mục và thanh tìm kiếm phản hồi chính xác theo thao tác người dùng.
  - **Trường hợp thất bại (Failure End Condition):**
    - Nếu mất mạng hoặc máy chủ gặp sự cố: Giao diện hiển thị component `ErrorState` thông báo lỗi nhẹ nhàng kèm nút *"Thử lại"*, tuyệt đối không làm trắng trang hay sập ứng dụng.
    - Nếu không có sản phẩm khớp với bộ lọc: Giao diện hiển thị component `EmptyState` kèm nút *"Xóa bộ lọc"*.

---

### 1.2 Luồng Sự kiện Chính (Main Flow / Basic Course of Events)

| Bước | Hành Động của Tác Nhân (Actor Action) | Phản Hồi của Hệ Thống (System Response) |
| :---: | :--- | :--- |
| **1** | Khách hàng truy cập vào màn hình Menu bằng đường dẫn `/menu` hoặc bấm biểu tượng "Thực đơn" trên thanh điều hướng. | |
| **2** | | Ứng dụng Frontend (Next.js) ngay lập tức hiển thị giao diện chờ dạng khung xương (**Skeleton Loading State**) tại các vị trí thẻ món ăn nhằm giữ ổn định khung hình (tránh hiện tượng giật vỡ bố cục - Cumulative Layout Shift), đồng thời phát request HTTP `GET /api/v1/products` lên máy chủ Backend. |
| **3** | | Tầng API Backend (NestJS `ProductsController`) tiếp nhận yêu cầu, xác thực các tham số truy vấn (`QueryProductDto`), sau đó chuyển tiếp cho `ProductsService`. |
| **4** | | `ProductsService` tương tác với CSDL PostgreSQL thông qua Prisma ORM: Truy vấn các bản ghi sản phẩm có trạng thái hoạt động `isActive = true`. Đối với mỗi sản phẩm, hệ thống nạp các dòng công thức tương ứng (`RecipeItem`) và số lượng tồn kho nguyên liệu thô hiện tại (`Ingredient.stockQuantity`) để tính toán tồn kho khả dụng $\text{availableStock}$. |
| **5** | | Backend tổng hợp dữ liệu thành mảng DTO (`ProductResponseDto[]`) và phản hồi mã trạng thái HTTP `200 OK` về cho Frontend. |
| **6** | | Frontend tắt hiệu ứng Skeleton Loading và render giao diện Menu hoàn chỉnh: Gồm thanh cuộn danh mục (`CategoryFilter`) ở trên cùng và lưới các thẻ sản phẩm (`ProductCard`) ở phía dưới.<br>• Món có $\text{availableStock} > 0$: Hiển thị bình thường kèm nút chọn món mở.<br>• Món có $\text{availableStock} = 0$: Tự động làm mờ 50%, hiển thị nhãn *"Hết hàng (Sold Out)"* và vô hiệu hóa nút bấm. |
| **7** | Khách hàng có thể thao tác lọc theo danh mục hoặc nhập từ khóa tìm kiếm món. *(Kích hoạt UC mở rộng `UC-01.2` hoặc `UC-01.3`)*. | Hệ thống lọc tức thời danh sách món thỏa mãn và kết xuất lại lưới sản phẩm tương ứng mà không cần tải lại toàn bộ trang web. |
| **8** | Khách hàng bấm (click chuột hoặc chạm màn hình cảm ứng) vào một thẻ món ăn đang ở trạng thái còn hàng. | Hệ thống thực thi Use Case bao gồm `UC-01.4` (Xem chi tiết sản phẩm): Mở xem thông tin chi tiết (mô tả hương vị, nguyên liệu đặc trưng) và kích hoạt mở Modal tùy biến sản phẩm (`ProductCustomizationModal` thuộc Chức năng 2) để khách hàng chọn Size và Topping. |

---

### 1.3 Các Luồng Thay Thế / Rẽ Nhánh (Alternative Flows)

#### Luồng Thay Thế 7a: Lọc hoặc Tìm kiếm cho ra kết quả rỗng (Không có món thỏa mãn)
- **Điểm rẽ nhánh:** Xuất hiện tại **Bước 7** của Luồng chính, khi người dùng chọn một danh mục chưa có món nào hoặc nhập từ khóa tìm kiếm không khớp với bất kỳ sản phẩm nào trong cơ sở dữ liệu (`products.length == 0`).
- **Diễn biến:**
  1. Hệ thống Frontend ẩn lưới danh sách sản phẩm.
  2. Giao diện hiển thị component thông báo rỗng (`EmptyState`) với hình minh họa trực quan và thông điệp: *"Không tìm thấy đồ uống phù hợp với bộ lọc hiện tại"*.
  3. Bên dưới thông điệp hiển thị một nút bấm hành động tiện ích: *"Xóa bộ lọc (Clear Filter)"*.
  4. Khách hàng bấm vào nút *"Xóa bộ lọc"*.
  5. Hệ thống tức thời đặt lại tab danh mục về "Tất cả", xóa trắng ô tìm kiếm, và tải lại danh sách đầy đủ tất cả các món ăn đang phục vụ.
- **Điểm kết thúc:** Quay lại **Bước 6** của Luồng chính.

#### Luồng Thay Thế 7b: Khách hàng nhập từ khóa tìm kiếm liên tục (Cơ chế Debounce)
- **Điểm rẽ nhánh:** Xuất hiện tại **Bước 7** của Luồng chính khi khách hàng gõ ký tự vào ô tìm kiếm.
- **Diễn biến:**
  1. Khách hàng gõ các ký tự liên tiếp (ví dụ: gõ từng chữ "c-a-p-h-e").
  2. Thay vì kích hoạt gửi request API hoặc lọc mảng dữ liệu sau mỗi phím bấm, hệ thống áp dụng cơ chế trì hoãn thông minh (`Debounce`) với thời gian chờ 300 mili-giây.
  3. Chỉ khi khách hàng dừng bấm phím quá 300ms, hệ thống mới chính thức thực thi logic tìm kiếm và cập nhật kết quả lên màn hình.
- **Điểm kết thúc:** Giúp giao diện hoạt động mượt mà, loại bỏ hiện tượng giật lắc và tối ưu hóa hiệu năng thiết bị di động.

---

### 1.4 Các Luồng Ngoại Lệ (Exception Flows)

#### Luồng Ngoại Lệ 2a / 5a: Sự cố Mất kết nối mạng hoặc Lỗi máy chủ Backend (Network / Server Error)
- **Điểm phát sinh:** Xuất hiện tại **Bước 2** hoặc **Bước 5** của Luồng chính, khi thiết bị của khách hàng bị ngắt kết nối Internet (mất sóng Wifi/4G) hoặc máy chủ Backend trả về các mã lỗi HTTP `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`, hoặc quá thời gian chờ (Timeout > 10s).
- **Diễn biến:**
  1. Tầng dịch vụ Frontend bắt được ngoại lệ (Catch Exception).
  2. Hệ thống chủ động tắt hiệu ứng Skeleton Loading để tránh tình trạng nhấp nháy treo vô tận.
  3. Giao diện kết xuất component báo lỗi thân thiện (`ErrorState`) với nội dung: *"Không thể tải thực đơn. Vui lòng kiểm tra kết nối mạng của bạn và thử lại!"*.
  4. Trên màn hình lỗi có gắn kèm một nút bấm chức năng nổi bật: *"Thử lại (Retry)"*.
  5. Khách hàng kiểm tra lại kết nối mạng và bấm nút *"Thử lại"*.
- **Điểm kết thúc:** Hệ thống quay trở lại thực hiện lại từ **Bước 2** của Luồng chính. Ứng dụng không bị sập hay trắng trang.

#### Luồng Ngoại Lệ 6a: Sản phẩm hết hàng do thiếu hụt nguyên vật liệu thô (Out of Stock Barrier - Task 10.3)
- **Điểm phát sinh:** Xuất hiện tại **Bước 6** của Luồng chính khi tính toán tồn kho thành phẩm.
- **Diễn biến:**
  1. Tại tầng Backend, khi kiểm tra định mức công thức pha chế (`RecipeItem`) của món với tồn kho thực tế trong bảng `Ingredient`, hệ thống phát hiện có ít nhất một nguyên liệu cấu thành không còn đủ định lượng để pha chế tối thiểu 1 ly ($\text{availableStock} = 0$). *(Ví dụ: Món "Cà phê sữa đá" còn đủ bột cà phê nhưng kho đã hết sạch sữa đặc hoặc hết ly nhựa)*.
  2. Backend trả về trường `stock: 0` và `isAvailable: false` trong DTO của sản phẩm đó.
  3. Tại tầng Frontend, thẻ hiển thị của sản phẩm này tự động kích hoạt chế độ khóa phòng thủ:
     - Thẻ sản phẩm bị giảm độ tương phản và mờ đi (`opacity: 0.5`).
     - Hiển thị nhãn huy hiệu màu xám đậm: *"Hết hàng (Sold Out)"* đè lên góc ảnh sản phẩm.
     - Nút bấm thêm món chuyển sang trạng thái vô hiệu hóa (`disabled = true`, con trỏ chuột đổi thành `not-allowed`).
  4. Nếu khách hàng cố tình bấm/chạm vào thẻ món ăn, hệ thống ngăn chặn hoàn toàn sự kiện bấm chuột (`pointer-events: none`), không mở Modal tùy biến và không cho phép đưa sản phẩm vào giỏ hàng.
- **Điểm kết thúc:** Ngăn chặn triệt để rủi ro khách đặt mua hàng ảo khi quán không còn khả năng phục vụ.

---

### 1.5 Các Yêu Cầu Phi Chức Năng Liên Quan (Non-Functional Requirements)

1. **Hiệu năng & Trải nghiệm Người dùng (Performance & UX):**
   - Thời gian hiển thị Skeleton Loading ban đầu không vượt quá **100ms** kể từ khi người dùng nhấp mở trang.
   - Thời gian phản hồi trung bình của API tải thực đơn `GET /api/v1/products` phải dưới **300ms** trong điều kiện mạng bình thường.
   - Thao tác lọc tab danh mục diễn ra gần như tức thì (độ trễ dưới **50ms**) nhờ cơ chế lọc dữ liệu phía Client (Client-side filtering trên mảng sản phẩm đã nạp).
2. **Khả năng Tương thích & Thiết kế Đáp ứng (Responsive & Mobile-first):**
   - Giao diện được thiết kế ưu tiên màn hình điện thoại di động (chiều rộng chuẩn từ 360px – 430px) và tự động mở rộng hài hòa trên máy tính bảng (Tablet) cũng như máy tính để bàn (Desktop).
   - Thanh lọc danh mục hỗ trợ cử chỉ vuốt trượt cảm ứng (Touch-scroll/Swipe) mượt mà trên màn hình cảm ứng di động.
   - Diện tích tương tác (Touch Target) của các tab và nút chọn món đạt kích thước tối thiểu $44 \times 44\text{px}$ theo tiêu chuẩn Accessibility của Google.
3. **Tính Độc lập & Toàn vẹn (Modularity & Loose Coupling):**
   - Chức năng 1 (`Menu & Chi tiết món`) hoạt động độc lập hoàn toàn với việc người dùng đã đăng nhập hay chưa.
   - Khi chọn món còn hàng, Chức năng 1 chỉ làm nhiệm vụ truyền dữ liệu sản phẩm mục tiêu sang Component Modal của Chức năng 2 (Giỏ hàng & Topping) thông qua Props/State, đảm bảo tính tách biệt ranh giới module rõ ràng.




### 1.6 Sơ đồ Use Case Phân hệ Chức năng 1 (`uc-01-menu`)

![Sơ đồ Use Case UC-01](../diagrams/uc-01-menu.svg)

---

## Mục 2: Chức năng 2 – UC-02: Tùy biến Đồ uống, Quản lý Giỏ hàng và Áp mã Khuyến mãi (Quỳnh)

### 2.1 Thông tin Định danh & Thuộc tính Use Case UC-02

| Thuộc tính | Chi tiết Đặc tả Nghiệp vụ & Kỹ thuật |
| :--- | :--- |
| **Mã Use Case** | **`UC-02`** |
| **Tên Use Case** | **Tùy biến Đồ uống, Quản lý Giỏ hàng và Áp mã Khuyến mãi (`Promotion`)** |
| **Phân hệ / Module** | Chức năng 2 (Tùy biến, Giỏ hàng Zustand & Khuyến mãi NestJS) |
| **Actor chính (Primary)** | **Khách hàng (`Customer / Guest`):** Bao gồm cả khách vãng lai chưa đăng nhập và khách hàng thành viên đã có tài khoản hệ thống. |
| **Actor hỗ trợ (Secondary)** | • **Next.js Client Presentation Layer:** Quản trị giao diện Modal tùy biến (`ProductCustomizationModal`) và trang Giỏ hàng (`/cart`).<br>• **Zustand Client Store (`useCartStore`):** Lưu trữ giỏ hàng trong bộ nhớ Client, tự động đồng bộ bền vững với `localStorage`.<br>• **NestJS Backend Promotions Module:** Cung cấp endpoint thẩm định mã `POST /api/v1/promotions/validate`.<br>• **PostgreSQL Database Engine:** Nguồn dữ liệu CSDL có thẩm quyền lưu trữ bảng `Product`, `Promotion`, bảng giá Size và Topping qua Prisma ORM. |
| **Mục tiêu Use Case (Goal)** | Cho phép khách hàng tùy biến khẩu vị món đồ uống theo ý muốn, quản lý số lượng và danh mục món trong giỏ hàng một cách mượt mà và bền vững, đồng thời thẩm định mã giảm giá hợp lệ để nắm rõ tổng tiền dự kiến trước khi chuyển giao sang bước Đặt hàng chính thức (`UC-04`). |
| **Trigger (Sự kiện kích hoạt)** | 1. Khách hàng nhấp chọn một món đồ uống bất kỳ còn hàng trên Thực đơn (Menu).<br>2. Khách hàng nhấp vào biểu tượng Giỏ hàng trên thanh điều hướng (Navbar / Header). |
| **Tiền điều kiện (Pre-conditions)** | 1. Món đồ uống được chọn đang mở bán (`isAvailable == true`) và còn số lượng phục vụ khả dụng (`stock > 0` hoặc nguyên vật liệu pha chế đủ định mức).<br>2. Trình duyệt của khách hàng hỗ trợ tính năng Web Storage (`localStorage`) để lưu trạng thái giỏ hàng.<br>3. Hệ thống Backend API hoạt động bình thường, endpoint `GET /api/v1/health` phản hồi mã `HTTP 200 OK`. |
| **Hậu điều kiện thành công (Post-conditions)** | 1. Giỏ hàng Client cập nhật danh mục món kèm đúng cấu hình (Size, Topping, Đường, Đá), số lượng nguyên dương, đơn giá và tạm tính hiển thị chuẩn xác.<br>2. Dữ liệu giỏ hàng được đồng bộ bền vững vào `localStorage` qua middleware `persist` của Zustand, không bị mất mát khi tải lại trang (F5) hoặc mở tab mới.<br>3. Huy hiệu số lượng (Cart Badge) trên thanh điều hướng cập nhật tức thời tổng số ly đồ uống ($\sum \text{quantity}$).<br>4. Nếu áp dụng Voucher hợp lệ: Hệ thống ghi nhận mã, hiển thị số tiền được giảm (`discountAmount`) và tổng tiền dự kiến sau chiết khấu.<br>5. Toàn bộ thông tin giỏ hàng được cấu trúc thành DTO chuẩn sẵn sàng chuyển giao cho quy trình Checkout (`UC-04: POST /api/v1/orders`). |
| **Bảo đảm khi thất bại (Failure Guarantees)** | 1. **Bảo toàn dữ liệu cục bộ:** Các thao tác lỗi (nhập voucher sai, mạng chập chờn khi gọi validate) tuyệt đối không làm mất các món đang có trong giỏ hàng.<br>2. **Không khóa tài nguyên sớm:** Ở cấp độ `UC-02`, hệ thống không khóa giữ chỗ tồn kho (No Cart Reservation) và không trừ lượt dùng của Voucher (`usedCount` giữ nguyên). Tài nguyên chỉ bị khóa an toàn trong Database Transaction ở `UC-04`.<br>3. **Chống sập ứng dụng (Crash-free):** Nếu dữ liệu trong `localStorage` bị hỏng cấu trúc, Zustand tự động dọn sạch về giỏ hàng rỗng an toàn mà không làm trắng trang. |

---

### 2.2 Bối cảnh Kiến trúc & Nguyên tắc Single Source of Truth

Hệ thống BrewLite áp dụng kiến trúc phân tầng với sự phân định ranh giới trách nhiệm rõ ràng giữa Client State và Server Business Logic:

```text
+----------------------------------------------------------------------------------------------------+
|                      TẦNG GIAO DIỆN CLIENT (Next.js 16 App Router & Zustand Store)                  |
|                                                                                                    |
|  [Khách hàng] ---> ProductCustomizationModal: Chọn Size S/M/L, Topping, Đường/Đá, Số lượng         |
|               ---> Tính giá tạm tính Tức thời (UI Optimistic Preview):                              |
|                    unitPrice = basePrice + sizePrice + sum(toppingPrices)                          |
|               ---> useCartStore (Zustand): Sinh composite itemKey, Gộp dòng thông minh             |
|               ---> persist Middleware: Ghi nhớ vào localStorage của trình duyệt                    |
|               ---> Cart Badge: Hiển thị tổng số ly trên Navbar theo thời gian thực                 |
|               ---> Trang Giỏ hàng (/cart): Nhập Voucher -> Gửi POST /api/v1/promotions/validate    |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  | HTTP POST /api/v1/promotions/validate
                                                  | (Kiểm tra điều kiện & Tính tiền giảm dự kiến)
                                                  v
+----------------------------------------------------------------------------------------------------+
|                  TẦNG NGHIỆP VỤ MÁY CHỦ (NestJS Modular Monolith - Promotions Module)               |
|                                                                                                    |
|  PromotionsController ---> ValidationPipe (Kiểm tra DTO đầu vào)                                   |
|                       ---> PromotionsService (Business Logic Layer):                               |
|                            1. Đối soát mã trong PostgreSQL: isActive == true                       |
|                            2. Kiểm tra khoảng thời gian hiệu lực: startDate <= now <= endDate      |
|                            3. Kiểm tra giới hạn lượt dùng: usedCount < usageLimit                  |
|                            4. Kiểm tra đơn hàng tối thiểu: cartSubtotal >= minOrderValue           |
|                            5. Tính số tiền giảm: PERCENTAGE (trần maxDiscount) HOẶC FIXED_AMOUNT   |
|                            6. TUYỆT ĐỐI KHÔNG TĂNG usedCount (Read-only Calculation)               |
|                       ---> Trả về HTTP 200 OK kèm { discountAmount, valid: true }                 |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  | Bấm "Tiến hành Đặt hàng" (Chuyển tiếp UC-04)
                                                  v
+----------------------------------------------------------------------------------------------------+
|                 CHUYỂN GIAO SANG UC-04: KHỞI TẠO ĐƠN HÀNG & KHÓA KHO NGUYÊN LIỆU (Chiến)           |
|                                                                                                    |
|  POST /api/v1/orders ---> Backend BỎ QUA mọi giá tiền Client gửi, tính lại 100% từ CSDL gốc        |
|                      ---> prisma.$transaction: Trừ kho Ingredient (Optimistic Lock)                |
|                      ---> Tăng usedCount Voucher & Tạo bản ghi Order (PENDING)                     |
+----------------------------------------------------------------------------------------------------+
```

> [!IMPORTANT]
> **Nguyên tắc Kiến trúc Bắt buộc (Server-Authoritative Pricing):** Mọi giá tiền hiển thị trên Modal và Giỏ hàng ở `UC-02` đều mang tính chất **Tạm tính (Preview)** phục vụ trải nghiệm người dùng. Khi chuyển sang `UC-04`, Backend NestJS độc lập truy vấn lại toàn bộ giá gốc, phụ thu và voucher từ CSDL bên trong một Database Transaction có Optimistic Locking.

---

### 2.3 Sơ đồ Use Case & Phân rã Use Case Thành phần

#### 2.3.1 Sơ đồ Use Case (PlantUML Diagram)
- **Tệp mã nguồn PlantUML:** [`docs/diagrams/uc-02-cart-promotion.puml`](../diagrams/uc-02-cart-promotion.puml)
- **Tệp ảnh kết xuất SVG (Chuẩn đơn sắc Monochrome):** [`docs/diagrams/uc-02-cart-promotion.svg`](../diagrams/uc-02-cart-promotion.svg)

![Sơ đồ Use Case UC-02](../diagrams/uc-02-cart-promotion.svg)

#### 2.3.2 Bảng Phân rã Use Case Con & Quan hệ Phụ thuộc

| Thành phần Use Case | Tên Use Case / Hành động | Kiểu Quan hệ | Mô tả Ý nghĩa & Điều kiện Kích hoạt |
| :--- | :--- | :--- | :--- |
| **System Boundary** | **UC-02: Phân hệ Tùy biến đồ uống, Quản lý giỏ hàng và Khuyến mãi** | Boundary Box | Ranh giới hệ thống phân hệ Chức năng 2, bao bọc toàn bộ các Use Case thành phần. |
| **UC-02.1** | **Tùy biến đồ uống (Size, Topping, Đường, Đá)** | Primary Use Case | Khách hàng tương tác trực tiếp: tùy chọn kích cỡ, thành phần topping và khẩu vị cá nhân cho sản phẩm. |
| -- | *Tính giá tạm tính theo tùy chọn* | `<<include>>` (thuộc UC-02.1) | Bắt buộc tính lại giá tức thời trên modal mỗi khi khách hàng click đổi bất kỳ tùy chọn nào. |
| **Thêm món** | **Thêm món vào giỏ hàng** | `<<extend>>` (vào UC-02.1) | Điểm mở rộng sau khi tùy biến món khi [Khách hàng xác nhận thêm vào giỏ]. Tách riêng để phân biệt rõ hành vi tùy biến và hành vi lưu giỏ. |
| -- | *Kiểm tra tồn kho khả dụng* | `<<include>>` (thuộc Thêm món & UC-02.2) | Bắt buộc kiểm soát tổng số lượng đặt của món không vượt quá số lượng khả dụng. |
| **UC-02.2** | **Quản lý giỏ hàng (Xem giỏ, điều chỉnh số lượng, xóa món)** | Primary Use Case | Khách hàng tương tác trực tiếp: duyệt danh sách món, tăng/giảm số lượng hoặc xóa dòng sản phẩm. |
| **UC-02.3** | **Áp dụng mã khuyến mãi (`Promotion` Voucher)** | `<<extend>>` (vào UC-02.2) | Kích hoạt tại điểm mở rộng từ giỏ hàng khi [Khách hàng nhập mã khuyến mãi]. |
| -- | *Kiểm tra điều kiện khuyến mãi* | `<<include>>` (thuộc UC-02.3) | Bắt buộc thẩm định điều kiện hạn dùng, số lượt và giá trị tối thiểu từ CSDL. |
| **UC-02.4** | **Hủy áp dụng mã khuyến mãi** | `<<extend>>` (vào UC-02.2) | Kích hoạt tại điểm mở rộng từ giỏ hàng khi [Khách hàng yêu cầu hủy mã khuyến mãi]. |

---

### 2.4 Luồng Sự kiện Chi tiết (Flow of Events)

#### 2.4.1 Luồng Sự kiện Chính (Main Success Scenario)


#### Các bước diễn tiến chi tiết:
1. **Khởi tạo tùy biến:** Khách hàng duyệt Thực đơn (`/menu`), nhấp chọn một món đồ uống còn bán (`isAvailable == true`) và còn số lượng phục vụ. Hệ thống mở cửa sổ giao diện `ProductCustomizationModal`.
2. **Cấu hình tùy chọn:** Giao diện hiển thị thông tin sản phẩm (Tên món, hình ảnh, mô tả, giá gốc). Khách hàng thực hiện các lựa chọn:
   - Chọn Kích cỡ (`Size`): **Size S** (+0đ), **Size M** (+6.000đ) hoặc **Size L** (+10.000đ). Mặc định chọn Size S.
   - Chọn `Topping`: Chọn một hoặc nhiều loại Topping (Trân châu trắng +8.000đ, Kem cheese +10.000đ, Thạch đào +7.000đ,...).
   - Chọn Khẩu vị: Điều chỉnh tỷ lệ Đường (0%, 30%, 50%, 70%, 100%) và Đá (0%, 30%, 50%, 70%, 100%).
   - Điều chỉnh số lượng: Mặc định là 1 ly.
3. **Cập nhật giá tức thời:** Giao diện tự động tính toán lại đơn giá theo công thức:
   $$\text{unitPrice} = \text{basePrice} + \text{sizePrice} + \sum \text{toppingPrices}$$
   $$\text{previewLineTotal} = \text{unitPrice} \times \text{quantity}$$
   Số tiền hiển thị trên nút bấm được cập nhật tức thời với độ trễ `< 50ms`.
4. **Xác nhận thêm vào giỏ:** Khách hàng nhấn nút **"Thêm vào giỏ hàng – [Số tiền]đ"**.
5. **Xử lý Store Zustand & Gộp dòng:** Store `useCartStore` tiếp nhận yêu cầu:
   - Sinh chuỗi khóa tổng hợp duy nhất: `itemKey = hash(productId, sizeId, sortedToppingIds, sugar, ice)`.
   - Kiểm tra tồn kho: Tính toán tổng số lượng của sản phẩm này trên toàn bộ giỏ hàng cộng với số lượng dự định thêm mới. Nếu $\le \text{availableStock}$, cho phép tiếp tục.
   - Nếu đã tồn tại dòng có cùng `itemKey`: Thực hiện cộng dồn số lượng: $\text{existingItem.quantity} += \text{quantity}$.
   - Nếu chưa tồn tại: Tạo bản ghi `CartItem` mới và đưa vào mảng `items`.
6. **Lưu trữ bền vững & Cập nhật UI:**
   - Middleware `persist` của Zustand tự động tuần tự hóa (serialize) state giỏ hàng và ghi xuống `localStorage` của trình duyệt.
   - Huy hiệu giỏ hàng (Cart Badge) trên Navbar cập nhật số hiển thị bằng tổng số ly ($\sum \text{item.quantity}$).
   - Modal đóng lại và hiển thị thông báo nhẹ (Toast) thành công.
7. **Truy cập giỏ hàng:** Khách hàng nhấp vào biểu tượng giỏ hàng trên thanh điều hướng để chuyển đến trang `/cart`.
8. **Hiển thị danh sách giỏ hàng:** Trang `/cart` hiển thị trực quan từng dòng món ăn kèm chi tiết Size, Topping, khẩu vị, số lượng, thành tiền từng dòng và tổng tiền tạm tính (`cartSubtotal`).
9. **Nhập mã khuyến mãi:** Khách hàng nhập mã giảm giá (ví dụ: `BREWLITE20`) vào ô nhập liệu và nhấn nút **"Áp dụng"**.
10. **Gọi API Thẩm định:** Giao diện hiển thị trạng thái đang xử lý (`Loading spinner`) trên nút bấm, vô hiệu hóa việc bấm liên tục và gửi yêu cầu:
    ```http
    POST /api/v1/promotions/validate HTTP/1.1
    Host: api.brewlite.com
    Content-Type: application/json

    {
      "code": "BREWLITE20",
      "cartSubtotal": 120000
    }
    ```
11. **Xử lý thẩm định tại Backend NestJS:**
    - `PromotionsController` tiếp nhận và kích hoạt `ValidationPipe`.
    - `PromotionsService` gọi Prisma truy vấn bảng `Promotion` theo `code` (không phân biệt chữ hoa thường).
    - Kiểm tra 4 điều kiện cốt lõi: `isActive == true`, thời gian hiện tại nằm trong $[\text{startDate}, \text{endDate}]$, số lượt đã dùng $\text{usedCount} < \text{usageLimit}$ và giá trị đơn hàng $\text{cartSubtotal} \ge \text{minOrderValue}$.
    - Tính toán số tiền chiết khấu theo loại `PERCENTAGE` hoặc `FIXED_AMOUNT`. Tuyệt đối không tăng cột `usedCount` (Validation là thao tác đọc thuần túy).
12. **Phản hồi và Cập nhật Chiết khấu:** API trả về mã thành công `HTTP 200 OK` kèm kết quả chiết khấu. Giao diện Client cập nhật thông tin mã đã áp dụng vào Zustand Store, hiển thị số tiền được giảm (`-24.000đ`) và tổng tiền dự kiến sau giảm (`96.000đ`).
13. **Kết thúc Use Case:** Khách hàng kiểm tra lại toàn bộ thông tin giỏ hàng và nhấn nút **"Tiến hành Đặt hàng"** để chuyển giao toàn bộ cấu hình sang màn hình Checkout (`UC-04`).

---

#### 2.4.2 Các Luồng Thay Thế (Alternative Flows - AF)

#### AF-01: Thêm món có cùng cấu hình với dòng đã có trong giỏ hàng (Gộp số lượng)
- **Điểm rẽ:** Tại Bước 5 của Luồng chính, khi khách hàng thêm một món có `productId`, `size`, `toppings`, đường và đá hoàn toàn trùng khớp với một dòng sản phẩm đã tồn tại trong giỏ.
- **Xử lý:**
  1. Hệ thống phát hiện trùng `itemKey`.
  2. Hệ thống kiểm tra điều kiện tồn kho: $(\text{item.quantity} + \text{addedQty}) \le \text{availableStock}$.
  3. Hệ thống tăng số lượng của dòng sản phẩm đó: $\text{item.quantity} += \text{addedQty}$.
  4. Hệ thống cập nhật lại thành tiền của dòng và tạm tính giỏ hàng, không sinh thêm dòng mới trong danh sách.
  5. Luồng quay lại Bước 6 của Luồng chính.

#### AF-02: Thay đổi số lượng sản phẩm trực tiếp tại trang Giỏ hàng
- **Điểm rẽ:** Tại Bước 8 của Luồng chính, khách hàng bấm nút tăng (`+`) hoặc giảm (`-`) số lượng trên một dòng sản phẩm trong trang `/cart`.
- **Xử lý:**
  1. **Khi bấm `+`:** Hệ thống kiểm tra tổng số ly của món đó so với tồn kho. Nếu còn đủ, tăng số lượng thêm 1 (`quantity = quantity + 1`).
  2. **Khi bấm `-`:** Nếu số lượng hiện tại $> 1$, hệ thống giảm số lượng đi 1 (`quantity = quantity - 1`).
  3. Cập nhật thành tiền dòng, tổng tạm tính và đồng bộ xuống `localStorage`.
  4. Nếu giỏ hàng đang có mã khuyến mãi được áp dụng, hệ thống kích hoạt tự động kiểm tra lại điều kiện `minOrderValue` (Xem thêm AF-08).

#### AF-03: Giảm số lượng món về 0 (Xóa món có xác nhận)
- **Điểm rẽ:** Khi dòng sản phẩm đang có số lượng bằng 1 và khách hàng bấm nút giảm (`-`), hoặc khách hàng bấm vào biểu tượng thùng rác (Xóa món).
- **Xử lý:**
  1. Hệ thống không xóa ngay mà hiển thị hộp thoại cảnh báo: *"Bạn có chắc chắn muốn xóa món này khỏi giỏ hàng?"*.
  2. Nếu khách hàng bấm **"Hủy bỏ"**: Hộp thoại đóng lại, dòng sản phẩm được giữ nguyên.
  3. Nếu khách hàng bấm **"Xác nhận xóa"**:
     - Hệ thống loại bỏ hoàn toàn `CartItem` đó ra khỏi mảng `items`.
     - Cập nhật lại Cart Badge trên Navbar.
     - Nếu giỏ hàng trở nên rỗng (`items.length == 0`), hệ thống xóa mã voucher đang lưu và hiển thị trạng thái Giỏ hàng rỗng.
     - Đồng bộ trạng thái mới xuống `localStorage`.

#### AF-04: Xóa toàn bộ giỏ hàng (Clear Cart)
- **Điểm rẽ:** Khách hàng bấm nút "Xóa tất cả" tại trang giỏ hàng.
- **Xử lý:**
  1. Hệ thống hiển thị hộp thoại xác nhận dọn sạch giỏ hàng.
  2. Sau khi xác nhận, Zustand store thực thi `clearCart()`: mảng `items` trở về rỗng `[]`, `appliedPromotion` trở về `null`.
  3. Xóa dữ liệu trong `localStorage` và hiển thị màn hình Empty Cart.

#### AF-05: Khách hàng chủ động Hủy áp dụng mã khuyến mãi (Remove Voucher)
- **Điểm rẽ:** Khách hàng đang có mã khuyến mãi được áp dụng thành công nhưng đổi ý muốn gỡ mã (bấm nút "Hủy mã" hoặc biểu tượng dấu X cạnh tên mã).
- **Xử lý:**
  1. Giao diện Client gọi action `removePromotion()` của `useCartStore`.
  2. Thuộc tính `appliedPromotion` được gán về `null`, số tiền giảm giá đưa về `0đ`.
  3. Tổng tiền dự kiến được tính lại bằng đúng giá trị tạm tính `cartSubtotal`.
  4. Cập nhật `localStorage` và thông báo cho người dùng: *"Đã hủy áp dụng mã khuyến mãi"*.

#### AF-06: Khách hàng Thay đổi sang một Mã khuyến mãi khác
- **Điểm rẽ:** Giỏ hàng đang có mã voucher A hợp lệ, khách hàng nhập mã voucher B vào ô và bấm "Áp dụng".
- **Xử lý:**
  1. Hệ thống gửi yêu cầu thẩm định mã B lên API `POST /api/v1/promotions/validate`.
  2. Nếu mã B hợp lệ: Hệ thống ghi đè mã B vào store, tính lại số tiền giảm theo mã B và hủy bỏ mã A (Không cộng dồn 2 mã).
  3. Nếu mã B không hợp lệ: Hệ thống báo lỗi mã B và **giữ nguyên** mã A hợp lệ trước đó.

#### AF-07: Người dùng Tải lại trang (F5) hoặc Mở lại trình duyệt (Hydratation)
- **Điểm rẽ:** Người dùng nhấn F5 tại bất kỳ trang nào hoặc tắt trình duyệt rồi truy cập lại.
- **Xử lý:**
  1. Khi ứng dụng Next.js khởi tạo tại Client, Zustand Middleware đọc dữ liệu đã serialize từ `localStorage`.
  2. Hệ thống nạp lại đầy đủ danh sách món, cấu hình Size, Topping và mã voucher đang áp dụng.
  3. Giao diện Cart Badge và Giỏ hàng hiển thị đầy đủ thông tin cũ mà không bị mất dữ liệu.

---

#### 2.4.3 Các Luồng Ngoại Lệ (Exception Flows - EF)

#### EF-01: Sản phẩm đã Hết hàng hoặc Ngừng kinh doanh khi mở Modal
- **Điều kiện kích hoạt:** Khách hàng bấm chọn một món đồ uống trên Menu nhưng tại thời điểm đó món có `stock == 0` hoặc bị quản trị viên đặt `isAvailable = false`.
- **Xử lý:**
  1. Nút chọn món trên Menu đã bị vô hiệu hóa kèm nhãn **"Hết hàng"** từ Chức năng 1 (FR-01).
  2. Nếu khách hàng cố tình can thiệp mở modal qua URL/Script, modal hiển thị thông báo lỗi: *"Sản phẩm hiện đang tạm ngưng phục vụ"* và khóa nút "Thêm vào giỏ hàng".
  3. Use Case kết thúc, không thêm món vào giỏ.

#### EF-02: Tăng số lượng vượt quá Tồn kho khả dụng của sản phẩm
- **Điều kiện kích hoạt:** Khách hàng bấm nút `+` trên modal hoặc trong giỏ hàng khi tổng số lượng của sản phẩm đó đã bằng đúng `availableStock`.
- **Xử lý:**
  1. Hệ thống chặn thao tác tăng số lượng, giữ nguyên số lượng hiện tại.
  2. Nút `+` chuyển sang trạng thái vô hiệu hóa (`disabled`).
  3. Hệ thống hiển thị thông báo cảnh báo (Toast hoặc Alert): *"Rất tiếc, chỉ còn X sản phẩm trong kho"*.

#### EF-03: Mã khuyến mãi Không tồn tại hoặc Bị vô hiệu hóa (`isActive == false`)
- **Điều kiện kích hoạt:** Khách hàng nhập mã voucher không có trong CSDL hoặc mã đã bị Admin tắt kích hoạt.
- **Xử lý:**
  1. API `POST /api/v1/promotions/validate` truy vấn không thấy bản ghi hoặc bản ghi có `isActive == false`.
  2. API trả về mã lỗi `HTTP 400 Bad Request`:
     ```json
     {
       "statusCode": 400,
       "message": "Mã khuyến mãi không tồn tại hoặc đã bị vô hiệu hóa.",
       "error": "Bad Request"
     }
     ```
  3. Giao diện Client hiển thị viền đỏ quanh ô nhập liệu và hiển thị thông điệp lỗi rõ ràng. Mức giảm giá giữ nguyên 0đ.

#### EF-04: Mã khuyến mãi Chưa đến ngày áp dụng hoặc Đã hết hạn sử dụng
- **Điều kiện kích hoạt:** Thời điểm gửi request `serverNow < startDate` hoặc `serverNow > endDate`.
- **Xử lý:**
  1. `PromotionsService` đối soát thời gian của máy chủ API với khoảng hiệu lực của mã.
  2. API trả về mã lỗi `HTTP 400 Bad Request`:
     ```json
     {
       "statusCode": 400,
       "message": "Mã khuyến mãi đã hết hạn sử dụng.",
       "error": "Bad Request"
     }
     ```
  3. Giao diện Client thông báo mã đã hết hạn sử dụng, không áp dụng chiết khấu.

#### EF-05: Mã khuyến mãi Đã hết lượt sử dụng trên toàn hệ thống
- **Điều kiện kích hoạt:** Cột `usedCount >= usageLimit` trong bảng `Promotion`.
- **Xử lý:**
  1. `PromotionsService` phát hiện số lượt dùng thực tế đã chạm ngưỡng cho phép của chiến dịch.
  2. API trả về lỗi `HTTP 400 Bad Request` kèm thông báo: *"Mã khuyến mãi đã hết lượt sử dụng."*.
  3. Client hiển thị thông báo lỗi và không áp dụng giảm giá.

#### EF-06: Giỏ hàng Chưa đạt Giá trị Đơn hàng Tối thiểu (`minOrderValue`)
- **Điều kiện kích hoạt:** Giá trị tạm tính `cartSubtotal` nhỏ hơn giá trị `minOrderValue` của mã voucher.
- **Xử lý:**
  1. `PromotionsService` phát hiện $\text{cartSubtotal} < \text{minOrderValue}$.
  2. API trả về lỗi `HTTP 400 Bad Request`:
     ```json
     {
       "statusCode": 400,
       "message": "Đơn hàng tối thiểu phải từ 100.000đ để áp dụng mã khuyến mãi này.",
       "error": "Bad Request"
     }
     ```
  3. Giao diện hiển thị cảnh báo hướng dẫn: *"Bạn cần mua thêm X đ để sử dụng mã này"*.

#### EF-07: Giỏ hàng Biến động làm Mất tính Hợp lệ của Mã đang áp dụng (Auto Invalidation)
- **Điều kiện kích hoạt:** Khách hàng đã áp mã `BREWLITE20` thành công (yêu cầu đơn tối thiểu 100.000đ khi tạm tính đang là 110.000đ). Sau đó, khách hàng xóa bớt một món đồ uống làm tạm tính giảm xuống còn 75.000đ.
- **Xử lý:**
  1. Zustand store lắng nghe biến động của `items` và tự động kích hoạt hàm đối soát `revalidatePromotion()`.
  2. Hệ thống nhận diện $\text{newSubtotal} < \text{appliedPromo.minOrderValue}$.
  3. Hệ thống tự động gỡ bỏ mã khuyến mãi (`appliedPromotion = null`), đưa tiền giảm về 0đ.
  4. Hiển thị thông báo cảnh báo màu vàng cho người dùng: *"Mã khuyến mãi BREWLITE20 đã tự động bị hủy do đơn hàng không còn đủ giá trị tối thiểu 100.000đ"*.

#### EF-08: Sự cố Kết nối Mạng hoặc Máy chủ API Gặp lỗi (`HTTP 500 / Network Error`)
- **Điều kiện kích hoạt:** Thiết bị khách hàng mất kết nối Internet hoặc dịch vụ Backend NestJS gặp sự cố khi đang bấm "Áp dụng" mã.
- **Xử lý:**
  1. Thư viện gọi API (Fetch/Axios) bắt lỗi timeout hoặc lỗi kết nối.
  2. Nút "Áp dụng" thoát khỏi trạng thái loading.
  3. Giao diện hiển thị thông báo: *"Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền và thử lại."*.
  4. Giỏ hàng và các món ăn đã chọn được giữ nguyên vẹn 100%, không bị ảnh hưởng.

#### EF-09: Dữ liệu Giỏ hàng trong `localStorage` bị Lỗi Cú pháp hoặc Hỏng Cấu trúc
- **Điều kiện kích hoạt:** Người dùng hoặc tiện ích mở rộng trình duyệt vô tình chỉnh sửa giá trị chuỗi JSON trong key lưu trữ của Zustand thành định dạng không hợp lệ.
- **Xử lý:**
  1. Middleware `persist` của Zustand khi thực hiện `JSON.parse` phát hiện ngoại lệ cú pháp (`SyntaxError`).
  2. Cơ chế bọc lỗi (`onRehydrateStorage`) bắt ngoại lệ và tự động xóa key bị lỗi trong `localStorage`.
  3. Hệ thống khởi tạo lại giỏ hàng rỗng sạch sẽ (`items: [], appliedPromotion: null`).
  4. Ứng dụng hoạt động bình thường, không xảy ra hiện tượng Crash giao diện hoặc màn hình trắng (White Screen).

---

### 2.5 Hợp đồng Dữ liệu & Thiết kế Kỹ thuật Chi tiết

#### 2.5.1 Client Domain Model (TypeScript Interfaces – Zustand Store)

```typescript
// apps/web/src/store/useCartStore.ts

export type SizeOption = 'S' | 'M' | 'L';

export interface ToppingOption {
  id: string;
  name: string;
  price: number;
}

export interface CustomizationOptions {
  size: SizeOption;
  sizePrice: number; // S: 0, M: 6000, L: 10000
  toppings: ToppingOption[];
  sugarLevel: number; // 0, 30, 50, 70, 100
  iceLevel: number; // 0, 30, 50, 70, 100
}

export interface CartItem {
  itemKey: string; // Hash duy nhất của cấu hình
  productId: string;
  productName: string;
  productImage: string;
  basePrice: number;
  options: CustomizationOptions;
  unitPrice: number; // basePrice + sizePrice + sum(toppings)
  quantity: number;
  lineSubtotal: number; // unitPrice * quantity
}

export interface AppliedPromotion {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number | null;
  calculatedDiscount: number;
}

export interface CartStoreState {
  items: CartItem[];
  appliedPromotion: AppliedPromotion | null;
  
  // Actions
  addItem: (product: any, options: CustomizationOptions, quantity: number) => void;
  updateQuantity: (itemKey: string, delta: number) => void;
  removeItem: (itemKey: string) => void;
  clearCart: () => void;
  applyPromotion: (promotion: AppliedPromotion) => void;
  removePromotion: () => void;
  
  // Computed Getters
  getCartSubtotal: () => number;
  getDiscountAmount: () => number;
  getFinalTotal: () => number;
  getTotalItemsCount: () => number;
}
```

#### 2.5.2 Backend Domain Entity (NestJS / Prisma Schema – Promotion Entity)

```prisma
// apps/api/prisma/schema.prisma

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

model Promotion {
  id                String       @id @default(uuid())
  code              String       @unique
  description       String?
  discountType      DiscountType
  discountValue     Decimal      @db.Decimal(10, 2)
  minOrderValue     Decimal      @default(0) @db.Decimal(10, 2)
  maxDiscountAmount Decimal?     @db.Decimal(10, 2)
  usageLimit        Int          @default(100)
  usedCount         Int          @default(0)
  startDate         DateTime
  endDate           DateTime
  isActive          Boolean      @default(true)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  orders            Order[]
}
```

#### 2.5.3 Chi tiết Hợp đồng Endpoint API: Thẩm định Khuyến mãi (`POST /api/v1/promotions/validate`)

#### Yêu cầu gửi lên (Request Specification):
- **URL:** `/api/v1/promotions/validate`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Request DTO Body:**
  ```json
  {
    "code": "BREWLITE20",
    "cartSubtotal": 120000
  }
  ```

#### Phản hồi thành công (HTTP 200 OK):
```json
{
  "valid": true,
  "promoId": "8f9a2b1c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
  "code": "BREWLITE20",
  "description": "Giảm 20% cho đơn hàng từ 100.000đ (Tối đa 30.000đ)",
  "discountType": "PERCENTAGE",
  "discountValue": 20,
  "discountAmount": 24000,
  "previewTotal": 96000
}
```

#### Phản hồi lỗi nghiệp vụ (HTTP 400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Đơn hàng tối thiểu phải từ 100.000đ để áp dụng mã khuyến mãi này.",
  "error": "Bad Request"
}
```

---

### 2.6 Ràng buộc Kỹ thuật, Hiệu năng & Tiêu chuẩn Phi chức năng

1. **Hiệu năng Giao diện (Client-side Latency):** Thao tác bấm đổi Size, chọn Topping và cập nhật giá tạm tính trên Modal phải hoàn thành hiển thị trong vòng **dưới 50ms**.
2. **Hiệu năng Máy chủ (Server Latency):** Thời gian phản hồi của endpoint `POST /api/v1/promotions/validate` (bao gồm truy vấn CSDL PostgreSQL và tính toán chiết khấu) phải đạt **dưới 200ms** ở mức tải tiêu chuẩn.
3. **Tiết kiệm Dung lượng Lưu trữ (Storage Efficiency):** Payload lưu trữ trạng thái giỏ hàng trong `localStorage` được tinh gọn tối đa (chỉ lưu các trường định danh và cấu hình thiết yếu), đảm bảo kích thước lưu trữ luôn **dưới 50KB** (rất an toàn so với hạn mức 5MB của trình duyệt).
4. **Chuẩn hóa Đầu vào:** Chuỗi ký tự mã khuyến mãi tự động được loại bỏ khoảng trắng thừa (`trim()`) và chuyển sang chữ hoa (`toUpperCase()`) trước khi gửi lên máy chủ hoặc thẩm định.
5. **Độ tin cậy Bền vững:** Không bị phụ thuộc vào phiên đăng nhập; khách hàng chưa đăng nhập (`Guest`) vẫn có thể tùy biến món và lưu giỏ hàng bình thường. Khi chuyển sang bước Checkout yêu cầu đăng nhập, giỏ hàng vẫn được bảo toàn nguyên vẹn sau khi đăng nhập thành công nhờ cơ chế chuyển hướng `redirect=/checkout`.

---

### 2.7 Ma trận Truy vết Toàn diện (Full Traceability Matrix)

| Yêu cầu Nghiệp vụ (SRS) | Quy tắc Nghiệp vụ (BR) | Tiêu chí Chấp nhận (AC) | Kịch bản / Luồng Use Case | Thành phần Code Hiện thực (Sprint 2) |
| :--- | :--- | :--- | :--- | :--- |
| **FR-03.1, FR-03.2** | BR-03.1 (Đơn giá/Size) | AC-03.01, AC-03.02 | Luồng chính (Bước 1, 2) | `apps/web/src/components/ProductCustomizationModal.tsx` |
| **FR-03.3, FR-03.4** | BR-03.1 (Topping/Khẩu vị) | AC-03.02 | Luồng chính (Bước 2, 3) | `apps/web/src/components/ProductCustomizationModal.tsx` |
| **FR-03.5** | BR-03.1 (Tạm tính tức thời) | AC-03.02 | Luồng chính (Bước 3) | `apps/web/src/components/ProductCustomizationModal.tsx` |
| **FR-03.6, FR-03.7** | BR-03.2 (Composite Key) | AC-03.04, AC-03.05, AC-03.06 | Luồng chính (Bước 5), AF-01 | `apps/web/src/store/useCartStore.ts` |
| **FR-03.8, FR-03.9** | BR-03.6 (Số lượng $\ge 1$) | AC-03.08, AC-03.09 | AF-02, AF-03 | `apps/web/src/app/cart/page.tsx`, `useCartStore.ts` |
| **FR-03.10** | BR-03.3 (Tồn kho khả dụng) | AC-03.07 | EF-02 | `apps/web/src/store/useCartStore.ts` |
| **FR-03.11** | BR-03.4 (Zustand Persist) | AC-03.10, AC-03.12 | Luồng chính (Bước 6), AF-07, EF-09 | `apps/web/src/store/useCartStore.ts` |
| **FR-03.12** | BR-03.7 (Cart Badge) | AC-03.03, AC-03.04 | Luồng chính (Bước 6) | `apps/web/src/components/Navbar.tsx` |
| **FR-09.1, FR-09.2** | BR-09.1 (Nhập Promo) | AC-09.01 | Luồng chính (Bước 9, 10) | `apps/web/src/app/cart/page.tsx` |
| **FR-09.3, FR-09.4** | BR-09.2, BR-09.3 (Validate) | AC-09.01, AC-09.02 | Luồng chính (Bước 11) | `apps/api/src/promotions/promotions.service.ts` |
| **FR-09.5** | BR-09.3 (Hiển thị chiết khấu)| AC-09.01, AC-09.02 | Luồng chính (Bước 12) | `apps/web/src/app/cart/page.tsx` |
| **FR-09.6** | BR-09.2 (Báo lỗi cụ thể) | AC-09.03, 04, 05, 06 | EF-03, EF-04, EF-05, EF-06 | `apps/api/src/promotions/promotions.service.ts` |
| **FR-09.7** | BR-09.1 (Hủy mã) | AC-09.07 | AF-05 | `apps/web/src/store/useCartStore.ts` |
| **FR-09.8** | BR-09.4 (Auto Invalidate) | AC-09.08 | EF-07 | `apps/web/src/store/useCartStore.ts` |
| **FR-09.9** | BR-09.5 (Không tăng usedCount)| AC-09.10 | Luồng chính (Bước 11) | `apps/api/src/promotions/promotions.service.ts` |
| **FR-09.10** | BR-09.1 (1 Voucher duy nhất)| AC-09.01 | AF-06 | `apps/web/src/store/useCartStore.ts` |

---

### 2.8 Hướng dẫn Kiểm thử & Tiêu chí Nghiệm thu Hoàn thành (DoD)

#### 2.8.1 Bộ Tiêu chí Hoàn thành (Definition of Done - DoD cho Task 1.3)
1. **Đầy đủ Cấu trúc Đặc tả Use Case chuẩn quốc tế:** Tài liệu bao gồm đầy đủ Metadata, Tiền điều kiện, Hậu điều kiện, Failure Guarantees, Sơ đồ Use Case, Luồng chính từng bước, Luồng thay thế (AF-01 đến AF-07), Luồng ngoại lệ (EF-01 đến EF-09), Hợp đồng Dữ liệu DTO và Ma trận truy vết.
2. **Sơ đồ Use Case hợp chuẩn UML 2.5:** Sơ đồ được vẽ chi tiết bằng PlantUML (`.puml`), kết xuất file vector `.svg` chất lượng cao, thể hiện chính xác các mối quan hệ `<<include>>` và `<<extend>>`.
3. **Phân định rõ ranh giới Kiến trúc:** Giải trình rõ ràng nguyên tắc Giá Client chỉ là tạm tính (Preview Non-Authoritative) và việc khóa tồn kho / trừ lượt dùng voucher chỉ được thực hiện ở Backend trong Database Transaction tại `UC-04`.
4. **Tính tương thích và Không xung đột:** Tài liệu được hợp nhất xuyên suốt từ `UC-01` đến `UC-06` trong `docs/requirements/usecase-checkout-spec.md`, liên kết chặt chẽ giữa `UC-02` (Quỳnh), `UC-03` (Hiếu), `UC-04` (Chiến) và `UC-05` (Quang).

---

## Mục 3: Chức năng 3 – UC-03: Đăng ký, Đăng nhập, Hồ sơ cá nhân & Xác thực Phân quyền JWT + Health Check (Hiếu - PO)

### 3.1 Sơ đồ Use Case (Use Case Diagram)

- **Actor chính:**
  - **Khách hàng vãng lai (`Guest`):** Người chưa có tài khoản hoặc chưa đăng nhập vào hệ thống.
  - **Khách hàng thành viên (`Authenticated Customer`):** Người dùng đã đăng nhập thành công, sở hữu định danh người dùng và chuỗi `accessToken` (JWT) hợp lệ.
- **Ranh giới hệ thống:** `BrewLite - Chức năng 3 (FR-04): Quản lý Tài khoản, Xác thực JWT & Giám sát Health`. Toàn bộ quá trình băm mật khẩu, so khớp đối soát, ký số token và kiểm tra phân quyền diễn ra nội bộ trong `apps/api` (NestJS) kết nối CSDL PostgreSQL qua Prisma ORM.
- **Tệp nguồn PlantUML:** [`docs/diagrams/uc-03-auth.puml`](../diagrams/uc-03-auth.puml)
- **Tệp ảnh kết xuất SVG:** [`docs/diagrams/uc-03-auth.svg`](../diagrams/uc-03-auth.svg)

#### Bảng thành phần Use Case và Quan hệ:

| Mã Use Case | Tên Use Case / Thành phần | Kiểu quan hệ | Ý nghĩa nghiệp vụ |
| :--- | :--- | :---: | :--- |
| **UC-03** | **Quản lý Tài khoản, Xác thực JWT & Giám sát Health** | Base Use Case | Điểm vào chính quản lý định danh người dùng, phiên bảo mật và tình trạng kết nối hệ thống. |
| **UC-03.1** | **Đăng ký tài khoản mới** | Con của UC-03 | Cho phép khách hàng vãng lai đăng ký tài khoản thành viên với thông tin email duy nhất, số điện thoại, họ tên và mật khẩu. |
| **UC-03.2** | **Đăng nhập hệ thống & Nhận JWT Token** | Con của UC-03 | Xác thực danh tính qua email/mật khẩu, cấp phát chuỗi ký số JWT mang payload chuẩn `{ sub, email, role }`. |
| **UC-03.3** | **Xem thông tin hồ sơ & Điểm tích lũy (`/auth/me`)** | Con của UC-03 | Cho phép khách hàng đã đăng nhập truy xuất hồ sơ cá nhân và số dư điểm thưởng tích lũy qua endpoint bảo mật. |
| **UC-03.4** | **Xác thực mật khẩu Bcrypt** | `<<include>>` | Bắt buộc đối soát mật khẩu đã băm một chiều (`saltRounds >= 10`) tại Business Logic Layer trước khi cấp phiên đăng nhập. |
| **UC-03.5** | **Cấp phát AccessToken (JWT)** | `<<include>>` | Bắt buộc ký số token bảo mật bằng khóa bí mật (`JWT_SECRET`) với thời hạn 24 giờ sau khi xác thực thành công. |
| **UC-03.6** | **Đăng nhập tiếp tục đơn hàng (`?redirect=/checkout`)** | `<<extend>>` | Kích hoạt khi khách hàng chưa đăng nhập bấm nút thanh toán; chuyển hướng đăng nhập và quay lại trang checkout bảo toàn giỏ hàng. |
| **UC-03.7** | **Giám sát sức khỏe hệ thống (`GET /api/v1/health`)** | Base Use Case | Endpoint kiểm tra sức khỏe đa tầng (Liveness/Readiness probe), thực thi câu lệnh truy vấn CSDL `SELECT 1` để xác minh kết nối. |

#### Hiển thị Sơ đồ UC-03:

![Sơ đồ Use Case UC-03](../diagrams/uc-03-auth.svg)

---

### 3.2 Đặc tả chi tiết Use Case UC-03

#### 3.2.1 Thông tin chung (General Information)

| Thuộc tính | Chi tiết mô tả |
| :--- | :--- |
| **Mã Use Case** | **UC-03** |
| **Tên Use Case** | Đăng ký, Đăng nhập, Quản lý Hồ sơ cá nhân và Xác thực Phân quyền JWT |
| **Actor chính** | Khách hàng vãng lai (`Guest`), Khách hàng thành viên (`Authenticated Customer`) |
| **Actor hỗ trợ** | Hệ thống Backend NestJS Auth Module, Cơ sở Dữ liệu PostgreSQL (Prisma ORM) |
| **Trigger (Kích hoạt)** | Khách hàng bấm nút "Đăng nhập" / "Đăng ký" trên Navbar, hoặc hệ thống tự động kích hoạt khi khách hàng bấm "Tiến hành Thanh toán" tại màn hình Giỏ hàng mà chưa có phiên đăng nhập hợp lệ. |
| **Tiền điều kiện (Pre-conditions)** | 1. Hệ thống Backend API và Database đang hoạt động bình thường (Endpoint `GET /api/v1/health` trả về `HTTP 200 OK`).<br>2. Thiết bị người dùng có kết nối mạng Internet và hỗ trợ lưu trữ trạng thái tại trình duyệt (hỗ trợ lưu trữ `accessToken` trong bộ nhớ/cookie/localStorage). |
| **Hậu điều kiện (Post-conditions)** | 1. **Đối với Đăng ký:** Bản ghi người dùng mới được lưu trữ an toàn trong bảng `User` của PostgreSQL; mật khẩu được băm bằng thuật toán `bcrypt` (`saltRounds >= 10`), điểm thưởng ban đầu khởi tạo là `0`.<br>2. **Đối với Đăng nhập:** Khách hàng được cấp phát một chuỗi `accessToken` (JWT) hợp lệ; Client tự động đính kèm token này vào header `Authorization: Bearer <token>` cho mọi thao tác đặt hàng, thanh toán và kiểm tra điểm thưởng. |

#### 3.2.2 Luồng sự kiện chính (Main Success Scenario - Đăng nhập hệ thống)

1. **Khách hàng** truy cập màn hình Đăng nhập (`/login`) trên ứng dụng Next.js.
2. Khách hàng nhập **Email** và **Mật khẩu** vào biểu mẫu, sau đó bấm nút "Đăng nhập".
3. **Next.js UI (Presentation Layer)** thực hiện kiểm tra định dạng tại Client (Form Validation: kiểm tra email đúng định dạng regex, mật khẩu tối thiểu 6 ký tự).
4. Sau khi form hợp lệ, giao diện hiển thị trạng thái đang xử lý (Loading indicator) và gửi một HTTP request:
   ```http
   POST /api/v1/auth/login
   Content-Type: application/json

   {
     "email": "customer@brewlite.com",
     "password": "Password123"
   }
   ```
5. **AuthController (NestJS API)** tiếp nhận request, ValidationPipe kiểm tra cấu trúc `LoginDto`, và chuyển tiếp dữ liệu đến **AuthService (Business Logic Layer)**.
6. **AuthService** gọi tầng truy xuất dữ liệu **PrismaService (Data Access Layer)** truy vấn bản ghi người dùng trong bảng `User` dựa trên `email`:
   ```sql
   SELECT id, email, "passwordHash", role, "fullName" FROM "User" WHERE email = $1;
   ```
7. Nếu tìm thấy người dùng, **AuthService** sử dụng thư viện `bcrypt` để đối chiếu mật khẩu nhập vào với mật khẩu đã băm trong CSDL:
   ```typescript
   const isMatch = await bcrypt.compare(password, user.passwordHash);
   ```
8. Khi mật khẩu hoàn toàn trùng khớp, **AuthService** gọi **JwtService** để ký và sinh chuỗi `accessToken` có thời hạn (24h) với payload:
   ```json
   {
     "sub": "user-uuid-1234",
     "email": "customer@brewlite.com",
     "role": "CUSTOMER"
   }
   ```
9. **AuthController** trả về mã phản hồi `HTTP 200 OK` kèm theo dữ liệu:
   ```json
   {
     "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
     "user": {
       "id": "user-uuid-1234",
       "email": "customer@brewlite.com",
       "fullName": "Hàn Minh Hiếu",
       "role": "CUSTOMER"
     }
   }
   ```
10. **Next.js UI** lưu trữ `accessToken` vào trạng thái xác thực và tự động cấu hình Axios/Fetch Interceptor để tự động gắn header:
    ```http
    Authorization: Bearer <accessToken>
    ```
11. Giao diện hiển thị thông báo đăng nhập thành công và điều hướng người dùng về trang chủ (hoặc trang được chỉ định bởi tham số `redirect`).

#### 3.2.3 Các luồng thay thế (Alternative Flows)

- **AF-01: Đăng ký tài khoản mới khi chưa có tài khoản:**
  - Tại bước 1, khách hàng chọn chuyển sang trang Đăng ký (`/register`).
  - Khách hàng điền đầy đủ: Họ tên, Email, Số điện thoại và Mật khẩu (tối thiểu 6 ký tự).
  - Client gửi `POST /api/v1/auth/register` với body `RegisterDto`.
  - Backend kiểm tra email chưa tồn tại trong CSDL, thực hiện băm mật khẩu một chiều:
    ```typescript
    const passwordHash = await bcrypt.hash(password, 10);
    ```
  - Backend lưu bản ghi người dùng mới vào PostgreSQL với vai trò `CUSTOMER` và `loyaltyPoints = 0`.
  - Hệ thống tự động ký cấp JWT `accessToken` và tự động đăng nhập luôn cho khách hàng, sau đó chuyển hướng về trang Menu hoặc đích đến tương ứng.

- **AF-02: Đăng nhập trong luồng Đặt hàng mà không làm mất Giỏ hàng (`?redirect=/checkout`):**
  - Khách hàng bấm nút "Tiến hành Thanh toán" tại màn hình Giỏ hàng (`/cart`) khi chưa đăng nhập.
  - Hệ thống tự động phát hiện trạng thái chưa xác thực và điều hướng sang trang Đăng nhập kèm tham số truy vấn: `/login?redirect=/checkout`.
  - Khách hàng thực hiện đăng nhập thành công theo Luồng chính.
  - Hệ thống phát hiện tham số `redirect`, tự động đưa khách hàng trở lại ngay màn hình `/checkout`. Toàn bộ dữ liệu giỏ hàng được bảo toàn nguyên vẹn 100% trong Zustand Store và `localStorage`.

#### 3.2.4 Các luồng ngoại lệ (Exception Flows)

- **EF-01: Đăng ký với Email đã tồn tại trong hệ thống (Trùng Email):**
  - Tại bước AF-01, nếu `email` đã có người khác đăng ký trong CSDL, `AuthService` phát hiện xung đột và ném ngoại lệ `ConflictException`.
  - Backend phản hồi mã lỗi `HTTP 409 Conflict`:
    ```json
    { "statusCode": 409, "message": "Email đã được đăng ký trong hệ thống." }
    ```
  - Next.js UI bắt mã lỗi và hiển thị thông báo cảnh báo màu đỏ trực tiếp dưới ô nhập Email, không cho phép gửi tiếp.

- **EF-02: Đăng nhập thất bại do sai Email hoặc sai Mật khẩu:**
  - Tại bước 7 của Luồng chính, nếu không tìm thấy người dùng hoặc hàm `bcrypt.compare` trả về `false`, `AuthService` lập tức ném ngoại lệ `UnauthorizedException`.
  - Backend trả về mã lỗi `HTTP 401 Unauthorized`:
    ```json
    { "statusCode": 401, "message": "Email hoặc mật khẩu không chính xác." }
    ```
  - Client hiển thị hộp thoại thông báo lỗi: *"Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại!"*.

- **EF-03: Token hết hạn hoặc bị giả mạo khi truy cập API bảo vệ:**
  - Khi khách hàng gửi request tới endpoint yêu cầu xác thực (`POST /orders`, `GET /orders/my-orders`, `GET /loyalty/balance`) nhưng token bị sai chữ ký hoặc quá hạn 24h:
  - `JwtAuthGuard` tại Backend chặn đứng request ngay tại tầng Controller và phản hồi `HTTP 401 Unauthorized`.
  - Axios Interceptor tại Client bắt mã 401, tự động xóa token bị hỏng khỏi bộ nhớ và chuyển hướng người dùng về trang `/login` để xác thực lại.

- **EF-04: Mất kết nối CSDL hoặc lỗi hệ thống nghiêm trọng:**
  - Nếu kết nối tới cơ sở dữ liệu PostgreSQL bị gián đoạn, dịch vụ phản hồi `HTTP 500 Internal Server Error` (hoặc `HTTP 503 Service Unavailable` từ endpoint `/health`).
  - Client hiển thị component `ErrorState` kèm nút *"Thử lại"* để người dùng tải lại khi mạng ổn định.

#### 3.2.5 Ranh giới kiến trúc, Quy chuẩn bảo mật & Ràng buộc phi chức năng

##### 1. Bảo mật mật khẩu người dùng (Bcrypt Hashing Strategy):
- Tuyệt đối không lưu trữ mật khẩu ở dạng văn bản thô (Plain-text) dưới bất kỳ hình thức nào.
- Mật khẩu trước khi ghi vào CSDL bắt buộc phải được băm qua hàm `bcrypt.hash(password, 10)` với hệ số làm chậm `saltRounds >= 10`. Chuỗi kết quả có dạng chuỗi ký tự chuẩn `$2b$10$...` đảm bảo an toàn tuyệt đối trước các hình thức tấn công vét cạn (Brute-force) hoặc từ điển bảng cầu vồng (Rainbow Table).

##### 2. Cơ chế Xác thực Phi trạng thái (Stateless JWT Authentication):
- Sử dụng mô hình Token-based Stateless: Backend không lưu trữ trạng thái phiên trong bộ nhớ (session memory), giúp hệ thống dễ dàng mở rộng theo chiều ngang (Scale-out) trên các container Docker độc lập.
- Token được ký số bằng thuật toán HMAC-SHA256 với bí mật `JWT_SECRET` lấy từ biến môi trường. Thời hạn sống (`expiresIn`) được cấu hình cố định là 24 giờ.
- Payload token chỉ chứa thông tin định danh tối giản (`sub`: User ID, `email`, `role`), không lưu thông tin nhạy cảm (như mật khẩu băm, thẻ ngân hàng).

##### 3. Tự động hóa Gắn Header & Bảo toàn Giỏ hàng:
- Thư viện HTTP Client (`api-client.ts`) cấu hình Request Interceptor tự động đọc token từ bộ lưu trữ an toàn và đính kèm vào Header `Authorization: Bearer <token>`.
- Khi người dùng bấm đặt hàng chưa đăng nhập, tham số `redirect=/checkout` truyền qua URL cho phép Next.js đưa người dùng trở lại đúng bước thanh toán sau khi đăng nhập thành công mà không làm gián đoạn trải nghiệm mua sắm.

##### 4. Endpoint Giám sát Sức khỏe Đa tầng (`GET /api/v1/health`):
- Phục vụ cơ chế tự động hóa kiểm tra sức khỏe hệ thống (Readiness & Liveness Probes) trong hạ tầng CI/CD và Docker.
- Endpoint thực hiện truy vấn `SELECT 1` trực tiếp xuống PostgreSQL thông qua Prisma. Nếu CSDL phản hồi thành công, trả về `HTTP 200 OK { status: 'ok', checks: { database: { status: 'connected' } } }`. Nếu CSDL mất kết nối, lập tức trả về `HTTP 503 Service Unavailable`.

---

---

## Mục 4: Chức năng 4 – UC-04: Khởi tạo đơn hàng & Khóa tồn kho an toàn (Chiến)

### 4.1 Sơ đồ Use Case (Use Case Diagram)

- **Actor chính:** Khách hàng đã đăng nhập (`Authenticated Customer`).
- **Ranh giới hệ thống:** `BrewLite - Chức năng 4 (FR-05): Khởi tạo đơn hàng & Khóa tồn kho an toàn`.
- **Tệp nguồn PlantUML:** [`docs/diagrams/uc-04-create-order.puml`](../diagrams/uc-04-create-order.puml)
- **Tệp ảnh kết xuất SVG:** [`docs/diagrams/uc-04-create-order.svg`](../diagrams/uc-04-create-order.svg)

#### Bảng thành phần Use Case và Quan hệ:

| Mã Use Case | Tên Use Case / Thành phần | Kiểu quan hệ | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| **UC-04.1** | **Gửi yêu cầu khởi tạo đơn hàng (Place Order)** | Base Use Case | Use Case trọng tâm: Khách hàng đã đăng nhập bấm xác nhận đặt đơn từ màn hình Giỏ hàng. |
| **UC-04.2** | **Tính toán lại tổng tiền đơn hàng tại Business Logic Layer** | `<<include>>` | Quan hệ bắt buộc: Tính lại toàn bộ đơn giá, phụ thu size/topping và khuyến mãi tại Core Layer CSDL, tuyệt đối không dùng giá Client gửi lên (Tuân thủ kiến trúc phân tầng của Thầy Phiêu). |
| **UC-04.3** | **Kiểm tra & Khóa trừ tồn kho đồng thời (Optimistic Locking Transaction)** | `<<include>>` | Quan hệ bắt buộc: Kiểm tra định lượng nguyên liệu thô theo `RecipeItem` (ví dụ: 1 ly = 10g cà phê + 1 ly nhựa) và trừ tồn kho `Ingredient` bằng Optimistic Locking trong `prisma.$transaction`. |
| **Mở rộng** | **Áp dụng mã khuyến mãi (?promoCode)** | `<<extend>>` | Điểm mở rộng: Kích hoạt khi khách hàng có gửi kèm mã khuyến mãi hợp lệ. |

#### Hiển thị Sơ đồ UC-04:

![UC-04 – Khởi tạo đơn hàng và Khóa tồn kho an toàn](../diagrams/uc-04-create-order.svg)

---

### 4.2 Đặc tả chi tiết Use Case UC-04 (Use Case Trọng tâm Task 1.3 AS2)

#### 4.2.1 Thông tin chung (General Information)

| Thuộc tính | Nội dung quy định |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-04 – Khởi tạo đơn hàng và Khóa tồn kho an toàn (Database Transaction)** |
| **Truy vết yêu cầu** | `FR-05.1` đến `FR-05.12`; `BR-05.1` đến `BR-05.8`; `AC-05.01` đến `AC-05.12`; Phạm vi `MVP-04`. |
| **Actor chính** | **Khách hàng đã đăng nhập (`Authenticated Customer`).** *(Hệ thống chỉ hỗ trợ đặt hàng cho thành viên đã đăng nhập có token JWT hợp lệ, không hỗ trợ khách vãng lai).* |
| **Actor hỗ trợ / Hệ thống** | NestJS `OrdersService` (Business Layer), PostgreSQL Database qua Prisma ORM. |
| **Trigger (Sự kiện kích hoạt)** | Khách hàng nhấn nút **"Đặt hàng / Tiến hành thanh toán"** từ màn hình Giỏ hàng / Checkout. |
| **Tiền điều kiện (Pre-conditions)** | 1. Khách hàng đã đăng nhập và sở hữu **JWT Token hợp lệ** (được kiểm tra qua `JwtAuthGuard`).<br>2. Giỏ hàng có ít nhất 1 sản phẩm hợp lệ (`items.length >= 1`).<br>3. Hệ thống Backend API và Database PostgreSQL hoạt động bình thường. |
| **Hậu điều kiện thành công (Post-conditions)** | 1. Bản ghi `Order` với trạng thái `PENDING` và mã `#ID` cùng các bản ghi `OrderItem` được lưu vào CSDL.<br>2. Số lượng tồn kho nguyên liệu thô (`Ingredient.stockQuantity` theo định mức `RecipeItem`: ví dụ 1 ly = 10g cà phê + 1 cái ly) được trừ tương ứng và cột `version` tăng thêm 1 trong cùng một Database Transaction.<br>3. Nếu có mã khuyến mãi: `usedCount` tăng 1 và số tiền giảm giá được lưu trong đơn.<br>4. Giỏ hàng Zustand phía Client được làm rỗng (`clearCart`).<br>5. Hệ thống trả về thông tin đơn hàng trạng thái `PENDING` để chuyển sang bước Thanh toán (UC-05). |
| **Bảo đảm khi thất bại (Failure Guarantees)** | **Rollback 100% Transaction:** Toàn bộ quá trình tính giá, đối soát công thức, trừ kho nguyên vật liệu và tạo đơn được bọc trong một Database Transaction duy nhất (`prisma.$transaction`). Nếu xảy ra bất kỳ lỗi nào (hết nguyên liệu, xung đột version, lỗi hệ thống), giao dịch tự động Rollback triệt để, không tạo đơn rác và không làm suy giảm tồn kho. |

---

#### 4.2.2 Luồng sự kiện chính (Main Flow)

1. **Khách hàng** bấm nút "Đặt hàng", Client gửi request `POST /api/v1/orders` kèm JWT Token trong Header `Authorization` và danh sách payload `{ productId, size, toppings, quantity, promoCode }` *(tuyệt đối không dùng giá tiền từ Client gửi lên)*.
2. **`JwtAuthGuard`** xác thực token JWT và **`ValidationPipe`** kiểm tra cấu trúc dữ liệu `CreateOrderDto`.
3. Tại **`OrdersService`** (Business Logic Layer), hệ thống mở một giao dịch cơ sở dữ liệu `prisma.$transaction()`:
   - **3.1. Truy vấn thông tin sản phẩm:** Truy vấn thông tin và đơn giá gốc (`basePrice`), trạng thái bán (`isAvailable`) của từng món từ bảng `Product`.
   - **3.2. Tính toán tiền tại Core Layer:** Thực hiện công thức tính tiền chuẩn kiến trúc phân tầng:
     $$\text{itemTotal} = (\text{basePrice} + \text{sizePrice} + \text{toppingsPrice}) \times \text{quantity}$$
     $$\text{rawTotal} = \sum \text{itemTotal}$$
     Trừ đi khuyến mãi hợp lệ để ra tổng thanh toán cuối cùng `finalAmount`. *(Tuân thủ tuyệt đối lời dặn của Thầy Phiêu về Kiến trúc phân tầng, không tin giá Client).*
   - **3.3. Cập nhật trừ kho nguyên liệu thô bằng Optimistic Locking:**
     - Đối soát định lượng nguyên liệu qua `RecipeItem` (ví dụ: 1 ly Cà phê đen = 10g hạt cà phê + 1 ly nhựa; kho còn 100g cà phê chỉ pha được tối đa 10 ly).
     - Kiểm tra điều kiện đủ định lượng: $\text{stockQuantity} \ge \text{requiredQty}$.
     - Thực thi câu lệnh cập nhật nguyên tử có kiểm tra phiên bản trên bảng `Ingredient`:
       ```sql
       UPDATE "Ingredient"
       SET "stockQuantity" = "stockQuantity" - :requiredQty,
           "version" = "version" + 1
       WHERE "id" = :ingredientId
         AND "version" = :currentVersion
         AND "stockQuantity" >= :requiredQty;
       ```
   - **3.4. Tạo bản ghi đơn hàng:** Tạo bản ghi `Order` với trạng thái `PENDING`, mã đơn `#BL-YYYYMMDD-XXXX` và lưu chi tiết các dòng `OrderItem`, `OrderItemTopping`.
4. **Transaction commit thành công:** Hệ thống trả về mã `201 Created` kèm thông tin đơn hàng mã `#ID` trạng thái `PENDING` để Client chuyển tiếp sang màn hình Thanh toán (UC-05).

---

#### 4.2.3 Luồng thay thế (Alternative Flow)

- **3a. Khách hàng có áp dụng mã khuyến mãi hợp lệ:**
  - Hệ thống kiểm tra điều kiện mã: còn hạn, còn lượt dùng và đạt giá trị đơn tối thiểu.
  - Ghi nhận `promotionId`, trừ `discountAmount` vào `finalAmount` và tăng `usedCount` của mã khuyến mãi thêm 1 trong cùng Transaction.

---

#### 4.2.4 Luồng ngoại lệ (Exception Flow – Trọng tâm Thầy chấm điểm)

- **3b. Hết hàng nguyên liệu hoặc Xung đột đặt hàng đồng thời (Concurrency):**
  - **Tình huống:** Hai khách hàng cùng bấm mua ly cuối cùng trong 1 tích tắc, hoặc khách đặt 11 ly trong khi kho nguyên liệu chỉ còn 100g cà phê (tối đa pha 10 ly).
  - **Cơ chế xử lý:** Câu lệnh cập nhật Optimistic Lock trả về `affectedRows === 0` (do `version` đã bị thay đổi bởi khách kia hoặc lượng nguyên liệu tồn kho $\text{stockQuantity} < \text{requiredQty}$).
  - **Phản hồi hệ thống:** Hệ thống tự động `ROLLBACK 100%` Transaction, không tạo đơn rác và trả về HTTP `409 Conflict`:
    > *"Sản phẩm/Nguyên liệu pha chế vừa hết hàng hoặc thay đổi tồn kho, vui lòng kiểm tra lại giỏ hàng."*
- **3c. DTO Validation hoặc Token không hợp lệ:**
  - `JwtAuthGuard` từ chối nếu không có token hoặc token hết hạn $\rightarrow$ trả về HTTP `401 Unauthorized`.
  - `ValidationPipe` chặn nếu giỏ hàng rỗng hoặc số lượng âm $\rightarrow$ trả về HTTP `400 Bad Request`.
- **3d. Sự cố kết nối cơ sở dữ liệu:**
  - Transaction tự động Rollback, không lưu dữ liệu dở dang $\rightarrow$ trả về HTTP `500 Internal Server Error`.

---

#### 4.2.5 Bảng tổng hợp các mã lỗi ngoại lệ (Exception Matrix)

| Mã lỗi | Điểm phát sinh | Nguyên nhân & Điều kiện | Xử lý của Hệ thống & Phản hồi | Hướng xử lý của Khách hàng |
| :--- | :--- | :--- | :--- | :--- |
| **E1** | Bước 2 | DTO Validation thất bại: Giỏ hàng rỗng (`items: []`), số lượng âm/bằng 0, hoặc thiếu JWT Token hợp lệ. | Controller ngắt xử lý, không mở Transaction. Trả về HTTP `400 Bad Request` (hoặc `401 Unauthorized`) kèm thông báo lỗi chi tiết. | Khách hàng kiểm tra lại giỏ hàng hoặc đăng nhập lại trước khi gửi yêu cầu. |
| **E2** | Bước 3.1 | Món trong giỏ đã bị Quản lý tắt bán (`isAvailable == false`). | Transaction tự động ROLLBACK. Trả về HTTP `409 Conflict` với thông báo: *"Món [Tên sản phẩm] hiện đã ngừng kinh doanh. Vui lòng xóa món khỏi giỏ hàng."* | Giao diện đánh dấu món bị ngừng bán, khách hàng xóa món và đặt lại. |
| **E3** | Bước 3.3 | Hết hoặc không đủ nguyên vật liệu để pha chế (`Ingredient.stockQuantity < requiredQty`). | Transaction tự động ROLLBACK. Trả về HTTP `409 Conflict` với mã lỗi `INSUFFICIENT_INGREDIENT`: *"Không đủ nguyên liệu [Tên nguyên vật liệu] để pha chế món [Tên sản phẩm] (thiếu X [đơn vị g/ml/cái]). Vui lòng chọn món khác hoặc giảm số lượng."* | Giỏ hàng được giữ nguyên; khách hàng giảm số lượng hoặc chọn món khác. |
| **E4** | Bước 3.3 | Xung đột đồng thời Optimistic Locking trên bảng `Ingredient` (`version mismatch` do có đơn khác vừa chốt tiêu hao cùng nguyên liệu). | Transaction tự động ROLLBACK. Trả về HTTP `409 Conflict` với mã lỗi `CONCURRENCY_CONFLICT`: *"Hệ thống đang phục vụ nhiều đơn hàng cùng lúc. Vui lòng bấm đặt lại để cập nhật tồn kho mới nhất."* | Khách hàng bấm lại nút "Đặt hàng" để hệ thống kiểm tra tồn kho phiên bản mới. |
| **E5** | Bước 3.2 | Mã giảm giá không còn hợp lệ (Hết hạn, hết lượt, hoặc giỏ hàng không đạt giá trị tối thiểu). | Transaction tự động ROLLBACK. Trả về HTTP `400 Bad Request` với mã `INVALID_VOUCHER`: *"Mã khuyến mãi không hợp lệ hoặc đã hết lượt sử dụng."* | Giao diện hủy áp dụng mã voucher lỗi và đề xuất khách đặt đơn không dùng mã hoặc nhập mã khác. |
| **E6** | Bất kỳ bước nào trong Transaction | Mất kết nối CSDL PostgreSQL hoặc lỗi hệ thống nội bộ. | Database Transaction tự động `ROLLBACK` triệt để. Hệ thống ghi log lỗi và trả về HTTP `500 Internal Server Error`: *"Hệ thống gián đoạn tạm thời. Đơn hàng của bạn chưa được tạo và chưa bị trừ tiền/tồn kho."* | Khách hàng thử lại sau vài giây; dữ liệu giỏ hàng phía Client được bảo toàn nguyên vẹn. |

---

#### 4.2.6 Ranh giới kiến trúc, Thiết kế giao dịch và Ràng buộc phi chức năng

##### 1. Phân định trách nhiệm kiến trúc phân tầng 3-Tier (Architectural Separation):

```text
+-----------------------+     POST /api/v1/orders      +-----------------------------------------+
|   Presentation Layer  | ---------------------------> |         Business Logic Layer            |
| (OrdersController)    |                              |           (OrdersService)               |
| - Parse JSON Body     | <--------------------------- | - Recalculate 100% pricing from DB      |
| - Validate DTO        |       Order Created (201)    | - Validate Voucher & Business Rules     |
| - Return HTTP Status  |                              | - Resolve RecipeItem & Aggregate Demands|
+-----------------------+                              | - Manage Transaction & Optimistic Lock  |
                                                       +-----------------------------------------+
                                                                    |                 ^
                                                 prisma.$transaction|                 | Data Records
                                                                    v                 |
                                                       +-----------------------------------------+
                                                       |           Data Access Layer             |
                                                       |       (PostgreSQL via Prisma ORM)       |
                                                       | - Table Product (basePrice, available)  |
                                                       | - Table Ingredient (stockQty, version)  |
                                                       | - Table RecipeItem (productId, ingId)   |
                                                       | - Table Order, OrderItem, Topping       |
                                                       +-----------------------------------------+
```

##### 2. Cơ chế Optimistic Locking chống bán âm kho nguyên vật liệu (Concurrency Strategy):
- **Bối cảnh thực tế F&B:** Cửa hàng đồ uống không bao giờ pha sẵn 100 ly để trong kho thành phẩm. Thay vào đó, tồn kho thực tế lưu ở dạng **Nguyên vật liệu thô (`Ingredient`)**: hạt cà phê (gam), sữa đặc (ml), đường (gam), ly nhựa (cái). Mỗi món đồ uống được liên kết với một hoặc nhiều nguyên liệu thông qua bảng **Công thức pha chế (`RecipeItem`)**.
- **Nguyên lý kiểm soát đồng thời:** Cột số nguyên `version` (mặc định khởi tạo `1`) được đặt trên bảng `Ingredient` (thay vì bảng `Product`).
- **Quy trình thực thi trong Transaction (`OrdersService.createOrder`):**
  1. Trích xuất danh sách công thức pha chế của tất cả sản phẩm trong đơn hàng.
  2. Tổng hợp tổng nhu cầu tiêu hao cho từng nguyên vật liệu (`ingredientDemands`).
  3. Kiểm tra và thực thi cập nhật nguyên tử có điều kiện phiên bản (Optimistic Concurrency Control):

```typescript
// 1. Tập hợp tổng nhu cầu nguyên vật liệu từ công thức pha chế (RecipeItem)
const ingredientDemands = new Map<string, { required: number; name: string; unit: string }>();

for (const item of dto.items) {
  const recipes = await tx.recipeItem.findMany({
    where: { productId: item.productId },
    include: { ingredient: true },
  });

  for (const recipe of recipes) {
    const current = ingredientDemands.get(recipe.ingredientId) || {
      required: 0,
      name: recipe.ingredient.name,
      unit: recipe.ingredient.unit,
    };
    current.required += recipe.quantityRequired * item.quantity;
    ingredientDemands.set(recipe.ingredientId, current);
  }
}

// 2. Trừ tồn kho từng nguyên vật liệu với Optimistic Locking
for (const [ingredientId, demand] of ingredientDemands.entries()) {
  const ingredient = await tx.ingredient.findUnique({
    where: { id: ingredientId },
  });

  if (!ingredient || ingredient.stockQuantity < demand.required) {
    throw new ConflictException(
      `Không đủ nguyên vật liệu: ${demand.name} (cần ${demand.required}${demand.unit}, trong kho còn ${ingredient?.stockQuantity ?? 0}${demand.unit})`,
    );
  }

  // Câu lệnh UPDATE có điều kiện version và stockQuantity
  const updateResult = await tx.ingredient.updateMany({
    where: {
      id: ingredientId,
      version: ingredient.version,
      stockQuantity: { gte: demand.required },
    },
    data: {
      stockQuantity: { decrement: demand.required },
      version: { increment: 1 },
    },
  });

  // Nếu count === 0: Có giao dịch khác đã commit trước làm thay đổi version hoặc làm cạn kho
  if (updateResult.count === 0) {
    throw new ConflictException(
      `Xung đột đồng thời khi cập nhật nguyên liệu: ${demand.name}. Vui lòng thử lại.`,
    );
  }
}
```

- Kỹ thuật này là **Non-blocking**, không khóa hàng (Pessimistic Row Lock) gây thắt nút cổ chai tại Database, đảm bảo hiệu năng cao khi nhiều khách hàng cùng đặt hàng trong giờ cao điểm.

##### 3. Quy định Hạn thời gian thanh toán và Hoàn kho tự động (Timeout & Restock Rollback):
- Khi đơn hàng tạo thành công ở trạng thái `PENDING`, trường `paymentDeadline` được thiết lập là **15 phút** kể từ thời điểm tạo.
- Nếu sau 15 phút, khách hàng không thực hiện thanh toán (hoặc thanh toán thất bại tại UC-05), tiến trình nền (Scheduled Cron Job / Event) sẽ chuyển trạng thái đơn hàng sang `CANCELLED` và tự động hoàn trả số lượng nguyên vật liệu theo đúng công thức:
  ```sql
  UPDATE "Ingredient"
  SET "stockQuantity" = "stockQuantity" + :requiredQuantity,
      "version" = "version" + 1
  WHERE "id" = :ingredientId;
  ```

##### 4. Công thức tính Số ly tối đa đặt được của một món (Truy vết Menu & Giỏ hàng):
Để đảm bảo trải nghiệm người dùng không chọn vượt quá khả năng phục vụ của kho, phía Presentation Layer (Menu - Duy & Giỏ hàng - Quỳnh) tính toán số ly tối đa của mỗi món theo công thức:
$$\text{maxOrderableGlasses}(\text{Product}) = \min_{r \in \text{RecipeItems}} \left( \left\lfloor \frac{\text{Ingredient}_r.\text{stockQuantity}}{r.\text{quantityRequired}} \right\rfloor \right)$$
- Nếu $\text{maxOrderableGlasses} == 0$, hệ thống tự động gắn nhãn **"Hết hàng"** trên menu và vô hiệu hóa nút thêm vào giỏ.

##### 5. Ràng buộc hiệu năng (Performance Constraints):
- Thời gian xử lý trọn vẹn của endpoint `POST /api/v1/orders` (bao gồm DTO Validation, Recalculate giá, đối soát công thức pha chế, trừ tồn kho `Ingredient` bằng Optimistic Lock và Commit Transaction) phải đạt **dưới 300ms** ở mức tải tiêu chuẩn 50 yêu cầu đồng thời trên môi trường thử nghiệm Docker.

---

---

## Mục 5: Chức năng 5 – UC-05: Thanh toán Đơn hàng Sandbox/Webhook 2 Bước & Chống Trừ tiền Trùng lặp (`Idempotency-Key`) (Quang)

### 5.1 Thuộc tính Định danh (Identification)
- **Mã Use Case:** `UC-05`
- **Tên Use Case:** **Thanh toán Đơn hàng qua Cổng Sandbox, Nhận JSON Message qua Webhook Backend và Chống Trừ tiền Hai lần (Idempotency)**
- **Phân hệ Trực thuộc:** Phân hệ Thanh toán & Chống Trừ tiền Trùng lặp (`PaymentsModule` - `FR-06`)
- **Mức độ Ưu tiên:** **Must Have** (Bắt buộc trong MVP Sprint 2)
- **Độ phức tạp Kỹ thuật:** Cao (Xử lý giao dịch phân tán 2 bước, Database Transaction, đối soát chữ ký số Webhook và cơ chế khóa bất biến Idempotency).

---

### 5.2 Tác nhân (Actors)

| Loại Tác nhân | Tên Tác nhân | Vai trò và Trách nhiệm đối với Use Case |
| :--- | :--- | :--- |
| **Tác nhân Chính<br>(Primary Actor)** | **Khách hàng đã đăng nhập<br>(Authenticated Customer)** | • Sở hữu đơn hàng hợp lệ đang ở trạng thái `PENDING`.<br>• Lựa chọn phương thức thanh toán phù hợp (Ví MoMo, VNPay, VietQR Sandbox).<br>• Thực hiện thao tác bấm nút "Xác nhận thanh toán" tại giao diện `/checkout` và thực hiện giao dịch trên cổng thanh toán Sandbox. |
| **Tác nhân Phụ / Đối tác<br>(Secondary / External Actor)** | **Cổng Thanh toán Sandbox<br>(Sandbox Payment Gateway)** | • Đóng vai trò hệ thống đối tác tài chính bên ngoài trong môi trường thử nghiệm (VNPay Sandbox, MoMo Sandbox, VietQR Sandbox).<br>• Khởi tạo phiên thanh toán, cung cấp URL cổng hoặc mã QR giao dịch.<br>• Sau khi khách thanh toán trên trang Sandbox, bắn bản tin JSON message đối soát về **Webhook của Backend (`POST /api/v1/payments/webhook`)** kèm chữ ký số xác thực để Backend chuyển trạng thái đơn hàng. |

---

### 5.3 Sự kiện Kích hoạt (Trigger)
Khách hàng sau khi hoàn tất bước Đặt hàng (tạo thành công đơn hàng `PENDING` ở màn hình Giỏ hàng) được hệ thống điều hướng tự động sang trang `/checkout`. Tại đây, khách hàng chọn một trong các phương thức thanh toán (Ví MoMo, VNPay hoặc Thẻ ngân hàng) và bấm nút **"Xác nhận thanh toán"**.

---

### 5.4 Tiền điều kiện (Pre-conditions)
Để Use Case `UC-05` có thể bắt đầu thực thi hợp lệ, hệ thống đòi hỏi bắt buộc phải thỏa mãn 3 điều kiện tiên quyết sau:
1. **Trạng thái Phiên làm việc (Session Auth):** Khách hàng đã đăng nhập thành công vào hệ thống và sở hữu chuỗi mã xác thực `accessToken` (JWT) còn hiệu lực trong header `Authorization: Bearer <token>`.
2. **Trạng thái Đơn hàng Hợp lệ:** Đơn hàng mục tiêu (`orderId`) đã được khởi tạo bởi `UC-04`, thuộc quyền sở hữu của chính người dùng đang đăng nhập, và đang ở trạng thái chính xác là `PENDING`. Số lượng tồn kho và nguyên liệu tương ứng đã được tạm khóa thành công trong CSDL.
3. **Mã khóa Bất biến Client (Idempotency-Key):** Phía giao diện Frontend (Next.js) đã chủ động sinh một chuỗi định danh duy nhất theo chuẩn UUID phiên bản 4 (ví dụ: `d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a`) gắn liền với phiên thanh toán của đơn hàng này trước khi bắn request sang Backend.

---

### 5.5 Hậu điều kiện (Post-conditions)

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
   - **Kích hoạt Cơ chế Hoàn trả Tồn kho Nguyên liệu Tức thì (Restock Rollback):** Toàn bộ số lượng nguyên vật liệu thô pha chế (`Ingredient.stockQuantity` theo định mức công thức `RecipeItem`) được cộng hoàn trả lại 100% nguyên vẹn trong cùng một Database Transaction.
   - Giao diện hiển thị thông báo lỗi chi tiết và hướng dẫn khách hàng chọn phương thức thanh toán khác hoặc thử lại.
3. **Trường hợp Gửi trùng Lặp (Idempotency Protection):**
   - Nếu nhận request có cùng `Idempotency-Key` trong vòng 24 giờ, hệ thống trả về ngay kết quả giao dịch đã có trong CSDL (HTTP 200 OK) mà không khởi tạo thêm giao dịch mới và không trừ tiền lần 2.

---

### 5.6 Luồng Sự kiện Chính (Main Flow)

| Bước | Thực thể Thực hiện | Hành động Chi tiết |
| :-: | :--- | :--- |
| **1** | Khách hàng (Client) | Tại trang `/checkout`, khách hàng chọn phương thức thanh toán mong muốn (Ví MoMo, VNPay hoặc Thẻ ngân hàng nội địa) và bấm nút **"Xác nhận thanh toán"**. |
| **2** | Next.js UI (Frontend) | Giao diện tự động sinh một mã `Idempotency-Key` (chuẩn UUID v4), đóng gói payload DTO `{ orderId: string, paymentMethod: string }` và gửi HTTP request `POST /api/v1/payments` kèm theo: <br>• Header `Authorization: Bearer <accessToken>`<br>• Header `Idempotency-Key: <UUIDv4>`. |
| **3** | NestJS Controller | `PaymentsController` tiếp nhận request. `JwtAuthGuard` giải mã xác thực token người dùng, `ValidationPipe` thẩm định cấu trúc dữ liệu đầu vào theo `ProcessPaymentDto`, đồng thời kiểm tra sự hiện diện của Header `Idempotency-Key`. |
| **4** | PaymentsService (Core) | `PaymentsService` thực thi câu lệnh SQL truy vấn trong CSDL PostgreSQL:<br>`SELECT * FROM "Payment" WHERE "idempotencyKey" = $1`. |
| **5** | PaymentsService (Core) | Hệ thống xác định đây là một giao dịch thanh toán hoàn toàn mới (mã khóa `idempotencyKey` chưa từng tồn tại trong CSDL). |
| **6** | PaymentsService (Core) | Hệ thống truy vấn thông tin đơn hàng theo `orderId`, xác thực đơn hàng thuộc quyền sở hữu của khách hàng đang đăng nhập và xác nhận đơn hàng đang ở đúng trạng thái `PENDING`. |
| **7** | PaymentsService & DB | Hệ thống tạo một bản ghi `Payment` mới trong bảng `Payment` với trạng thái ban đầu là `PENDING`, lưu trữ `orderId`, `idempotencyKey`, `amount` (lấy từ `Order.finalAmount`), `paymentMethod` và thời điểm tạo `createdAt`. |
| **8** | PaymentsService & Sandbox | `PaymentsService` gọi sang Cổng Thanh toán Sandbox (`SandboxPaymentGateway.createPaymentUrl(...)`) gửi thông tin đơn hàng và số tiền để khởi tạo phiên giao dịch bên thứ ba; Cổng Sandbox trả về đường dẫn thanh toán (`paymentUrl`) hoặc mã QR Sandbox. |
| **9** | Sandbox Gateway & Webhook | Khách hàng thực hiện thao tác quét mã/nhập thẻ test trên giao diện Cổng Sandbox. Sau khi xử lý hoàn tất, Cổng Thanh toán Sandbox bắn bản tin JSON message về endpoint **Webhook của Backend (`POST /api/v1/payments/webhook`)** kèm `orderId`, `transactionRef`, trạng thái `SUCCESS` và chữ ký số xác thực HMAC. |
| **10** | PaymentsService & DB | Webhook tại `PaymentsService` (Backend) tiếp nhận bản tin JSON từ Sandbox, xác thực tính toàn vẹn của chữ ký số đối soát và mở một PostgreSQL Transaction (`prisma.$transaction()`):<br>1. Cập nhật bản ghi `Payment`: `status = SUCCESS`, `transactionRef = txRef`, `paidAt = now()`.<br>2. Cập nhật bản ghi `Order`: `status = PAID`, `updatedAt = now()`.<br>3. Commit Transaction thành công vào CSDL. |
| **11** | Backend & Next.js UI | Backend phản hồi mã trạng thái `HTTP 201 Created` kèm `PaymentSuccessDto`. Giao diện Frontend dọn sạch giỏ hàng trong Zustand Store và tự động điều hướng khách hàng sang trang Biên nhận đơn hàng thành công (`/checkout/success`). |

---

### 5.7 Các Luồng Sự kiện Thay thế (Alternative Flows)

#### Luồng Thay thế 3a: Xử lý Sự cố Rớt mạng hoặc Khách bấm Đúp nút Thanh toán (Idempotency Cache Hit)
- **Hoàn cảnh xảy ra:** Khách hàng sử dụng mạng 4G/WiFi chập chờn hoặc mất kiên nhẫn bấm liên tiếp 2 lần vào nút "Thanh toán", khiến giao diện gửi lên máy chủ 2 request có cùng Header `Idempotency-Key` trong khoảng thời gian rất ngắn.
- **Quy trình xử lý của Hệ thống:**
  1. Ở request thứ nhất: Hệ thống tiếp nhận và đang tiến hành xử lý bình thường theo Luồng chính.
  2. Ở request thứ hai: Tại Bước 4, `PaymentsService` truy vấn CSDL và phát hiện `idempotencyKey` này **đã tồn tại** trong bảng `Payment`.
  3. Hệ thống lập tức bỏ qua toàn bộ các Bước 6, 7, 8 (tuyệt đối KHÔNG gọi lại cổng thanh toán `SandboxPaymentGateway`, KHÔNG sinh thêm giao dịch mới và KHÔNG trừ tiền lần 2).
  4. Hệ thống trích xuất bản ghi `Payment` đã được tạo trước đó từ CSDL và lập tức hoàn trả kết quả về cho Client với mã trạng thái `HTTP 200 OK` (thay vì 201 Created).
  5. Giao diện người dùng nhận được phản hồi, tiếp tục quy trình hiển thị bình thường mà không gây ra bất kỳ xung đột tài chính nào.

#### Luồng Thay thế 4a: Khách hàng Thay đổi Phương thức Thanh toán trước khi Xác nhận
- **Hoàn cảnh xảy ra:** Khách hàng ban đầu chọn Ví MoMo nhưng sau đó đổi ý muốn thanh toán qua Thẻ ATM nội địa trước khi thực hiện giao dịch.
- **Quy trình xử lý:** Khách hàng chọn lại phương thức thanh toán trên giao diện. Frontend Next.js tự động hủy phiên hiện tại, sinh ra một mã `Idempotency-Key` hoàn toàn mới tương ứng với phương thức mới và gửi yêu cầu thanh toán lại từ đầu.

---

### 5.8 Các Luồng Ngoại lệ (Exception Flows)

#### Luồng Ngoại lệ 5a: Thanh toán Thất bại từ Cổng Sandbox hoặc Hủy đơn / Quá hạn TTL (Kích hoạt Restock Rollback)
- **Hoàn cảnh xảy ra:** Giao dịch trên Cổng Thanh toán Sandbox thất bại (thẻ test không đủ số dư, thẻ hết hạn, nhập sai OTP) và Cổng Sandbox bắn bản tin JSON message báo lỗi (`{ status: "FAILED", errorCode: "INSUFFICIENT_FUNDS" }`) về Webhook của Backend (`POST /api/v1/payments/webhook`), hoặc phiên thanh toán quá hạn TTL (5–15 phút giữ chỗ nguyên liệu `Hold Stock`), hoặc khách hàng chủ động hủy đơn khi đang `PENDING` (Tuyệt đối không dùng nút bấm giả lập Thành công/Thất bại trên UI hay hardcode trong code).
- **Quy trình xử lý Hoàn kho Nguyên tử (Restock Rollback):**
  1. Tại Bước 9, Webhook của Backend nhận được bản tin JSON từ Cổng Sandbox thông báo giao dịch thất bại (hoặc hệ thống ghi nhận quá hạn TTL / hủy đơn).
  2. `PaymentsService` lập tức mở một PostgreSQL Database Transaction (`prisma.$transaction()`) để thực thi chuỗi hành động hoàn kho:
     - **Cập nhật Payment:** `UPDATE "Payment" SET "status" = 'FAILED', "failureReason" = $errorCode WHERE "id" = $paymentId;`
     - **Cập nhật Order:** `UPDATE "Order" SET "status" = 'CANCELLED' WHERE "id" = $orderId;`
     - **Hoàn trả Tồn kho Nguyên liệu Thô:** Duyệt qua danh sách `OrderItem` của đơn hàng, đối chiếu định mức công thức pha chế (`RecipeItem`) và cộng hoàn trả lại 100% số lượng nguyên vật liệu thô (`Ingredient`):
       ```sql
       UPDATE "Ingredient"
       SET "stockQuantity" = "stockQuantity" + $requiredQty,
           "version" = "version" + 1
       WHERE "id" = $ingredientId;
       ```
     - **Commit Transaction:** Toàn bộ trạng thái cập nhật và khôi phục tồn kho nguyên liệu được ghi nhận nguyên tử và vĩnh viễn vào CSDL.
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

### 5.9 Bảng Tổng hợp Quy tắc Nghiệp vụ (Business Rules - BR)

| Mã Quy tắc | Tên Quy tắc Nghiệp vụ | Nội dung Chi tiết & Ràng buộc Kỹ thuật |
| :---: | :--- | :--- |
| **`BR-PAY-01`** | **Tính Bất biến & Duy nhất của Idempotency-Key** | Mã `Idempotency-Key` bắt buộc phải là một chuỗi UUID v4 chuẩn. Cột `idempotencyKey` trong bảng `Payment` được đánh chỉ mục duy nhất (`UNIQUE INDEX`). Trong khung thời gian 24 giờ kể từ thời điểm tạo, mọi request có cùng key đều trả về nguyên trạng kết quả giao dịch trước đó, không được phép trừ tiền lần 2. |
| **`BR-PAY-02`** | **Quy tắc 2 Bước (Cấm Gán PAID Khống)** | Nghiêm cấm tuyệt đối việc gán trạng thái `Order = PAID` ngay tại thời điểm nhận request thanh toán từ Client. Việc chuyển trạng thái sang `PAID` bắt buộc phải trải qua 2 bước độc lập: (1) Khởi tạo bản ghi `Payment` trạng thái `PENDING`; (2) Chỉ cập nhật sang `PAID` khi nhận được bản tin Webhook Callback hợp lệ có đối soát chữ ký số từ Cổng thanh toán Sandbox. |
| **`BR-PAY-03`** | **Hoàn kho Nguyên tử (Atomic Restock Rollback)** | Khi một giao dịch thanh toán bị xác định thất bại hoặc hủy bỏ, việc cập nhật `Payment = FAILED`, `Order = CANCELLED` và việc cộng trả lại số lượng tồn kho nguyên vật liệu thô (`Ingredient.stockQuantity` theo định mức `RecipeItem`) bắt buộc phải được đóng gói trong **cùng 1 Database Transaction duy nhất**. Nếu transaction gặp sự cố, hệ thống phải rollback toàn bộ. |
| **`BR-PAY-04`** | **Bảo toàn Đơn giá phía Máy chủ** | Số tiền thanh toán (`Payment.amount`) bắt buộc phải được lấy trực tiếp từ trường `Order.finalAmount` đã được tính toán độc lập tại tầng Business Logic Layer (`OrdersService`), tuyệt đối không chấp nhận bất kỳ số tiền nào do Client tự ý gửi lên trong payload. |
| **`BR-PAY-05`** | **Thời hạn Hết hạn Thanh toán (Payment Timeout)** | Một phiên thanh toán có thời hạn hiệu lực tối đa là **15 phút**. Nếu sau 15 phút không nhận được bản tin Webhook Callback xác thực từ cổng thanh toán, đơn hàng sẽ tự động hết hạn, chuyển sang trạng thái `CANCELLED` và kích hoạt luồng hoàn trả tồn kho tự động. |

---

### 5.10 Đặc tả Hợp đồng Giao diện API (API Contracts / DTO Specifications)

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
      "paymentUrl": "https://sandbox.brewlite.vn/pay/momo?token=sandbox_token_123",
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
      "transactionRef": "SANDBOX-MOMO-987654",
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
    "transactionRef": "SANDBOX-MOMO-987654",
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

### 5.11 Sơ đồ Use Case Phân hệ Thanh toán (`uc-05-payment`)

Toàn bộ luồng tương tác và quan hệ nghiệp vụ giữa Khách hàng, Cổng thanh toán Sandbox và các use case thành phần của `FR-06` được thể hiện đồng bộ trong sơ đồ dưới đây (chuẩn đen - trắng phục vụ in ấn theo mẫu hướng dẫn):

![Sơ đồ Use Case Thanh toán UC-05](../diagrams/uc-05-payment.svg)

> - **Mã nguồn PlantUML:** [`docs/diagrams/uc-05-payment.puml`](../diagrams/uc-05-payment.puml)
> - **Ảnh Vector SVG:** [`docs/diagrams/uc-05-payment.svg`](../diagrams/uc-05-payment.svg)


---

## Mục 6: Chức năng 6 – UC-06: Biên nhận Điện tử, Lịch sử Đơn hàng, Theo dõi Trạng thái (`OrderStatusStepper`) & Điểm thưởng Loyalty (Sang - SM)

### 6.1 Sơ đồ Use Case Phân hệ Chức năng 6 (`uc-06-history-loyalty`)

![Sơ đồ Use Case UC-06](../diagrams/uc-06-history-loyalty.svg)

#### Bảng Giải thích Các Thành phần Use Case & Quan hệ UML

| Mã thành phần | Tên Use Case / Tác nhân | Loại phần tử / Quan hệ | Ý nghĩa nghiệp vụ trong hệ thống |
| :--- | :--- | :---: | :--- |
| **Actor 1** | **Khách hàng đã đăng nhập (`Authenticated Customer`)** | Primary Actor | Người dùng sở hữu JWT Token hợp lệ, thực hiện xem biên nhận, theo dõi trạng thái đơn, tra cứu lịch sử đơn hàng và quản lý điểm thưởng cá nhân. |
| **Actor 2** | **Nhân viên Quầy / Quản lý (`Barista / Store Manager`)** | Secondary Actor | Nhân sự vận hành tại cửa hàng (`role = STAFF / ADMIN`), tiếp nhận đơn hàng đã thanh toán (`PAID`) và cập nhật tiến trình pha chế (`PREPARING` → `COMPLETED`). |
| **UC-06.1** | **Xem biên nhận điện tử & Theo dõi tiến trình đơn (`OrderStatusStepper`)** | Base Use Case | Hiển thị hóa đơn điện tử chi tiết sau thanh toán và thanh tiến trình 4 bước trạng thái đơn hàng theo thời gian thực. |
| **UC-06.2** | **Xem lịch sử đơn hàng cá nhân (`GET /api/v1/orders/my-orders`)** | Base Use Case | Liệt kê danh sách các đơn hàng thuộc sở hữu của khách hàng theo thứ tự mới nhất đến cũ nhất. |
| **UC-06.3** | **Tra cứu số dư & lịch sử điểm thưởng (`GET /api/v1/loyalty/balance`)** | Base Use Case | Hiển thị tổng điểm tích lũy hiện có (`User.loyaltyPoints`) và danh sách các giao dịch biến động điểm (`EARN`, `REDEEM`, `REFUND`). |
| **UC-06.4** | **Cập nhật trạng thái đơn hàng (`PAID` → `PREPARING` → `COMPLETED`)** | Base Use Case | Cho phép nhân viên pha chế chuyển trạng thái đơn hàng theo đúng trình tự máy trạng thái hữu hạn. |
| **Include 1** | **Kiểm tra quyền sở hữu đơn hàng & Xác thực phiên JWT** | `<<include>>` (từ `UC-06.1`, `UC-06.2`) | Bắt buộc kiểm tra chữ ký JWT và xác minh `order.userId === currentUser.sub` trước khi trả dữ liệu đơn hàng về cho Client. |
| **Include 2** | **Tích lũy điểm thưởng tự động khi đơn `PAID` (`Loyalty: EARN`)** | `<<include>>` (từ `UC-06.1`) | Tự động ghi nhận bản ghi cộng điểm thưởng ($\lfloor \text{finalAmount} / 10.000 \rfloor$) ngay khi đơn hàng hoàn tất thanh toán. |
| **Extend 1** | **Đổi điểm thưởng giảm giá đơn hàng (`LoyaltyTransaction: REDEEM`)** | `<<extend>>` (vào `UC-06.3`) | Mở rộng khi khách hàng có số dư điểm dương và chọn sử dụng điểm để khấu trừ vào giá trị đơn hàng tiếp theo. |

---

### 6.2 Đặc tả Chi tiết Use Case UC-06 (Use Case Specification)

#### 6.2.1 Bảng Thông tin Định danh & Thuộc tính Use Case

| Thuộc tính | Nội dung đặc tả chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-06 – Xem biên nhận, Theo dõi lịch sử đơn hàng, Cập nhật trạng thái và Tích lũy / Đổi điểm thưởng (Loyalty)** |
| **Mã yêu cầu liên kết** | `FR-07` (`FR-07.1`–`FR-07.4`), `FR-08` (`FR-08.1`–`FR-08.2`), `FR-10` (`FR-10.1`–`FR-10.6`); `BR-06.1`–`BR-06.5`; `AC-06.01`–`AC-06.08`. |
| **Actor chính (Primary)** | Khách hàng đã đăng nhập (`Authenticated Customer`). |
| **Actor phụ (Secondary)** | Nhân viên pha chế / Quản lý cửa hàng (`Barista / Store Manager`). |
| **Trigger (Sự kiện kích hoạt)** | 1. Đơn hàng của khách vừa được xác nhận thanh toán thành công (`Order.status = PAID`) và hệ thống tự động chuyển hướng sang `/checkout/success?orderId=:id`.<br>2. Khách hàng bấm vào mục **"Lịch sử đơn hàng & Điểm thưởng"** trên thanh điều hướng.<br>3. Nhân viên quầy bấm cập nhật trạng thái chế biến đơn hàng trên màn hình quản lý đơn. |
| **Tiền điều kiện (Pre-conditions)** | 1. Người dùng đã đăng nhập thành công và gửi kèm chuỗi `accessToken` (JWT) hợp lệ trong Header `Authorization: Bearer <token>`.<br>2. Hệ thống Backend API (`OrdersModule`, `LoyaltyModule`) và cơ sở dữ liệu PostgreSQL đang hoạt động bình thường. |
| **Hậu điều kiện thành công (Post-conditions)** | 1. Khách hàng xem được đầy đủ thông tin biên nhận điện tử, danh sách lịch sử đơn hàng cá nhân và tiến trình trạng thái đơn trên thanh `OrderStatusStepper`.<br>2. Điểm thưởng tích lũy (`EARN`) hoặc điểm thưởng quy đổi (`REDEEM`) được ghi nhận chính xác vào bảng `LoyaltyTransaction` và đồng bộ tức thời với cột `User.loyaltyPoints` trong cùng một Database Transaction.<br>3. Trạng thái đơn hàng được cập nhật đúng quy tắc chuyển trạng thái (`PENDING` → `PAID` → `PREPARING` → `COMPLETED`). |
| **Bảo đảm khi thất bại (Failure Guarantees)** | 1. Không tiết lộ thông tin đơn hàng của người dùng khác dưới bất kỳ hình thức nào (chặn đứng lỗi IDOR với `HTTP 403 Forbidden`).<br>2. Tuyệt đối không cho phép số dư điểm thưởng của khách hàng bị âm (`User.loyaltyPoints >= 0` trong mọi tình huống) hoặc cộng điểm thưởng 2 lần cho cùng một `orderId`. |

---

#### 6.2.2 Luồng Sự kiện Chính (Main Success Scenario)

| Bước | Tác nhân / Thành phần | Hành động xử lý chi tiết |
| :---: | :--- | :--- |
| **1** | **NestJS Backend (`PaymentsService` & `LoyaltyService`)** | Ngay khi nhận được Webhook Callback xác nhận đơn hàng chuyển sang trạng thái `PAID` (từ `UC-05`), bên trong cùng một `prisma.$transaction()`, hệ thống tính số điểm thưởng được cộng theo công thức $\text{earnedPoints} = \lfloor \text{Order.finalAmount} / 10.000 \rfloor$, tạo bản ghi `LoyaltyTransaction (type = 'EARN', points = +earnedPoints, orderId)` và cộng dồn vào `User.loyaltyPoints`. |
| **2** | **Next.js UI (`/checkout/success`)** | Trình duyệt điều hướng khách hàng tới màn hình Biên nhận điện tử (`/checkout/success?orderId=:id`) và gửi request `GET /api/v1/orders/:id` kèm Header `Authorization: Bearer <token>`. |
| **3** | **NestJS (`OrdersController` & `OrdersService`)** | `JwtAuthGuard` xác thực token; `OrdersService` truy vấn đơn hàng kèm `items` và `payment`, kiểm tra điều kiện quyền sở hữu `order.userId === currentUser.sub`, sau đó trả về `HTTP 200 OK` kèm `OrderDetailResponseDto`. |
| **4** | **Next.js UI (`OrderStatusStepper`)** | Giao diện hiển thị biên nhận sắc nét gồm mã đơn `#BL-YYYYMMDD-XXXX`, danh sách món (Size, Topping, đơn giá), tổng tiền đã thanh toán, số điểm thưởng vừa được cộng và thanh tiến trình `OrderStatusStepper` đang ở mốc **`PAID (Đã thanh toán)`**. |
| **5** | **Nhân viên Quầy (`Barista`)** | Nhân viên quầy tiếp nhận đơn hàng mới, bắt đầu pha chế và gửi request `PATCH /api/v1/orders/:id/status` với `{ "status": "PREPARING" }`, và sau khi pha xong cập nhật thành `{ "status": "COMPLETED" }`. |
| **6** | **Khách hàng (`/orders/my-orders`)** | Khách hàng mở trang **Lịch sử đơn hàng & Điểm thưởng**; giao diện gọi đồng thời 2 API: `GET /api/v1/orders/my-orders` và `GET /api/v1/loyalty/balance`. |
| **7** | **NestJS (`OrdersService` & `LoyaltyService`)** | Hệ thống truy vấn danh sách đơn hàng của `userId` sắp xếp theo `createdAt DESC` cùng số dư `loyaltyPoints` và lịch sử biến động `LoyaltyTransaction[]`, trả về `HTTP 200 OK` để giao diện hiển thị trọn vẹn cho khách hàng. |

---

#### 6.2.3 Các Luồng Thay thế (Alternative Flows)

- **AF-01 (Tại Bước 6 – Khách hàng sử dụng điểm thưởng `REDEEM` cho đơn hàng mới):**
  1. Khi khách hàng đang có số dư điểm dương (`User.loyaltyPoints > 0`) và nhập số điểm muốn dùng (`pointsToRedeem`) tại bước đặt hàng:
  2. Hệ thống kiểm tra điều kiện `0 < pointsToRedeem <= user.loyaltyPoints`, quy đổi thành số tiền giảm $\text{loyaltyDiscount} = \text{pointsToRedeem} \times 1.000\text{đ}$.
  3. Bên trong Database Transaction tạo đơn hàng, hệ thống trừ `User.loyaltyPoints = User.loyaltyPoints - pointsToRedeem` và ghi nhận bản ghi `LoyaltyTransaction (type = 'REDEEM', points = -pointsToRedeem, orderId)`.
- **AF-02 (Tại Bước 6 – Tài khoản mới chưa có đơn hàng nào):**
  1. Khi khách hàng mới đăng ký mở trang `/orders/my-orders`, API trả về mảng rỗng `orders: []` và `loyaltyBalance: 0`.
  2. Giao diện hiển thị component `EmptyState` (*"Bạn chưa có đơn hàng nào tại BrewLite"*) kèm nút bấm điều hướng về `/menu`.

---

#### 6.2.4 Các Luồng Ngoại lệ (Exception Flows)

- **EF-01 (Tại Bước 3 – Truy cập trái phép đơn hàng của người dùng khác / Lỗi IDOR):**
  - *Điều kiện kích hoạt:* Khách hàng A thay đổi `orderId` trên thanh địa chỉ URL để cố tình xem biên nhận của Khách hàng B (`order.userId !== currentUser.sub`).
  - *Xử lý của hệ thống:* `OrdersService` phát hiện không khớp chủ sở hữu, lập tức ném ngoại lệ `ForbiddenException` (`HTTP 403 Forbidden` – *"Bạn không có quyền xem thông tin đơn hàng này"*). Giao diện hiển thị thông báo từ chối truy cập và nút quay về trang Lịch sử đơn của mình.
- **EF-02 (Tại Luồng AF-01 – Nhập số điểm quy đổi vượt quá số dư hiện có):**
  - *Điều kiện kích hoạt:* Khách hàng nhập `pointsToRedeem > user.loyaltyPoints` hoặc nhập số âm / số thập phân.
  - *Xử lý của hệ thống:* Backend chặn yêu cầu và trả về mã lỗi `HTTP 400 Bad Request` (*"Số dư điểm thưởng không đủ để thực hiện quy đổi"*), giữ nguyên số dư điểm hiện tại, tuyệt đối không để xảy ra âm điểm.
- **EF-03 (Tại Bước 5 – Chuyển trạng thái đơn hàng sai quy trình State Machine):**
  - *Điều kiện kích hoạt:* Request gọi `PATCH /api/v1/orders/:id/status` cố tình chuyển một đơn hàng đang `PENDING` (chưa thanh toán) hoặc đã `CANCELLED` sang `PREPARING` / `COMPLETED`.
  - *Xử lý của hệ thống:* `OrdersService` kiểm tra bảng chuyển trạng thái hợp lệ (`BR-06.1`), từ chối thực thi và trả về mã lỗi `HTTP 400 Bad Request` (*"Không thể chuyển trạng thái đơn hàng từ trạng thái hiện tại"*).
- **EF-04 (Hoàn trả điểm thưởng khi đơn hàng bị hủy – `REFUND`):**
  - *Điều kiện kích hoạt:* Đơn hàng có sử dụng điểm thưởng (`loyaltyPointsUsed > 0`) nhưng thanh toán thất bại tại `UC-05` hoặc hết hạn thanh toán 15 phút dẫn đến `Order.status = CANCELLED`.
  - *Xử lý của hệ thống:* Bên trong cùng Transaction hủy đơn và hoàn kho nguyên liệu, `LoyaltyService` cộng trả lại đúng `loyaltyPointsUsed` vào `User.loyaltyPoints` và tạo bản ghi `LoyaltyTransaction (type = 'REFUND', points = +loyaltyPointsUsed, orderId)`.