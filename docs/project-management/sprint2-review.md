# BÁO CÁO TỔNG KẾT HOÀN THÀNH SPRINT 2 (SPRINT 2 REVIEW & RETROSPECTIVE)

- **Dự án:** BrewLite – Hệ thống Đặt đồ uống Trực tuyến (Mobile-first / PWA)
- **Tài liệu:** `docs/project-management/sprint2-review.md`
- **Giai đoạn:** Task 5 (Sprint 2, CI/CD và Delivery) -> Nghiệm thu Toàn diện
- **Chủ trì báo cáo:** **Hàn Minh Hiếu (Product Owner - PO)**
- **Phối hợp thực hiện:** **Sang (Scrum Master)**, **Trần Quang (Tech Lead)**, Duy, Quỳnh, Chiến
- **Ngày hoàn thành Sprint 2:** 14/11/2026
- **Trạng thái:** ✅ ĐÃ HOÀN TẤT 100% & MERGE TOÀN BỘ VÀO MAIN (16/16 Pull Requests)

---

## 1. Mục tiêu Sprint 2 (Sprint Goal)

> **Sprint Goal:** Hoàn thiện luồng nghiệp vụ End-to-End từ Giỏ hàng, Tùy biến món, Khuyến mãi, Xác thực người dùng Figma, Khởi tạo đơn hàng & Khóa kho đồng thời (Optimistic Locking), Thanh toán Cổng trực tuyến VNPay Sandbox, Theo dõi trạng thái đơn hàng thời gian thực đến Tích lũy điểm thưởng Loyalty; đồng thời đóng gói tự động hóa qua Docker Compose và kiểm thử toàn diện với CI/CD Pipeline.

- **Thời lượng:** Tuần 3 – Tuần 4 của đồ án.
- **Tổng Story Points cam kết:** 34 Points.
- **Tổng Story Points hoàn thành:** **34 / 34 Points (Đạt 100% Velocity)**.

---

## 2. Bảng Đối soát Definition of Done (DoD) & Các Pull Requests Sprint 2 đã Merge vào `main`

Toàn bộ các Pull Request kỹ thuật của Sprint 2 đã được review chéo nghiêm ngặt, vượt qua pipeline kiểm thử tự động CI trên GitHub Actions và merge thành công vào nhánh `main`:

| STT | Số PR | Nhánh nguồn | Thành viên phụ trách | Nội dung hiện thực | Trạng thái DoD & CI |
| :---: | :---: | :--- | :--- | :--- | :---: |
| 1 | **PR #14** | `feat/task4-chien-cart-order` | Chiến | Module Giỏ hàng kết nối Đặt hàng ban đầu, kiểm tra luồng tạo đơn. | ✅ Passed CI / Merged |
| 2 | **PR #15** | `feat/task5-quynh` | Quỳnh | Hoàn thiện Modal tùy biến Size/Topping, Quản lý Giỏ hàng Zustand bền vững, Tích hợp mã khuyến mãi (`BREWNEW`, `BREW20K`) và bộ test giỏ hàng. | ✅ Passed CI / Merged |
| 3 | **PR #16** | `feat/task5-hieu-auth` | **Hàn Minh Hiếu (PO)** | Chuẩn hóa giao diện Đăng nhập/Đăng ký 100% khớp bản vẽ Figma (Frame 04a/04b/04c), hỗ trợ đăng nhập bằng Số điện thoại hoặc Email, cấu hình `JwtModule.registerAsync`, đồng bộ proxy API rewrite và seed user chuẩn. | ✅ Passed CI / Merged |
| 4 | Direct Merge | `feat/task5-chien-orders` | Chiến | Xử lý giao dịch ACID đặt đơn (`orders.service.ts`), khóa lạc quan Optimistic Locking (`version`), kịch bản kiểm thử tranh chấp đồng thời (`orders-concurrency.spec.ts`). | ✅ Passed CI / Merged |
| 5 | Direct Merge | `task5-Quang` | Quang | Tích hợp Cổng thanh toán VNPay Sandbox v2.1.0, cơ chế xác nhận Webhook IPN, chống thanh toán trùng lặp (Idempotency-Key UUID), giao diện Popup QR thanh toán chuẩn Figma. | ✅ Passed CI / Merged |
| 6 | Direct Merge | `feat/task5-duy-adv-tests` | Duy | Bổ sung kịch bản kiểm thử End-to-End Playwright (`menu-to-checkout.spec.ts`), nâng cấp trang theo dõi đơn hàng thời gian thực (`/orders`). | ✅ Passed CI / Merged |

---

## 3. Chi tiết Nghiệp vụ Hoàn thành trong Sprint 2

### 3.1 Chức năng 2: Tùy biến Món & Khuyến mãi (Phụ trách: Quỳnh)
- **Tùy biến món:** Cho phép chọn Size (S/M/L) với giá chênh lệch tự động, chọn thêm Topping (Trân châu trắng, Thạch nha đam, Kem Macchiato...).
- **Giỏ hàng Zustand:** Lưu trạng thái đồng bộ `localStorage`, cập nhật số lượng tức thời, badge hiển thị số lượng giỏ hàng trên thanh điều hướng.
- **Khuyến mãi (Promotion):** Áp dụng mã `BREWNEW` (giảm 20% đơn từ 50k, tối đa 30k) và `BREW20K` (giảm ngay 20k đơn từ 80k); loại bỏ mã không hợp lệ theo đúng phân bổ.

### 3.2 Chức năng 3: Xác thực Người dùng & Phân quyền JWT (Phụ trách: Hiếu)
- **Giao diện chuẩn Figma:** Màn hình Đăng nhập (Frame 04a) và Đăng ký (Frame 04b) chia 2 cột cân xứng trên Desktop, 1 cột tối ưu trên Mobile, loại bỏ nút test 1-click để đạt 100% chuẩn thiết kế.
- **Xác thực linh hoạt:** Đăng nhập mượt mà bằng **Số điện thoại** (ví dụ `0901234567`, `0909999888`) hoặc **Email** (ví dụ `hieu@brewlite.vn`, `customer@brewlite.vn`).
- **Bảo mật JWT:** Quản lý Secret qua `ConfigService` với `JwtModule.registerAsync`, băm mật khẩu Bcrypt với salt rounds = 10, cấp Access Token 24h.
- **UserNav Dropdown & Profile (Frame 04c):** Hiển thị Avatar, cấp độ thẻ thành viên, số Hạt tích lũy (420 Hạt), lịch sử đơn và nút Đăng xuất.

### 3.3 Chức năng 4: Đặt hàng & Khóa kho Đồng thời (Phụ trách: Chiến)
- **Tính toán tiền tại Backend:** Không tin tưởng dữ liệu giá từ trình duyệt, máy chủ tự tính lại toàn bộ tiền món, topping, giảm giá và phí dịch vụ.
- **Optimistic Locking:** Cơ chế khóa lạc quan dựa trên trường `version` trong bảng `Ingredient` và `Product`, đảm bảo khi 2 khách hàng cùng tranh mua ly đồ uống cuối cùng tại cùng một tích tắc, hệ thống chỉ chấp nhận 1 đơn và từ chối an toàn đơn còn lại mà không làm âm kho.

### 3.4 Chức năng 5: Thanh toán Cổng trực tuyến VNPay Sandbox (Phụ trách: Quang)
- **100% VNPay Sandbox:** Loại bỏ hoàn toàn thanh toán tiền mặt giả lập theo chỉ đạo, chỉ hỗ trợ cổng thanh toán VNPay Sandbox v2.1.0 chuẩn bảo mật HMAC-SHA512.
- **Idempotency-Key:** Sinh UUID tại Client cho mỗi giao dịch thanh toán để chống click đúp hoặc trừ tiền hai lần.
- **Popup QR Modal chuẩn Figma:** Giao diện mã QR thanh toán chia 2 cột cân đối, không tràn màn hình, hỗ trợ mở trực tiếp Cổng VNPay hoặc quét mã.

### 3.5 Chức năng 6: Theo dõi Đơn & Loyalty (Phụ trách: Sang & Duy)
- **Theo dõi tiến trình:** Màn hình `/orders` với thanh tiến trình Stepper trực quan 4 giai đoạn (`PENDING` -> `PAID` -> `PREPARING` -> `COMPLETED`).
- **Loyalty Points:** Tự động cộng điểm thưởng (+1 điểm mỗi 10.000đ) khi đơn hàng thanh toán thành công.

---

## 4. Tổng kết Kiểm thử & Độ bao phủ (Test Verification Summary)

| Phân loại Test | Phạm vi | Số lượng Suite | Số ca kiểm thử (Tests) | Trạng thái |
| :--- | :--- | :---: | :---: | :---: |
| **API Unit & Spec Tests** | Toàn bộ NestJS Modules (`auth`, `products`, `orders`, `payments`, `promotions`, `health`) | 10 Suites | 54 Tests | ✅ **100% PASS** |
| **Web Unit & Integration Tests** | Màn hình giao diện, Giỏ hàng, Voucher, VNPay, Menu States | 6 Suites | 39 Tests | ✅ **100% PASS** |
| **Concurrency Test** | Kiểm tra tranh chấp 2 khách mua ly cuối (`orders-concurrency.spec.ts`) | 1 Suite | Included in API | ✅ **PASS** |
| **E2E Playwright Tests** | Luồng đầy đủ: Chọn menu -> Tùy biến -> Giỏ hàng -> Đăng nhập -> Checkout | 1 Suite | Menu-to-Checkout | ✅ **PASS** |
| **ESLint & TypeScript** | Kiểm tra cú pháp, biến thừa và quy chuẩn code | Cả 2 workspace | Monorepo | ✅ **0 Error, 0 Warning** |
| **GitHub Actions CI** | Pipeline tự động `Install -> Lint -> Test -> Build` | All PRs & main | Cloud Runner | ✅ **XANH 100%** |

---

## 5. Sprint Retrospective (Họp Đúc kết Sprint 2)

### 5.1 Điểm làm tốt (What went well)
- Tinh thần phối hợp nhóm rất cao: Mọi xung đột merge (như PR #16 của Hiếu) được phát hiện sớm và xử lý triệt để, không để mất code của thành viên khác.
- Tuân thủ nghiêm ngặt quy tắc bài giảng của Thầy Phiêu: Không mock ngây thơ, bám sát mô hình kiến trúc phân tầng 3 lớp, đảm bảo tính toàn vẹn dữ liệu qua Transaction và Optimistic Locking.
- Thiết kế giao diện bám sát 100% bản vẽ Figma Cloud (từ Thực đơn, Tùy biến món, Form đăng nhập đến Popup QR Sandbox).

### 5.2 Điểm cần lưu ý & Khắc phục (What could be improved)
- Khi phát triển phân nhánh dài ngày, cần thường xuyên rebase hoặc pull code mới từ `main` về nhánh cá nhân để giảm thiểu khác biệt tệp tin khi mở Pull Request.
- Chú ý quản lý biến môi trường bí mật (secret) đúng quy định qua `.env` và Docker environment, không commit trực tiếp lên git.

### 5.3 Kế hoạch Bàn giao & Bảo vệ Đồ án (Next Steps)
1. Kiểm tra môi trường Docker Compose local: Chạy mượt mà cả 3 dịch vụ `apps/web` (Next.js port 3000), `apps/api` (NestJS port 3001) và `postgres` (port 5432).
2. Chuẩn bị kịch bản demo trực tiếp luồng nghiệp vụ từ A đến Z cho Giảng viên.
3. Xuất tài liệu Báo cáo tổng hợp và cập nhật ma trận truy vết phục vụ chấm điểm Assignment 2.
