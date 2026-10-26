# ĐẶC TẢ CHI TIẾT USE CASE: UC-03 – ĐĂNG KÝ, ĐĂNG NHẬP VÀ XÁC THỰC NGƯỜI DÙNG BẰNG JWT

- **Dự án:** BrewLite – Hệ thống Đặt đồ uống Trực tuyến (Mobile-first / PWA)
- **Tài liệu:** `docs/requirements/usecase-auth-spec.md`
- **Mã Use Case:** `UC-03`
- **Tên Use Case:** Đăng ký, Đăng nhập, Hồ sơ cá nhân và Xác thực Phân quyền JWT
- **Yêu cầu chức năng liên kết (Traceability):** `FR-04`
- **Người phụ trách:** **Hiếu (Product Owner / Fullstack Dev)**

---

## 1. Thông tin chung về Use Case

| Thuộc tính | Chi tiết mô tả |
| :--- | :--- |
| **Actor chính** | • **Khách hàng vãng lai (Guest):** Người chưa có tài khoản hoặc chưa đăng nhập vào hệ thống.<br>• **Khách hàng thành viên (Authenticated Customer):** Người dùng đã đăng nhập thành công và sở hữu mã định danh hợp lệ. |
| **Actor hỗ trợ** | • **Hệ thống Backend NestJS Auth Module**<br>• **Hệ thống Quản lý Cơ sở Dữ liệu PostgreSQL (Prisma ORM)** |
| **Trigger (Sự kiện kích hoạt)** | Khách hàng bấm vào nút "Đăng nhập" / "Đăng ký" trên thanh điều hướng (Navbar) hoặc hệ thống tự động kích hoạt khi khách hàng bấm nút "Tiến hành Đặt hàng / Thanh toán" mà chưa có phiên đăng nhập. |
| **Tiền điều kiện (Pre-conditions)** | 1. Hệ thống Backend API và Database đang hoạt động bình thường (Endpoint `GET /api/v1/health` trả về mã `HTTP 200 OK`).<br>2. Thiết bị người dùng có kết nối mạng Internet và hỗ trợ lưu trữ trạng thái tại trình duyệt (hỗ trợ lưu trữ token). |
| **Hậu điều kiện (Post-conditions)** | 1. **Đối với Đăng ký:** Bản ghi người dùng mới được lưu trữ an toàn trong bảng `User` của PostgreSQL; mật khẩu được băm bằng thuật toán `bcrypt` (`saltRounds >= 10`), điểm thưởng ban đầu khởi tạo là `0`.<br>2. **Đối với Đăng nhập:** Khách hàng được cấp phát một chuỗi `accessToken` (JWT) hợp lệ; Client tự động đính kèm token này vào header `Authorization: Bearer <token>` cho mọi thao tác đặt hàng, thanh toán và kiểm tra điểm thưởng. |

---

## 2. Các Use Case thành phần (Sub-Use Cases)

- **UC-03.1: Đăng ký tài khoản thành viên mới:** Khách hàng cung cấp Họ và tên, Email, Số điện thoại và Mật khẩu để tạo tài khoản mới.
- **UC-03.2: Đăng nhập hệ thống & Cấp phát JWT Token:** Xác thực thông tin đăng nhập đối chiếu với mật khẩu đã băm (Bcrypt) và nhận mã JWT mang payload chuẩn `{ sub: userId, email, role }`.
- **UC-03.3: Xem thông tin hồ sơ cá nhân & Xác minh phiên làm việc (`/auth/me`):** Client gửi token lên để máy chủ giải mã và trả về thông tin hồ sơ người dùng kèm số điểm thưởng tích lũy hiện có.

---

## 3. Luồng sự kiện (Flow of Events)

### 3.1 Luồng sự kiện chính (Main Flow - Đăng nhập hệ thống)

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
5. **AuthController (NestJS API)** tiếp nhận request và chuyển tiếp dữ liệu đến **AuthService (Business Logic Layer)**.
6. **AuthService** gọi tầng truy xuất dữ liệu **PrismaService (Data Access Layer)** truy vấn bản ghi người dùng trong bảng `User` dựa trên `email`:
   ```sql
   SELECT id, email, "passwordHash", role, "fullName" FROM "User" WHERE email = $1;
   ```
7. Nếu tìm thấy người dùng, **AuthService** sử dụng thư viện `bcrypt` để đối chiếu mật khẩu nhập vào với mật khẩu đã băm trong CSDL:
   ```typescript
   const isMatch = await bcrypt.compare(password, user.passwordHash);
   ```
8. Khi mật khẩu hoàn toàn trùng khớp, **AuthService** gọi **JwtService** để ký và sinh chuỗi `accessToken` có thời hạn với payload:
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
     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": "user-uuid-1234",
       "email": "customer@brewlite.com",
       "fullName": "Nguyen Van A",
       "role": "CUSTOMER"
     }
   }
   ```
10. **Next.js Client** lưu trữ `accessToken` an toàn và thiết lập Interceptor tự động gắn Header `Authorization: Bearer <token>` cho mọi request sau đó.
11. Giao diện cập nhật trạng thái đã đăng nhập và tự động điều hướng người dùng về trang Đích (mặc định là `/menu` hoặc trang được chỉ định bởi tham số `redirect`).

---

### 3.2 Luồng thay thế (Alternative Flows)

- **AF-01: Đăng ký tài khoản mới khi chưa có tài khoản:**
  - Tại bước 1, khách hàng chọn chuyển sang trang Đăng ký (`/register`).
  - Khách hàng điền đầy đủ: Họ tên, Email, Số điện thoại và Mật khẩu.
  - Client gửi `POST /api/v1/auth/register` với `RegisterDto`.
  - Backend kiểm tra email chưa tồn tại, thực hiện băm mật khẩu:
    ```typescript
    const passwordHash = await bcrypt.hash(password, 10);
    ```
  - Backend lưu người dùng mới vào PostgreSQL với vai trò `CUSTOMER` và `loyaltyPoints = 0`.
  - Hệ thống tự động cấp phát JWT và đăng nhập luôn cho khách hàng, sau đó chuyển hướng về trang Menu.

- **AF-02: Đăng nhập trong luồng Đặt hàng mà không làm mất Giỏ hàng (`redirect`):**
  - Khách hàng bấm nút "Thanh toán" tại màn hình Giỏ hàng (`/cart`) khi chưa đăng nhập.
  - Hệ thống tự động điều hướng sang trang Đăng nhập kèm tham số truy vấn: `/login?redirect=/checkout`.
  - Khách hàng thực hiện đăng nhập thành công theo Luồng chính.
  - Hệ thống phát hiện tham số `redirect`, tự động đưa khách hàng trở lại ngay màn hình `/checkout`. Toàn bộ dữ liệu giỏ hàng được bảo toàn nguyên vẹn trong Zustand Store và `localStorage`.

---

### 3.3 Luồng ngoại lệ (Exception Flows)

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
  - Khi khách hàng gửi request tới endpoint yêu cầu xác thực (`POST /orders`, `GET /orders/my-orders`, `GET /loyalty/balance`) nhưng token bị sai chữ ký hoặc quá hạn:
  - `JwtAuthGuard` tại Backend chặn đứng request ngay tại tầng Controller và phản hồi `HTTP 401 Unauthorized`.
  - Axios Interceptor tại Client bắt mã 401, tự động xóa token bị hỏng khỏi bộ nhớ và chuyển hướng người dùng về trang `/login` để xác thực lại.

- **EF-04: Mất kết nối CSDL hoặc lỗi hệ thống nghiêm trọng:**
  - Nếu kết nối tới cơ sở dữ liệu PostgreSQL bị gián đoạn, dịch vụ phản hồi `HTTP 500 Internal Server Error` (hoặc `HTTP 503` từ endpoint `/health`).
  - Client hiển thị component `ErrorState` kèm nút *"Thử lại"* để người dùng tải lại khi mạng ổn định.

---

## 4. Ma trận liên kết Nghiệp vụ & Dữ liệu (Traceability)

| Thành phần thiết kế | Tên đối tượng / File mã nguồn tương ứng |
| :--- | :--- |
| **Yêu cầu chức năng** | `FR-04` (Đăng ký, Đăng nhập, JWT & Health Check) |
| **Sơ đồ Use Case** | `docs/diagrams/uc-03-auth.puml` (.svg) |
| **Sơ đồ Hoạt động (Activity)** | `docs/diagrams/activity-03-auth.puml` (.svg) |
| **Sơ đồ Tuần tự (Sequence)** | `docs/diagrams/sequence-03-auth.puml` (.svg) |
| **Sơ đồ Lớp (Class)** | `docs/diagrams/class-03-user-auth.puml` (.svg) |
| **Tài liệu Kiến trúc (ADR)** | `docs/architecture/adr/005-security-jwt-and-healthcheck.md` |
| **Giao diện Frontend (Next.js)** | `apps/web/src/app/(auth)/login/page.tsx`<br>`apps/web/src/app/(auth)/register/page.tsx`<br>`apps/web/src/lib/api-client.ts` |
| **Dịch vụ Backend (NestJS)** | `apps/api/src/auth/auth.controller.ts`<br>`apps/api/src/auth/auth.service.ts`<br>`apps/api/src/auth/jwt.strategy.ts`<br>`apps/api/src/auth/guards/jwt-auth.guard.ts`<br>`apps/api/src/health/health.controller.ts` |
| **Kiểm thử (Unit Tests)** | `apps/api/src/auth/auth.service.spec.ts`<br>`apps/api/src/health/health.controller.spec.ts` |
