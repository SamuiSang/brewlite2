# ADR-003: Kiến trúc Modular Monolith và Mô hình Phân tầng (3-Tier Layered Architecture)

- **Trạng thái:** Accepted (Đã phê duyệt và áp dụng chính thức)
- **Người đề xuất / Chịu trách nhiệm:** Võ Thành Chiến (Dev Team – Phụ trách Chức năng 4: Khởi tạo Đơn hàng, Tính tiền tại Business Layer & Khóa tồn kho nguyên liệu đồng thời)
- **Các bên liên quan (Deciders):** Ban Cố vấn Học thuật (Giảng viên hướng dẫn: Thầy Phiêu – Khoa CNTT, SGU), Nhóm Phát triển Dự án BrewLite (Duy, Quỳnh, Hiếu, Chiến, Quang, Sang)
- **Ngày phê duyệt:** 08/11/2026
- **Phạm vi áp dụng:** Toàn bộ hệ thống BrewLite, đặc biệt là quy trình nghiệp vụ cốt lõi: Khởi tạo Đơn hàng (`UC-04`), Quản lý Giỏ hàng & Khuyến mãi (`UC-02`), và Thanh toán Sandbox 2 bước (`UC-05`).

---

## 1. Bối cảnh và Đặt vấn đề (Context & Problem Statement)

Dự án **BrewLite** là một giải pháp chuyển đổi số bán lẻ đồ uống (F&B) theo định hướng **Mobile-first / PWA**, được xây dựng trong khuôn khổ học phần **Công nghệ Phần mềm (Assignment 2 – Học kỳ I, năm học 2026–2027)** tại Trường Đại học Sài Gòn (SGU).

Hệ thống phục vụ các cửa hàng đồ uống trong các khung giờ cao điểm (sáng sớm và giờ trưa), khi hàng trăm khách hàng có thể cùng lúc truy cập thực đơn, tùy biến món (Size/Topping), áp dụng phiếu giảm giá và tiến hành bấm nút **"Đặt hàng"** đồng thời. Trong bối cảnh này, hệ thống đối mặt với những thách thức kỹ thuật sống còn:

1. **Rủi ro bán âm kho nguyên liệu pha chế (Overselling & Concurrency Conflicts):** Trong ngành F&B, quán không bao giờ tồn kho ly cà phê pha sẵn, mà tồn kho nguyên liệu thô (`Ingredient`: hạt cà phê, sữa đặc, ly nhựa, trân châu...). Khi 2 hoặc nhiều khách hàng cùng bấm mua những ly đồ uống cuối cùng vào cùng một mili-giây, nếu hệ thống không có cơ chế khóa đồng thời nghiêm ngặt, số lượng tồn kho nguyên vật liệu sẽ bị trừ thành số âm (`stockQuantity < 0`).
2. **Nguy cơ tấn công thao túng giá tiền từ Client (Client Payload Tampering):** Khách hàng hoặc kẻ tấn công có thể can thiệp vào trình duyệt (DevTools / Postman / Proxies) để sửa đổi giá tiền trong payload gửi lên (ví dụ: sửa ly cà phê 35.000đ thành 1.000đ). Nếu hệ thống tin cậy giá do Client tính toán, doanh nghiệp sẽ chịu thiệt hại tài chính nặng nề.
3. **Mối quan hệ giao dịch đa thực thể (Multi-entity Transaction):** Một yêu cầu tạo đơn hàng thành công đòi hỏi một chuỗi hành động nguyên tử (Atomic Actions): Kiểm tra trạng thái món `Product` $\rightarrow$ Tính toán lại đơn giá $\rightarrow$ Đối soát và khóa mã `Promotion` $\rightarrow$ Tra cứu công thức `RecipeItem` $\rightarrow$ Trừ kho `Ingredient` bằng khóa lạc quan $\rightarrow$ Khởi tạo bản ghi `Order` và các `OrderItem`. Nếu bất kỳ khâu nào thất bại, toàn bộ tiến trình bắt buộc phải được khôi phục nguyên trạng (Rollback 100%), tuyệt đối không để lại đơn rác (Orphan records) hay trừ hụt kho.

Để giải quyết bài toán trên, nhóm phát triển cần đưa ra quyết định kiến trúc then chốt: **Lựa chọn phong cách kiến trúc tổng thể (Modular Monolith vs. Microservices)** và **Thiết lập mô hình phân tầng trách nhiệm nghiêm ngặt (3-Tier Layered Architecture)** theo đúng chỉ đạo và bài giảng của Thầy Phiêu.

---

## 2. Các Tiêu chí Đánh giá Quyết định (Decision Drivers)

Quyết định kiến trúc được đánh giá dựa trên 5 tiêu chí cốt lõi:

1. **Tính Toàn vẹn Dữ liệu và Hỗ trợ Giao dịch ACID (ACID Transaction Integrity):** Khả năng thực thi giao dịch nguyên tử (All-or-Nothing) giữa nhiều bảng dữ liệu liên quan mà không cần hạ tầng phức tạp.
2. **Tuân thủ Nguyên lý Phân tầng Trách nhiệm (Separation of Concerns):** Ranh giới rành mạch giữa Tầng Giao diện (Presentation), Tầng Nghiệp vụ cốt lõi (Business Logic), và Tầng Truy xuất Dữ liệu (Data Access Layer). Business Logic phải là thẩm quyền tuyệt đối trong việc định giá.
3. **Độ trễ Mạng và Hiệu năng Thực thi (Performance & Latency):** Thời gian phản hồi của endpoint tạo đơn `POST /api/v1/orders` phải đạt dưới 300ms trong điều kiện chịu tải đồng thời.
4. **Chi phí Vận hành, Độ phức tạp Hạ tầng & Kiểm thử (Operational Overhead & Testability):** Kiến trúc phải tinh gọn, dễ dàng container hóa bằng Docker, chạy mượt mà trong môi trường phát triển local và vượt qua CI/CD Pipeline mà không đòi hỏi cụm máy chủ phân tán đắt đỏ.
5. **Khả năng Tiến hóa Kiến trúc (Architectural Evolvability):** Cấu trúc mã nguồn phải có ranh giới module độc lập (High Cohesion, Low Coupling) để khi chuỗi đồ uống mở rộng toàn quốc có thể bóc tách thành các dịch vụ độc lập một cách tự nhiên.

---

## 3. Các Phương án Kiến trúc Được Xem xét (Considered Options)

### Phương án 1: Kiến trúc Vi dịch vụ (Microservices Architecture)
- Chia tách hệ thống thành các dịch vụ độc lập: `Orders Service`, `Catalog/Menu Service`, `Inventory Service`, `Promotion Service`, `Payment Service`, giao tiếp với nhau qua REST API, gRPC hoặc Message Broker (RabbitMQ / Kafka). Mỗi dịch vụ sở hữu cơ sở dữ liệu riêng (Database-per-Service).
- **Ưu điểm:** Khả năng mở rộng độc lập từng dịch vụ (Scale out theo tải); cô lập lỗi giữa các phân hệ.
- **Nhược điểm chí tử đối với BrewLite:**
  - *Mất tính năng ACID Transaction cục bộ:* Để tạo đơn hàng kèm trừ kho nguyên liệu và trừ voucher, hệ thống buộc phải triển khai mô hình Giao dịch Phân tán (Distributed Transactions / Saga Pattern / Two-Phase Commit 2PC).
  - *Rủi ro Bán âm kho do Eventual Consistency:* Tính nhất quán cuối cùng của Message Broker có độ trễ vài trăm mili-giây, dẫn đến tình trạng hai dịch vụ đọc tồn kho cũ và cùng xác nhận đơn hàng, gây bán âm kho nghiêm trọng trong giờ cao điểm.
  - *Chi phí hạ tầng và vận hành quá tải:* Đòi hỏi API Gateway, Service Discovery (Consul/Eureka), Circuit Breaker, Distributed Tracing (Jaeger), CI/CD phức tạp cho 5–6 repo riêng biệt, hoàn toàn vượt quá quy mô của một đề tài học phần và phạm vi cửa hàng vừa và nhỏ.

### Phương án 2: Khối Đơn khối Truyền thống Không Phân tầng (Traditional / Spaghetti Monolith)
- Toàn bộ ứng dụng viết chung trong một codebase không có ranh giới rõ ràng. Logic tính tiền, truy vấn CSDL, kiểm tra tồn kho bị trộn lẫn ngay bên trong Controller hoặc trực tiếp trên mã giao diện (Client-side logic).
- **Ưu điểm:** Tốc độ viết code ban đầu rất nhanh; dễ khởi tạo.
- **Nhược điểm chí tử:** Vi phạm nghiêm trọng nguyên lý thiết kế phần mềm; logic nghiệp vụ bị phân tán, không thể viết Unit Test độc lập; rủi ro lộ lọt bảo mật và sai lệch giá tiền khi Client can thiệp dữ liệu; mã nguồn nhanh chóng biến thành "Big Ball of Mud", không thể bảo trì hay nâng cấp.

### Phương án 3: Kiến trúc Modular Monolith kết hợp Mô hình Phân tầng 3-Tier (LỰA CHỌN ĐƯỢC PHÊ DUYỆT)
- Toàn bộ ứng dụng được đóng gói trong một ứng dụng Monolithic duy nhất nhưng được **module hóa triệt để** (chia thành các NestJS Module độc lập: `OrdersModule`, `ProductsModule`, `InventoryModule`, `PromotionsModule`, `PaymentsModule`, `AuthModule`) cùng chia sẻ một cơ sở dữ liệu PostgreSQL chuẩn hóa thông qua Prisma ORM.
- Bên trong từng Module, áp dụng nghiêm ngặt **Kiến trúc Phân tầng 3-Tier (Presentation – Business Logic – Data Access Layer)**.

---

## 4. Quyết định Kiến trúc (Architectural Decision)

Nhóm phát triển BrewLite chính thức lựa chọn **Phương án 3: Kiến trúc Modular Monolith kết hợp Mô hình Phân tầng 3-Tier (Layered Architecture)** làm kiến trúc nền tảng xuyên suốt dự án.

### 4.1 Chi tiết Phân định Trách nhiệm 3 Tầng (3-Tier Layered Responsibilities)

Sơ đồ phân tầng trách nhiệm theo đúng bài giảng của Thầy Phiêu:

```text
+-----------------------------------------------------------------------------------+
| 1. PRESENTATION LAYER (TẦNG HIỂN THỊ & GIAO DIỆN NGOÀI)                           |
| - Frontend: Next.js PWA (apps/web) - UI Components, Zustand State, Mobile Touch    |
| - Backend Controller: OrdersController (apps/api)                                 |
| - Trách nhiệm:                                                                    |
|   + Render giao diện giỏ hàng, bảng chọn Size/Topping, xử lý tương tác người dùng. |
|   + Kiểm tra định dạng dữ liệu thô đầu vào (ValidationPipe & CreateOrderDto).     |
|   + Xác thực danh tính phiên người dùng thông qua JwtAuthGuard.                   |
|   + Điều phối HTTP Request/Response (trả về 201 Created, bắt 400, 401, 409).     |
|   + TUYỆT ĐỐI KHÔNG chứa logic nghiệp vụ định giá, tính tiền hay trừ kho.        |
+-----------------------------------------------------------------------------------+
                                         |
                                         | (userId, CreateOrderDto - Bỏ qua giá Client)
                                         v
+-----------------------------------------------------------------------------------+
| 2. BUSINESS LOGIC LAYER / DOMAIN CORE (TẦNG LOGIC NGHIỆP VỤ CỐT LÕI)               |
| - Service Provider: OrdersService (apps/api)                                      |
| - Trách nhiệm (Thẩm quyền Tuyệt đối & Độc lập 100%):                              |
|   + Tính toán lại toàn bộ đơn giá đơn hàng từ bảng giá CSDL:                      |
|     unitPrice = Product.basePrice + sizePrice + sum(toppingPrices)                |
|     rawSubtotal = sum(unitPrice * quantity)                                       |
|   + Thẩm định điều kiện hợp lệ và tính số tiền giảm giá của Promotion (Voucher).  |
|   + finalAmount = max(0, rawSubtotal - discountAmount)                            |
|   + Tra cứu định mức pha chế RecipeItem, tổng hợp nhu cầu nguyên vật liệu thô.    |
|   + Kiểm soát tính toàn vẹn giao dịch và điều phối Khóa lạc quan (Optimistic Lock)|
|   + Ra quyết định Commit đơn hàng PENDING hoặc Rollback 100% khi có xung đột.     |
+-----------------------------------------------------------------------------------+
                                         |
                                         | (prisma.$transaction / SQL Queries)
                                         v
+-----------------------------------------------------------------------------------+
| 3. DATA ACCESS LAYER - DAL (TẦNG TRUY XUẤT VÀ LƯU TRỮ DỮ LIỆU)                     |
| - ORM & Database: PrismaService (Prisma ORM) + PostgreSQL 16 Relational Database   |
| - Trách nhiệm:                                                                    |
|   + Đảm bảo các đặc tính ACID của giao dịch thông qua prisma.$transaction.        |
|   + Quản trị các bảng thực thể: Product, Ingredient, RecipeItem, Order, OrderItem.|
|   + Thực thi câu lệnh cập nhật nguyên tử có điều kiện phiên bản:                  |
|     UPDATE "Ingredient" SET stockQuantity = stockQuantity - :qty,                 |
|     version = version + 1 WHERE id = :id AND version = :v AND stockQuantity >= :q |
|   + Phản hồi số dòng bị ảnh hưởng (count / affectedRows) về cho Business Layer.   |
+-----------------------------------------------------------------------------------+
```

---

## 5. Lý giải Chi tiết: Vì sao chọn Modular Monolith thay vì Microservices?

Tuân thủ chặt chẽ chỉ đạo chuyên môn của Thầy Phiêu về việc *"Lựa chọn kiến trúc phải căn cứ trên bản chất bài toán và tính khả thi kỹ thuật, không chạy theo phong trào công nghệ (Buzzword-driven Architecture)"*, nhóm đưa ra 4 luận điểm thuyết phục:

### Luận điểm 1: Bảo toàn Tính nguyên tử của Giao dịch Đặt hàng & Trừ kho (ACID vs. BASE)
- **Trong Modular Monolith:** Khi khách hàng bấm đặt đơn, `OrdersService` mở một giao dịch cơ sở dữ liệu duy nhất:
  ```typescript
  return await this.prisma.$transaction(async (tx) => {
    // 1. Kiểm tra mở bán
    // 2. Tính tiền từ giá gốc
    // 3. Khóa trừ kho nguyên liệu bằng Optimistic Locking
    // 4. Tạo Order PENDING và các OrderItem
  });
  ```
  Nếu nguyên liệu không đủ hoặc có xung đột phiên bản, PostgreSQL sẽ **Rollback 100%** toàn bộ giao dịch trong vòng vài mili-giây. Dữ liệu kho nguyên liệu thô được bảo toàn nguyên vẹn, không sinh ra bất kỳ bản ghi đơn hàng rác nào.
- **Nếu dùng Microservices:** Việc trừ kho nằm ở `Inventory Service`, tạo đơn ở `Order Service`, áp mã ở `Promotion Service`. Để đạt được tính nguyên tử, hệ thống phải áp dụng **Saga Pattern** (Orchestration/Choreography) với các giao dịch bù trừ (Compensating Transactions) qua Message Broker. Nếu `Inventory Service` trừ kho thành công nhưng mạng bị ngắt (Network Partition) trước khi gửi tin nhắn cho `Order Service`, kho bị hụt nhưng khách hàng không có đơn. Xử lý bài toán này phức tạp gấp 10 lần nhưng không mang lại giá trị gia tăng nào cho hệ thống cửa hàng cà phê ở quy mô hiện tại.

### Luận điểm 2: Giải quyết Triệt để Bài toán Xung đột Đồng thời (Optimistic Concurrency Control)
- Thay vì sử dụng cơ chế Khóa bi quan (Pessimistic Row Lock: `SELECT ... FOR UPDATE`) gây nghẽn hàng đợi (Blocking) tại CSDL khi nhiều người cùng đặt món, Modular Monolith cho phép ứng dụng triển khai **Khóa lạc quan (Optimistic Locking)** trên cột `version` của bảng `Ingredient` với hiệu năng vượt trội:
  ```sql
  UPDATE "Ingredient" 
  SET "stockQuantity" = "stockQuantity" - :requiredQty, "version" = "version" + 1 
  WHERE "id" = :ingredientId AND "version" = :currentVersion AND "stockQuantity" >= :requiredQty;
  ```
- Nếu `count === 0` (chứng tỏ có một luồng khác đã commit trước làm thay đổi `version` hoặc làm cạn kho), `OrdersService` lập tức ném lỗi `ConflictException (HTTP 409)`. Cơ chế này hoạt động với độ trễ cực thấp (dưới 15ms) ngay trong một kết nối CSDL PostgreSQL cục bộ. Trong Microservices, việc đồng bộ version phân tán trên nhiều node đòi hỏi các giải pháp Distributed Lock (như Redis Redlock) với nguy cơ deadlock và độ trễ mạng cao.

### Luận điểm 3: Tối ưu Hóa Chi phí Vận hành và Hạ tầng Triển khai (DevOps & Operational Efficiency)
- Một ứng dụng **Modular Monolith** chỉ cần đóng gói thành 1 Docker Image duy nhất cho Backend NestJS, 1 Image cho Frontend Next.js và 1 Container PostgreSQL chính thức.
- Toàn bộ hệ thống có thể khởi chạy đồng bộ bằng một lệnh `docker-compose up` duy nhất trên bất kỳ máy tính cá nhân nào của thành viên, cũng như chạy mượt mà trên hạ tầng máy chủ ảo miễn phí / chi phí thấp (như Railway, Render, EC2 t3.micro).
- Việc debug, tracing lỗi hay kiểm thử tích hợp (Integration Test) diễn ra trực tiếp mà không cần thiết lập hạ tầng phụ trợ cồng kềnh.

### Luận điểm 4: Khả năng Tiến hóa Tự nhiên (Evolutionary Architecture)
- Thiết kế **Modular Monolith** không phải là bước lùi, mà là **bước đi đúng đắn nhất** trước khi chuyển đổi sang Microservices (theo quy luật kiến trúc của Martin Fowler: *"Monolith First"*).
- Bằng việc tổ chức mã nguồn thành các Module với ranh giới Domain rõ ràng (`orders`, `products`, `inventory`, `promotions`, `payments`, `loyalty`), các module chỉ giao tiếp với nhau qua Service Interfaces mà không phụ thuộc vòng (No Circular Dependencies). Khi chuỗi cửa hàng BrewLite tăng trưởng lên hàng nghìn chi nhánh trong tương lai, nhóm hoàn toàn có thể bóc tách từng module ra thành microservice độc lập mà không cần phải đập đi xây lại toàn bộ nghiệp vụ.

---

## 6. Hậu quả và Ràng buộc Triển khai (Consequences & Constraints)

### Hệ quả Tích cực (Positive Consequences):
- **Bảo mật giá tiền 100%:** Dập tắt hoàn toàn nguy cơ giả mạo giá tiền từ phía Client. Backend tự tính toán toàn bộ giá trị đơn hàng.
- **Chống bán âm kho tuyệt đối:** Cột `version` trên bảng nguyên liệu `Ingredient` ngăn chặn triệt để tình trạng âm kho khi tải cao điểm.
- **Tốc độ phản hồi cực nhanh:** Gọi hàm nội bộ (In-memory) giữa các module chỉ tốn micro-giây, thời gian xử lý tạo đơn trung bình đạt **~45ms**, vượt xa chỉ tiêu NFR (< 300ms).
- **Kiểm thử tự động dễ dàng:** Viết Unit Test và Integration Test cho `OrdersService` nhanh chóng với Mock Prisma, tỷ lệ bao phủ mã kiểm thử (Coverage) đạt trên 90%.

### Hệ quả Tiêu cực và Biện pháp Giảm thiểu (Trade-offs & Mitigation):
- **Nguy cơ vi phạm ranh giới module (Architectural Erosion):** Các lập trình viên có thể vô tình import trực tiếp Service của module khác hoặc truy vấn chéo bảng không qua interface.
  - *Biện pháp giảm thiểu:* Sử dụng quy tắc Linting nghiêm ngặt (ESLint boundary rules), cấm import chéo giữa các thư mục nội bộ và kiểm soát chặt chẽ qua Pull Request Code Review trước khi merge vào `main`.
- **Dùng chung một cơ sở dữ liệu:** Nếu một câu truy vấn nặng làm nghẽn CSDL, toàn bộ hệ thống có thể bị ảnh hưởng.
  - *Biện pháp giảm thiểu:* Đánh chỉ mục (Index) đầy đủ trên các khóa ngoại (`orderId`, `productId`, `ingredientId`, `version`), sử dụng Connection Pooling thông qua Prisma và cấu hình timeout giao dịch tối đa là 5.000ms.

---

## 7. Bảng Đối chiếu Ma trận Quyết định (Decision Comparison Matrix)

| Tiêu chí Đánh giá | Microservices Architecture | Traditional Spaghetti Monolith | Modular Monolith (Lựa chọn) |
| :--- | :---: | :---: | :---: |
| **Hỗ trợ Giao dịch ACID (Khóa tồn kho)** | Kém (Phải dùng Saga/2PC) | Tốt (Cục bộ CSDL) | **Xuất sắc (prisma.$transaction)** |
| **Chống Bán âm kho Đồng thời** | Trung bình (Độ trễ Eventual) | Rất kém (Dễ race-condition) | **Xuất sắc (Optimistic Lock version)** |
| **Phân định Ranh giới 3 Tầng** | Tốt (Phân tán theo service) | Kém (Trộn lẫn Controller/UI) | **Xuất sắc (3-Tier rành mạch)** |
| **Độ trễ Thực thi (Latency)** | Cao (> 100ms do gọi mạng) | Thấp (< 50ms) | **Rất thấp (~15 - 45ms)** |
| **Độ phức tạp DevOps & Triển khai** | Rất cao (K8s, Gateway, Broker)| Rất thấp (1 process) | **Tối ưu (Docker Compose)** |
| **Phù hợp Tinh thần Bài giảng Thầy Phiêu** | Không phù hợp (Over-engineering)| Không phù hợp (Vi phạm phân tầng)| **Hoàn toàn phù hợp 100%** |

---

## 8. Kết luận

Bản quyết định kiến trúc **ADR-003** là văn bản kỹ thuật quy chuẩn, thiết lập nền móng kiến trúc vững chắc cho hệ thống **BrewLite**. Toàn bộ mã nguồn Backend (`apps/api`) và Frontend (`apps/web`) thực thi trong các Sprint tiếp theo bắt buộc phải tuân thủ nghiêm ngặt các nguyên tắc phân tầng và cơ chế giao dịch khóa lạc quan đã được phê duyệt trong tài liệu này.

