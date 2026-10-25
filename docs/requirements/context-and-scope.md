# TASK 1.1 – BỐI CẢNH NGHIỆP VỤ, STAKEHOLDER VÀ PHẠM VI DỰ ÁN BREWLITE

- **Dự án:** BrewLite – Hệ thống Đặt đồ uống Trực tuyến (Mobile-first / PWA)
- **Tài liệu:** `docs/requirements/context-and-scope.md`
- **Giai đoạn:** Task 1 – Khai thác và Đặc tả Yêu cầu (Task 1.1)
- **Người thực hiện:**
  - **Hiếu (Product Owner):** Phụ trách Mục 1 (Vấn đề nghiệp vụ) và Mục 2 (Phân tích 6 Stakeholders chính).
  - **Sang (Scrum Master):** Phụ trách Mục 3 (Phạm vi MVP, Mở rộng, Out-of-scope) và Mục 4 (Giả định, Ràng buộc, Rủi ro ban đầu).

---

## 1. Bối cảnh và Vấn đề Nghiệp vụ BrewLite cần giải quyết

*(Phần nội dung do **Hiếu – Product Owner** thực hiện và bổ sung qua Pull Request)*

---

## 2. Phân tích các Stakeholder chính, Mục tiêu và Kỳ vọng

*(Phần bảng phân tích 6 Stakeholders chính: **Khách hàng, Nhân viên quầy, Quản lý cửa hàng, Giảng viên/Khách hàng nghiệm thu, Nhóm phát triển, Đơn vị thanh toán** do **Hiếu – Product Owner** thực hiện và bổ sung qua Pull Request)*

---

## 3. Phạm vi Sản phẩm (Product Scope)

Để đảm bảo dự án hoàn thành đúng tiến độ qua 2 Sprint với chất lượng kiểm thử và khả năng triển khai thực tế cao nhất, phạm vi của hệ thống **BrewLite** được phân định rõ thành 3 nhóm: **Phạm vi trong MVP (In-Scope)**, **Phạm vi mở rộng (Future Scope)** và **Các nội dung không thực hiện (Out-of-Scope)**.

### 3.1 Phạm vi trong MVP (In-Scope)

Phiên bản MVP (Minimum Viable Product) của **BrewLite** hiện thực hóa trọn vẹn luồng nghiệp vụ cốt lõi từ đầu đến cuối (**End-to-End**):

> `Xem menu` -> `Chọn tùy chọn` -> `Giỏ hàng` -> `Đặt đơn` -> `Thanh toán` -> `Theo dõi đơn`

Cụ thể, các chức năng nằm trong phạm vi thực hiện gồm:

| Mã cụm | Nhóm chức năng trong MVP (In-Scope) | Mô tả chi tiết phạm vi thực hiện |
| :--- | :--- | :--- |
| **MVP-01** | **Duyệt Thực đơn (Menu), Tìm kiếm và Xem Chi tiết món** | Hiển thị danh sách đồ uống theo giao diện Mobile-first bằng Next.js; lọc sản phẩm theo danh mục (Cà phê, Trà trái cây, Đá xay, Bánh ngọt) và tìm kiếm theo tên món; xem chi tiết sản phẩm (mô tả, giá gốc, hình ảnh, trạng thái tồn kho); xử lý đầy đủ 3 trạng thái giao diện `Loading` (Skeleton), `Empty` (Danh mục trống) và `Error` (Lỗi kết nối API); tự động gắn nhãn **"Hết hàng"** và khóa thao tác chọn đối với món có `stock == 0`. |
| **MVP-02** | **Tùy biến Đồ uống, Quản lý Giỏ hàng và Khuyến mãi (`Promotion`)** | Cho phép chọn kích cỡ (`Size S / M / L`) và các loại `Topping` đi kèm cho từng món; quản lý giỏ hàng ở phía Client bằng **Zustand** (đồng bộ `localStorage`) gồm thêm món, cộng dồn nếu trùng cấu hình Size/Topping, tăng/giảm số lượng (không vượt quá `stock`) và xóa món; kiểm tra và áp dụng mã khuyến mãi giảm giá (`Promotion`) hợp lệ theo điều kiện thời hạn và giá trị đơn tối thiểu. |
| **MVP-03** | **Đăng ký, Đăng nhập và Xác thực Phân quyền (`JWT`)** | Đăng ký tài khoản khách hàng mới với mật khẩu được băm an toàn bằng `bcrypt`; đăng nhập và cấp phát `JSON Web Token (JWT)` để xác thực cho các tác vụ nhạy cảm (đặt đơn, thanh toán, xem lịch sử đơn, tích điểm); cung cấp endpoint giám sát sức khỏe hệ thống `GET /api/v1/health`. |
| **MVP-04** | **Khởi tạo Đơn hàng, Tính tiền tại Business Layer và Khóa Tồn kho Đồng thời** | Xác thực dữ liệu đầu vào (`DTO Validation`) và **tính toán lại 100% tổng tiền đơn hàng tại tầng Business Logic Layer (NestJS Service)** dựa trên đơn giá gốc trong CSDL (tuyệt đối không dùng giá tiền do Client gửi lên); kiểm tra và trừ tồn kho an toàn bên trong **Database Transaction (`prisma.$transaction`)** kết hợp kỹ thuật **Optimistic Locking (cột `version` trên bảng `Product`)** nhằm chống bán quá số lượng tồn kho (`stock < 0`) khi có nhiều khách hàng đặt mua cùng một món cuối cùng tại cùng một thời điểm. |
| **MVP-05** | **Thanh toán Ví/Thẻ Mô phỏng (`Mock Payment`) và Chống Trừ tiền Trùng lặp (`Idempotency`)** | Mô phỏng cổng thanh toán qua Ví điện tử (MoMo/VNPay) hoặc Thẻ ngân hàng hỗ trợ cả 2 kịch bản Thanh toán thành công (`SUCCESS`) và Thanh toán thất bại (`FAILED`); bắt buộc kiểm tra khóa **`Idempotency-Key` (UUID)** trên mỗi yêu cầu thanh toán để đảm bảo khi khách hàng bấm đúp hoặc gửi lại yêu cầu do mạng chập chờn thì hệ thống chỉ trừ tiền đúng 1 lần; tự động hủy đơn (`CANCELLED`) và hoàn trả lại số lượng tồn kho (`Restock Rollback`) nếu giao dịch thanh toán thất bại. |
| **MVP-06** | **Biên nhận, Theo dõi Trạng thái, Lịch sử Đơn hàng và Tích điểm (`LoyaltyTransaction`)** | Hiển thị biên nhận điện tử ngay sau khi thanh toán thành công kèm mã đơn hàng (`#BL-XXXX`); theo dõi tiến trình trạng thái đơn hàng trực quan (`PENDING -> PAID -> PREPARING -> COMPLETED / CANCELLED`) và tra cứu danh sách lịch sử đơn hàng cá nhân; tự động ghi nhận giao dịch cộng điểm thưởng (`EARN`) và đổi điểm giảm giá (`REDEEM`) thông qua thực thể `LoyaltyTransaction`. |

---

### 3.2 Phạm vi mở rộng (Future / Extended Scope)

Các tính năng có giá trị gia tăng được định hướng thiết kế sẵn điểm mở rộng trong kiến trúc dữ liệu nhưng sẽ triển khai ở các phiên bản sau giai đoạn MVP:

1. **Phân hạng Thành viên tự động (Tiered Membership):** Tự động nâng hạng thẻ thành viên (*Đồng, Bạc, Vàng, Kim Cương*) dựa trên tổng điểm tích lũy `LoyaltyTransaction` với mức chiết khấu ưu đãi riêng.
2. **Thông báo đẩy Thời gian thực (Real-time Web Push / WebSocket):** Gửi thông báo đẩy tức thời đến màn hình khóa điện thoại của khách hàng ngay khi nhân viên quầy chuyển trạng thái đơn sang `PREPARING` hoặc `COMPLETED`.
3. **Đặt hàng theo Nhóm (Group Order):** Cho phép nhiều người dùng cùng quét một mã QR để thêm đồ uống vào chung một giỏ hàng tập thể trước khi người chủ phòng chốt đơn thanh toán.
4. **Gợi ý Thực đơn Thông minh (Personalized Recommendation):** Đề xuất đồ uống và combo bánh ngọt dựa trên lịch sử mua hàng cá nhân và thời tiết/khung giờ trong ngày.

---

### 3.3 Các nội dung KHÔNG thực hiện trong dự án (Out-of-Scope)

Để tập trung nguồn lực vào độ sâu kỹ thuật của kiến trúc phân tầng, tính toàn vẹn giao dịch đồng thời (Concurrency) và quy trình CI/CD tự động hóa, nhóm xác định rõ các hạng mục **không thực hiện (Out-of-Scope)** trong phạm vi Assignment 2:

| STT | Hạng mục không thực hiện (Out-of-Scope) | Lý do loại trừ và Giải pháp thay thế trong MVP |
| :--- | :--- | :--- |
| **1** | **Giao diện Quản trị kho và CRUD Sản phẩm phức tạp (Admin Back-office UI)** | Việc xây dựng các màn hình nhập kho, thêm/sửa/xóa sản phẩm chỉ lặp lại thao tác CRUD cơ bản và làm phân tán thời gian của 2 Sprint. Thay vào đó, nhóm sử dụng kịch bản **Database Migration, Prisma Seed (`seed.ts`) và Prisma Studio** để khởi tạo và bổ sung tồn kho (`Restock`) khi kiểm thử. |
| **2** | **Tích hợp Cổng thanh toán Ngân hàng / Ví điện tử thương mại bằng tiền thật** | Việc đăng ký tài khoản doanh nghiệp (Merchant) với MoMo/VNPay/Ngân hàng đòi hỏi giấy phép pháp lý ngoài phạm vi môn học. Nhóm xây dựng **Mock Payment Service** mô phỏng đầy đủ độ trễ mạng, mã giao dịch, kịch bản lỗi và cơ chế chống trùng lặp `Idempotency-Key`. |
| **3** | **Hệ thống Định vị Bản đồ GPS và Điều phối Tài xế Giao hàng (Live Delivery Tracking)** | Nghiệp vụ cốt lõi của BrewLite tập trung vào mô hình đặt món trước trên điện thoại và nhận tại quầy hoặc nhận đơn tiêu chuẩn, không bao gồm bài toán định tuyến bản đồ cho đội ngũ shipper. |
| **4** | **Ứng dụng Di động Native độc lập trên App Store / Google Play (iOS Swift / Android Kotlin)** | Hệ thống được phát triển dưới dạng ứng dụng web **Next.js theo hướng Mobile-first / Progressive Web App (PWA)**, cho phép truy cập trực tiếp qua trình duyệt di động và cài đặt ra màn hình chính mà không cần duy trì mã nguồn Native riêng biệt. |
| **5** | **Kiến trúc Microservices phân tán đa cơ sở dữ liệu** | Không tách hệ thống thành nhiều Microservices chạy trên các CSDL rời rạc nhằm tránh độ phức tạp không cần thiết của Distributed Transaction (Saga/2PC) trong phạm vi 2 Sprint; thay vào đó áp dụng kiến trúc **Modular Monolith** trên NestJS. |

---

## 4. Giả định, Ràng buộc và các Rủi ro ban đầu

### 4.1 Các Giả định (Assumptions)

1. **Hạ tầng thiết bị của người dùng:** Khách hàng truy cập BrewLite bằng thiết bị di động hoặc máy tính có trình duyệt web hiện đại (hỗ trợ JavaScript, `localStorage` và HTTPS) kèm kết nối mạng Internet ổn định tại thời điểm gửi yêu cầu đặt đơn và thanh toán.
2. **Tính sẵn sàng của dữ liệu danh mục ban đầu:** Danh sách thực đơn tối thiểu (8–10 món đồ uống thuộc các nhóm Cà phê, Trà, Đá xay, Bánh ngọt), đơn giá gốc (`basePrice`), cấu hình giá Size/Topping và mã khuyến mãi mẫu được nạp sẵn vào PostgreSQL thông qua script `seed` trước khi vận hành.
3. **Định danh phiên giao dịch từ Client:** Trình duyệt phía Client có khả năng sinh chuỗi định danh duy nhất theo chuẩn `UUID v4` để đính kèm làm khóa `Idempotency-Key` cho mỗi lần yêu cầu thanh toán đơn hàng.
4. **Môi trường triển khai Cloud/Container:** Nền tảng triển khai Production (Render / Railway / Fly.io hoặc VPS tương đương) hỗ trợ chạy Docker Container và cung cấp kết nối TLS/HTTPS mặc định cho cả Frontend và Backend API.

---

### 4.2 Các Ràng buộc (Constraints)

1. **Ràng buộc Công nghệ Bắt buộc (Mandatory Tech Stack):**
   - Frontend bắt buộc sử dụng **Next.js** thiết kế theo hướng **Mobile-first / PWA**.
   - Backend bắt buộc sử dụng **NestJS** đóng vai trò API Server xử lý nghiệp vụ.
   - Hệ quản trị cơ sở dữ liệu bắt buộc sử dụng **PostgreSQL** và môi trường chạy phải được đóng gói bằng **Docker** (`docker-compose.yml`). Nhóm có thể bổ sung thư viện phụ trợ (Prisma, Zustand, Jest, Playwright) nhưng tuyệt đối không thay thế 3 thành phần cốt lõi trên.
2. **Ràng buộc Kiến trúc Phần mềm (Architectural Constraints):**
   - Backend phải tuân thủ chặt chẽ **Kiến trúc phân lớp 3 tầng (Presentation Layer – Business Logic Layer – Data Access Layer)**.
   - Toàn bộ nghiệp vụ tính tổng tiền đơn hàng, áp mã giảm giá và kiểm tra tồn kho bắt buộc thực hiện tại **Business Logic Layer**; nghiêm cấm việc tin tưởng tổng tiền gửi lên từ phía Client.
3. **Ràng buộc Quy trình và Thời gian (Process & Schedule Constraints):**
   - Dự án thực hiện trong thời gian cố định **2 Sprint** với quy mô **6 thành viên**.
   - Bắt buộc tuân thủ **Quy tắc thực hiện tuần tự**: Năm task (`Task 1 -> Task 2 -> Task 3 -> Task 4 -> Task 5`) phải được hoàn thành và lưu vết commit/Pull Request trên kho mã nguồn theo đúng thứ tự.
4. **Ràng buộc Bảo mật và Bàn giao (Security & Delivery Constraints):**
   - Cơ sở dữ liệu PostgreSQL trên môi trường Production tuyệt đối không được mở public trực tiếp ra Internet.
   - Không được để lộ bất kỳ khóa bí mật nào (`JWT_SECRET`, `DATABASE_URL`, API Keys) trong mã nguồn repository hoặc trong log của CI/CD pipeline.

---

### 4.3 Danh mục các Rủi ro ban đầu và Biện pháp Giảm thiểu (Initial Risks & Mitigation)

| Mã rủi ro | Mô tả rủi ro ban đầu | Nhóm ảnh hưởng | Mức độ | Biện pháp phòng ngừa và giảm thiểu (Mitigation Strategy) |
| :--- | :--- | :--- | :--- | :--- |
| **RISK-01** | **Xung đột đặt hàng đồng thời (Race Condition / Concurrency):** Hai hoặc nhiều khách hàng cùng bấm đặt mua sản phẩm chỉ còn đúng 1 phần cuối cùng trong kho tại cùng một mili-giây, dẫn đến bán vượt tồn kho (`stock < 0`). | Nghiệp vụ & Dữ liệu | **Cao** | Bọc toàn bộ thao tác kiểm tra kho và tạo đơn trong **Database Transaction (`prisma.$transaction`)** kết hợp kỹ thuật **Optimistic Locking** (kiểm tra điều kiện `version = currentVersion AND stock >= qty` khi cập nhật). Nếu xung đột, lập tức Rollback và trả về `HTTP 409 Conflict`. |
| **RISK-02** | **Trừ tiền trùng lặp khi mạng chập chờn (Double Charging):** Khách hàng bấm nút Thanh toán nhiều lần liên tiếp hoặc trình duyệt tự gửi lại request khi kết nối mạng bị gián đoạn. | Thanh toán & Uy tín | **Cao** | Bắt buộc sử dụng khóa **`Idempotency-Key` (Unique)** lưu trong bảng `Payment`. Nếu hệ thống nhận được request mang `Idempotency-Key` đã xử lý thành công trước đó, lập tức trả về kết quả cũ mà không gọi lại dịch vụ trừ tiền. |
| **RISK-03** | **Giả mạo đơn giá từ phía trình duyệt (Client-side Price Tampering):** Người dùng can thiệp vào payload request `POST /orders` để sửa giá món hoặc mức giảm giá về `0đ`. | Bảo mật & Tài chính | **Cao** | API `POST /orders` chỉ nhận định danh `productId`, `size`, `toppings`, `quantity` và `promoCode`. Tầng **Business Logic Layer (`OrdersService`)** tự truy vấn đơn giá gốc từ PostgreSQL để tính toán lại `subtotalAmount`, `discountAmount` và `finalAmount`. |
| **RISK-04** | **Sai lệch hoặc mâu thuẫn giữa Tài liệu Yêu cầu (SRS), Sơ đồ UML và Mã nguồn thực tế:** Thành viên sửa code nhưng quên cập nhật sơ đồ hoặc vẽ sơ đồ không khớp với tên lớp/thuộc tính trong Database. | Quy trình & Nghiệm thu | **Trung bình** | Thống nhất bộ 7 thực thể cốt lõi (`User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction`) ngay từ Task 2.3 làm chuẩn cho `schema.prisma`; kiểm soát mọi thay đổi qua Pull Request và bảng `docs/traceability-matrix.md`. |
| **RISK-05** | **Lỗi tích hợp môi trường và gián đoạn Pipeline CI/CD sát hạn nộp bài:** Code chạy được trên máy cá nhân nhưng lỗi khi build Docker hoặc trượt bài kiểm thử trên GitHub Actions. | Kỹ thuật & Triển khai | **Trung bình** | Thiết lập `docker-compose.yml` ngay từ Sprint 1 (Task 4.1) và kích hoạt cổng kiểm soát chất lượng CI (`Install -> Lint -> Unit Test -> Build`) chặn merge các PR bị lỗi; cấu hình cơ chế Smoke Test (`GET /health`) và hướng dẫn Rollback rõ ràng. |
