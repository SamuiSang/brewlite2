# BrewLite – Đặc tả Use Case Trọng tâm Quy trình Checkout (UC-04 & UC-05)

- **Dự án:** BrewLite – Hệ thống Đặt đồ uống Trực tuyến (Mobile-first / PWA)
- **Tài liệu:** `docs/requirements/usecase-checkout-spec.md`
- **Giai đoạn:** Task 1.3 – Đặc tả Use Case Quy trình Trọng tâm (Checkout Flow)
- **Thành viên phụ trách:**
  - **4. Chiến (Dev Team):** Chủ trì nửa đầu UC trọng tâm – **Mục 4: UC-04: Đặt đơn hàng & Khóa tồn kho đồng thời** (Mục 4.1 & 4.2).
  - **5. Quang (Dev Team):** Chủ trì nửa sau UC trọng tâm – **Mục 5: UC-05: Thanh toán đơn hàng & Chống trừ tiền trùng lặp (`Idempotency-Key`)** (Mục 5.1 & 5.2).
- **Truy vết:** Kế thừa từ `context-and-scope.md` (MVP-04, MVP-05) và `srs-summary.md` (FR-05, FR-06).

---

## Tổng quan Quy trình Checkout Cốt lõi (End-to-End)

Quy trình Checkout trong hệ thống BrewLite là luồng giao dịch có rủi ro nghiệp vụ cao nhất, quyết định doanh thu và trải nghiệm người dùng. Luồng này được thiết kế theo 2 giai đoạn kế thừa tuần tự:

```text
+----------------------------------------------------------------------------------------------------+
|                         GIAI ĐOẠN 1: KHỞI TẠO ĐƠN & KHÓA KHO NGUYÊN VẬT LIỆU                       |
|                                       (Chiến phụ trách - UC-04)                                     |
|  [Giỏ hàng] ---> POST /api/v1/orders ---> Validate DTO ---> Tính lại 100% tiền tại Business Layer  |
|                                       ---> prisma.$transaction:                                    |
|                                            Đối soát RecipeItem, Trừ kho Ingredient (Optimistic Lock)|
|                                       ---> Lưu Order (PENDING) & OrderItems                         |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                GIAI ĐOẠN 2: THANH TOÁN & CHỐNG TRÙNG LẶP                            |
|                                       (Quang phụ trách - UC-05)                                     |
|  [Đơn PENDING] ---> POST /api/v1/payments ---> Kiểm tra Idempotency-Key UUID                        |
|                                            ---> Mock Payment (Ví điện tử / Thẻ)                     |
|                                            ---> Cập nhật PAID (Thành công) HOẶC CANCELLED & Restock |
|                                                 (Hoàn kho nguyên liệu Ingredient)                   |
+----------------------------------------------------------------------------------------------------+
```

---

## Mục 4: Chức năng 4 – UC-04: Đặt đơn hàng & Khóa tồn kho nguyên vật liệu theo công thức pha chế (Chiến)

### 4.1 Sơ đồ Use Case (Use Case Diagram)

- **Actor chính:** Khách hàng (`Customer / Guest`) – Người dùng ứng dụng web BrewLite (bao gồm cả khách vãng lai và thành viên đã đăng nhập).
- **Ranh giới hệ thống:** `BrewLite - Chức năng 4 (FR-05): Đặt đơn hàng & Khóa tồn kho nguyên vật liệu`. Toàn bộ quá trình tính giá, đối soát công thức pha chế, khóa kho nguyên vật liệu và lưu trữ được thực hiện nội bộ trong API Server và Cơ sở dữ liệu PostgreSQL.
- **Tệp nguồn PlantUML:** [`docs/diagrams/uc-04-create-order.puml`](../diagrams/uc-04-create-order.puml)
- **Tệp ảnh kết xuất SVG:** [`docs/diagrams/uc-04-create-order.svg`](../diagrams/uc-04-create-order.svg)

#### Bảng thành phần Use Case và Quan hệ:

| Mã Use Case | Tên Use Case / Thành phần | Kiểu quan hệ | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| **UC-04** | **Đặt đơn hàng & Khóa kho nguyên liệu** | Base Use Case | Điểm vào chính khi khách hàng bấm xác nhận đặt đơn từ màn hình Giỏ hàng / Checkout. |
| **UC-04.1** | **Xác thực dữ liệu đầu vào (DTO Validation)** | `<<include>>` | Bắt buộc kiểm tra tính hợp lệ của danh sách món, số lượng nguyên dương, thông tin giao nhận theo chuẩn `CreateOrderDto`. |
| **UC-04.2** | **Tính toán lại 100% tổng tiền tại Business Layer** | `<<include>>` | Bắt buộc tính lại toàn bộ đơn giá, phụ thu size/topping và voucher discount tại tầng Business Logic Layer (NestJS Service) dựa vào DB gốc, tuyệt đối không dùng giá Client gửi lên. |
| **UC-04.3** | **Đối soát công thức & Khóa kho nguyên liệu (RecipeItem & Ingredient Optimistic Lock)** | `<<include>>` | Bắt buộc đối soát công thức pha chế (`RecipeItem`), tính tổng định mức nguyên vật liệu thô và trừ tồn kho bảng `Ingredient` trong `prisma.$transaction` với cơ chế Optimistic Locking (cột `version` của bảng `Ingredient`). Không lưu tồn kho theo ly thành phẩm (`Product`) theo đúng nguyên lý vận hành F&B thực tế. |
| **UC-04.4** | **Khởi tạo bản ghi đơn hàng (Trạng thái PENDING)** | `<<include>>` | Bắt buộc sinh mã đơn `#BL-YYYYMMDD-XXXX`, ghi nhận các dòng `OrderItem`, `OrderItemTopping` và chuyển đơn sang trạng thái `PENDING` sẵn sàng thanh toán. |
| **UC-04.5** | **Áp dụng giảm giá từ Voucher hợp lệ** | `<<extend>>` | Điểm mở rộng: Chỉ kích hoạt khi giỏ hàng có đính kèm `voucherCode` hợp lệ, còn hạn, còn lượt và đạt giá trị đơn tối thiểu. |
| **UC-04.6** | **Thêm ghi chú đơn hàng (Ghi chú pha chế / giao nhận)** | `<<extend>>` | Điểm mở rộng: Kích hoạt khi khách hàng nhập thêm ghi chú đặc biệt cho quán (tối đa 255 ký tự). |

#### Hiển thị Sơ đồ UC-04:

![UC-04 – Đặt đơn hàng và Khóa tồn kho nguyên vật liệu theo công thức pha chế](../diagrams/uc-04-create-order.svg)

---

### 4.2 Đặc tả chi tiết Use Case UC-04

#### 4.2.1 Thông tin chung (General Information)

| Thuộc tính | Nội dung quy định |
| :--- | :--- |
| **Mã Use Case** | **UC-04** |
| **Tên Use Case** | **Đặt đơn hàng và Khóa tồn kho nguyên vật liệu theo công thức pha chế** |
| **Truy vết yêu cầu** | `FR-05.1` đến `FR-05.12`; `BR-05.1` đến `BR-05.8`; `AC-05.01` đến `AC-05.12`; Phạm vi `MVP-04`. |
| **Actor chính** | Khách hàng (`Customer / Guest`). |
| **Actor hỗ trợ / Hệ thống** | NestJS OrdersService (Business Layer), PostgreSQL Database Engine qua Prisma ORM. |
| **Mục tiêu Use Case** | Chuyển đổi giỏ hàng thành một đơn hàng chính thức với trạng thái `PENDING`, tổng tiền được tính toán chuẩn xác từ nguồn dữ liệu có thẩm quyền của CSDL và số lượng tồn kho nguyên vật liệu thô (`Ingredient`) được đối soát công thức (`RecipeItem`) và khóa/trừ an toàn ngay lập tức. |
| **Trigger (Sự kiện kích hoạt)** | Khách hàng nhấn nút **"Đặt hàng" / "Xác nhận thanh toán"** tại giao diện Giỏ hàng / Màn hình Checkout (`/checkout`). |
| **Tiền điều kiện (Pre-conditions)** | 1. Giỏ hàng phía Client có ít nhất một món hợp lệ (`items.length > 0`).<br>2. Khách hàng đã cung cấp đủ thông tin người nhận (`customerName`, `customerPhone`) và phương thức nhận hàng (`deliveryAddress` hoặc Nhận tại quầy).<br>3. Hệ thống Backend API hoạt động bình thường và kết nối được PostgreSQL Database. |
| **Hậu điều kiện thành công (Post-conditions)** | 1. Đơn hàng mới được tạo trong bảng `Order` với mã đơn dạng `#BL-YYYYMMDD-XXXX`, trạng thái là `PENDING`.<br>2. Các dòng sản phẩm chi tiết được lưu vào bảng `OrderItem` (bao gồm `productId`, `size`, `unitPrice`, `quantity`, `subtotal`, ghi nhận danh sách `toppings`).<br>3. Số lượng tồn kho của các nguyên vật liệu thô cấu thành tương ứng trong bảng `Ingredient` bị giảm đi đúng bằng tổng lượng tiêu hao theo định mức công thức pha chế: `stockQuantity = stockQuantity - (quantityRequired * quantity)` và cột `version` của `Ingredient` tăng thêm 1 (`version = version + 1`) trong cùng một Transaction.<br>4. Nếu có Voucher: Số lượt dùng của voucher tăng thêm 1 (`usedCount = usedCount + 1`) và gắn vào đơn hàng.<br>5. Giỏ hàng Zustand ở Client được làm rỗng (`clearCart`).<br>6. Hệ thống trả về `orderId`, `orderCode`, `totalAmount`, `paymentDeadline` để chuyển tiếp sang màn hình thanh toán (UC-05). |
| **Bảo đảm khi thất bại (Failure Guarantees)** | 1. **Rollback toàn diện:** Toàn bộ thao tác kiểm tra giá, đối soát công thức, trừ kho nguyên vật liệu và tạo đơn được bọc trong một Database Transaction duy nhất (`prisma.$transaction`). Nếu có bất kỳ lỗi nào (thiếu nguyên liệu pha chế, xung đột version trên Ingredient, voucher lỗi, đứt mạng CSDL), giao dịch tự động Rollback 100%.<br>2. **Bảo toàn dữ liệu người dùng:** Không tạo đơn hàng rác, tồn kho nguyên vật liệu không bị trừ sai, giỏ hàng phía Client được giữ nguyên trạng thái kèm thông báo lỗi rõ ràng để khách hàng kịp thời điều chỉnh. |

---

#### 4.2.2 Luồng sự kiện chính (Main Success Scenario)

1. **Khách hàng** kiểm tra giỏ hàng trên màn hình Checkout, điền đầy đủ họ tên, số điện thoại, địa chỉ nhận hàng (hoặc chọn nhận tại quầy) và bấm nút **"Đặt hàng"**.
2. **Giao diện Client (Next.js)** thực hiện tiền kiểm tra dữ liệu form, vô hiệu hóa nút bấm đặt đơn để chống gửi kép (Double Submit) và gửi yêu cầu `POST /api/v1/orders` kèm payload `CreateOrderDto` chứa danh sách món (`items`), thông tin người nhận và mã `voucherCode` (nếu có).
3. **Presentation Layer (NestJS OrdersController)** tiếp nhận yêu cầu, kích hoạt `ValidationPipe` để xác thực kiểu dữ liệu đầu vào.
4. **OrdersController** gọi sang tầng nghiệp vụ `OrdersService.createOrder(dto, userId?)`.
5. **Business Logic Layer (OrdersService)** khởi tạo một giao dịch CSDL độc lập: `prisma.$transaction(async (tx) => { ... })`.
6. **Bên trong Transaction – Bước tính giá Server-Authoritative & Truy vấn công thức:**
   - Hệ thống truy vấn thông tin mới nhất từ CSDL cho tất cả `productId` trong đơn hàng, bao gồm `basePrice`, `isAvailable`, bảng giá Topping, và bảng định mức công thức pha chế `RecipeItem` (kèm thông tin nguyên vật liệu `Ingredient`).
   - Kiểm tra trạng thái món: Nếu món đang ngừng bán (`isAvailable == false`), ngắt giao dịch.
   - Tính toán lại đơn giá từng dòng:
     $$\text{itemPrice} = \text{basePrice} + \text{sizePrice} + \sum \text{toppingPrices}$$
     $$\text{itemSubtotal} = \text{itemPrice} \times \text{quantity}$$
     $$\text{rawTotal} = \sum \text{itemSubtotal}$$
   - *Tuyệt đối bỏ qua và không sử dụng các trường giá tiền do Client gửi lên.*
7. **Bên trong Transaction – Bước áp dụng Voucher (nếu có):**
   - Truy vấn thông tin Voucher từ CSDL theo `voucherCode`.
   - Xác thực: Voucher tồn tại, `isActive == true`, thời gian hiện tại nằm trong khoảng `[startDate, endDate]`, `usedCount < maxUsage`, và `rawTotal >= minOrderValue`.
   - Tính toán số tiền giảm giá `discountAmount` (theo tỷ lệ phần trăm kèm chặn trần tối đa `maxDiscount`, hoặc theo số tiền cố định).
   - Xác định tổng tiền thanh toán cuối cùng:
     $$\text{finalTotal} = \max(0, \text{rawTotal} - \text{discountAmount})$$
8. **Bên trong Transaction – Bước khóa tồn kho nguyên vật liệu bằng Optimistic Locking:**
   - Quán F&B không lưu tồn kho theo ly cà phê pha sẵn (`Product`). Tồn kho thực tế được lưu tại bảng `Ingredient` (hạt cà phê, sữa đặc, đường, ly nhựa,...).
   - Hệ thống duyệt qua từng món trong đơn, tra cứu bảng `RecipeItem` để nhân số lượng ly đặt với lượng nguyên liệu định mức:
     $$\text{totalRequired}(\text{ingredientId}) = \sum_{\text{items}} (\text{item.quantity} \times \text{RecipeItem.quantityRequired})$$
   - Đọc số lượng tồn kho `stockQuantity` và `currentVersion` từ bảng `Ingredient`.
   - Kiểm tra điều kiện đủ nguyên liệu: $\text{stockQuantity} \ge \text{totalRequired}$.
   - Thực thi câu lệnh cập nhật nguyên tử có kiểm tra phiên bản trên bảng `Ingredient` (Optimistic Concurrency Control):
     ```sql
     UPDATE "Ingredient"
     SET "stockQuantity" = "stockQuantity" - :totalRequired,
         "version" = "version" + 1
     WHERE "id" = :ingredientId
       AND "version" = :currentVersion
       AND "stockQuantity" >= :totalRequired;
     ```
   - Nếu số bản ghi bị ảnh hưởng bằng 0 (`affectedRows === 0`), hệ thống ném ngoại lệ `InsufficientIngredientException` hoặc `OptimisticLockException` khiến Transaction lập tức `ROLLBACK`.
9. **Bên trong Transaction – Bước tạo đơn hàng và chi tiết:**
   - Sinh mã đơn hàng theo quy tắc chuẩn: `#BL-YYYYMMDD-XXXX` (trong đó `XXXX` là số ngẫu nhiên hoặc sequence tăng dần).
   - Tạo bản ghi mới trong bảng `Order` với `totalAmount = finalTotal`, `status = PENDING`, `paymentDeadline = now() + 15 phút`.
   - Tạo các bản ghi chi tiết trong bảng `OrderItem` và lưu danh sách topping đã chọn vào `OrderItemTopping`.
   - Cập nhật số lượt sử dụng voucher: `usedCount = usedCount + 1`.
10. **Transaction `COMMIT` thành công:**
    - OrdersService trả về thông tin đơn hàng vừa tạo (`orderId`, `orderCode`, `totalAmount`, `status: 'PENDING'`).
    - Client nhận mã phản hồi `201 Created`, xóa sạch giỏ hàng trong Zustand (`clearCart()`) và tự động điều hướng sang màn hình Thanh toán (UC-05).

---

#### 4.2.3 Các luồng thay thế (Alternative Flows)

| Mã luồng | Tình huống kích hoạt | Các bước xử lý của hệ thống | Điểm quay lại luồng chính |
| :--- | :--- | :--- | :--- |
| **A1** | **Khách hàng không dùng mã giảm giá** | Tại Bước 2, giỏ hàng không có `voucherCode`. Tại Bước 7, hệ thống bỏ qua bước tra cứu Voucher, gán `discountAmount = 0`, tổng tiền `finalTotal = rawTotal`. | Tiếp tục Bước 8 luồng chính. |
| **A2** | **Khách hàng chọn Nhận tại quầy (Pick-up)** | Tại Bước 1, khách hàng tick chọn hình thức nhận tại quầy. Trường `deliveryAddress` được gán mặc định là `"Tại quầy cửa hàng BrewLite"`. Đơn hàng không yêu cầu điền địa chỉ nhà riêng. | Tiếp tục Bước 3 luồng chính. |
| **A3** | **Đính kèm ghi chú đơn hàng** | Khách hàng điền thông tin vào ô "Ghi chú pha chế" (ví dụ: *"Giao trước 11h, nhiều đá riêng"*). Hệ thống lưu nội dung ghi chú vào trường `note` của bảng `Order` (cắt ngắn tối đa 255 ký tự). | Tiếp tục Bước 9 luồng chính. |
| **A4** | **Khách hàng đã đăng nhập tài khoản (Authenticated)** | Request gửi lên kèm HTTP Header `Authorization: Bearer <JWT>`. OrdersService trích xuất `userId` từ token và gán trực tiếp vào trường `userId` của bảng `Order`. Đơn hàng được liên kết với lịch sử tài khoản của khách và sẵn sàng tích điểm Loyalty sau khi thanh toán. | Tiếp tục Bước 6 luồng chính. |

---

#### 4.2.4 Các luồng ngoại lệ (Exception Flows)

| Mã lỗi | Điểm phát sinh | Nguyên nhân & Điều kiện | Xử lý của Hệ thống & Phản hồi | Hướng xử lý của Khách hàng |
| :--- | :--- | :--- | :--- | :--- |
| **E1** | Bước 3 | DTO Validation thất bại: Giỏ hàng rỗng (`items: []`), số lượng âm/bằng 0, số điện thoại không đúng định dạng. | Controller ngắt xử lý, không mở Transaction. Trả về HTTP `400 Bad Request` kèm thông báo lỗi chi tiết theo từng trường dữ liệu vi phạm. | Khách hàng kiểm tra lại thông tin trên form và giỏ hàng trước khi gửi lại. |
| **E2** | Bước 6 | Món trong giỏ đã bị Quản lý tắt bán (`isAvailable == false`). | Transaction tự động ROLLBACK. Trả về HTTP `409 Conflict` với thông báo: *"Món [Tên sản phẩm] hiện đã ngừng kinh doanh. Vui lòng xóa món khỏi giỏ hàng."* | Giao diện đánh dấu món bị ngừng bán, khách hàng xóa món và đặt lại. |
| **E3** | Bước 8 | Hết hoặc không đủ nguyên vật liệu để pha chế (`Ingredient.stockQuantity < totalRequired`). | Transaction tự động ROLLBACK. Trả về HTTP `409 Conflict` với mã lỗi `INSUFFICIENT_INGREDIENT`: *"Không đủ nguyên liệu [Tên nguyên vật liệu] để pha chế món [Tên sản phẩm] (thiếu X [đơn vị g/ml/cái]). Vui lòng chọn món khác hoặc giảm số lượng."* | Giỏ hàng được giữ nguyên; khách hàng giảm số lượng hoặc chọn món khác. |
| **E4** | Bước 8 | Xung đột đồng thời Optimistic Locking trên bảng `Ingredient` (`version mismatch` do có đơn khác vừa chốt tiêu hao cùng nguyên liệu). | Transaction tự động ROLLBACK. Trả về HTTP `409 Conflict` với mã lỗi `CONCURRENCY_CONFLICT`: *"Hệ thống đang phục vụ nhiều đơn hàng cùng lúc. Vui lòng bấm đặt lại để cập nhật tồn kho mới nhất."* | Khách hàng bấm lại nút "Đặt hàng" để hệ thống kiểm tra tồn kho phiên bản mới. |
| **E5** | Bước 7 | Mã giảm giá không còn hợp lệ (Hết hạn, hết lượt, hoặc giỏ hàng không đạt giá trị tối thiểu). | Transaction tự động ROLLBACK. Trả về HTTP `400 Bad Request` với mã `INVALID_VOUCHER`: *"Mã khuyến mãi không hợp lệ hoặc đã hết lượt sử dụng."* | Giao diện hủy áp dụng mã voucher lỗi và đề xuất khách đặt đơn không dùng mã hoặc nhập mã khác. |
| **E6** | Bất kỳ bước nào trong Transaction | Mất kết nối CSDL PostgreSQL hoặc lỗi hệ thống nội bộ. | Database Transaction tự động `ROLLBACK` triệt để. Hệ thống ghi log lỗi và trả về HTTP `500 Internal Server Error`: *"Hệ thống gián đoạn tạm thời. Đơn hàng của bạn chưa được tạo và chưa bị trừ tiền/tồn kho."* | Khách hàng thử lại sau vài giây; dữ liệu giỏ hàng phía Client được bảo toàn nguyên vẹn. |

---

#### 4.2.5 Ranh giới kiến trúc, Thiết kế giao dịch và Ràng buộc phi chức năng

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

## Mục 5: Chức năng 5 – UC-05: Thanh toán đơn hàng & Chống trừ tiền trùng lặp (`Idempotency`) (Quang)

> **Ghi chú phân công:** Phần nội dung Mục 5.1 (Sơ đồ `uc-05-payment.puml / .svg`) và Mục 5.2 (Đặc tả chi tiết Use Case UC-05) do thành viên **5. Quang (Dev Team)** chủ trì xây dựng và tích hợp vào tài liệu này thông qua Pull Request riêng của nhánh `docs/task1-quang` hoặc tương ứng.

*(Nội dung do **Quang** cập nhật...)*
