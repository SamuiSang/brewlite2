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
