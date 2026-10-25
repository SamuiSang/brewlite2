# BrewLite – Requirements to Deployment (Assignment 2)

- **Môn học:** Công nghệ Phần mềm – Học kỳ I (2026–2027)
- **Trường:** Đại học Sài Gòn (SGU) – Khoa Công nghệ Thông tin
- **Ngăn xếp kỹ thuật bắt buộc:** Next.js (Mobile-first / PWA), NestJS (Modular Monolith – 3-Tier Layered Architecture), PostgreSQL (Prisma ORM) và Docker

---

## 1. Giới thiệu Dự án và Phạm vi Sản phẩm

**BrewLite** là ứng dụng web đặt đồ uống trực tuyến theo hướng **Mobile-first / PWA**, giải quyết bài toán xếp hàng giờ cao điểm, sai sót khi ghi nhận tùy biến món (Size/Topping) thủ công, xung đột tồn kho khi nhiều khách đặt cùng lúc và rủi ro trừ tiền trùng lặp khi thanh toán.

**Luồng nghiệp vụ cốt lõi (End-to-End):**

> `Xem menu` -> `Chọn tùy chọn (Size/Topping)` -> `Giỏ hàng & Khuyến mãi` -> `Đặt đơn (Khóa tồn kho đồng thời)` -> `Thanh toán mô phỏng (Idempotency-Key)` -> `Theo dõi đơn & Tích điểm thưởng`

---

## 2. Phân công Nhóm Phát triển (6 Thành viên – Mô hình Vertical Slice)

Mỗi thành viên phụ trách xuyên suốt **1 Module Chức năng** từ khâu Khai thác yêu cầu (FR/AC), Vẽ sơ đồ (Use Case, Activity, Sequence, Class), Thiết kế Kiến trúc (ADR) đến Hiện thực Code (Frontend & Backend) và Kiểm thử:

| STT | Thành viên | Vai trò Scrum | Module Chức năng phụ trách xuyên suốt (Từ Sơ đồ -> Code -> Test) |
| :-: | :--- | :--- | :--- |
| **1** | **Duy** | Dev Team | **Chức năng 1 (`FR-01`, `FR-02`):** Hiển thị Menu, Tìm kiếm, Lọc theo Danh mục & Xem Chi tiết sản phẩm + E2E Test |
| **2** | **Quỳnh** | Dev Team | **Chức năng 2 (`FR-03`):** Tùy biến Món (Size/Topping), Quản lý Giỏ hàng (`Zustand`) & Áp mã Khuyến mãi (`Promotion`) + CI Pipeline |
| **3** | **Hiếu** | Product Owner (PO) | **Chức năng 3 (`FR-04`):** Đăng ký, Đăng nhập, Xác thực Phân quyền `JWT` & Giám sát `GET /health` + Quản lý Backlog & Truy vết |
| **4** | **Chiến** | Dev Team | **Chức năng 4 (`FR-05`):** Khởi tạo Đơn hàng (`POST /orders`), Tính tổng tiền tại Business Layer & Khóa Tồn kho Đồng thời (`Optimistic Lock`) |
| **5** | **Quang** | Dev Team | **Chức năng 5 (`FR-06`, `NFR-01..04`):** Thanh toán Ví/Thẻ Mô phỏng (`Mock Payment`) & Chống Trừ tiền Trùng lặp (`Idempotency-Key`) + Integration Test |
| **6** | **Sang** | Scrum Master (SM) | **Chức năng 6 (`FR-07`, `FR-08`):** Biên nhận, Lịch sử Đơn (`/orders/my-orders`), Theo dõi Trạng thái & Điểm thưởng (`LoyaltyTransaction`) + Docker & CD Pipeline |

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
