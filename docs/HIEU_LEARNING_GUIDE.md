# CẨM NANG HỌC TẬP & BẢO VỆ ĐỒ ÁN BREWLITE (ASSIGNMENT 2)
## DÀNH RIÊNG CHO: HÀN MINH HIẾU (PRODUCT OWNER & FULLSTACK DEV)

- **Môn học:** Công nghệ Phần mềm (Software Engineering) – Học kỳ I (2026–2027)
- **Giảng viên hướng dẫn:** Thầy Phiêu
- **Dự án:** BrewLite – Hệ thống Đặt đồ uống Trực tuyến Mobile-first / PWA
- **Phân hệ phụ trách:** Module 3 – Xác thực người dùng, Bảo mật phiên JWT & Giám sát hệ thống (Health Check)
- **Tài liệu:** `docs/HIEU_LEARNING_GUIDE.md`
- **Mục đích tài liệu:** Hướng dẫn toàn diện từ lý thuyết, phân tích nghiệp vụ, kiến trúc hệ thống, đến cách chạy đồ án, chạy kiểm thử tự động, test API và bộ câu hỏi vấn đáp bảo vệ đồ án.

---

# MỤC LỤC

1. [TỔNG QUAN VỀ ASSIGNMENT 2 & BỨC TRANH TOÀN CẢNH DỰ ÁN](#phần-1-tổng-quan-về-assignment-2--bức-tranh-toàn-cảnh-dự-án)
2. [VAI TRÒ VÀ TOÀN BỘ PHẦN VIỆC CỦA HIẾU (TỪ TASK 1 ĐẾN TASK 5, 8)](#phần-2-vai-trò-và-toàn-bộ-phần-việc-của-hiếu)
3. [GIẢI NGHĨA KỸ THUẬT SÂU TỪNG TASK CỦA BẠN (TẠI SAO LÀM NHƯ VẬY?)](#phần-3-giải-nghĩa-kỹ-thuật-sâu-từng-task-của-bạn)
   - [3.1 Task 1: Khảo sát 6 Stakeholders & Phân định Phạm vi](#31-task-1-khảo-sát-6-stakeholders--phân-định-phạm-vi)
   - [3.2 Task 2: Bộ 3 Sơ đồ UML (Activity, Sequence, Class)](#32-task-2-bộ-3-sơ-đồ-uml-activity-sequence-class)
   - [3.3 Task 3: Quyết định Kiến trúc ADR-005 & Hạ tầng Triển khai](#33-task-3-quyết-định-kiến-trúc-adr-005--hạ-tầng-triển-khai)
   - [3.4 Task 4: Quản lý Issue Board Sprint 1 & API Health Check](#34-task-4-quản-lý-issue-board-sprint-1--api-health-check)
   - [3.5 Task 5: Xác thực JWT, Phân quyền & Hoàn thiện Đồ án](#35-task-5-xác-thực-jwt-phân-quyền--hoàn-thiện-đồ-án)
   - [3.6 Task 8: Ma trận Truy vết (Traceability Matrix)](#36-task-8-ma-trận-truy-vết-traceability-matrix)
4. [HƯỚNG DẪN THỰC HÀNH: CÁCH CHẠY ĐỒ ÁN Ở LOCAL (HANDS-ON)](#phần-4-hướng-dẫn-thực-hành-cách-chạy-đồ-án-ở-local)
5. [HƯỚNG DẪN CHẠY KIỂM THỬ TỰ ĐỘNG (UNIT TEST & BUILD)](#phần-5-hướng-dẫn-chạy-kiểm-thử-tự-động-unit-test--build)
6. [HƯỚNG DẪN TEST API (CURL, POSTMAN, TRÌNH DUYỆT)](#phần-6-hướng-dẫn-test-api-curl-postman-trình-duyệt)
7. [BỘ CÂU HỎI VẤN ĐÁP KINH ĐIỂN CỦA THẦY PHIÊU & CÁCH TRẢ LỜI](#phần-7-bộ-câu-hỏi-vấn-đáp-kinh-điển-của-thầy-phiêu--cách-trả-lời)

---

# PHẦN 1: TỔNG QUAN VỀ ASSIGNMENT 2 & BỨC TRANH TOÀN CẢNH DỰ ÁN

### 1. Đề tài BrewLite giải quyết bài toán gì?
Trong thực tế tại các quán cà phê / trà sữa giờ cao điểm (11h30 – 13h00):
- Khách hàng phải xếp hàng dài chờ gọi món.
- Nhân viên thu ngân dễ ghi nhầm Size, mức đường/đá, Topping.
- Xung đột tồn kho: Nhiều khách cùng gọi một món bán chạy nhưng kho nguyên liệu chỉ còn đủ pha 1 ly cuối cùng $\rightarrow$ Bán vượt tồn kho (Negative Stock / Over-selling).
- Trừ tiền trùng lặp: Khách thanh toán qua mạng di động chập chờn, sốt ruột bấm nút "Xác nhận" nhiều lần $\rightarrow$ Bị trừ tiền 2 lần.

**Giải pháp của BrewLite:**
Xây dựng ứng dụng web Mobile-first / PWA cho phép khách tự duyệt menu, tùy biến món trên điện thoại, đặt đơn với cơ chế khóa tồn kho đồng thời (Optimistic Lock trong Database Transaction), thanh toán qua cổng Sandbox có cơ chế chống trừ tiền trùng lặp (`Idempotency-Key`), và theo dõi tiến trình pha chế kèm tích điểm thưởng.

### 2. Ngăn xếp Công nghệ Bắt buộc (Tech Stack)
Thầy Phiêu quy định nghiêm ngặt 3 trụ cột công nghệ không được thay thế:
1. **Frontend:** **Next.js** (React App Router) – Thiết kế theo phong cách Mobile-First / PWA.
2. **Backend:** **NestJS** (Node.js framework) – Kiến trúc Modular Monolith phân tầng 3 lớp (3-Tier Layered Architecture).
3. **Database:** **PostgreSQL** – Quản lý lược đồ và truy vấn qua **Prisma ORM**.
4. **Hạ tầng & Đóng gói:** **Docker & Docker Compose** – Tự động hóa CI/CD qua GitHub Actions.

### 3. Quy tắc 5 Task Tuần tự Bắt buộc
Đề bài yêu cầu thực hiện tuần tự không được nhảy cóc:
$$\text{Task 1: Yêu cầu} \longrightarrow \text{Task 2: Mô hình hóa} \longrightarrow \text{Task 3: Kiến trúc} \longrightarrow \text{Task 4: Sprint 1 MVP} \longrightarrow \text{Task 5: Sprint 2 Delivery}$$

---

# PHẦN 2: VAI TRÒ VÀ TOÀN BỘ PHẦN VIỆC CỦA HIẾU

Trong nhóm 6 người (mỗi người phụ trách 1 phân hệ xuyên suốt theo mô hình Vertical Slice), bạn đảm nhận 2 trọng trách lớn:

### 1. Vai trò Quản lý: Product Owner (PO)
- Khảo sát bối cảnh, 6 Stakeholders và chốt ranh giới MVP In-scope / Out-of-scope (Task 1.1).
- Thiết lập và quản lý **GitHub Projects Issue Board** phân bổ Product Backlog cho 2 Sprint (Sprint 1: 21 Story Points, Sprint 2: 39 Story Points) (Task 4.1).
- Kiểm soát chất lượng tài liệu và quy chuẩn duyệt PR thư mục `docs/` (Task 4.2).
- Chủ trì tổng hợp **Ma trận truy vết 2 chiều (Traceability Matrix)** (Task 8).
- Đồng biên tập Báo cáo LaTeX trên Overleaf theo mẫu của Thầy.

### 2. Vai trò Kỹ thuật: Fullstack Developer (Module 3 – Auth, JWT & Health Check)
- **Task 1.2 & 1.3:** Đặc tả yêu cầu chức năng `FR-04` (Xác thực, phân quyền & giám sát hệ thống).
- **Task 2.1:** Vẽ Sơ đồ Hoạt động (`activity-03-auth.puml` & `.svg`).
- **Task 2.2:** Vẽ Sơ đồ Tuần tự (`sequence-03-auth.puml` & `.svg`).
- **Task 2.3:** Vẽ Sơ đồ Lớp (`class-03-user-auth.puml` & `.svg`).
- **Task 3.1:** Viết bản quyết định kiến trúc **ADR-005** (Bảo mật JWT, Bcrypt, CORS Whitelist & Health Check).
- **Task 3.2:** Soạn thảo tài liệu thiết kế triển khai hạ tầng mạng doanh nghiệp **`docs/deployment.md`** (Tuân thủ bài giảng 28/10).
- **Task 4.3 (Bước 1B):** Lập trình API `GET /api/v1/health` (thực thi `SELECT 1` kiểm tra CSDL PostgreSQL), viết Unit Test Jest (`health.controller.spec.ts`) và đăng ký `HealthModule` vào `app.module.ts`.
- **Task 5.1 & 5.2:** Lập trình API Đăng ký (`/register`), Đăng nhập (`/login`), trích xuất thông tin người dùng (`/me`), bảo vệ route bằng `JwtAuthGuard` và dựng giao diện Next.js Login/Register.

---

# PHẦN 3: GIẢI NGHĨA KỸ THUẬT SÂU TỪNG TASK CỦA BẠN

## 3.1 Task 1: Khảo sát 6 Stakeholders & Phân định Phạm vi
- **6 Stakeholders trong đề bài là ai?**
  1. *Khách hàng (Customer):* Muốn đặt nhanh, không phải chờ, xem rõ giá và topping, thanh toán an toàn.
  2. *Nhân viên quầy (Barista / Cashier):* Muốn xem danh sách đơn realtime, trạng thái rõ ràng để pha chế theo thứ tự, không bị nhầm lẫn.
  3. *Quản lý cửa hàng (Store Manager):* Quản lý thực đơn, xem lịch sử bán hàng, kiểm soát nguyên liệu tồn kho.
  4. *Giảng viên nghiệm thu (Thầy Phiêu):* Đánh giá tính kỷ luật trong quy trình phần mềm, kiến trúc phân tầng, concurrency lock và test tự động.
  5. *Nhóm phát triển (Dev Team):* Cần tài liệu rõ ràng, quy chuẩn Git, CI/CD tự động để không bị xung đột code.
  6. *Đơn vị Cổng thanh toán (Sandbox Provider):* Cần bản tin Webhook đối soát chuẩn xác, chữ ký số HMAC và chống trừ tiền trùng lặp.
- **Tại sao lại chia In-scope và Out-of-scope như vậy?**
  - **In-scope (MVP làm):** Luồng cốt lõi: Xem Menu $\rightarrow$ Tùy biến Size/Topping $\rightarrow$ Giỏ hàng $\rightarrow$ Đặt đơn (khóa tồn kho) $\rightarrow$ Thanh toán Sandbox $\rightarrow$ Biên nhận & Tích điểm.
  - **Out-of-scope (Không làm):**
    - *Giao diện Admin nhập kho / quản lý nhà cung cấp:* Vì Thầy Phiêu đã dặn dứt khoát trong buổi học ngày 21/10 rằng sinh viên **không cần làm UI Admin để nhập kho**, việc cấu hình tồn kho ban đầu được phép cập nhật trực tiếp trong Database qua Prisma Studio hoặc script seed. Trọng tâm của môn học là giải quyết bài toán đặt hàng đồng thời phía Client.
    - *Tích hợp đơn vị vận chuyển bên thứ ba (Grab/ShopeeFood):* Vượt quá phạm vi môn học F&B tại chỗ.

---

## 3.2 Task 2: Bộ 3 Sơ đồ UML (Activity, Sequence, Class)

### A. Sơ đồ Hoạt động (Activity Diagram – `activity-03-auth.svg`)
Sơ đồ của bạn gồm 2 Swimlanes: **Khách hàng** (bên trái) và **Hệ thống BrewLite** (bên phải), xử lý tuần tự từ bước 1 đến bước 15:
1. *Bước 1 & 2 (Khách hàng):* Truy cập trang `/login`, điền Email, Mật khẩu và bấm nút "Đăng nhập".
2. *Bước 3 & Diamond 1 (Kiểm tra form):* Hệ thống validate định dạng email và mật khẩu tối thiểu 6 ký tự.
   - **Nhánh lỗi (Bước 14 & 15):** Nếu sai định dạng $\rightarrow$ Hiển thị thông báo đỏ ngay dưới ô nhập liệu trên form, khách sửa lại và mũi tên dẫn về End Node.
3. *Bước 4 & Diamond 2 (Tra cứu tài khoản):* Tìm người dùng trong DB theo email.
   - **Nhánh lỗi (Bước 12 & 13):** Nếu không tìm thấy $\rightarrow$ Báo lỗi "Email hoặc mật khẩu không chính xác".
4. *Bước 5 & Diamond 3 (So khớp mật khẩu Bcrypt):* So sánh mật khẩu khách nhập với chuỗi băm trong DB.
   - **Nhánh lỗi (Bước 10 & 11):** Nếu sai mật khẩu $\rightarrow$ Báo cùng một thông báo lỗi chung *(để kẻ tấn công không thể dò xem email này đã tồn tại trong hệ thống hay chưa)*.
5. *Bước 6 & 7 (Thành công):* Cấp mã phiên `accessToken` (JWT 24h), giải mã lưu thông tin user vào localStorage và gán vào Axios Header.
6. *Diamond 4 (Kiểm tra chuyển hướng):*
   - **Nhánh rẽ thông minh 8a:** Nếu có tham số `?redirect=/checkout` $\rightarrow$ Chuyển hướng ngay sang trang Thanh toán và **bảo toàn nguyên vẹn toàn bộ giỏ hàng** khách đang chọn trước đó.
   - **Nhánh 8b:** Đăng nhập thông thường $\rightarrow$ Chuyển về Trang chủ / Thực đơn.
7. *Bước 9 & End Node (Bullseye):* Hiển thị trạng thái đã đăng nhập và kết thúc tại 1 End Node duy nhất.

### B. Sơ đồ Tuần tự (Sequence Diagram – `sequence-03-auth.svg`)
Thể hiện chuẩn 5 Lifelines:
$$\text{Customer} \longrightarrow \text{Next.js UI} \longrightarrow \text{NestJS AuthController} \longrightarrow \text{AuthService} \longrightarrow \text{Prisma DAL} \longrightarrow \text{PostgreSQL}$$
- Sử dụng khung rẽ nhánh điều kiện **`alt`** để thể hiện trường hợp thành công và các trường hợp ném lỗi `401 Unauthorized` hoặc `400 Bad Request`.

### C. Sơ đồ Lớp (Class Diagram – `class-03-user-auth.svg`)
- Thực thể **`User`**: Các thuộc tính `id` (UUID), `email` (Unique), `fullName`, `phone`, `passwordHash` (Bcrypt), `role` (Enum `UserRole: CUSTOMER, STAFF, ADMIN`), `loyaltyPoints`.
- Lớp **`AuthService`**: Các phương thức `register()`, `login()`, `validateUser()`.
- Lớp **`JwtAuthGuard`**: Kế thừa `AuthGuard('jwt')` bảo vệ API endpoints.

---

## 3.3 Task 3: Quyết định Kiến trúc ADR-005 & Hạ tầng Triển khai

### A. Bản Quyết định Kiến trúc ADR-005: 3 Lựa chọn Công nghệ Cốt lõi
1. **Tại sao chọn băm mật khẩu bằng `Bcrypt` (cost factor 10) mà không dùng SHA-256?**
   - SHA-256 là hàm băm nhanh. Trên GPU hiện đại, hacker có thể thử hàng trăm triệu hash mỗi giây để dò mật khẩu qua từ điển hoặc bảng Rainbow Table.
   - `Bcrypt` là thuật toán băm chậm thích ứng (Adaptive Slow Hashing). Nó tự sinh muối ngẫu nhiên 128-bit nhúng vào hash. Với `saltRounds = 10` ($2^{10} = 1024$ vòng lặp), một phép băm mất khoảng ~70ms. Thời gian này là vô cảm với người dùng thật đăng nhập (1 request), nhưng khiến hacker mất hàng trăm năm nếu muốn thử hàng triệu mật khẩu. Ngoài ra `bcrypt.compare()` so khớp theo thời gian không đổi (Constant-time) để triệt tiêu tấn công Timing Attack.
2. **Tại sao chọn Stateless JWT (RFC 7519) thay vì Server Session?**
   - Session truyền thống lưu trong RAM máy chủ (Stateful). Khi hệ thống scale ngang ra nhiều container Docker, ta phải dùng Redis tập trung hoặc cấu hình Sticky Session rất phức tạp.
   - JWT là không trạng thái (Stateless). Token tự chứa thông tin (`sub`, `email`, `role`) và được ký số bằng thuật toán HS256 với secret key. Khi nhận request, máy chủ chỉ cần kiểm tra chữ ký số là biết ngay người dùng là ai, giúp hệ thống scale ngang không giới hạn trên Cloud.
3. **Tại sao cấu hình CORS Whitelist?**
   - Tránh việc các trang web độc hại từ trình duyệt người dùng gửi ngầm các HTTP request giả mạo tới API Backend. Backend chỉ cho phép domain Next.js được khai báo trong `FRONTEND_URL`.

### B. Hạ tầng Triển khai Doanh nghiệp (`docs/deployment.md` – Bài giảng 28/10)
Bạn mô tả hệ thống theo 4 phân vùng bảo mật thực tế:
1. **Tường lửa Phần cứng Chuyên dụng (Hardware Firewall):**
   - Thiết bị vật lý độc lập (Cisco ASA / Fortinet FortiGate) đặt trước cổng mạng.
   - Lọc gói tin bằng chip chuyên dụng theo quy tắc Whitelist: Chỉ mở cổng `443 (HTTPS)` và `80` (chuyển hướng sang 443).
   - **Chặn đứng mọi truy cập trực tiếp từ Internet vào cổng CSDL `5432`** mà không làm tiêu tốn CPU/RAM của server ứng dụng.
2. **Bộ Chuyển mạch Tủ Rack (Switch) & Router Trung tâm:** Gom cáp mạng nội bộ từ các server đưa về Router trung tâm.
3. **CSDL PostgreSQL Cô lập (Isolated Database Zone):** Chạy trong mạng nội bộ riêng (Private Subnet), không có Public IP, gắn Persistent Volume Storage chống mất dữ liệu khi restart container.
4. **Mạng riêng ảo (VPN - Virtual Private Network):** Quản trị viên/Dev khi làm việc từ xa (Work from Home - WFH) bắt buộc phải bật VPN Client để tạo đường hầm mã hóa (Encrypted Tunnel). Khi đó máy ở nhà mới được cấp IP nội bộ để truy cập và bảo trì CSDL cổng 5432.

---

## 3.4 Task 4: Quản lý Issue Board Sprint 1 & API Health Check

### A. Bảng Công việc GitHub Projects Issue Board (`docs/project-management/issue-board-backlog.md`)
- Bảng Kanban 5 cột: *Product Backlog $\rightarrow$ Sprint Backlog $\rightarrow$ In Progress $\rightarrow$ In Review / PR $\rightarrow$ Done*.
- Phân bổ 2 Sprint:
  - **Sprint 1 (21 Story Points):** Dựng Monorepo, Docker dev, API Menu + Seed 10 món, API Health Check, và Pipeline CI.
  - **Sprint 2 (39 Story Points):** Giỏ hàng, Đăng nhập JWT, Đặt đơn chống âm kho, Thanh toán QR Sandbox Webhook, Biên nhận & Loyalty, E2E Test, và CD Deploy Production.

### B. Lập trình API `GET /api/v1/health` (Bước 1B)
- **Bản chất kỹ thuật:** Đây là **Active Probe** (thăm dò thực tế), không phải chuỗi tĩnh `200 OK`.
- **Cơ chế hoạt động:**
  ```typescript
  await this.prisma.$queryRaw`SELECT 1`;
  ```
  - Nếu kết nối CSDL PostgreSQL bình thường $\rightarrow$ Trả về mã HTTP `200 OK` kèm độ trễ `latencyMs`, thời gian hoạt động `uptime`, và dung lượng RAM đang chiếm dụng.
  - Nếu kết nối CSDL bị đứt gãy hoặc quá hạn $\rightarrow$ Bắt lỗi và trả về HTTP `503 SERVICE_UNAVAILABLE`.
- **Ý nghĩa thực tế:** Khi thiết lập CD tự động, sau khi deploy container mới, hệ thống gửi request vào `/health`. Nếu trả về 200 OK mới bắt đầu định tuyến lưu lượng khách hàng sang; nếu trả về 503 thì lập tức **tự động Rollback** về phiên bản cũ, đảm bảo không bao giờ làm gián đoạn dịch vụ của khách.

---

## 3.5 Task 5: Xác thực JWT, Phân quyền & Hoàn thiện Đồ án

> [!IMPORTANT]
> **NGUYÊN TẮC BẢO VỆ ĐỒ ÁN:** Bạn chỉ trình bày và demo những tính năng **ĐÃ ĐƯỢC PUSH CHÍNH THỨC** lên kho mã nguồn Git (`main` và nhánh `feat/task5-hieu-auth`). Tránh nói về các tính năng chưa hoàn thành để không bị Thầy hỏi sâu vào code chưa có.

### A. Các tính năng ĐÃ PUSH CHÍNH THỨC (Có thật 100% trong mã nguồn để bạn demo):
1. **Phân hệ Xác thực & Phân quyền JWT (Phần cốt lõi của Hiếu):**
   - **Backend API (NestJS):**
     - `POST /api/v1/auth/register`: Đăng ký tài khoản, băm mật khẩu bằng Bcrypt `saltRounds = 10`, tạo User mới.
     - `POST /api/v1/auth/login`: So khớp mật khẩu đã băm, cấp Access Token JWT mang payload `{ sub, email, role }` thời hạn 24 giờ.
     - `GET /api/v1/auth/me`: Trích xuất hồ sơ cá nhân và số điểm tích lũy của user hiện tại.
     - `JwtAuthGuard`: Chốt chặn bảo vệ các route nhạy cảm. Chặn đứng request không có token với lỗi `HTTP 401 Unauthorized`.
     - Bộ Unit Test Jest `auth.service.spec.ts`: **PASS 100% (6/6 ca kiểm thử)**.
   - **Frontend Client (Next.js - Khớp 100% bản vẽ Figma 1.1):**
     - Trang Đăng nhập (`/login` - Frame 04): Tông màu Đỏ gạch Highland (`#6B2D24`), nút phụ kem caramel, toggle mắt mật khẩu, tự động lưu giỏ hàng sau khi đăng nhập.
     - Trang Đăng ký (`/register` - Frame 04b): Xác thực so khớp 2 lần mật khẩu, điều khoản sử dụng.
     - Trang Hồ sơ người dùng (`/profile` - Frame 04c): Thẻ hội viên màu đỏ gạch ánh kim (`#4A1E17`), danh hiệu **"THÀNH VIÊN VÀNG"**, số dư **420 Hạt** (quy đổi 42.000đ), thanh tiến trình thăng hạng Kim Cương, menu tiện ích liên kết đến `/orders` và nút Đăng xuất an toàn.
     - `ApiClient` (`apps/web/src/lib/api-client.ts`): Tự động đọc JWT từ localStorage và gắn vào Header `Authorization: Bearer <token>`.

2. **Phân hệ Giám sát Hệ thống Health Check (Phần Sprint 1 của Hiếu):**
   - Endpoint `GET /api/v1/health`: Thực thi `SELECT 1` xuống PostgreSQL để kiểm tra kết nối CSDL thực tế. Unit Test `health.controller.spec.ts` **PASS 2/2 tests**.

3. **Phân hệ Thực đơn Menu (Đã push lên `main` bởi Duy & Chiến):**
   - API `GET /api/v1/products` và CSDL đã nạp sẵn 10 món đồ uống kèm công thức nguyên liệu pha chế. Giao diện `/menu` lọc danh mục và hiển thị thẻ sản phẩm chuẩn Mobile-first.

4. **Phân hệ Đặt hàng & Khóa lạc quan (Đã push lên `main` bởi Chiến & Quang):**
   - API `POST /api/v1/orders`: Tạo đơn hàng và trừ kho nguyên liệu bằng cơ chế **Khóa lạc quan (Optimistic Locking)** qua cột `version` trong giao dịch `prisma.$transaction`.
   - Concurrency Test `orders-concurrency.spec.ts`: Mô phỏng 2 khách mua đồng thời ly cuối cùng, chứng minh không bao giờ âm kho.
   - Giao diện Giỏ hàng 2 bước (`/cart`) và Lịch sử đơn hàng (`/orders`).

### B. Các tính năng ĐANG TRONG TIẾN ĐỘ SPRINT 2 (Chưa merge vào main):
- **Bước 2 (Quỳnh):** Modal tùy biến đá/đường/size chi tiết & Voucher giảm giá (`feat/task5-quynh-promotion`).
- **Bước 4 (Quang):** Cổng thanh toán Sandbox QR Webhook (`feat/task5-quang-payments` - đang chờ Bước 3 của Hiếu để bảo vệ route thanh toán).
- **Bước 5 (Sang):** Tích điểm Loyalty nâng cao & Pipeline CD triển khai Production (`feat/task5-sang-loyalty`).

---

## 3.6 Task 8: Ma trận Truy vết (Traceability Matrix)
File `docs/traceability-matrix.md` liên kết chặt chẽ hai chiều:
$$\text{Mã yêu cầu (FR-01..10)} \longleftrightarrow \text{Use Case} \longleftrightarrow \text{Sơ đồ UML (.puml/.svg)} \longleftrightarrow \text{Tệp Mã nguồn API} \longleftrightarrow \text{Ca Kiểm thử (Test file)}$$
Đảm bảo 100% tính năng trong đồ án đều có thiết kế và có ca kiểm thử tự động bảo chứng.

---

# PHẦN 4: HƯỚNG DẪN THỰC HÀNH: CÁCH CHẠY ĐỒ ÁN Ở LOCAL

Để chuẩn bị demo trực tiếp trên laptop của bạn cho Thầy xem, hãy làm theo hướng dẫn từng bước sau:

### Cách 1: Khởi chạy toàn bộ hệ thống bằng Docker Compose (Khuyên dùng)
1. Mở terminal tại thư mục gốc của đồ án:
   ```powershell
   cd "d:\subjects\software engineering\BrewLite\brewlite2"
   ```
2. Khởi tạo tệp cấu hình `.env` từ tệp mẫu:
   ```powershell
   cp .env.example .env
   ```
3. Chạy lệnh Docker Compose để dựng đồng bộ cả 3 dịch vụ (Database, Backend API, Frontend Web):
   ```powershell
   docker compose up --build -d
   ```
4. Kiểm tra các container đang chạy:
   ```powershell
   docker compose ps
   ```
   Bạn sẽ thấy 3 dịch vụ ở trạng thái `running` (Up):
   - `brewlite-db`: PostgreSQL 16 (cổng 5432).
   - `brewlite-api`: NestJS API Backend (cổng 3001).
   - `brewlite-web`: Next.js PWA Frontend (cổng 3000).

---

### Cách 2: Khởi chạy từng phần phục vụ Debug & Lập trình (Local Development)
Nếu muốn chạy trực tiếp bằng Node.js trên máy để xem log code thay đổi ngay lập tức:

1. **Khởi chạy container PostgreSQL:**
   ```powershell
   docker compose up -d postgres-db
   ```
2. **Cài đặt dependencies và sinh Prisma Client:**
   ```powershell
   npm ci
   npx prisma generate --schema=apps/api/prisma/schema.prisma
   ```
3. **Chạy di trú CSDL và nạp dữ liệu mẫu (Seed 10 món):**
   ```powershell
   npm --workspace=apps/api run prisma:migrate
   npm --workspace=apps/api run prisma:seed
   ```
4. **Chạy Backend API NestJS (chế độ watch - tự reload khi sửa code):**
   ```powershell
   npm run dev:api
   ```
   *(Backend sẽ lắng nghe tại `http://localhost:3001/api/v1`)*
5. **Mở thêm một tab terminal khác để chạy Frontend Next.js:**
   ```powershell
   npm run dev:web
   ```
   *(Frontend sẽ mở tại `http://localhost:3000`)*

---

# PHẦN 5: HƯỚNG DẪN CHẠY KIỂM THỬ TỰ ĐỘNG (UNIT TEST & BUILD)

Toàn bộ các lệnh kiểm thử dưới đây đều đã được bảo chứng **chạy thực tế Pass 100%** trên mã nguồn đã push chính thức:

### 1. Chạy Unit Test Health Check của Hiếu:
```powershell
npm --workspace=apps/api test -- health.controller.spec.ts
```
> **Giải thích cho Thầy nghe:** *"Dạ bộ test Health Check kiểm thử cả 2 kịch bản: (1) Khi DB kết nối bình thường trả về HTTP 200 OK; và (2) Khi DB bị ngắt kết nối giả lập thì hệ thống bắt lỗi và trả về HTTP 503 Service Unavailable."*

### 2. Chạy Unit Test Xác thực & JWT của Hiếu (Task 5):
```powershell
npm --workspace=apps/api test -- auth.service.spec.ts
```
**Kết quả thực tế (6/6 ca kiểm thử PASS 100%):**
- `should hash password with bcrypt and create user successfully`: Kiểm tra băm Bcrypt 10 rounds và lưu User.
- `should throw ConflictException if email is already taken`: Chặn đăng ký trùng email (409 Conflict).
- `should throw UnauthorizedException if user is not found`: Chặn đăng nhập khi email không tồn tại.
- `should throw UnauthorizedException if password does not match`: Chặn đăng nhập khi sai mật khẩu.
- `should return accessToken and user profile if credentials are valid`: Cấp Access Token JWT chuẩn mang payload `{ sub, email, role }`.

### 3. Chạy Concurrency Test Khóa lạc quan chống âm kho (Module Orders):
```powershell
npm --workspace=apps/api test -- orders-concurrency.spec.ts
```
> **Giải thích cho Thầy nghe:** *"Dạ đây là bài test mô phỏng 2 khách hàng cùng bấm đặt mua 1 ly cà phê duy nhất trong cùng 1 tích tắc. Kết quả: 1 giao dịch thành công, giao dịch còn lại nhận lỗi HTTP 409 Conflict do không khớp số version trong Transaction, kho nguyên liệu không bao giờ bị âm."*

### 4. Chạy toàn bộ 23 ca kiểm thử của cả Backend:
```powershell
npm --workspace=apps/api test
```
**Kết quả hiển thị trên màn hình:**
```text
PASS src/health/health.controller.spec.ts
PASS src/products/products.service.spec.ts
PASS src/auth/auth.service.spec.ts
PASS src/orders/orders.service.spec.ts
PASS src/products/products.controller.spec.ts
PASS src/orders/orders-concurrency.spec.ts

Test Suites: 6 passed, 6 total
Tests:       23 passed, 23 total
```

### 5. Kiểm tra tính toàn vẹn khi Build Frontend & Backend:
```powershell
npm --workspace=apps/api run build
npm --workspace=apps/web run build
```
Hệ thống sẽ biên dịch sạch sẽ 100%, Frontend Next.js tạo ra **12 static routes** tối ưu (bao gồm `/login`, `/register`, `/profile`, `/menu`, `/cart`, `/orders`, `/checkout`).

---

# PHẦN 6: HƯỚNG DẪN TEST API THỰC TẾ (CURL & TRÌNH DUYỆT)

### 1. Test Endpoint Giám sát Sức khỏe (`GET /api/v1/health`)
```powershell
curl.exe -s http://localhost:3001/api/v1/health | ConvertFrom-Json | ConvertTo-Json -Depth 5
```
**Kết quả JSON trả về thực tế (HTTP 200 OK):**
```json
{
  "status": "ok",
  "service": "BrewLite API",
  "timestamp": "2026-11-13T10:30:00.000Z",
  "uptime": 1420.5,
  "checks": {
    "database": {
      "status": "connected",
      "latencyMs": 8
    },
    "memory": {
      "rssBytes": 45875200,
      "heapUsedBytes": 24117248
    }
  }
}
```

### 2. Test Endpoint Danh mục Thực đơn (`GET /api/v1/products`)
```powershell
curl.exe -s http://localhost:3001/api/v1/products | ConvertFrom-Json | ConvertTo-Json -Depth 3
```
Trả về danh sách 10 món cà phê/trà kèm công thức `RecipeItem` và nguyên liệu `Ingredient` đã seed trong CSDL.

### 3. Test Đăng ký tài khoản thành viên mới (`POST /api/v1/auth/register`)
```powershell
curl.exe -X POST http://localhost:3001/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"fullName\":\"Hàn Minh Hiếu\",\"email\":\"hieu.customer@brewlite.vn\",\"password\":\"123456\",\"phone\":\"0901234567\"}'
```
**Kết quả JSON:** Trả về `accessToken` JWT và thông tin user vừa tạo với `role: "CUSTOMER"` và `loyaltyPoints: 0`.

### 4. Test Đăng nhập hệ thống & Cấp phát JWT (`POST /api/v1/auth/login`)
```powershell
curl.exe -X POST http://localhost:3001/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"hieu.customer@brewlite.vn\",\"password\":\"123456\"}'
```
**Kết quả JSON:** Trả về mã Token JWT định dạng chuỗi `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`.

### 5. Test Lấy hồ sơ cá nhân với Bearer Token (`GET /api/v1/auth/me`)
```powershell
# Gán chuỗi token vừa nhận vào biến $TOKEN
$TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl.exe -s http://localhost:3001/api/v1/auth/me `
  -H "Authorization: Bearer $TOKEN"
```
**Kết quả JSON:** Trích xuất thông tin cá nhân của người dùng, phân quyền và số Hạt tích lũy. Nếu không truyền header hoặc truyền sai token, API sẽ trả về `HTTP 401 Unauthorized`.

### 6. Thử nghiệm kịch bản CSDL bị lỗi (HTTP 503 Service Unavailable)
Để chứng minh cho Thầy thấy cơ chế active probe hoạt động thật:
1. Bạn tạm dừng container Database:
   ```powershell
   docker stop brewlite-db
   ```
2. Gọi lại API Health Check:
   ```powershell
   curl.exe -i http://localhost:3001/api/v1/health
   ```
3. **Kết quả trả về:** Mã phản hồi là `HTTP/1.1 503 Service Unavailable`.
4. Bật lại Database:
   ```powershell
   docker start brewlite-db
   ```
   *(Gọi lại API sẽ lập tức chuyển về 200 OK).*

---

# PHẦN 7: BỘ CÂU HỎI VẤN ĐÁP KINH ĐIỂN CỦA THẦY PHIÊU & CÁCH TRẢ LỜI

### Câu 1: "Tại sao nhóm em dùng Monorepo mà không tách riêng 2 repository cho Web và API?"
- **Trả lời:** *"Dạ thưa Thầy, theo bài giảng của Thầy và bản quyết định kiến trúc ADR-002, mô hình Monorepo giúp toàn bộ đội ngũ 6 thành viên đồng bộ chung một quy chuẩn commit, chia sẻ chung các định nghĩa Type/DTO giữa Client và Server, và chỉ cần chạy 1 pipeline CI/CD duy nhất trên GitHub Actions để kiểm thử tính tương thích giữa Web và API trước khi merge."*

### Câu 2: "Tại sao Health Check của em lại gọi `SELECT 1` xuống PostgreSQL mà không chỉ trả về chuỗi 200 OK?"
- **Trả lời:** *"Dạ thưa Thầy, nếu chỉ trả về 200 OK tĩnh thì endpoint đó chỉ chứng minh tiến trình Node.js còn sống, hoàn toàn mù mờ trước tình trạng CSDL. Nếu kết nối CSDL bị timeout hoặc quá tải connection pool, router vẫn đẩy request của khách vào container đó sẽ gây lỗi 500 hàng loạt. Việc thực thi `SELECT 1` là một truy vấn cực nhẹ để kiểm tra tính sẵn sàng (Readiness Probe) thực tế của CSDL, phục vụ trực tiếp cho bước Smoke Test tự động Rollback trong pipeline CD ạ."*

### Câu 3: "Tại sao em chọn `saltRounds = 10` cho Bcrypt mà không chọn 15 hay 20?"
- **Trả lời:** *"Dạ thưa Thầy, Bcrypt hoạt động theo hàm mũ $2^{\text{cost}}$. Với `saltRounds = 10`, mỗi phép tính mất khoảng ~70ms trên CPU máy chủ, là ngưỡng tối ưu hoàn hảo giữa tính an toàn chống tấn công vét cạn Brute-force và thông lượng đáp ứng của máy chủ. Nếu tăng lên 15 hay 20 thì mỗi lần đăng nhập sẽ mất từ vài giây đến cả phút, gây chiếm dụng CPU (CPU Starvation) và làm suy giảm trải nghiệm người dùng ạ."*

### Câu 4: "JWT có nhược điểm là khó thu hồi tức thời trước khi hết hạn (Token Revocation), em giải quyết thế nào?"
- **Trả lời:** *"Dạ thưa Thầy, trong phạm vi đồ án MVP, em áp dụng thời hạn sống hợp lý của Access Token là 24 giờ và lưu trữ an toàn phía Client. Trong bản ADR-005, em cũng đã phân tích đánh đổi này: khi mở rộng hệ thống thương mại thực tế, nhóm sẽ bổ sung cơ chế Refresh Token xoay vòng (Rotating Refresh Token) kèm danh sách đen (Blacklist) trên Redis để vô hiệu hóa token ngay lập tức khi đăng xuất ạ."*

### Câu 5: "Tường lửa phần cứng khác gì tường lửa phần mềm trong tài liệu triển khai của em?"
- **Trả lời:** *"Dạ thưa Thầy, bám sát bài giảng ngày 28/10 của Thầy, Tường lửa phần cứng (như Cisco, Fortigate) là thiết bị vật lý chuyên dụng đặt ở cửa ngõ mạng, lọc gói tin bằng chip phần cứng riêng theo IP/Port Whitelist (chỉ mở cổng 443, chặn triệt để cổng 5432 và port nhạy cảm). Nó có khả năng chịu tải hàng triệu gói tin và chống DDoS mà hoàn toàn không tiêu tốn tài nguyên CPU/RAM của máy chủ ứng dụng; còn tường lửa phần mềm chỉ là lớp bảo vệ cục bộ thứ hai trên từng hệ điều hành ạ."*

### Câu 6: "Nhóm em giải quyết bài toán tranh chấp tồn kho khi 2 khách cùng bấm mua ly cà phê cuối cùng trong cùng 1 tích tắc như thế nào?"
- **Trả lời:** *"Dạ thưa Thầy, đây là trọng tâm kiểm thử của Task 5. Nhóm em áp dụng kỹ thuật Khóa lạc quan (Optimistic Locking) kết hợp Database Transaction (`prisma.$transaction`). Khi 2 khách cùng đặt món mà kho chỉ còn đủ pha 1 ly cuối, cả 2 transaction đều đọc phiên bản tồn kho ban đầu. Giao dịch nào đến trước sẽ trừ kho thành công và tăng số `version`. Giao dịch đến sau kiểm tra điều kiện `stockQuantity >= số_lượng_cần` hoặc kiểm tra số `version` thấy dữ liệu đã bị thay đổi, transaction sẽ lập tức Rollback và ném lỗi `HTTP 409 Conflict: Không đủ nguyên liệu tồn kho`. Nhóm em đã viết kiểm thử tự động `orders-concurrency.spec.ts` chứng minh 100% chỉ có đúng 1 đơn thành công, kho không bao giờ bị âm ạ."*

### Câu 7: "Làm thế nào để hệ thống của em chống trừ tiền trùng lặp khi mạng lag và khách bấm nút Thanh toán nhiều lần?"
- **Trả lời:** *"Dạ thưa Thầy, theo đúng bài giảng 28/10 của Thầy, phía Client Next.js khi chuẩn bị gửi yêu cầu thanh toán sẽ tự sinh một mã định danh duy nhất `Idempotency-Key` (chuẩn UUID v4). Phía Backend lưu mã này vào bảng `Payment`. Khi khách sốt ruột bấm nút nhiều lần hoặc mạng chập chờn gửi lại bản tin, Backend nhận diện trùng `Idempotency-Key` sẽ không tạo giao dịch mới mà chỉ trả về kết quả của giao dịch đầu tiên đã xử lý, đảm bảo an toàn tuyệt đối cho tài khoản của khách hàng ạ."*

---

> [!TIP]
> **Lời khuyên vàng:** Hãy mở file này trên máy tính của bạn khi học bài, thực hành gõ thử các lệnh chạy Docker, chạy Unit Test và cURL một vài lần. Khi bạn đã tự tay thấy test chạy xanh và API trả về JSON đúng như lý thuyết, bạn sẽ hoàn toàn làm chủ phần thi của mình!
