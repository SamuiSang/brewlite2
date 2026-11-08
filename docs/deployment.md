# TÀI LIỆU THIẾT KẾ TRIỂN KHAI HỆ THỐNG & HẠ TẦNG MẠNG DOANH NGHIỆP THỰC TẾ (DEPLOYMENT SPECIFICATION)

- **Dự án:** BrewLite – Hệ thống Đặt đồ uống Trực tuyến (Mobile-first / PWA)
- **Tài liệu:** `docs/deployment.md`
- **Giai đoạn:** Task 3.2 – Deployment Architecture & Hạ tầng Triển khai Production
- **Thực hiện:**
  - **Sang (Scrum Master):** Phụ trách vẽ Sơ đồ UML Deployment Diagram (`docs/diagrams/deployment-diagram.puml`).
  - **Hiếu (Product Owner):** Phụ trách Đặc tả Chi tiết Kiến trúc Hạ tầng Doanh nghiệp, Phân vùng Mạng, Tường lửa Phần cứng, Mạng riêng ảo VPN, Quản lý Secret và Cơ chế Giám sát Rollback (Tuân thủ triệt để bài giảng 28/10 của Thầy Phiêu).
- **Trạng thái:** Đã chấp thuận (Accepted)
- **Liên kết yêu cầu:** `Task 3.2`, `Task 5.3`, `Task 5.4`, `NFR-01`, `NFR-02`, `NFR-03`, `NFR-05`, `ADR-005`, `ADR-006`

---

## 1. Sơ đồ Kiến trúc Hạ tầng Mạng Doanh nghiệp Thực tế (Enterprise Infrastructure Topology)

Theo bài giảng chuyên sâu ngày 28/10 của Thầy Phiêu về hạ tầng mạng máy tính và triển khai doanh nghiệp, hệ thống **BrewLite** được thiết kế dựa trên mô hình phân vùng mạng vật lý và logic phân tầng bảo mật cao. Hệ thống ngăn cách hoàn toàn giữa Internet công cộng và cụm máy chủ xử lý dữ liệu nội bộ:

```mermaid
flowchart TD
    subgraph PublicZone ["VÙNG PUBLIC INTERNET & CLIENT (EDGE ZONE)"]
        ClientBrowser["Trình duyệt Di động Khách hàng (Next.js PWA)"]
        PaymentGateway["Cổng Thanh toán Đối tác (MoMo / VNPay / VietQR)"]
        AdminRemote["Quản trị viên / Developer làm việc từ xa (WFH)"]
    end

    subgraph PerimeterZone ["VÙNG BIÊN AN NINH & TƯỜNG LỬA PHẦN CỨNG"]
        CDN["Edge CDN & DNS Gateway (HTTPS / TLS 1.3)"]
        HW_Firewall["TƯỜNG LỬA PHẦN CỨNG CHUYÊN DỤNG (Hardware Firewall)<br>(Lọc gói tin IP/Port Whitelist: Mở 443, Chặn 5432 & Cổng nội bộ)"]
        VPNGateway["Cổng Mạng Riêng Ảo (VPN Gateway / IPsec Tunnel)"]
    end

    subgraph InternalNetwork ["MẠNG NỘI BỘ DOANH NGHIỆP (ENTERPRISE LAN / RACK INFRASTRUCTURE)"]
        CentralRouter["Router Trung tâm Doanh nghiệp"]
        FloorSwitch["Bộ Chuyển Mạch Tủ Rack (Switch)"]

        subgraph AppCluster ["Cụm Máy chủ Ứng dụng (App Compute Cluster)"]
            FE_Host["Web Server (Next.js PWA Static & SSR)"]
            BE_API["Application Server (Docker: NestJS API Gateway - Port 3001)"]
            WebManager["Internal Web Manager Server (Dành cho Barista & Quản lý)"]
        end

        subgraph IsolatedDBZone ["Phân vùng CSDL Cô lập (Isolated Database Zone)"]
            DB_Server[("PostgreSQL Database Server 16 Alpine<br>(Port 5432 - Internal Only, No Public IP)")]
            PersistentStorage[("Phân vùng Lưu trữ Bền vững (Persistent Volume Storage)")]
            DB_Server --- PersistentStorage
        end
    end

    ClientBrowser -->|"1. Truy cập HTTPS:443"| CDN
    CDN -->|"Tải Static Assets / HTML"| FE_Host
    ClientBrowser -->|"2. REST API Requests (HTTPS:443)"| HW_Firewall
    PaymentGateway -->|"3. Webhook Callback (POST /webhook:443)"| HW_Firewall
    
    HW_Firewall -->|"4. Chuyển tiếp lưu lượng sạch (Port 3001)"| CentralRouter
    CentralRouter --> FloorSwitch
    FloorSwitch --> BE_API
    FloorSwitch --> WebManager
    
    BE_API -->|"5. Truy vấn nội bộ TCP:5432 (Internal VPC/VLAN)"| DB_Server
    
    AdminRemote -->|"Đường hầm mã hóa (Encrypted Tunnel:1194)"| VPNGateway
    VPNGateway -->|"Cấp IP nội bộ (VLAN Quản trị)"| FloorSwitch
```

---

## 2. Đặc tả Chi tiết các Phân vùng & Thiết bị Hạ tầng (Bài giảng 28/10)

### 2.1 Tường lửa Phần cứng Chuyên dụng (Hardware Firewall)
- **Bản chất kỹ thuật:** Là thiết bị phần cứng vật lý chuyên dụng độc lập (như Cisco ASA, Fortinet FortiGate, hoặc Palo Alto Networks) được lắp đặt trực tiếp tại điểm giao thoa giữa đường truyền Internet bên ngoài và mạng LAN doanh nghiệp.
- **Cơ chế lọc gói tin (Stateful Packet Inspection & IP/Port Whitelist):**
  - Sử dụng vi xử lý phần cứng chuyên dụng (ASIC) để kiểm tra các trường Header của gói tin (Địa chỉ IP nguồn, IP đích, Cổng nguồn, Cổng đích, Giao thức TCP/UDP) với độ trễ cực thấp (< 1ms), **hoàn toàn không tiêu tốn tài nguyên CPU/RAM của máy chủ ứng dụng**.
  - **Quy tắc Whitelist nghiêm ngặt:** Chỉ cho phép gói tin đi qua cổng `443 (HTTPS)` và cổng `80` (chỉ để chuyển hướng 301 sang 443).
  - **Chặn đứng mọi truy cập trực tiếp từ Internet vào CSDL:** Cổng `5432 (PostgreSQL)` và cổng quản trị `22 (SSH)` bị chặn 100% tại tường lửa phần cứng.
- **Phân biệt với Software Firewall:** Tường lửa phần mềm (như `iptables`, `UFW` trên Linux) chỉ đóng vai trò là lớp bảo vệ thứ hai cục bộ trên từng máy chủ, không thể thay thế năng lực chịu tải và chống tấn công từ chối dịch vụ (DDoS) của Tường lửa phần cứng.

### 2.2 Bộ Chuyển mạch Tủ Rack (Switch) & Router Trung tâm
- **Switch tủ mạng (Rack Switch):** Được đặt trong từng tủ Rack của trung tâm dữ liệu hoặc từng tầng của tòa nhà văn phòng, có nhiệm vụ gom toàn bộ các kết nối cáp mạng nội bộ (Ethernet UTP/STP) từ các máy chủ ứng dụng và máy trạm nhân viên đưa về một đầu mối.
- **Router trung tâm (Core Router):** Định tuyến lưu lượng nội bộ giữa các phân vùng mạng (Subnet / VLAN) và kết nối trực tiếp với Tường lửa phần cứng để truyền dữ liệu ra Internet.

### 2.3 Mạng riêng ảo (VPN - Virtual Private Network) & Kịch bản Làm việc từ xa (Work from Home)
- **Vấn đề đặt ra:** Trong trường hợp Quản trị viên hệ thống (Admin) hoặc Lập trình viên Backend cần làm việc từ xa (Work from Home - WFH) để bảo trì CSDL PostgreSQL, kiểm tra dữ liệu qua Prisma Studio hoặc xem nhật ký máy chủ (Log Server). Do CSDL đã bị cô lập hoàn toàn không mở cổng ra Internet, máy tính ở nhà không thể kết nối trực tiếp.
- **Giải pháp Mạng riêng ảo (VPN Gateway):**
  - Doanh nghiệp thiết lập một máy chủ **VPN Gateway** (hỗ trợ giao thức OpenVPN / IPsec IKEv2) đặt tại vùng mạng biên an ninh.
  - Quản trị viên từ xa bắt buộc phải cài đặt phần mềm VPN Client, nhập chứng chỉ số và mật khẩu 2 lớp (MFA).
  - VPN Client thiết lập một **Đường hầm mã hóa (Encrypted Tunnel)** xuyên qua Internet kết nối vào VPN Gateway.
  - Khi đường hầm được xác lập, máy trạm từ xa sẽ được cấp phát một địa chỉ IP nội bộ hợp lệ (ví dụ: `10.0.5.x`), cho phép truy cập an toàn vào CSDL PostgreSQL qua cổng `5432` nội bộ giống như đang cắm dây mạng trực tiếp tại văn phòng công ty.

### 2.4 Phân vùng CSDL Cô lập (Isolated Database Zone)
- **Cô lập mạng tuyệt đối (Private Subnet):** Máy chủ CSDL PostgreSQL được đặt trong VLAN riêng biệt, không có Public IP, chỉ chấp nhận kết nối TCP từ địa chỉ IP của cụm Application Server hoặc dải IP của VPN Gateway.
- **Phân vùng Lưu trữ Bền vững (Persistent Volume Storage):** Dữ liệu bảng thực thể (`User`, `Product`, `Ingredient`, `Order`, `Payment`) được mount ra ổ cứng gắn ngoài độc lập (EBS / Block Storage / Local Persistent Disk). Khi container PostgreSQL bị restart, nâng cấp phiên bản hoặc bảo trì, toàn bộ dữ liệu giao dịch và nhật ký WAL (Write-Ahead Logging) được bảo toàn 100% không bị mất mát.

---

## 3. Ma trận Kết nối Mạng, Giao thức và Cổng Dịch vụ (Port Mapping Matrix)

Bảng ma trận ánh xạ toàn bộ các luồng giao tiếp mạng trong hệ thống theo đúng bài giảng của Thầy Phiêu:

| Thành phần Nguồn | Thiết bị Trung gian | Thành phần Đích | Giao thức Mạng | Cổng kết nối | Mục đích Nghiệp vụ & Ý nghĩa An ninh |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Khách hàng (Client Browser)** | Router $\rightarrow$ Edge CDN | **Next.js PWA Frontend** | `HTTPS (TLS 1.3)` | `443` | Tải giao diện ứng dụng web PWA, các tệp JavaScript tĩnh và Service Worker. |
| **Next.js Frontend / Client** | Hardware Firewall (Whitelist) | **NestJS API Gateway** | `HTTPS (REST API)` | `443 -> 3001` | Gọi các API xem Menu, đặt hàng, tạo phiên thanh toán và xác thực JWT. |
| **Cổng thanh toán Sandbox** | Hardware Firewall (Whitelist IP) | **NestJS Webhook (`/webhook`)** | `HTTPS (POST JSON)` | `443 -> 3001` | Cổng MoMo/VNPay gửi bản tin đối soát thanh toán ngầm 2 bước có chữ ký số HMAC. |
| **NestJS API Service** | Switch Nội bộ (Rack Switch) | **PostgreSQL Database** | `TCP (Internal SSL)` | `5432` | Thực thi các truy vấn CRUD, $transaction và Optimistic Lock trong mạng nội bộ cô lập. |
| **Admin làm việc từ xa (WFH)** | VPN Gateway (Encrypted Tunnel) | **DB Server & Log Server** | `IPsec / OpenVPN` | `1194 / 22` | Quản trị viên truy cập nội bộ an toàn từ xa qua mạng riêng ảo mà không mở port DB ra ngoài. |
| **Monitoring Probe / CI Runner** | Mạng nội bộ cụm máy chủ | **NestJS API (`/health`)** | `HTTP / HTTPS` | `3001` | Thăm dò sức khỏe hệ thống (Readiness & Liveness Probe) mỗi 30 giây để kích hoạt Rollback. |

---

## 4. Quản lý Biến Môi trường và Khóa Bí mật (Secrets Management)

Hệ thống tuân thủ nghiêm ngặt nguyên tắc **12-Factor App** và quy tắc bất biến: **Tuyệt đối không lưu trữ khóa bí mật (Secrets) hoặc thông tin nhạy cảm vào mã nguồn Git**:

| Tên biến Môi trường | Phạm vi áp dụng | Mô tả Mục đích & Ý nghĩa Kỹ thuật | Giá trị Môi trường Dev (Local) | Giá trị Môi trường Production (Cloud PaaS Secret) |
| :--- | :---: | :--- | :--- | :--- |
| `NODE_ENV` | BE & FE | Chế độ thực thi ứng dụng | `development` | `production` |
| `PORT` | BE | Cổng lắng nghe của NestJS API | `3001` | Được cấp phát tự động bởi nền tảng Cloud (`10000` trên Render) |
| `DATABASE_URL` | BE | Chuỗi kết nối CSDL PostgreSQL | `postgresql://brewlite:secret@localhost:5432/brewlite_db` | `postgresql://<user>:<secret_pass>@dpg-xxxx.render.internal:5432/brewlite_prod?sslmode=require` |
| `JWT_SECRET` | BE | Khóa bí mật dùng để ký và thẩm định Token | `dev_jwt_secret_key_12345` | Chuỗi 64 ký tự hex ngẫu nhiên sinh từ lệnh: `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | BE | Thời hạn sống của Access Token | `24h` | `24h` |
| `FRONTEND_URL` | BE | Danh sách domain CORS Whitelist | `http://localhost:3000` | `https://brewlite.onrender.com` |
| `NEXT_PUBLIC_API_URL`| FE | Đường dẫn gốc gọi API Backend | `http://localhost:3001/api/v1` | `https://api-brewlite.onrender.com/api/v1` |

---

## 5. Phân định Ranh giới Môi trường: Local vs. CI vs. Production

```text
+----------------------------------------------------------------------------------------------------+
| 1. LOCAL DEVELOPMENT ENVIRONMENT (Máy tính Cá nhân Lập trình viên)                                 |
|    - docker-compose.yml khởi chạy đồng bộ 3 dịch vụ trên máy cá nhân:                              |
|      * web: Next.js Mobile-first PWA (port 3000, hot-reload)                                       |
|      * api: NestJS REST API (port 3001, nodemon watch)                                             |
|      * db: PostgreSQL 16 Alpine (port 5432 nội bộ, mount volume local `postgres_data`)             |
|    - Khởi tạo dữ liệu: Chạy lệnh `npx prisma migrate dev && npx prisma db seed` (nạp 10 món thực   |
|      đơn, bảng nguyên liệu Ingredient và công thức RecipeItem).                                    |
+----------------------------------------------------------------------------------------------------+
                                                  | (git push lên branch cá nhân & tạo Pull Request)
                                                  v
+----------------------------------------------------------------------------------------------------+
| 2. CONTINUOUS INTEGRATION (CI) ENVIRONMENT (GitHub Actions Runner Khép kín)                        |
|    - Cổng kiểm soát chất lượng tự động (Quality Gate) thực thi tuần tự 4 bước:                     |
|      1. Install dependencies sạch (`npm ci`)                                                       |
|      2. Linting kiểm tra chuẩn mực mã nguồn (`npm run lint`)                                       |
|      3. Chạy 100% các ca Unit Test Jest cho Auth, Health, Orders, Payments (`npm run test`)        |
|      4. Kiểm tra Build sản phẩm Next.js & NestJS (`npm run build`)                                  |
|    - Quy tắc nghiêm ngặt: Pull Request chỉ được phép merge vào main khi 100% các bước CI đều Pass.|
+----------------------------------------------------------------------------------------------------+
                                                  | (Merge PR vào nhánh main & gắn Tag Release)
                                                  v
+----------------------------------------------------------------------------------------------------+
| 3. PRODUCTION ENTERPRISE ENVIRONMENT (Nền tảng Cloud PaaS: Render / Railway / VPS Docker)          |
|    - Tường lửa phần cứng (Hardware Firewall): Lọc gói tin IP/Port Whitelist, bảo vệ trước DDoS.     |
|    - Frontend PWA: Build tối ưu hóa Static & SSR, phục vụ qua CDN toàn cầu có chứng chỉ HTTPS.     |
|    - Backend API: Docker Container Alpine Node.js được cách ly, kết nối DB qua mạng nội bộ VPC.     |
|    - Isolated PostgreSQL DB: Không mở public Internet; sao lưu tự động định kỳ; persistent disk.   |
|    - Zero-downtime Deploy & Rollback:                                                              |
|      * Thăm dò `GET /api/v1/health` (SELECT 1 kiểm tra kết nối DB) ngay sau khi deploy bản mới.    |
|      * Nếu kiểm tra thành công (200 OK) -> chuyển traffic; nếu lỗi -> tự động Rollback bản cũ.     |
+----------------------------------------------------------------------------------------------------+
```

---

## 6. Quy trình Kiểm tra Sức khỏe và Cơ chế Rollback Tự động (Health Check & Rollback)

1. **Quy trình Triển khai An toàn Không gián đoạn Dịch vụ (Zero-Downtime Deployment):**
   - Nền tảng điều phối Cloud PaaS khởi tạo container phiên bản mới ($V_{\text{new}}$) chạy song song với container phiên bản đang phục vụ ($V_{\text{old}}$).
   - Tiến hành chạy lệnh di trú lược đồ CSDL tự động: `npx prisma migrate deploy`.
   - Nền tảng điều phối gửi HTTP request định kỳ (chu kỳ 5 giây, tối đa 6 lần) đến endpoint thăm dò `GET /api/v1/health`.
   - Khi `HealthController` trả về `HTTP 200 OK` (xác nhận kết nối CSDL PostgreSQL phản hồi qua `SELECT 1` với độ trễ < 50ms), bộ cân bằng tải (Load Balancer) mới chính thức chuyển 100% lưu lượng người dùng sang container mới ($V_{\text{new}}$).
   - Container phiên bản cũ ($V_{\text{old}}$) được dừng lại một cách êm ái (Graceful Shutdown) sau khi hoàn tất các request đang xử lý dở dang.

2. **Kịch bản Tự động Phục hồi Lỗi (Automated Rollback Strategy):**
   - Nếu trong quá trình khởi động container mới gặp sự cố (lỗi cú pháp mã nguồn, thiếu biến môi trường Secret, migration thất bại), hoặc endpoint `/health` trả về mã lỗi `HTTP 503 Service Unavailable` hoặc bị Timeout quá 30 giây:
   - Quy trình triển khai lập tức bị hủy bỏ (Aborted).
   - Bộ cân bằng tải giữ nguyên 100% lưu lượng mạng tại container phiên bản cũ ($V_{\text{old}}$) đang chạy ổn định, đảm bảo khách hàng không hề cảm nhận thấy sự gián đoạn dịch vụ.
   - Container lỗi ($V_{\text{new}}$) bị tiêu hủy và hệ thống tự động gửi thông báo cảnh báo lỗi kèm nhật ký (Log Trace) về kênh giám sát kỹ thuật của nhóm.
