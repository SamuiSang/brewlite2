# 📮 HƯỚNG DẪN TEST API DỰ ÁN BREWLITE BẰNG POSTMAN
## DÀNH CHO: HÀN MINH HIẾU (PRODUCT OWNER & FULLSTACK DEV)

- **Môn học:** Công nghệ Phần mềm (Software Engineering) – Thầy Phiêu
- **Dự án:** BrewLite 2 – Hệ thống Đặt đồ uống Trực tuyến Mobile-first / PWA
- **Tệp Collection đính kèm:** `docs/testing/BrewLite_API_Collection.postman_collection.json`
- **Mục tiêu:** Giúp bạn nắm vững từng bước thao tác Postman, hiểu cách các API giao tiếp với nhau, và tự tin mở Postman trình diễn trước mặt Thầy Phiêu khi nghiệm thu đồ án.

---

# 📑 MỤC LỤC
1. [Tại sao dùng Postman để bảo vệ đồ án?](#1-tại-sao-dùng-postman-để-bảo-vệ-đồ-án)
2. [Cách Import Bộ sưu tập (Collection) vào Postman](#2-cách-import-bộ-sưu-tập-collection-vào-postman)
3. [Cơ chế Tự động hóa Biến môi trường (Environment Variables)](#3-cơ-chế-tự-động-hóa-biến-môi-trường)
4. [Kịch bản 5 Bước Test API Mẫu để Demo với Thầy Phiêu](#4-kịch-bản-5-bước-test-api-mẫu-để-demo-với-thầy-phiêu)
   - [Bước 1: Giám sát Hệ thống Health Check](#bước-1-giám-sát-hệ-thống-health-check)
   - [Bước 2: Tra cứu Thực đơn Thực tế](#bước-2-tra-cứu-thực-đơn-thực-tế)
   - [Bước 3: Đăng ký & Đăng nhập JWT](#bước-3-đăng-ký--đăng-nhập-jwt)
   - [Bước 4: Gọi API Bảo mật Hồ sơ Cá nhân (/auth/me)](#bước-4-gọi-api-bảo-mật-hồ-sơ-cá-nhân-authme)
   - [Bước 5: Thử nghiệm Ca Kiểm thử Tiêu cực (Negative Test - Sai pass)](#bước-5-thử-nghiệm-ca-kiểm-thử-tiêu-cực-negative-test)
5. [Tính năng "Ăn điểm": Chạy Tự động Toàn bộ bằng Collection Runner](#5-tính-năng-ăn-điểm-chạy-tự-động-toàn-bộ-bằng-collection-runner)
6. [Bộ Câu hỏi Thầy Phiêu hay hỏi khi chấm Postman](#6-bộ-câu-hỏi-thầy-phiêu-hay-hỏi-khi-chấm-postman)

---

# 1. Tại sao dùng Postman để bảo vệ đồ án?

Khi Thầy Phiêu ngồi chấm đồ án, Thầy thường yêu cầu:
> *"Em mở Postman lên test trực tiếp API cho Thầy xem, đừng chỉ bấm trên giao diện web vì web có thể mock dữ liệu."*

Sử dụng Postman giúp bạn:
1. **Chứng minh Backend NestJS chạy thật 100%:** Dữ liệu trả về đúng JSON chuẩn RESTful.
2. **Chứng minh Cơ chế Bảo mật:** Chứng minh token JWT hoạt động thật (có token thì mở khóa, không token thì chặn `401 Unauthorized`).
3. **Chứng minh Kiểm thử Tự động:** Các mã kiểm tra (Postman Assertions) tự động chạy và đánh dấu tích xanh `PASS`, không cần bạn phải giải thích dài dòng.

---

# 2. Cách Import Bộ sưu tập (Collection) vào Postman

Bạn chỉ mất đúng **10 giây** để đưa toàn bộ 10 API vào Postman của mình:

1. Mở phần mềm **Postman** trên laptop của bạn.
2. Nhìn góc trên bên trái, bấm vào nút **Import** (hoặc dùng phím tắt `Ctrl + O`).
3. Bấm nút **files** hoặc kéo thả tệp sau vào cửa sổ Postman:
   ```text
   d:\subjects\software engineering\BrewLite\brewlite2\docs\testing\BrewLite_API_Collection.postman_collection.json
   ```
4. Bấm **Import**. Bạn sẽ thấy ngay bộ sưu tập mang tên:
   **`BrewLite 2 – API Testing Collection (Hàn Minh Hiếu)`** xuất hiện bên thanh điều hướng bên trái!

---

# 3. Cơ chế Tự động hóa Biến môi trường

Bộ sưu tập đã được cài sẵn 2 biến quan trọng:
- `{{baseUrl}}`: Mặc định là `http://localhost:3001/api/v1`. Bạn không cần gõ lại địa chỉ host ở từng request.
- `{{accessToken}}`: **Đặc biệt thông minh!** Khi bạn bấm gửi request **Login** hoặc **Register**, một đoạn Test Script tự động chạy:
  ```javascript
  var json = pm.response.json();
  if (json.accessToken) {
      pm.collectionVariables.set("accessToken", json.accessToken);
  }
  ```
  Token JWT sẽ tự động được gán vào biến `{{accessToken}}`. Do đó, khi bạn bấm sang request `GET /auth/me` hay `POST /orders`, bạn **KHÔNG CẦN copy/paste token thủ công**, Postman đã tự đính kèm Header:
  ```http
  Authorization: Bearer {{accessToken}}
  ```

---

# 4. Kịch bản 5 Bước Test API Mẫu để Demo với Thầy Phiêu

Trước khi bấm, hãy đảm bảo Backend đang chạy:
```powershell
# Chạy Database (nếu chưa chạy):
docker compose up -d postgres-db

# Chạy Backend NestJS:
npm --workspace=apps/api run start:dev
```

---

### Bước 1: Giám sát Hệ thống Health Check
- **Thư mục:** `01. Giám sát Hệ thống` $\rightarrow$ Chọn request **`GET Health Check (Active Probe DB)`**.
- **Phương thức & URL:** `GET {{baseUrl}}/health`
- **Bấm:** **Send**
- **Kết quả trả về (HTTP 200 OK):**
  ```json
  {
    "status": "ok",
    "service": "BrewLite API",
    "timestamp": "2026-11-13T...",
    "uptime": 142.5,
    "checks": {
      "database": {
        "status": "connected",
        "latencyMs": 8
      },
      "memory": { "rssBytes": 52428800, "heapUsedBytes": 28117248 }
    }
  }
  ```
- **Tab Test Results:** Hiện `PASS (2/2)` màu xanh lá cây.
- **Lời nói tự tin với Thầy:** *"Dạ thưa Thầy, đây là endpoint Health Check do em hiện thực ở Task 4.3. Nó thực thi câu lệnh `SELECT 1` xuống PostgreSQL để đo độ trễ `latencyMs` thực tế, làm căn cứ kích hoạt tự động Rollback trong pipeline CD nếu DB gặp sự cố ạ."*

---

### Bước 2: Tra cứu Thực đơn Thực tế
- **Thư mục:** `03. Thực đơn & Sản phẩm` $\rightarrow$ Chọn **`GET Danh sách Món (All Products)`**.
- **Phương thức & URL:** `GET {{baseUrl}}/products`
- **Bấm:** **Send**
- **Kết quả:** Trả về danh sách đầy đủ 10 món đồ uống kèm công thức nguyên liệu pha chế (`RecipeItem`).
- **Tab Test Results:** Hiện `PASS` (Danh sách trả về tối thiểu 10 món).

---

### Bước 3: Đăng ký & Đăng nhập JWT
1. **Đăng ký tài khoản mới:**
   - Chọn **`POST Đăng ký tài khoản (Register)`**.
   - Body JSON gửi lên:
     ```json
     {
       "fullName": "Hàn Minh Hiếu",
       "email": "hieu.customer@brewlite.vn",
       "password": "password123",
       "phone": "0901234567"
     }
     ```
   - **Bấm Send:** Nhận về mã `201 Created` kèm chuỗi `accessToken`.
2. **Đăng nhập:**
   - Chọn **`POST Đăng nhập lấy Token (Login Success)`**.
   - Body JSON:
     ```json
     {
       "email": "hieu.customer@brewlite.vn",
       "password": "password123"
     }
     ```
   - **Bấm Send:** Nhận về mã `200 OK` kèm chuỗi Access Token JWT 24h. Postman tự động lưu token này vào bộ nhớ.

---

### Bước 4: Gọi API Bảo mật Hồ sơ Cá nhân (/auth/me)
- **Thư mục:** `02. Xác thực & Hồ sơ Hội viên` $\rightarrow$ Chọn **`GET Hồ sơ cá nhân (/auth/me - Cần Token)`**.
- **Phương thức:** `GET {{baseUrl}}/auth/me`
- **Mục Authorization:** Bạn sẽ thấy Postman đã tự chọn `Bearer Token` và điền sẵn `{{accessToken}}`.
- **Bấm Send:**
  ```json
  {
    "id": "c83b8b1a-...",
    "email": "hieu.customer@brewlite.vn",
    "fullName": "Hàn Minh Hiếu",
    "phone": "0901234567",
    "role": "CUSTOMER",
    "loyaltyPoints": 420
  }
  ```
- **Lời nói tự tin với Thầy:** *"Dạ thưa Thầy, endpoint này được bảo vệ bởi `JwtAuthGuard`. Khi request gửi lên, guard sẽ giải mã chữ ký HS256 của token, trích xuất `sub` (userId) và trả về đúng hồ sơ của khách hàng ạ."*

---

### Bước 5: Thử nghiệm Ca Kiểm thử Tiêu cực (Negative Test)
- Để chứng minh hệ thống không bị "lọt lưới" bảo mật, bạn chọn request:
  **`POST Đăng nhập thất bại (Sai mật khẩu - 401)`**.
- Body gửi mật khẩu sai: `"wrong_password_999"`.
- **Bấm Send:** Hệ thống lập tức trả về mã **`401 Unauthorized`** kèm thông báo lỗi chung *"Email hoặc mật khẩu không chính xác"*.
- **Giải thích cho Thầy nghe:** *"Dạ em áp dụng thông báo lỗi chung để ngăn chặn kẻ tấn công dò quét xem email đó đã tồn tại trong CSDL hay chưa (chống User Enumeration Attack) ạ."*

---

# 5. Tính năng "Ăn điểm": Chạy Tự động Toàn bộ bằng Collection Runner

Nếu Thầy muốn xem kiểm thử tự động toàn diện:
1. Nhấp vào tên bộ sưu tập **`BrewLite 2 – API Testing Collection (Hàn Minh Hiếu)`**.
2. Nhìn góc trên bên phải, bấm vào nút **Run** (Collection Runner).
3. Bấm nút màu xanh **Run BrewLite 2...**.
4. **Kết quả:** Postman sẽ tự động chạy tuần tự từ request 1 đến request 10 trong 2 giây. Toàn bộ bài test sẽ hiển thị một danh sách dài các dòng chữ xanh **`PASS (10/10)`** cực kỳ chuyên nghiệp!

---

# 6. Bộ Câu hỏi Thầy Phiêu hay hỏi khi chấm Postman

### Câu 1: "Tại sao em dùng Bearer Token trong Header mà không truyền token trong URL query parameter?"
- **Trả lời:** *"Dạ thưa Thầy, việc truyền token trên URL (`?token=...`) rất nguy hiểm vì URL sẽ bị ghi lại trong nhật ký truy cập (Web Access Logs), lịch sử trình duyệt và qua các proxy trung gian. Sử dụng Header `Authorization: Bearer <token>` là chuẩn bảo mật RFC 6750, bảo vệ token qua kênh mã hóa HTTPS TLS 1.3 ạ."*

### Câu 2: "Khi token hết hạn, Postman hay Client nhận được mã lỗi gì?"
- **Trả lời:** *"Dạ thưa Thầy, khi token hết hạn sau 24h, JwtAuthGuard của NestJS sẽ bắt lỗi và trả về mã HTTP `401 Unauthorized`. Phía Client Web có interceptor tự động bắt mã 401 này, xóa token cũ trong localStorage và điều hướng khách về trang `/login` ạ."*
