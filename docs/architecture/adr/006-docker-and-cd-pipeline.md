# KIẾN TRÚC HỆ THỐNG BREWLITE – BẢN GHI QUYẾT ĐỊNH KIẾN TRÚC (ADR)

# ADR-006: Đóng gói Độc lập bằng Docker Đa tầng (Multi-stage Containerization), Điều phối Mạng Nội bộ Docker Compose và Đường ống Triển khai Liên tục Không gián đoạn (Zero-Downtime CD Pipeline & Auto-Rollback)

- **Trạng thái (Status):** Đã chấp thuận (Accepted)
- **Ngày quyết định (Date):** 2026-11-10
- **Tác giả (Author):** Sang (Scrum Master / DevOps & Fullstack Lead – Phụ trách Module 6: Biên nhận, Lịch sử Đơn hàng, Điểm thưởng Loyalty & Hạ tầng CI/CD Deployment)
- **Người xem xét & Phê duyệt (Reviewers):** Hiếu (Product Owner), Quang (Backend Lead), Chiến (Core Domain Lead), Quỳnh (CI & State Lead), Duy (Frontend Lead)
- **Phân hệ phụ trách:** Chức năng 6 (`FR-07`, `FR-08`, `FR-10`), Yêu cầu phi chức năng (`NFR-01`..`NFR-05`), `Task 3.1`, `Task 3.2`, `Task 4.1`, `Task 5.3` & `Task 5.4`
- **Tài liệu liên quan:**
  - [Bối cảnh và Phạm vi Hệ thống (docs/requirements/context-and-scope.md)](../../requirements/context-and-scope.md)
  - [Đặc tả Yêu cầu SRS Summary (docs/requirements/srs-summary.md)](../../requirements/srs-summary.md)
  - [Sơ đồ Thành phần Hệ thống – UML Component Diagram (docs/diagrams/component-diagram.svg)](../../diagrams/component-diagram.svg)
  - [Sơ đồ Triển khai Hạ tầng – UML Deployment Diagram (docs/diagrams/deployment-diagram.svg)](../../diagrams/deployment-diagram.svg)
  - [Đặc tả Hạ tầng Triển khai Doanh nghiệp (docs/deployment.md)](../../deployment.md)

---

## 1. Bối cảnh và Đặt vấn đề (Context & Problem Statement)

Dự án **BrewLite** bao gồm 3 thành phần vận hành cốt lõi trong một Monorepo (`apps/web` dùng Next.js PWA, `apps/api` dùng NestJS Modular Monolith + Prisma ORM, và hệ quản trị CSDL `PostgreSQL 16`). Nhóm phát triển gồm 6 thành viên làm việc song song trên các máy cá nhân có hệ điều hành khác nhau (Windows, macOS, Linux) và hướng tới mục tiêu triển khai lên môi trường **Production HTTPS** để nghiệm thu thực tế với Giảng viên hướng dẫn (Thầy Phiêu).

Trong quá trình phát triển và vận hành, nhóm đối mặt với 4 thách thức kỹ thuật trọng tâm (bám sát bài giảng ngày **28/10** và **04/11** của Thầy Phiêu):

1. **Sự sai lệch môi trường phát triển ("Works on My Machine"):**
   - Phiên bản Node.js, thư viện hệ thống, cấu hình cổng (Port) và phiên bản PostgreSQL giữa máy của 6 thành viên dễ bất đồng bộ, gây lỗi khi chạy `npx prisma migrate dev` hoặc `npx prisma db seed`.
2. **Rủi ro đẩy thư mục phụ thuộc (`node_modules`) và lộ biến môi trường nhạy cảm (`.env`) lên Git:**
   - Như Thầy Phiêu đặc biệt cảnh báo trong buổi giảng ngày **04/11/2026**, việc commit `node_modules` làm phình to repository hàng trăm MB, còn việc lộ file `.env` chứa `DATABASE_URL`, `JWT_SECRET`, `WEBHOOK_SECRET` lên Git công khai là lỗ hổng bảo mật nghiêm trọng.
3. **Yêu cầu cô lập CSDL (Isolated Database Server) và tách biệt các tạo phẩm vật lý (`<<manifest>>` Artifacts):**
   - Theo bài giảng ngày **28/10/2026**, hệ quản trị CSDL PostgreSQL bắt buộc phải tách thành một Node/Container độc lập, tuyệt đối không cài chung lộ thiên hoặc mở cổng `5432` ra ngoài mạng công cộng (Public Internet).
4. **Rủi ro gián đoạn dịch vụ khi triển khai bản mới lên Production (Deployment Downtime & Broken Release):**
   - Nếu triển khai thủ công hoặc thay thế container trực tiếp mà không có cơ chế kiểm tra sức khỏe tự động (`GET /api/v1/health` kết hợp truy vấn `SELECT 1` xuống DB), một bản cập nhật bị thiếu biến môi trường hoặc lỗi migration sẽ làm sập toàn bộ hệ thống đang phục vụ khách hàng.

---

## 2. Các Tiêu chí Đánh giá Quyết định (Decision Drivers)

1. **Tính Nhất quán Môi trường (Environment Parity):** Đảm bảo 100% sự đồng nhất từ môi trường Local của 6 thành viên $\rightarrow$ Máy ảo Ubuntu của GitHub Actions CI $\rightarrow$ Môi trường Production HTTPS.
2. **Bảo mật Hạ tầng & Cô lập Mạng Nội bộ (Network Isolation & Hardware Firewall Alignment):** CSDL chỉ giao tiếp với Backend qua mạng cầu nối nội bộ (Internal Bridge/VPC Network), không phơi bày cổng `5432` ra Internet.
3. **Tối ưu Hóa Dung lượng Tạo phẩm (Minimal Artifact Footprint):** Giảm kích thước Docker Image từ `~1.1 GB` xuống `< 180 MB` thông qua cơ chế **Multi-stage Build** trên nền `node:20-alpine`.
4. **Triển khai Tự động Không gián đoạn & Khôi phục Lỗi Tức thì (Zero-Downtime CD & Automated Rollback):** Tự động hóa hoàn toàn quy trình từ lúc gộp Pull Request vào `main` / gắn Tag `v*.*.*` đến khi chạy Smoke Test qua `/api/v1/health` và tự động Rollback nếu phát hiện sự cố.

---

## 3. Các Phương án Đã Xem xét (Considered Alternatives)

### Phương án 1: Cài đặt trực tiếp trên máy chủ vật lý / VPS truyền thống (Bare-Metal / Manual SSH Deployment)
- **Cơ chế:** Cài trực tiếp Node.js, PM2, Nginx và PostgreSQL lên cùng một máy chủ VPS, sau đó SSH vào máy chủ để chạy `git pull && npm install && npm run build`.
- **Ưu điểm:** Không cần kiến thức về Docker; cấu hình ban đầu đơn giản cho 1 người dùng.
- **Nhược điểm (Lý do loại bỏ):**
  - Vi phạm yêu cầu tách biệt Node CSDL độc lập trong bài giảng 28/10 của Thầy Phiêu.
  - Không đảm bảo tính đồng nhất môi trường giữa 6 thành viên trong nhóm.
  - Khi nâng cấp phiên bản hoặc Rollback rất dễ để lại rác phụ thuộc (`node_modules` lệch phiên bản) và gây gián đoạn dịch vụ (Downtime) trong lúc đang biên dịch lại trên máy chủ.

### Phương án 2: Điều phối bằng cụm Kubernetes (K8s / EKS / GKE)
- **Cơ chế:** Đóng gói container và triển khai trên cụm Kubernetes đa node với Ingress Controller, Helm Charts và Service Mesh.
- **Ưu điểm:** Khả năng mở rộng quy mô lớn (Auto-scaling) và tự phục hồi ở cấp độ tập đoàn.
- **Nhược điểm (Lý do loại bỏ):**
  - Quá phức tạp (Over-engineering) đối với quy mô MVP học thuật của nhóm 6 sinh viên.
  - Chi phí vận hành hạ tầng đám mây cao, tốn nhiều thời gian cấu hình YAML thay vì tập trung vào chất lượng nghiệp vụ cốt lõi (`UC-01` $\rightarrow$ `UC-06`).

### Phương án 3 (ĐƯỢC CHỌN): Đóng gói Docker Multi-stage (`node:20-alpine`), Điều phối Local bằng `docker-compose.yml` và Pipeline CD Tự động trên GitHub Actions kết hợp Cloud PaaS HTTPS
- **Cơ chế:**
  - Mỗi thành phần phần mềm được đóng gói thành một tạo phẩm vật lý (`<<artifact>>`) độc lập qua mối quan hệ `<<manifest>>`: `brewlite-web:latest`, `brewlite-api:latest`, và `postgres:16-alpine`.
  - Ở môi trường phát triển (Local Dev), tệp `docker-compose.yml` khởi tạo đồng bộ cả 3 container cùng mạng nội bộ `brewlite_internal_net`.
  - Ở môi trường Production, đường ống `.github/workflows/cd.yml` tự động build Docker Image, đẩy lên Container Registry (GHCR), kích hoạt triển khai HTTPS kèm kịch bản Smoke Test `GET /api/v1/health` và tự động Rollback nếu kiểm tra thất bại.

---

## 4. Chi tiết Quyết định Kiến trúc (Decision Outcome)

### 4.1. Đóng gói Docker Đa tầng (Multi-stage Dockerfile) & Bảo vệ Repository (`.gitignore` / `.dockerignore`)

1. **Chốt chặn `.gitignore` và `.dockerignore` (Tuân thủ bài giảng 04/11):**
   - Cấm tuyệt đối đẩy `node_modules/`, `dist/`, `.next/`, `.env`, `*.log` lên Git hoặc đưa vào Docker Build Context.
   - Mọi gói phụ thuộc chỉ được tái tạo sạch sẽ thông qua lệnh `npm ci` dựa trên tệp khóa phiên bản bất biến `package-lock.json`.
2. **Kiến trúc Multi-stage Build (`node:20-alpine`):**
   - **Tầng 1 (`deps`):** Chỉ sao chép `package.json` và `package-lock.json`, thực thi `npm ci` để tận dụng tối đa cơ chế bộ nhớ đệm lớp (Docker Layer Caching).
   - **Tầng 2 (`builder`):** Sao chép mã nguồn, chạy `npx prisma generate` và biên dịch TypeScript sang mã máy JavaScript tối ưu (`npm run build`).
   - **Tầng 3 (`runner` – Production Image):** Sử dụng image siêu nhẹ `node:20-alpine`, chạy dưới quyền người dùng phi đặc quyền (`USER node` – Non-root User), chỉ giữ lại thư mục `dist/` (hoặc `.next/standalone`) và `node_modules` chỉ gồm dependencies thực thi (`--omit=dev`).

```dockerfile
# Minh họa cấu trúc Multi-stage Dockerfile cho apps/api (NestJS Modular Monolith)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
USER node
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/package.json ./package.json
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### 4.2. Kiến trúc Mạng Nội bộ Docker Compose & Cô lập Database (`docker-compose.yml`)

Hệ thống phân chia thành 2 vùng mạng ảo tách biệt trong `docker-compose.yml` để mô phỏng sát thực tế mô hình mạng doanh nghiệp (Hardware Firewall $\rightarrow$ App Server $\rightarrow$ Isolated DB Server):

- **`edge_public_net`:** Cho phép giao tiếp giữa Reverse Proxy / Edge Gateway với `web-container` (cổng `3000`) và `api-container` (cổng `3001`).
- **`db_isolated_net` (`internal: true`):** Chỉ nối riêng giữa `api-container` và `postgres-db`. Container `postgres-db` trên môi trường Production **hoàn toàn không khai báo `ports:` ra máy chủ vật lý bên ngoài**, đảm bảo không một kết nối Internet công cộng nào có thể quét hoặc tấn công trực tiếp vào cổng `5432`.
- **Lưu trữ bền vững (`postgres_data` Volume):** Dữ liệu bảng `User`, `Product`, `Ingredient`, `RecipeItem`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction` được gắn vào Named Volume độc lập, giữ nguyên vẹn dữ liệu kể cả khi xóa hoặc khởi động lại container.

### 4.3. Thiết kế Đường ống CI/CD Tự động & Cơ chế Zero-Downtime Rollback

Quy trình tự động hóa được tách bạch thành 2 đường ống trên GitHub Actions:

| Đường ống | Tệp cấu hình | Sự kiện kích hoạt | Các bước kiểm soát chất lượng & triển khai |
| :--- | :--- | :--- | :--- |
| **1. Continuous Integration (CI – Gatekeeper)** | `.github/workflows/ci.yml` | `pull_request` vào `main`, `push` lên nhánh tính năng | `actions/checkout@v4` $\rightarrow$ `actions/setup-node@v4 (Node 20)` $\rightarrow$ `npm ci` $\rightarrow$ `npm run lint` $\rightarrow$ `npx prisma validate` $\rightarrow$ `npm test` (Unit & Integration Tests) $\rightarrow$ `npm run build`. Nếu bất kỳ bước nào đỏ (Fail), GitHub tự động khóa nút Merge PR. |
| **2. Continuous Deployment (CD – Delivery)** | `.github/workflows/cd.yml` | Merge PR vào `main` hoặc đẩy Tag `v*.*.*` | Chạy lại cổng kiểm tra toàn vẹn $\rightarrow$ Build & Push Docker Image (`ghcr.io/samuisang/brewlite-web`, `ghcr.io/samuisang/brewlite-api`) gắn nhãn SHA commit $\rightarrow$ Kích hoạt Deploy Production HTTPS + chạy `npx prisma migrate deploy` $\rightarrow$ Thực thi **Smoke Test** gọi `GET /api/v1/health` $\rightarrow$ Tự động **Rollback** về Image SHA liền trước nếu Smoke Test thất bại. |

#### Quy trình Smoke Test & Tự động Rollback (Automated Rollback Flow):
1. Sau khi container phiên bản mới ($V_{\text{new}}$) khởi chạy bên cạnh phiên bản cũ ($V_{\text{old}}$), job `smoke-test` trong `.github/workflows/cd.yml` gửi tối đa 6 lần thử (mỗi lần cách nhau 5 giây) tới `GET https://<prod-api-domain>/api/v1/health`.
2. Endpoint `/api/v1/health` thực thi câu lệnh kiểm tra kết nối sống `SELECT 1` xuống PostgreSQL và kiểm tra trạng thái bộ nhớ tiến trình.
3. **Trường hợp Thành công (`HTTP 200 OK`):** Bộ cân bằng tải chuyển 100% lưu lượng HTTPS sang container mới ($V_{\text{new}}$) và hạ container cũ ($V_{\text{old}}$) một cách an toàn (Graceful Shutdown).
4. **Trường hợp Thất bại (`HTTP 503` hoặc Timeout > 30s):** Đường ống CD lập tức hủy đợt phát hành, giữ nguyên lưu lượng người dùng ở bản ổn định trước đó ($V_{\text{old}}$) hoặc kích hoạt lệnh `docker service rollback` / redeploy image tag `<previous-commit-sha>`, đồng thời ghi nhật ký cảnh báo lỗi trên GitHub Actions Summary.

---

## 5. Hệ quả và Đánh đổi Kiến trúc (Consequences & Trade-offs)

### 5.1. Lợi ích Đạt được (Positive Consequences)
- **Khởi chạy toàn bộ hệ thống bằng 1 lệnh duy nhất:** Mọi thành viên trong nhóm hoặc Giảng viên chấm bài chỉ cần chạy `docker compose up --build -d` là có ngay đầy đủ Frontend Next.js, Backend NestJS và PostgreSQL đã nạp sẵn dữ liệu mẫu (10 món đồ uống cùng định mức nguyên liệu `Ingredient` & `RecipeItem`).
- **Truy vết đầy đủ từ Thiết kế UML sang Triển khai Thực tế:** Ánh xạ 1-1 giữa các tạo phẩm `<<artifact>>` trong `docs/diagrams/component-diagram.svg` và các Node phần cứng/container trong `docs/diagrams/deployment-diagram.svg`.
- **An toàn tuyệt đối khi phát hành:** Cơ chế chốt chặn CI (`ci.yml`) kết hợp kiểm tra sức khỏe `/api/v1/health` trong CD (`cd.yml`) giúp loại bỏ hoàn toàn tình trạng đẩy code lỗi làm sập trang Production trước giờ bảo vệ đồ án.

### 5.2. Chi phí & Đánh đổi (Trade-offs & Mitigations)
- **Thời gian build Docker Image trên CI/CD (khoảng 2 – 3 phút):**
  - *Giải pháp giảm thiểu:* Áp dụng cơ chế lưu trữ đệm `actions/cache@v4` và `docker/build-push-action` với `cache-from: type=gha` để giảm thời gian build ở các lần chạy kế tiếp xuống dưới 45 giây.
- **Yêu cầu cài đặt Docker Desktop trên máy cá nhân:**
  - *Giải pháp giảm thiểu:* Tài liệu hóa hướng dẫn khởi chạy song song cả chế độ Docker Compose chuẩn và chế độ chạy Node.js + PostgreSQL cục bộ trong `README.md` và `docs/deployment.md`.
