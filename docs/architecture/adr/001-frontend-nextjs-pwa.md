# ADR-001: Lựa chọn Next.js App Router, Kiến trúc Mobile-first PWA và Chốt chặn Tồn kho phía Client

- **Trạng thái:** Đề xuất — chờ nhóm duyệt.
- **Ngày:** 2026-11-10.
- **Người phụ trách:** Duy (Dev Team – Phụ trách Chức năng 1).
- **Phạm vi:** Task 3.1 — quyết định kiến trúc tầng giao diện người dùng (Presentation Layer), giải pháp Progressive Web App (PWA) tối ưu hóa trải nghiệm duyệt thực đơn đồ uống trên thiết bị di động.
- **Yêu cầu liên quan:** FR-01 (Hiển thị thực đơn & Lọc theo danh mục), FR-02 (Tìm kiếm món đồ uống), UC-01; tích hợp UC-02 (Tùy biến món & Giỏ hàng) và Task 10.3 (Chốt chặn tồn kho Client theo định mức nguyên liệu BOM).

---

## 1. Bối cảnh và Đặt vấn đề

BrewLite là nền tảng đặt đồ uống trực tuyến hướng tới mô hình phục vụ tại quán và mang đi. Trong giờ cao điểm, khách hàng thường xuyên sử dụng điện thoại thông minh quét mã QR tại bàn hoặc truy cập đường link của quán để gọi món.

Bối cảnh thực tế đặt ra các thách thức kỹ thuật lớn đối với tầng giao diện (Presentation Layer):

1. **Rào cản cài đặt ứng dụng gốc (Native App):** Khách hàng vãng lai bước vào quán chỉ muốn gọi món nhanh trong 1–2 phút; việc bắt buộc tải một ứng dụng từ App Store hoặc Google Play (dung lượng hàng chục MB, thủ tục cấp quyền) là rào cản trải nghiệm cực kỳ nghiêm trọng. Hệ thống bắt buộc phải chạy trực tiếp trên nền tảng Web nhưng mang lại cảm giác mượt mà như ứng dụng gốc.
2. **Tối ưu tốc độ tải trang thực đơn (FCP & LCP):** Trang thực đơn chứa hàng chục món đồ uống với hình ảnh chất lượng cao, giá bán, danh mục phân loại và mô tả chi tiết. Nếu sử dụng mô hình Client-Side Rendering (CSR) truyền thống (như React SPA), người dùng phải tải toàn bộ JavaScript bundle rồi mới bắt đầu gọi API lấy dữ liệu, gây ra hiện tượng màn hình trắng (White Screen of Death) hoặc giật cục bố cục (Layout Shift) khi sóng 3G/4G chập chờn.
3. **Trải nghiệm tìm kiếm và lọc tức thì:** Khách hàng cần tìm nhanh đồ uống yêu thích (như "trà sữa", "cà phê muối") hoặc lọc theo các tab danh mục (Cà phê, Trà, Freeze, Bánh). Thao tác này đòi hỏi độ trễ cực thấp, không được reload trang và không được gây quá tải (DDoS) lên Backend do gửi request liên tục khi người dùng đang gõ phím.
4. **Ràng buộc nghiệp vụ tồn kho thực tế (Task 10 theo bài giảng Thầy Phiêu):**
   - Quán cà phê tuyệt đối không lưu số ly pha sẵn trong kho; số lượng ly bán được phụ thuộc hoàn toàn vào định mức công thức pha chế (BOM) và lượng tồn kho nguyên liệu thô thực tế (hạt cà phê, sữa đặc, kem béo, ly nhựa).
   - Nếu giao diện cho phép khách hàng thoải mái bấm chọn món đã hết nguyên liệu, khách hàng sẽ mất công chọn size/topping, nhập giỏ hàng rồi mới nhận thông báo lỗi ở bước đặt hàng cuối cùng $\rightarrow$ tạo ra trải nghiệm cực kỳ khó chịu.
   - Do đó, tầng Client bắt buộc phải có cơ chế **chốt chặn tồn kho (Client Inventory Guard)** hiển thị rõ trạng thái Còn hàng / Hết hàng ngay tại thẻ món `ProductCard`.

Tại thời điểm viết ADR này, thư mục `apps/web` đã được định hình trong kiến trúc Monorepo để chuẩn bị bước vào triển khai mã nguồn tại Task 4.

---

## 2. Quyết định Kiến trúc

### 2.1. Lựa chọn Next.js 15 với App Router làm nền tảng Frontend

Nhóm thống nhất lựa chọn **Next.js 15 (sử dụng App Router và React Server Components - RSC)** để xây dựng ứng dụng giao diện `apps/web`:

- **Cấu trúc thư mục định tuyến:** Tổ chức theo mô hình App Router chuẩn:
  ```text
  apps/web/src/
  ├── app/
  │   ├── layout.tsx              # Root Layout bọc toàn bộ PWA (Header, Nav, Font, Theme)
  │   ├── page.tsx                # Trang chủ điều hướng
  │   ├── menu/
  │   │   └── page.tsx            # Trang thực đơn chính (Module của Duy - UC-01)
  │   ├── cart/page.tsx           # Trang giỏ hàng (Module của Quỳnh - UC-02)
  │   └── manifest.ts             # Web App Manifest động cấu hình PWA
  ├── components/
  │   ├── CategoryFilter.tsx      # Thanh tab chọn danh mục (ALL, COFFEE, TEA, FREEZE, PASTRY)
  │   ├── ProductCard.tsx         # Thẻ hiển thị sản phẩm kèm chốt chặn tồn kho
  │   ├── ProductCustomizationModal.tsx # Modal tùy biến món (bàn giao sang UC-02)
  │   └── UIStates.tsx            # Bộ 3 component Skeleton, EmptyState, ErrorState
  ├── hooks/
  │   └── useDebounce.ts          # Hook khử rung tìm kiếm 300ms
  └── public/
      ├── sw.js                   # Service Worker phục vụ PWA Offline Cache
      └── icons/                  # Bộ Icon chuẩn PWA đa kích thước (192x192, 512x512)
  ```
- **Phân tách Server Components và Client Components:**
  - `menu/page.tsx` đóng vai trò khung vỏ (Page Shell): thực hiện tiền nạp (pre-fetch) dữ liệu khung thực đơn và metadata SEO từ NestJS Backend.
  - Các thành phần cần tương tác người dùng cao (`CategoryFilter`, `ProductCard`, Ô tìm kiếm `SearchInput`) được đánh dấu `'use client'` để phản hồi ngay lập tức với thao tác click, chạm vuốt của khách hàng.

### 2.2. Kiến trúc Mobile-first Progressive Web App (PWA)

Triển khai đầy đủ bộ ba trụ cột của PWA nhằm biến trang web thành ứng dụng di động thực thụ:

1. **Web App Manifest (`manifest.json`):**
   - Thiết lập `display: "standalone"` giúp ứng dụng khi mở từ màn hình chính sẽ ẩn hoàn toàn thanh địa chỉ của trình duyệt (URL bar), mang lại giao diện toàn màn hình như native app.
   - Định nghĩa `theme_color` và `background_color` đồng bộ nhận diện thương hiệu BrewLite.
   - Hỗ trợ tính năng "Add to Home Screen" (A2HS) trên cả iOS Safari và Android Chrome.
2. **Service Worker (`sw.js`) & Cache Storage API:**
   - Áp dụng chiến lược bộ nhớ đệm **Stale-While-Revalidate** đối với tài nguyên tĩnh (HTML shell, CSS, JavaScript chunks, Web Fonts). Khi người dùng mở app, giao diện hiển thị ngay lập tức từ cache trong khi Service Worker âm thầm kiểm tra và cập nhật phiên bản mới ở nền.
   - Áp dụng chiến lược **Cache-First** đối với hình ảnh đồ uống trong thư mục `/icons` và CDN hình ảnh: hình ảnh sau khi tải lần đầu sẽ được lưu trong Cache Storage, giúp người dùng lướt menu mượt mà, không tốn dữ liệu mạng di động.
3. **Responsive Mobile-first Design:**
   - Xây dựng giao diện dựa trên hệ thống Tailwind CSS với triết lý ưu tiên màn hình điện thoại (chiều rộng cơ sở 375px – 430px), hỗ trợ bố cục lưới linh hoạt (1 cột trên Mobile, 2 cột trên Tablet, 3–4 cột trên Desktop).
   - Nút bấm và vùng chạm (touch target) đảm bảo kích thước tối thiểu $44 \times 44\text{ px}$ theo tiêu chuẩn Apple Human Interface Guidelines.

### 2.3. Mô hình xử lý Bất đồng bộ & Bộ 3 Trạng thái Giao diện (UIStates)

Để tránh hoàn toàn hiện tượng layout giật cục và xử lý mượt mà mọi tình huống mạng, tầng giao diện áp dụng mô hình trạng thái:

$$\text{UIState} \in \{\text{LOADING}, \text{SUCCESS}, \text{EMPTY}, \text{ERROR}\}$$

1. **Trạng thái Đang tải (`LOADING` - Skeleton Shimmer):**
   - Khi ứng dụng bắt đầu gửi yêu cầu `GET /api/v1/products`, hệ thống kích hoạt hiển thị ngay lập tức 6–8 khung thẻ mờ dạng **Skeleton Shimmer** (hiệu ứng bóng sáng quét qua).
   - Chiều cao và vị trí của Skeleton mô phỏng chính xác kích thước thật của `ProductCard`, giữ vững cấu trúc DOM, triệt tiêu hoàn toàn điểm số dịch chuyển bố cục tích lũy (Cumulative Layout Shift - CLS = 0).
2. **Trạng thái Rỗng (`EMPTY` - EmptyState):**
   - Kích hoạt khi khách hàng nhập từ khóa tìm kiếm hoặc chọn danh mục mà không có sản phẩm nào thỏa mãn (`products.length === 0`).
   - Hiển thị hình minh họa đồ uống kèm thông điệp thân thiện *"Không tìm thấy món đồ uống phù hợp"* và cung cấp nút bấm *"Xóa bộ lọc"* đưa thực đơn trở về trạng thái danh sách ban đầu.
3. **Trạng thái Lỗi mạng (`ERROR` - ErrorState):**
   - Kích hoạt khi mất kết nối mạng hoặc Backend trả về mã lỗi HTTP 500 / Timeout.
   - Hiển thị thông báo *"Không thể tải thực đơn. Vui lòng kiểm tra lại kết nối mạng"* kèm nút bấm *"Thử lại (Retry)"* để người dùng kích hoạt tải lại dữ liệu mà không cần tải lại toàn bộ trang web.

### 2.4. Cơ chế Khử rung (Debounce 300ms) khi Tìm kiếm Đồ uống

- Khi khách hàng gõ từ khóa vào thanh tìm kiếm (ví dụ gõ từ "Matcha"), thay vì gửi request liên tục theo từng ký tự gõ (`M`, `Ma`, `Mat`, `Matc`, `Match`, `Matcha`), hệ thống tích hợp custom hook `useDebounce` với độ trễ $\Delta t = 300\text{ ms}$.
- Bộ đếm thời gian (timer) chỉ kích hoạt gửi yêu cầu `GET /api/v1/products?search=Matcha` khi người dùng ngừng gõ phím đủ 300ms.
- **Hiệu quả:** Giảm hơn 80% số lượng request rác gửi về Backend, ngăn chặn nghẽn tài nguyên server mà vẫn đảm bảo độ nhạy tìm kiếm tức thì đối với mắt người dùng.

### 2.5. Chốt chặn Tồn kho Client theo Nguyên liệu BOM (Task 10.3)

Theo quy định bắt buộc của Thầy Phiêu, CSDL không lưu số ly pha sẵn mà tính toán động `availableStock` từ số lượng nguyên liệu thô chia cho định mức công thức pha chế:

$$\text{availableStock} = \min_{i \in \text{Recipes}} \left( \left\lfloor \frac{\text{Ingredient}_i.\text{stockQuantity}}{\text{RecipeItem}_i.\text{quantityRequired}} \right\rfloor \right)$$

Tầng Client tiếp nhận trường `availableStock` từ `ProductResponseDto` và áp dụng chốt chặn an toàn:

| Trạng thái món | Hành vi hiển thị phía Client (`ProductCard.tsx`) | Thao tác tương tác |
| :--- | :--- | :--- |
| **Còn hàng**<br>($\text{availableStock} > 0$) | • Hiển thị ảnh rõ nét, giá bán niêm yết chuẩn.<br>• Nút chọn món hoạt động bình thường, hiển thị trạng thái sẵn sàng. | Khi bấm vào thẻ: Mở `ProductCustomizationModal` (hiển thị mô tả, thành phần) và bàn giao dữ liệu sang Chức năng 2 (UC-02) để chọn Size/Topping. |
| **Hết hàng**<br>($\text{availableStock} = 0$) | • Thẻ món bị làm mờ 50% (`opacity-50`).<br>• Gắn nhãn badge màu xám đậm *"Hết hàng"* đè lên ảnh sản phẩm. | Khóa toàn bộ tương tác (`pointer-events: none` hoặc `disabled`), ngăn chặn tuyệt đối việc mở modal chọn món, bảo vệ người dùng không đặt nhầm món thiếu nguyên liệu. |

---

## 3. Các Giải pháp Thay thế đã Cân nhắc

| Tiêu chí so sánh | Next.js 15 App Router + PWA (Được chọn) | React SPA thuần (Vite + React) | Mobile App gốc (Flutter / React Native) | Server-Side thuần (NestJS + EJS Template) |
| :--- | :--- | :--- | :--- | :--- |
| **Tốc độ tải đầu (FCP/LCP)** | **Rất nhanh:** Server kết xuất khung trang trước, tài nguyên tĩnh cache bởi Service Worker. | **Chậm:** Phải tải toàn bộ file JS lớn về máy rồi mới render màn hình. | **Rất chậm:** Khách phải lên chợ ứng dụng tải bộ cài đặt hàng chục MB. | **Nhanh:** Render toàn bộ trên server nhưng mỗi lần bấm tab là tải lại toàn trang. |
| **Trải nghiệm di động** | **Cao:** Toàn màn hình (Standalone), vuốt chạm mượt mà, cài ra Home Screen như app thật. | **Trung bình:** Vẫn chạy trong trình duyệt với thanh URL, không có cache offline chuyên sâu. | **Rất cao:** Tận dụng 100% phần cứng thiết bị di động. | **Kém:** Giật màn hình khi tải lại trang, không phù hợp ứng dụng đặt món hiện đại. |
| **Chi phí & Độ phức tạp** | **Hợp lý:** Chia sẻ TypeScript interface DTO với Backend NestJS trong cùng Monorepo. | **Thấp:** Dễ cấu hình nhưng khó tối ưu trải nghiệm và quản lý cache. | **Rất cao:** Phải duy trì 2 codebase riêng biệt, tốn tài nguyên nhóm 6 thành viên. | **Thấp:** Nhưng code giao diện bị bó chặt vào backend, vi phạm phân tầng kiến trúc. |
| **Phù hợp đề tài đồ án** | **100% khớp đề bài:** Thầy yêu cầu Mobile-first PWA, monorepo và layered architecture. | Không đáp ứng trọn vẹn tiêu chí PWA nâng cao. | Vượt quá phạm vi và lãng phí thời gian làm đồ án môn học. | Cổ điển, không đáp ứng chuẩn công nghệ phần mềm hiện đại. |

---

## 4. Hệ quả và Đánh đổi (Consequences & Trade-offs)

### 4.1. Lợi ích mang lại
- **Trải nghiệm khách hàng tối ưu:** Người dùng tại quán chỉ cần quét mã QR là menu mở ra ngay lập tức dưới 1 giây, thao tác chọn tab danh mục và tìm kiếm diễn ra mượt mà không độ trễ.
- **Tiết kiệm tài nguyên server:** Nhờ cơ chế Service Worker cache tài nguyên tĩnh và Debounce 300ms, Backend NestJS chỉ cần tập trung xử lý các truy vấn nghiệp vụ thực sự cần thiết.
- **Bảo toàn tính toàn vẹn dữ liệu từ sớm (Fail-early):** Chốt chặn tồn kho phía Client loại bỏ ngay từ đầu các thao tác đặt món vô hiệu, giảm tải xung đột khóa tồn kho ở tầng cơ sở dữ liệu.
- **Chuẩn hóa kiến trúc phân tầng:** Tách bạch tuyệt đối ranh giới giữa Presentation Layer (Next.js) và Business/Data Layer (NestJS/Prisma), tuân thủ 100% bài giảng kiến trúc của Thầy Phiêu.

### 4.2. Hạn chế và Biện pháp Giảm thiểu

| Hạn chế / Rủi ro tiềm ẩn | Biện pháp giảm thiểu cụ thể |
| :--- | :--- |
| **Lỗi bất đồng bộ kết xuất (Hydration Mismatch):** Server kết xuất thời gian hoặc cấu hình khác với Client gây cảnh báo đỏ trên console. | Phân định nghiêm ngặt: Server Component chỉ tải dữ liệu tĩnh; các trạng thái động gắn liền với trình duyệt (`localStorage`, `navigator.onLine`) chỉ được khởi tạo trong hook `useEffect` ở Client Component. |
| **Tồn kho Client hiển thị lệch với thời gian thực:** Client hiển thị còn hàng nhưng lúc bấm đặt thì khách khác vừa mua hết nguyên liệu. | Tầng Client chỉ đóng vai trò chốt chặn trải nghiệm ban đầu (Pre-check). Tại bước tạo đơn chính thức ở Task 6 (Chức năng 4), Backend NestJS sử dụng Database Transaction kết hợp khóa bi quan (`SELECT ... FOR UPDATE`) để thẩm định lại tồn kho lần cuối. |
| **Dữ liệu cache của Service Worker bị cũ khi menu đổi giá:** Khách hàng thấy giá cũ do Service Worker giữ bản cache. | Cấu hình Service Worker với chiến lược **Network-First** cho các endpoint API `/api/v1/products`; chỉ áp dụng Cache-First cho ảnh và icon tĩnh. Khi có phiên bản PWA mới, Service Worker tự động gọi `skipWaiting()` và cập nhật cache ngầm. |

---

## 5. Tiêu chí Kiểm chứng khi Hiện thực (Definition of Verification - Task 4 & 5)

Bản thiết kế kiến trúc này được coi là hiện thực thành công khi thỏa mãn toàn bộ các bài kiểm tra thực tế:

1. **Kiểm thử PWA:** Ứng dụng chạy trên thiết bị di động (Chrome/Safari) hiển thị banner cài đặt "Add to Home Screen"; sau khi cài đặt, mở ứng dụng độc lập không có thanh URL trình duyệt.
2. **Kiểm thử bộ 3 trạng thái (UIStates):**
   - Khi mạng bị bóp băng thông (Slow 3G qua Chrome DevTools): Màn hình hiển thị đúng hiệu ứng Skeleton Shimmer đều đặn.
   - Khi tìm kiếm từ khóa không tồn tại (ví dụ: `xyz123`): Giao diện chuyển sang EmptyState và nút "Xóa bộ lọc" hoạt động bình thường.
   - Khi ngắt kết nối mạng (Offline): Giao diện hiển thị ErrorState và nút "Thử lại (Retry)" hoạt động khi mạng được bật lại.
3. **Kiểm thử Debounce tìm kiếm:** Gõ liên tục 10 ký tự trong 1 giây; tab Network của trình duyệt chỉ được phép ghi nhận duy nhất 1 request `GET /api/v1/products?search=...` sau khi ngừng gõ 300ms.
4. **Kiểm thử chốt chặn tồn kho:** Khi nguyên liệu pha chế của một món có số lượng bằng 0 (ví dụ hết sữa đặc), thẻ món tương ứng phải tự động mờ 50%, có nhãn "Hết hàng" và nút chọn món bị khóa hoàn toàn, không thể click mở Modal.

---

## 6. Khi nào cần Xem xét lại Quyết định này?

Bản quyết định kiến trúc ADR-001 sẽ được đưa ra thảo luận lại nếu xuất hiện các yêu cầu mới:
- Dự án quyết định mở rộng thêm ứng dụng quản lý kho phần cứng quét mã vạch (Barcode/RFID) chuyên dụng trên thiết bị cầm tay của nhân viên kho, lúc đó có thể cân nhắc viết thêm một ứng dụng riêng.
- Chức năng Menu cần cập nhật tồn kho từng giây theo cơ chế Realtime Server-Sent Events (SSE) hoặc WebSocket thay vì gọi REST API thông thường.
