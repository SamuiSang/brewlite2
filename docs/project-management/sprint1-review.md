# BÁO CÁO TỔNG KẾT HOÀN THÀNH SPRINT 1 (SPRINT 1 REVIEW & RETROSPECTIVE)

- **Dự án:** BrewLite – Hệ thống Đặt đồ uống Trực tuyến (Mobile-first / PWA)
- **Tài liệu:** `docs/project-management/sprint1-review.md`
- **Giai đoạn:** Task 4 (Sprint 1) -> Chuyển tiếp Task 5 (Sprint 2)
- **Chủ trì báo cáo:** **Hàn Minh Hiếu (Product Owner - PO)**
- **Phối hợp thực hiện:** **Sang (Scrum Master)**, **Trần Quang (Tech Lead)**, Duy, Quỳnh, Chiến
- **Ngày hoàn thành Sprint 1:** 12/11/2026
- **Trạng thái:** ✅ ĐÃ HOÀN TẤT 100% & MERGE TOÀN BỘ VÀO MAIN

---

## 1. Mục tiêu Sprint 1 (Sprint Goal)

> **Sprint Goal:** Thiết lập nền tảng kỹ thuật Monorepo chuẩn doanh nghiệp, kiến trúc CSDL PostgreSQL 16 với Prisma ORM, xây dựng pipeline CI tự động trên GitHub Actions, hoàn thành API giám sát hệ thống Health Check và phát hành phiên bản MVP đầu tiên xem Menu thực đơn đồ uống.

- **Thời lượng:** Tuần 1 – Tuần 2 của đồ án.
- **Tổng Story Points cam kết:** 21 Points.
- **Tổng Story Points hoàn thành:** **21 / 21 Points (Đạt 100% Velocity)**.

---

## 2. Bảng Đối soát Definition of Done (DoD) & 7 Pull Requests đã Merge vào `main`

Toàn bộ 7 Pull Request kỹ thuật của Sprint 1 đã được review chéo, vượt qua pipeline kiểm thử tự động CI và merge thành công vào nhánh `main`:

| STT | Số PR | Nhánh nguồn | Thành viên phụ trách | Nội dung hiện thực | Trạng thái DoD & CI |
| :---: | :---: | :--- | :--- | :--- | :---: |
| 1 | **PR #5** | `feat/task4-sang` | Sang (SM) | Khởi tạo Monorepo (`apps/api` NestJS, `apps/web` Next.js), cấu hình Docker Compose dev, `.env.example`, tài liệu kiến trúc. | ✅ Passed CI / Merged |
| 2 | **PR #7** | `feat/task4-quang-db-seed` | Quang & Chiến | Thiết kế Prisma Schema, chạy migration `init_db`, viết kịch bản seed nạp danh mục, sản phẩm và nguyên liệu thô vào PostgreSQL. | ✅ Passed CI / Merged |
| 3 | **PR #8** | `feat/task4-hieu-health` | **Hàn Minh Hiếu (PO)** | Hiện thực API giám sát `GET /api/v1/health`, kiểm tra kết nối CSDL và đo độ trễ truy vấn (ping latency), viết Unit Test Health check. | ✅ Passed CI / Merged |
| 4 | **PR #6** | `feat/task4-duy-products-api` | Duy & Chiến | Hiện thực Products Service & Controller (`GET /api/v1/products`), thuật toán tính toán tồn kho khả dụng `availableStock` từ định mức nguyên liệu. | ✅ Passed CI / Merged |
| 5 | **PR #9** | `feat/task4-quang-tests` | Quang | Bổ sung bộ Unit Test toàn diện cho Products Module và Health Check, nâng độ phủ kiểm thử backend. | ✅ Passed CI / Merged |
| 6 | **PR #10** | `feat/task4-quynh` | Quỳnh & Quang | Xây dựng bộ component UI States (Loading Skeleton, Empty State, Error State) và hoàn thiện cấu hình CI Workflow (`.github/workflows/ci.yml`). | ✅ Passed CI / Merged |
| 7 | **PR #11** | `feat/task4-duy-menu-page` | Duy | Xây dựng trang Thực đơn Menu mobile-first hoàn chỉnh, nhúng 18 hình ảnh đồ uống xuất từ Figma, thanh tìm kiếm từ khóa, bộ lọc danh mục và thanh giỏ hàng nổi. | ✅ Passed CI / Merged |

---

## 3. Đánh giá Chi tiết Phân hệ Giám sát Hệ thống (Phần của Hiếu - PR #8)

- **Mã yêu cầu đáp ứng:** `FR-04` (Quản trị trạng thái hệ thống) và `NFR-03` (Độ tin cậy & Giám sát vận hành).
- **Endpoint cung cấp:** `GET /api/v1/health`.
- **Kết quả trả về chuẩn:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-11-12T08:00:00.000Z",
    "uptime": 128.45,
    "environment": "development",
    "database": {
      "status": "up",
      "latencyMs": 3.12
    }
  }
  ```
- **Ý nghĩa kỹ thuật:** Endpoint giúp các hệ thống Cloud PaaS (Render / Docker) thực hiện kịch bản Health Check thăm dò tự động; nếu cơ sở dữ liệu ngắt kết nối hoặc độ trễ vượt ngưỡng, hệ thống sẽ cảnh báo lập tức thay vì để khách hàng gặp lỗi giao dịch.
- **Kiểm thử:** Đã viết Unit Test `health.controller.spec.ts` kiểm thử đầy đủ kịch bản CSDL hoạt động bình thường và kịch bản CSDL bị mất kết nối (`503 Service Unavailable`).

---

## 4. Đánh giá Cải tiến Giao diện & Tiếp thu Phản hồi của Đội ngũ (Sprint Retrospective)

Sau khi nghiệm thu trang Menu ở PR #11, Tech Lead Trần Quang đã đưa ra các định hướng điều chỉnh quan trọng để cập nhật ngay vào Sprint 2 (Task 5):
1. **Màu sắc nhận diện thương hiệu:** Đổi từ tone màu cà phê nâu cũ sang **tông màu đỏ đô (Highland Red / Burgundy - `#8B1E1E`)** theo đúng bảng Design System Frame 00 trên Figma.
2. **Quy trình Thanh toán (Checkout):** Khi khách hàng bấm thanh toán, hiển thị Modal Popup trực tiếp trên màn hình thay vì điều hướng sang landing page khác để tối ưu trải nghiệm Mobile.
3. **Hiển thị Kho trên Web Client:** Khách hàng chỉ nhìn thấy nhãn trạng thái trực quan: **"CÒN HÀNG"**, **"TẠM HẾT"**, **"NGỪNG BÁN"**; ẩn hoàn toàn số gram nguyên liệu thô khỏi giao diện người dùng.

---

## 5. Kế hoạch & Phân công Bước vào Sprint 2 (Task 5)

| Thành viên | Trách nhiệm chính trong Sprint 2 | Nhánh Git |
| :--- | :--- | :--- |
| **Hàn Minh Hiếu (PO)** | **Module 3: Xác thực Người dùng (Auth & JWT)**<br>• Backend: API Register, Login, Me, Bcrypt hash, JWT Strategy & Guard.<br>• Frontend: Giao diện `/login` & `/register` chuẩn tông màu đỏ Highland Figma.<br>• Quản lý: Cập nhật Ma trận truy vết `traceability-matrix.md` và Báo cáo tổng thể. | `feat/task5-hieu-auth` |
| **Duy** | **Module 1 & UI:** Ẩn số gram nguyên liệu trên Client, cập nhật nhãn trạng thái kho, hoàn thiện tìm kiếm & lọc. | `feat/task5-duy-inventory` |
| **Quỳnh** | **Module 2: Tùy biến món & Giỏ hàng:** Modal chọn size/topping, Popup thanh toán Checkout trực tiếp. | `feat/task5-quynh-cart` |
| **Chiến** | **Module 4: Đặt hàng & Transaction:** API tạo đơn hàng, trừ kho nguyên liệu với Khóa lạc quan (OCC). | `feat/task5-chien-orders` |
| **Quang** | **Module 5: Thanh toán QR:** Tích hợp VietQR / MoMo Sandbox, cơ chế Webhook Idempotency-Key. | `feat/task5-quang-payments` |
| **Sang (SM)** | **Module 6 & DevOps:** Tích điểm Loyalty, Pipeline CD triển khai Cloud PaaS HTTPS. | `feat/task5-sang-loyalty-cd` |

---
*Tài liệu được ký duyệt bởi Product Owner: **Hàn Minh Hiếu**.*
