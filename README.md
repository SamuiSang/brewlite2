# BrewLite – Requirements to Deployment (Assignment 2)

- **Môn học:** Công nghệ Phần mềm – Học kỳ I (2026–2027)
- **Trường:** Đại học Sài Gòn (SGU) – Khoa Công nghệ Thông tin
- **Ngăn xếp kỹ thuật bắt buộc:** Next.js (Mobile-first / PWA), NestJS (Modular Monolith – 3-Tier Layered Architecture), PostgreSQL (Prisma ORM) và Docker

---

## 1. Giới thiệu Dự án và Phạm vi Sản phẩm

**BrewLite** là ứng dụng web đặt đồ uống trực tuyến theo hướng **Mobile-first / PWA**, giải quyết bài toán xếp hàng giờ cao điểm, sai sót khi ghi nhận tùy biến món (Size/Topping) thủ công, xung đột tồn kho khi nhiều khách đặt cùng lúc và rủi ro trừ tiền trùng lặp khi thanh toán.

**Luồng nghiệp vụ cốt lõi (End-to-End):**

> `Xem menu` -> `Chọn tùy chọn (Size/Topping)` -> `Giỏ hàng & Khuyến mãi` -> `Đặt đơn (Khóa tồn kho đồng thời)` -> `Thanh toán Cổng Sandbox & Webhook Backend (Idempotency-Key)` -> `Theo dõi đơn & Tích điểm thưởng`

---

## 2. Phân công Nhóm Phát triển (6 Thành viên – Mô hình Vertical Slice)

Mỗi thành viên phụ trách xuyên suốt **1 Module Chức năng** từ khâu Khai thác yêu cầu (FR/AC), Vẽ sơ đồ (Use Case, Activity, Sequence, Class), Thiết kế Kiến trúc (ADR) đến Hiện thực Code (Frontend & Backend) và Kiểm thử:

| STT | Thành viên | Vai trò Scrum | Module Chức năng phụ trách xuyên suốt (Từ Sơ đồ -> Code -> Test) |
| :-: | :--- | :--- | :--- |
| **1** | **Duy** | Dev Team | **Chức năng 1 (`FR-01`, `FR-02`):** Hiển thị Menu, Tìm kiếm, Lọc theo Danh mục & Xem Chi tiết sản phẩm + E2E Test |
| **2** | **Quỳnh** | Dev Team | **Chức năng 2 (`FR-03`, `FR-09`):** Tùy biến Món (Size/Topping), Quản lý Giỏ hàng (`Zustand`) & Áp mã Khuyến mãi (`Promotion`) + CI Pipeline |
| **3** | **Hiếu** | Product Owner (PO) | **Chức năng 3 (`FR-04`):** Đăng ký, Đăng nhập, Xác thực Phân quyền `JWT` & Giám sát `GET /api/v1/health` + Quản lý Backlog & Truy vết |
| **4** | **Chiến** | Dev Team | **Chức năng 4 (`FR-05`):** Khởi tạo Đơn hàng (`POST /orders`), Tính tổng tiền tại Business Layer & Khóa Tồn kho Đồng thời (`Optimistic Lock`) |
| **5** | **Quang** | Dev Team | **Chức năng 5 (`FR-06`, `NFR-01..05`):** Thanh toán Cổng Sandbox & Webhook Backend (`POST /payments/webhook` 2 bước) + Chống Trừ tiền Trùng lặp (`Idempotency-Key`) + Integration Test |
| **6** | **Sang** | Scrum Master (SM) | **Chức năng 6 (`FR-07`, `FR-08`, `FR-10`):** Biên nhận, Lịch sử Đơn (`/orders/my-orders`), Theo dõi Trạng thái & Điểm thưởng (`LoyaltyTransaction`) + Docker & CD Pipeline |

---

## 3. Cấu trúc Repository (Chuẩn Mục 9 – Assignment 2)

```text
brewlite/
|-- apps/
|   |-- web/                         # Next.js mobile-first/PWA (Presentation UI)
|   `-- api/                         # NestJS Modular Monolith (3-Tier Layered Architecture)
|-- docs/
|   |-- requirements/                # Task 1: context-and-scope.md, srs-summary.md, usecase-checkout-spec.md
|   |-- diagrams/                    # Task 1, 2, 3: Tệp nguồn PlantUML (.puml) và ảnh kết xuất (.svg)
|   |-- architecture/                # Task 3: architecture-overview.md và thư mục adr/
|   |-- traceability-matrix.md       # Mục 8: Ma trận truy vết bắt buộc (FR -> UC -> Diagram -> Code -> Test)
|   `-- deployment.md                # Task 3.2: Mô tả triển khai Production
|-- tests/                           # Task 5.2: Integration tests & Playwright E2E tests
|-- .github/workflows/               # Task 4.4 & 5.3: Pipeline CI (ci.yml) và CD (cd.yml)
|-- docker-compose.yml               # Khởi chạy đồng bộ Web, API và PostgreSQL ở local
|-- .env.example                     # Mẫu cấu hình biến môi trường
`-- README.md                        # Tài liệu hướng dẫn, quy ước làm việc & Sprint Review/Retrospective
```

---

## 4. Chiến lược Branch, Pull Request, Quy ước Commit và Definition of Done (Task 4.1 & 4.2)

### 4.1 Quy tắc thực hiện tuần tự

Toàn bộ dự án tuân thủ nghiêm ngặt quy tắc thực hiện tuần tự của đề bài:

> **`Task 1 (Yêu cầu)` -> `Task 2 (Mô hình hóa)` -> `Task 3 (Kiến trúc)` -> `Task 4 (MVP Sprint 1 & CI)` -> `Task 5 (MVP Sprint 2, CD & Production)`**

### 4.2 Chiến lược Nhánh (Branching Strategy) và Pull Request

- Nhánh chính `main` được bảo vệ (**Branch Protection**): Không thành viên nào được push trực tiếp vào `main`.
- Mọi bổ sung hoặc thay đổi về tài liệu yêu cầu, sơ đồ, kiến trúc hay mã nguồn đều phải tách nhánh riêng và tạo **Pull Request (PR)** ghi rõ lý do:
  - Nhánh tài liệu và sơ đồ (Task 1–3): `docs/task1-<ten>`, `docs/task2-<ten>`, `docs/task3-<ten>`
  - Nhánh tính năng (Task 4–5): `feat/<chuc-nang>-<ten>`
  - Nhánh sửa lỗi, kiểm thử, CI/CD: `fix/<mo-ta>`, `test/<mo-ta>`, `ci/<mo-ta>`

### 4.3 Quy ước Commit (Conventional Commits)

- `docs(task1): ...` – Bổ sung/cập nhật tài liệu yêu cầu và sơ đồ Use Case (Task 1).
- `docs(task2): ...` – Bổ sung/cập nhật Activity, Sequence, Class Diagram (Task 2).
- `docs(task3): ...` – Bổ sung/cập nhật kiến trúc, ADR và Deployment Diagram (Task 3).
- `feat(menu|cart|auth|orders|payments|loyalty): ...` – Hiện thực mã nguồn chức năng (Task 4 & 5).
- `test(unit|integration|e2e): ...` – Bổ sung kiểm thử tự động.
- `ci(workflow): ...` / `chore(docker): ...` – Thiết lập hạ tầng Docker và pipeline CI/CD.

### 4.4 Definition of Done (DoD)

Một Task hoặc User Story chỉ được nghiệm thu (`Done`) khi thỏa mãn đầy đủ các tiêu chí:

1. Tạo phẩm của Task trước đó đã tồn tại trên nhánh `main` với lịch sử commit/PR rõ ràng.
2. Đối với Sơ đồ (Task 1–3): Lưu đầy đủ cả tệp mã nguồn `.puml` và ảnh kết xuất `.svg` trong `docs/diagrams/`, không mâu thuẫn với SRS và mô hình dữ liệu.
3. Đối với Mã nguồn (Task 4–5):
   - Tuân thủ kiến trúc 3 tầng (Presentation – Business Logic – Data Access Layer); tổng tiền đơn hàng bắt buộc tính lại tại Business Logic Layer.
   - Đảm bảo an toàn đồng thời (Database Transaction + Optimistic Locking chống âm kho) và chống thanh toán trùng lặp (`Idempotency-Key`).
   - Vượt qua toàn bộ bước kiểm tra tự động trên CI Pipeline (`Install -> Lint -> Unit Test -> Build`).
4. Được cập nhật đầy đủ vào bảng truy vết `docs/traceability-matrix.md`.


---

## 5. Hướng dẫn Khởi chạy Hệ thống bằng Docker Compose & Local Dev (Task 4.1)

### 5.1 Khởi chạy đồng bộ bằng Docker Compose (Khuyên dùng)

1. Sao chép tệp cấu hình biến môi trường mẫu (tuyệt đối không commit tệp `.env` thật lên Git):
   ```bash
   cp .env.example .env
   ```
2. Khởi chạy đồng bộ cả 3 container (`postgres-db`, `api-backend`, `web-frontend`) qua mạng nội bộ Docker:
   ```bash
   docker compose up --build -d
   ```
3. Kiểm tra trạng thái sức khỏe hệ thống (Health Check Probe):
   - **Frontend Next.js PWA:** `http://localhost:3000`
   - **Backend NestJS API:** `http://localhost:3001/api/v1`
   - **Health Check Endpoint:** `http://localhost:3001/api/v1/health` (Thực thi `SELECT 1` xuống PostgreSQL)

### 5.2 Khởi chạy từng phần phục vụ phát triển (Local Development)

1. Khởi chạy riêng container cơ sở dữ liệu PostgreSQL 16:
   ```bash
   docker compose up -d postgres-db
   ```
2. Cài đặt phụ thuộc sạch và chạy Migration + Seed dữ liệu mẫu (10 món đồ uống kèm nguyên liệu `Ingredient` & công thức `RecipeItem`):
   ```bash
   npm ci
   cd apps/api && npx prisma migrate dev && npx prisma db seed
   ```
3. Chạy máy chủ phát triển:
   ```bash
   npm run dev:api   # Chạy NestJS API tại cổng 3001
   npm run dev:web   # Chạy Next.js PWA tại cổng 3000
   ```

---

## 6. Quy trình CD Pipeline & Kế hoạch Rollback Production (Task 5.3 – ADR-006)

### 6.1 Kiến trúc CD Pipeline (`.github/workflows/cd.yml`)

Khi code được hợp nhất vào nhánh `main` (hoặc kích hoạt thủ công qua `workflow_dispatch`), GitHub Actions thực thi tuần tự 3 giai đoạn:

1. **Stage 1 (`quality-gate`):** Cài đặt phụ thuộc sạch (`npm ci`), sinh Prisma Client (`npm run prisma:generate --workspace=apps/api`), chạy `npm run lint`, `npm test` (Backend NestJS + Frontend Next.js Jest) và `npm run build`.
2. **Stage 2 (`build-and-push`):** Đóng gói multi-stage Docker images (`apps/api/Dockerfile` và `apps/web/Dockerfile`) và đẩy lên **GitHub Container Registry (GHCR)** với bộ tag bất biến `sha-<short_sha>` kèm `latest`:
   - `ghcr.io/samuisang/brewlite-api:<sha-tag>`
   - `ghcr.io/samuisang/brewlite-web:<sha-tag>`
3. **Stage 3 (`deploy-and-verify`):** Gửi webhook triển khai tới nền tảng Cloud PaaS (`RENDER_DEPLOY_HOOK_URL`), sau đó chạy **Smoke Test** gọi `GET <PRODUCTION_API_URL>/api/v1/health` tối đa **6 lần × 5 giây** (30 giây) để xác nhận API trả HTTP `200` và kết nối PostgreSQL (`SELECT 1`) khỏe mạnh.

### 6.2 Quy trình Rollback Tự động & Thủ công (Auto-Rollback Runbook)

- **Rollback tự động trên CI/CD:** Nếu bước Smoke Test `/api/v1/health` thất bại (HTTP khác `200` hoặc timeout sau 30 giây), bước `Automated Rollback on Health Check Failure` tự động chạy (`if: failure() && steps.smoke.outcome == 'failure'`) để kích hoạt `RENDER_ROLLBACK_HOOK_URL`, chuyển lưu lượng về container image ổn định trước đó mà không làm mất dữ liệu trong Persistent Volume PostgreSQL.
- **Rollback thủ công qua GitHub Actions (`workflow_dispatch`):**
  1. Vào tab **Actions** -> chọn workflow **CD - Deploy to Production & Auto-Rollback** -> bấm **Run workflow**.
  2. Nhập immutable image tag ổn định gần nhất vào trường `target_tag` (ví dụ `sha-4743bca`).
- **Rollback thủ công trên Docker Host / VPS:**
  ```bash
  # Dừng dịch vụ gặp sự cố và kéo image phiên bản ổn định (last-known-good SHA)
  docker pull ghcr.io/samuisang/brewlite-api:<stable_sha_tag>
  docker pull ghcr.io/samuisang/brewlite-web:<stable_sha_tag>
  docker compose up -d
  # Hoặc hoàn tác commit lỗi trên nhánh main:
  git revert <bad_commit_sha> && git push origin main
  ```
- Tài liệu tổng kết Sprint 2 Retrospective và Bộ Q&A bảo vệ kỹ thuật xem tại [`docs/project-management/sprint2-retro.md`](docs/project-management/sprint2-retro.md).

