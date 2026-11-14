# KẾ HOẠCH QUẢN LÝ DỰ ÁN & BẢNG CÔNG VIỆC (GITHUB PROJECTS ISSUE BOARD & PRODUCT BACKLOG)

- **Dự án:** BrewLite – Hệ thống Đặt đồ uống Trực tuyến (Mobile-first / PWA)
- **Tài liệu:** `docs/project-management/issue-board-backlog.md`
- **Giai đoạn:** Task 4.1 & Task 4.2 – Quản lý Kho mã nguồn, Tài liệu & Kế hoạch Sprint
- **Chủ trì thực hiện:** **Hàn Minh Hiếu (Product Owner - PO)**
- **Phối hợp:** **Sang (Scrum Master - SM)** & Toàn bộ Dev Team (Duy, Quỳnh, Chiến, Quang)
- **Trạng thái:** Đã chấp thuận (Accepted)
- **Liên kết yêu cầu:** `Task 4.1`, `Task 4.2`, `Task 4.3`, `Task 5.1`, `SRS Summary`, `DoD`

---

## 1. Tổng quan Mô hình Quản lý Dự án Scrum trên GitHub Projects

Nhóm áp dụng khung làm việc Agile/Scrum với bảng điều phối công việc **GitHub Projects (Kanban Board)** để quản lý trực quan tiến độ của 2 Sprint theo đúng yêu cầu của Thầy Phiêu và đề bài Assignment 2.

### 1.1 Cấu trúc các cột trên Kanban Board (Board Columns Workflow)
1. **📌 Product Backlog:** Chứa toàn bộ các User Story / Tính năng tổng thể của đề tài từ US-01 đến US-10 được định lượng độ ưu tiên (MoSCoW) và Story Points.
2. **📋 Sprint Backlog (Sprint 1 / Sprint 2):** Các User Stories và Tasks kỹ thuật được cam kết hoàn thành trong Sprint tương ứng.
3. **⚙️ In Progress:** Các công việc đang được thành viên phụ trách hiện thực code hoặc viết tài liệu trên nhánh riêng (`feat/*`, `docs/*`).
4. **🔍 In Review / PR:** Các Pull Request đã được mở, đang chờ pipeline CI GitHub Actions kiểm tra tự động và các thành viên khác phê duyệt (Code Review / PO Review).
5. **✅ Done:** Các đầu việc đã thỏa mãn 100% tiêu chí **Definition of Done (DoD)** và đã merge thành công vào nhánh chính `main`.

---

## 2. Chi tiết Product Backlog & Phân bổ 2 Sprint (Sprint 1 & Sprint 2)

### 2.1 Bảng Product Backlog Tổng thể (MoSCoW & Story Points)

| Mã Issue | User Story / Task Kỹ thuật | Phân hệ / FR liên quan | MoSCoW | Story Points | Thành viên phụ trách | Sprint |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **#01** | Thiết lập cấu trúc Monorepo, `.gitignore`, Docker Compose dev | Hạ tầng / Task 4.1 | **Must** | 3 | Sang (SM) | **Sprint 1** |
| **#02** | Khởi tạo Issue Board, quy ước Branch/PR, DoD và duyệt docs | Quản lý / Task 4.1, 4.2 | **Must** | 2 | Hiếu (PO) | **Sprint 1** |
| **#03** | US-01: Hiển thị Menu, lọc theo danh mục & Seed DB 10 món | `FR-01`, `FR-02` | **Must** | 5 | Duy, Chiến | **Sprint 1** |
| **#04** | Xây dựng UI Loading/Skeleton, Empty State và Error State | UI/UX / Task 4.3 | **Should** | 3 | Quỳnh | **Sprint 1** |
| **#05** | Xây dựng API giám sát `GET /api/v1/health` & Unit Test | `FR-04`, `NFR-03` | **Must** | 3 | Hiếu (PO) | **Sprint 1** |
| **#06** | Thiết lập Pipeline CI tự động kiểm tra Lint, Test, Build | DevOps / Task 4.4 | **Must** | 5 | Quỳnh, Quang | **Sprint 1** |
| **#07** | US-02: Modal tùy biến Size (S/M/L), Topping và giỏ hàng Zustand | `FR-03` | **Must** | 5 | Quỳnh | **Sprint 2** |
| **#08** | US-03: Đăng ký, Đăng nhập, JWT Auth Guard & Quản lý User | `FR-04`, `NFR-02` | **Must** | 5 | Hiếu (PO) | **Sprint 2** |
| **#09** | US-04: Tạo đơn hàng, tính tiền Business Layer & Optimistic Lock | `FR-05`, `NFR-04` | **Must** | 8 | Chiến | **Sprint 2** |
| **#10** | US-05: Checkout thanh toán QR Sandbox & Webhook Idempotency-Key | `FR-06`, `NFR-04` | **Must** | 8 | Quang | **Sprint 2** |
| **#11** | US-06: Biên nhận đơn, lịch sử cá nhân & Tích điểm Loyalty | `FR-07`, `FR-10` | **Should** | 5 | Sang (SM) | **Sprint 2** |
| **#12** | US-07: Áp dụng mã Voucher giảm giá `Promotion` | `FR-09` | **Could** | 3 | Quỳnh | **Sprint 2** |
| **#13** | Kiểm thử tích hợp Concurrency Test và E2E Test Playwright | QA / Task 5.2 | **Must** | 5 | Quang, Duy | **Sprint 2** |
| **#14** | Thiết lập Pipeline CD triển khai Cloud PaaS HTTPS & Smoke Test | DevOps / Task 5.3, 5.4 | **Must** | 5 | Sang (SM) | **Sprint 2** |

---

## 3. Kế hoạch Chi tiết Sprint 1 (Sprint 1 Backlog: Foundation & MVP Menu)

- **Sprint Goal:** Hoàn thiện nền tảng kỹ thuật monorepo, quản lý tài liệu Task 1–3, đưa pipeline CI vào hoạt động và phát hành MVP đầu tiên xem Menu thực đơn kết hợp API Health Check.
- **Thời lượng:** Tuần 1 – Tuần 2 của đồ án.
- **Tổng Story Points cam kết:** 21 Points.

### 3.1 Danh sách Công việc Sprint 1

```text
+-----------------------------------------------------------------------------------------------------+
| SPRINT 1 BACKLOG ITEMS                                                                              |
+-----+-------------------------------------------------------+-----------+---------+-----------------+
| STT | Tên Công việc (User Story / Task)                     | Ưu tiên   | Điểm SP | Người thực hiện |
+-----+-------------------------------------------------------+-----------+---------+-----------------+
| 1   | Thiết lập Monorepo (apps/web, apps/api, docs), Docker | Must-have | 3 SP    | Sang (SM)       |
| 2   | Issue Board Sprint 1 & 2, Quản trị duyệt PR thư mục docs | Must-have | 2 SP    | Hiếu (PO)       |
| 3   | API GET /products, GET /products/:id & Seed CSDL      | Must-have | 5 SP    | Duy, Chiến      |
| 4   | Frontend Menu Mobile-first (Next.js) & UI States       | Must-have | 3 SP    | Duy, Quỳnh      |
| 5   | API Giám sát Liveness & Readiness GET /api/v1/health   | Must-have | 3 SP    | Hiếu (PO)       |
| 6   | Pipeline CI GitHub Actions (.github/workflows/ci.yml) | Must-have | 5 SP    | Quỳnh, Quang    |
+-----+-------------------------------------------------------+-----------+---------+-----------------+
|     | TỔNG CỘNG ĐIỂM SPRINT 1                               |           | 21 SP   |                 |
+-----+-------------------------------------------------------+-----------+---------+-----------------+
```

### 3.2 Minh chứng Thực thi Sprint 1 (Artifacts & Pull Requests)
- **PR #1 (Sang):** Khởi tạo Monorepo, cấu hình docker-compose local, .gitignore và README.md.
- **PR #2 (Hiếu):** Hiện thực `GET /api/v1/health`, Unit Test Jest cho HealthController và Tài liệu Issue Board Backlog.
- **PR #3 (Duy & Chiến):** Hiện thực API Products, Prisma Schema và Seed 10 món thực đơn kèm công thức RecipeItem.
- **PR #4 (Duy & Quỳnh):** Giao diện Menu Mobile-first Next.js, trạng thái Loading Skeleton, Empty và Error.
- **PR #5 (Quang):** Bộ Unit Test Jest cho Products API.
- **PR #6 (Quỳnh):** Cấu hình CI GitHub Actions và thu thập minh chứng 1 PR Pass, 1 PR Fail.

---

## 4. Kế hoạch Dự kiến Sprint 2 (Sprint 2 Backlog: Full Flow & Production Deployment)

- **Sprint Goal:** Hiện thực toàn bộ luồng nghiệp vụ end-to-end (Tùy biến món -> Giỏ hàng -> Đặt đơn chống âm kho -> Thanh toán QR Sandbox Webhook -> Biên nhận & Loyalty), kiểm thử Concurrency/E2E, đóng gói Docker và triển khai lên Production có HTTPS.
- **Thời lượng:** Tuần 3 – Tuần 4 của đồ án.
- **Tổng Story Points cam kết:** 39 Points.

---

## 5. Quy trình Kiểm soát Tài liệu & Phê duyệt Pull Request (PO Responsibilities - Task 4.2)

Với vai trò **Product Owner**, **Hàn Minh Hiếu** thiết lập quy chuẩn kiểm soát tài liệu:
1. **Nguyên tắc bảo toàn tạo phẩm:** Toàn bộ tài liệu Yêu cầu (`docs/requirements/*`), Sơ đồ UML (`docs/diagrams/*`), Kiến trúc (`docs/architecture/*`), và Triển khai (`docs/deployment.md`) là căn cứ pháp lý để nghiệm thu đồ án.
2. **Quy tắc Duyệt Pull Request (PR Review):**
   - Không thành viên nào được tự ý merge PR của chính mình.
   - PR thuộc thư mục `docs/` bắt buộc phải có ít nhất 1 phê duyệt từ Product Owner (Hiếu) hoặc Scrum Master (Sang).
   - PR thuộc thư mục mã nguồn (`apps/`) bắt buộc phải có tích xanh (Pass 100%) từ CI GitHub Actions trước khi nút Merge được mở khóa.
3. **Tiêu chí Hoàn thành (Definition of Done - DoD):**
   - Đạt 100% yêu cầu về phân tầng kiến trúc (3-tier layered).
   - Có kiểm thử tự động (Unit Test / Integration Test) tương ứng.
   - Đã cập nhật vào bảng ma trận truy vết `docs/traceability-matrix.md`.
