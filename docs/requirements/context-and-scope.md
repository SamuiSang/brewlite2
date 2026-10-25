# TASK 1.1 – BỐI CẢNH NGHIỆP VỤ, STAKEHOLDER VÀ PHẠM VI DỰ ÁN BREWLITE

- **Dự án:** BrewLite – Hệ thống Đặt đồ uống Trực tuyến (Mobile-first / PWA)
- **Tài liệu:** `docs/requirements/context-and-scope.md`
- **Giai đoạn:** Task 1 – Khai thác và Đặc tả Yêu cầu (Task 1.1)
- **Người thực hiện:**
  - **Hiếu (Product Owner):** Phụ trách Mục 1 (Vấn đề nghiệp vụ) và Mục 2 (Phân tích 6 Stakeholders chính).
  - **Sang (Scrum Master):** Phụ trách Mục 3 (Phạm vi MVP, Mở rộng, Out-of-scope) và Mục 4 (Giả định, Ràng buộc, Rủi ro ban đầu).

---

## 1. Bối cảnh và Vấn đề Nghiệp vụ BrewLite cần giải quyết

### 1.1 Bối cảnh thực tế ngành F&B và dịch vụ đồ uống Take-away
Trong bối cảnh thị trường đồ uống giải khát và cà phê/trà thủ công (Craft Beverage) ngày càng phát triển mạnh mẽ, nhu cầu trải nghiệm dịch vụ tiện lợi, nhanh chóng của khách hàng đô thị tăng cao. Mô hình kinh doanh F&B hiện đại đòi hỏi tốc độ phục vụ tối ưu, giảm thiểu thời gian chờ đợi và cá nhân hóa trải nghiệm người dùng (chọn kích cỡ, mức đá, độ ngọt, đa dạng toppings kèm theo).

Tuy nhiên, các cửa hàng quy mô vừa và nhỏ (như mô hình chuỗi quán BrewLite) khi vận hành theo phương thức truyền thống tại quầy đang đối mặt với nhiều bài toán nan giải:

1. **Ùn tắc và thắt nút cổ chai tại quầy (Order Queue Bottleneck):** Vào các khung giờ cao điểm (buổi sáng trước giờ làm việc, giờ nghỉ trưa), lượng khách tập trung tại quầy thu ngân đông đúc. Việc đứng xếp hàng chờ gọi món, nhân viên nhập máy tính tiền POS mất từ 3 – 5 phút/khách làm giảm đáng kể công suất phục vụ và gây ức chế, dẫn đến việc khách hàng bỏ đi (churn rate cao).
2. **Sai sót thủ công trong khâu tiếp nhận tùy biến (Customization Errors):** Đồ uống hiện đại có tính tùy biến rất cao (Size S/M/L, 0%/30%/50%/70%/100% đường và đá, nhiều loại topping kèm theo). Việc nhân viên nghe và nhập thủ công dễ dẫn đến sai sót giữa đơn hàng khách yêu cầu và sản phẩm thực tế nhân viên pha chế (Barista) thực hiện, gây lãng phí nguyên liệu và khiếu nại chất lượng.
3. **Mất kiểm soát tồn kho tức thời và nguy cơ bán vượt kho (Overselling / Concurrency Conflict):** Khi lượng khách truy cập đồng thời tăng cao, nếu hệ thống không có cơ chế quản lý dữ liệu chặt chẽ, nhiều khách hàng có thể cùng đặt mua những ly đồ uống cuối cùng của ngày. Việc này dẫn đến số lượng tồn kho bị âm (`stock < 0`), khiến cửa hàng rơi vào tình huống dở khóc dở cười vì đã nhận tiền nhưng không còn nguyên liệu để pha chế.
4. **Rủi ro gián đoạn mạng và trừ tiền trùng lặp (Network Flakiness & Double Charging):** Khách hàng sử dụng mạng 4G/WiFi di động thường xuyên đối mặt với sự cố chập chờn kết nối. Khi bấm "Thanh toán" nhưng phản hồi bị chậm, khách thường có xu hướng bấm liên tục nhiều lần. Nếu hệ thống Backend không có giải pháp chốt chặn tính bất biến (`Idempotency`), khách hàng sẽ bị trừ tiền hai hoặc nhiều lần cho cùng một đơn hàng, ảnh hưởng nghiêm trọng đến uy tín thương hiệu.
5. **Gian lận đơn giá từ Client (Client-side Price Tampering):** Khách hàng am hiểu kỹ thuật có thể can thiệp sửa đổi giá tiền trong payload gửi lên từ trình duyệt. Nếu hệ thống phía máy chủ không tính toán lại toàn bộ đơn giá tại tầng nghiệp vụ độc lập mà tin tưởng dữ liệu client gửi lên sẽ gây thất thoát tài chính lớn cho doanh nghiệp.
6. **Thiếu liên kết thành viên và tích lũy điểm thưởng (Customer Retention):** Các quán nhỏ thường dùng thẻ tích điểm giấy hoặc ghi chép rời rạc, làm giảm tỷ lệ quay lại của khách quen và không xây dựng được tệp khách hàng trung thành bền vững.

### 1.2 Giải pháp Hệ thống BrewLite
**BrewLite** được thiết kế như một hệ thống đặt đồ uống trực tuyến gọn nhẹ, tối ưu hóa theo định hướng **Mobile-first Web Application / Progressive Web App (PWA)**, kết nối xuyên suốt với Backend NestJS hiệu năng cao và cơ sở dữ liệu quan hệ PostgreSQL đáng tin cậy. 

Hệ thống số hóa toàn diện quy trình phục vụ thông qua chuỗi nghiệp vụ khép kín:
$$\text{Xem thực đơn} \longrightarrow \text{Tùy biến món} \longrightarrow \text{Giỏ hàng} \longrightarrow \text{Đặt đơn} \longrightarrow \text{Thanh toán điện tử} \longrightarrow \text{Theo dõi tiến trình \& Tích điểm}$$

Về mặt công nghệ phần mềm, **BrewLite** giải quyết triệt để các rủi ro vận hành bằng các nguyên lý kiến trúc tiêu chuẩn:
- **Kiến trúc phân lớp 3 tầng (3-Layer Architecture):** Tách bạch rõ rệt giữa Presentation Layer (Next.js), Business Logic Layer (NestJS Services) và Data Access Layer (Prisma ORM & PostgreSQL). Toàn bộ nghiệp vụ tính tiền, kiểm tra khuyến mãi được tính toán lại 100% ở Business Layer, vô hiệu hóa hoàn toàn nguy cơ gian lận giá từ phía Client.
- **Kiểm soát đồng thời bằng Optimistic Locking & Database Transaction:** Đảm bảo tính nguyên tử (Atomicity) khi tạo đơn và trừ tồn kho, triệt tiêu bài toán bán vượt kho (`stock < 0`) ngay cả khi có hàng chục khách cùng tranh chấp đơn vị sản phẩm cuối cùng.
- **Cơ chế Idempotency-Key trong thanh toán:** Chống trừ tiền trùng lặp, tự động phục hồi và hoàn trả tồn kho (`Restock Rollback`) tức thời nếu giao dịch thanh toán thất bại.
- **Hệ thống xác thực chuẩn công nghiệp:** Bảo vệ phiên làm việc của khách hàng bằng JSON Web Token (`JWT`) và thuật toán băm mật khẩu `Bcrypt` an toàn, tích hợp cơ chế giám sát `Health Check` chủ động phục vụ triển khai Production liên tục.

---

## 2. Phân tích các Stakeholder chính, Mục tiêu và Kỳ vọng

Nhằm đảm bảo sản phẩm đáp ứng đầy đủ góc nhìn từ vận hành kinh doanh, trải nghiệm người dùng đến tiêu chuẩn học thuật của môn Công nghệ Phần mềm, hệ thống **BrewLite** xác định và phân tích toàn diện **đúng 6 nhóm Stakeholder chính** theo yêu cầu của đề tài:

| STT | Nhóm Stakeholder | Vai trò & Trách nhiệm trong hệ sinh thái | Mục tiêu nghiệp vụ (Goals) | Kỳ vọng đối với hệ thống (Expectations) | Thước đo thành công (Success Metrics / KPIs) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Khách hàng<br>(Customer / End-User)** | • Người trực tiếp sử dụng ứng dụng web trên thiết bị di động cá nhân.<br>• Lựa chọn sản phẩm, cấu hình size/topping, thực hiện đặt hàng và thanh toán. | • Đặt món nhanh chóng, không phải xếp hàng chờ đợi tại quầy.<br>• Tự do tùy biến khẩu vị món theo sở thích cá nhân.<br>• Được minh bạch về số tiền, tồn kho và điểm tích lũy. | • Giao diện PWA thân thiện trên di động, tải trang nhanh (< 1.5s).<br>• Hiển thị rõ món nào còn hàng, món nào hết hàng.<br>• Giữ nguyên giỏ hàng khi lỡ tải lại trang (F5).<br>• Thanh toán an toàn, không bị trừ tiền oan hai lần khi mạng lag.<br>• Theo dõi trạng thái đơn hàng theo thời gian thực trực quan. | • Thời gian hoàn tất đặt đơn < 60 giây.<br>• Tỷ lệ hài lòng giao diện >= 90%.<br>• 0% sự cố trừ tiền trùng lặp (`Idempotency`). |
| **2** | **Nhân viên quầy / Pha chế<br>(Counter Staff / Barista)** | • Tiếp nhận thông tin đơn hàng đã thanh toán thành công.<br>• Thực hiện pha chế theo đúng tùy biến size/topping và cập nhật trạng thái đơn. | • Giảm áp lực gọi món và nhập liệu thủ công tại quầy giờ cao điểm.<br>• Tránh hoàn toàn việc pha sai khẩu vị khách đã dặn.<br>• Điều phối thứ tự chế biến công bằng, khoa học. | • Danh sách đơn hàng chuyển về chuẩn xác, phân biệt rõ các mã đơn (`#BL-XXXX`).<br>• Hiển thị chi tiết từng món kèm đúng tổ hợp Topping/Size.<br>• Chỉ nhận các đơn hàng đã ở trạng thái hợp lệ (`PAID`). | • Tỷ lệ sai sót món chế biến giảm về 0%.<br>• Năng suất chuẩn bị đồ uống tăng 40% trong giờ cao điểm. |
| **3** | **Quản lý cửa hàng<br>(Store Manager)** | • Giám sát doanh thu, lượng đơn hàng bán ra và tình hình tồn kho nguyên liệu.<br>• Quản lý hiệu quả các chương trình kích cầu (mã khuyến mãi/Voucher). | • Tối đa hóa doanh thu và vòng quay bán hàng.<br>• Ngăn ngừa thất thoát tài chính và gian lận giá.<br>• Kiểm soát chặt chẽ hàng tồn, không để khách đặt món khi đã cạn nguyên liệu. | • Tồn kho được khấu trừ chuẩn xác trong Database Transaction.<br>• Hệ thống tuyệt đối không bị bán âm kho (`stock < 0`).<br>• Mã khuyến mãi (Voucher) được kiểm tra chặt chẽ điều kiện hạn dùng và đơn tối thiểu tại máy chủ. | • 0 trường hợp tồn kho bị âm (`stock < 0`).<br>• 100% doanh thu khớp đúng với lịch sử giao dịch cổng thanh toán. |
| **4** | **Giảng viên / Khách hàng nghiệm thu<br>(Evaluation Committee)** | • Đóng vai trò Hội đồng Đánh giá chất lượng đồ án môn Công nghệ Phần mềm.<br>• Thẩm định tính chuẩn mực của quy trình kỹ nghệ từ yêu cầu đến triển khai. | • Đánh giá năng lực của nhóm qua tính hoàn chỉnh của 5 Task.<br>• Kiểm chứng việc áp dụng đúng đắn kiến trúc 3 tầng, tính toán tiền tại Business Layer.<br>• Nghiệm thu tính bền vững của hệ thống qua Concurrency và CI/CD thực tế. | • Mã nguồn Monorepo chuẩn mực, phân chia thư mục khoa học (`apps/web`, `apps/api`, `docs/`).<br>• Có ma trận truy vết (`traceability-matrix.md`) liên kết chặt từ SRS, Diagram đến Source Code và Tests.<br>• Có Pipeline CI/CD tự động chạy trên GitHub Actions (Pass/Fail rõ ràng).<br>• Hệ thống Production triển khai thực tế trên Internet qua giao thức HTTPS có gắn Health Check. | • Hoàn thành 100% các tiêu chí nghiệm thu của 5 Task trong đề bài.<br>• Báo cáo kỹ thuật chuẩn định dạng LaTeX ngắn gọn, súc tích (1.5 – 2 trang văn bản). |
| **5** | **Nhóm phát triển hệ thống<br>(Development / Scrum Team)** | • 6 thành viên đóng các vai trò Scrum (PO, SM, Devs).<br>• Chịu trách nhiệm trọn gói từng tính năng (Vertical Slice) từ thiết kế sơ đồ đến code và test. | • Nắm vững toàn bộ chu trình kỹ nghệ phần mềm hiện đại.<br>• Viết mã nguồn sạch (Clean Code), dễ bảo trì và mở rộng.<br>• Hoàn thành đúng tiến độ qua 2 Sprint mà không bị nợ kỹ thuật (Technical Debt). | • Quy ước đặt tên branch, commit message theo chuẩn Conventional Commits.<br>• Mỗi thành viên đều có đóng góp code và commit rõ ràng trên Git (chống 0 điểm đồ án).<br>• Cơ chế Docker Compose chạy đồng bộ môi trường Web, API, Database ở local chỉ với một lệnh. | • 100% Pull Request được review trước khi merge vào nhánh chính.<br>• Đạt độ bao phủ kiểm thử (Unit, Integration, E2E) theo cam kết Definition of Done. |
| **6** | **Đơn vị thanh toán đối tác<br>(Payment Partner / Mock Gateway)** | • Cổng thanh toán trực tuyến (Mô phỏng MoMo, VNPay, Thẻ ngân hàng).<br>• Xử lý yêu cầu trừ tiền, phản hồi trạng thái giao dịch và cấp mã tham chiếu. | • Cung cấp giao thức thanh toán tin cậy, an toàn, minh bạch.<br>• Hỗ trợ cơ chế đối soát giao dịch và chống gian lận. | • Client/Server gọi API thanh toán bắt buộc kèm Header `Idempotency-Key` (UUID duy nhất).<br>• Dữ liệu số tiền gửi sang (`finalAmount`) phải là số tiền cuối cùng đã xác thực của đơn hàng.<br>• Hệ thống hỗ trợ xử lý cả hai kịch bản: Giao dịch thành công (`SUCCESS`) và Giao dịch thất bại (`FAILED`) để hoàn kho. | • Tỷ lệ hoàn trả kho (`Restock Rollback`) thành công 100% khi thanh toán fail.<br>• Thời gian phản hồi xác thực giao dịch < 500ms. |

---

## 3. Phạm vi Sản phẩm (Product Scope)

Để đảm bảo dự án hoàn thành đúng tiến độ qua 2 Sprint với chất lượng kiểm thử và khả năng triển khai thực tế cao nhất, phạm vi của hệ thống **BrewLite** được phân định rõ thành 3 nhóm: **Phạm vi trong MVP (In-Scope)**, **Phạm vi mở rộng (Future Scope)** và **Các nội dung không thực hiện (Out-of-Scope)**.

### 3.1 Phạm vi trong MVP (In-Scope)

Phiên bản MVP (Minimum Viable Product) của **BrewLite** hiện thực hóa trọn vẹn luồng nghiệp vụ cốt lõi từ đầu đến cuối (**End-to-End**):

> `Xem menu` -> `Chọn tùy chọn` -> `Giỏ hàng` -> `Đặt đơn` -> `Thanh toán` -> `Theo dõi đơn`

Cụ thể, các chức năng nằm trong phạm vi thực hiện gồm:

| Mã cụm | Nhóm chức năng trong MVP (In-Scope) | Mô tả chi tiết phạm vi thực hiện |
| :--- | :--- | :--- |
| **MVP-01** | **Duyệt Thực đơn (Menu), Tìm kiếm và Xem Chi tiết món** | Hiển thị danh sách đồ uống theo giao diện Mobile-first bằng Next.js; lọc sản phẩm theo danh mục (Cà phê, Trà trái cây, Đá xay, Bánh ngọt) và tìm kiếm theo tên món; xem chi tiết sản phẩm (mô tả, giá gốc, hình ảnh, trạng thái tồn kho); xử lý đầy đủ 3 trạng thái giao diện `Loading` (Skeleton), `Empty` (Danh mục trống) và `Error` (Lỗi kết nối API); tự động gắn nhãn **"Hết hàng"** và khóa thao tác chọn đối với món có `stock == 0`. |
| **MVP-02** | **Tùy biến Đồ uống, Quản lý Giỏ hàng và Khuyến mãi (`Promotion`)** | Cho phép chọn kích cỡ (`Size S / M / L`) và các loại `Topping` đi kèm cho từng món; quản lý giỏ hàng ở phía Client bằng **Zustand** (đồng bộ `localStorage`) gồm thêm món, cộng dồn nếu trùng cấu hình Size/Topping, tăng/giảm số lượng (không vượt quá `stock`) và xóa món; kiểm tra và áp dụng mã khuyến mãi giảm giá (`Promotion`) hợp lệ theo điều kiện thời hạn và giá trị đơn tối thiểu. |
| **MVP-03** | **Đăng ký, Đăng nhập và Xác thực Phân quyền (`JWT`)** | Đăng ký tài khoản khách hàng mới với mật khẩu được băm an toàn bằng `bcrypt`; đăng nhập và cấp phát `JSON Web Token (JWT)` để xác thực cho các tác vụ nhạy cảm (đặt đơn, thanh toán, xem lịch sử đơn, tích điểm); cung cấp endpoint giám sát sức khỏe hệ thống `GET /api/v1/health`. |
| **MVP-04** | **Khởi tạo Đơn hàng, Tính tiền tại Business Layer và Khóa Tồn kho Đồng thời** | Xác thực dữ liệu đầu vào (`DTO Validation`) và **tính toán lại 100% tổng tiền đơn hàng tại tầng Business Logic Layer (NestJS Service)** dựa trên đơn giá gốc trong CSDL (tuyệt đối không dùng giá tiền do Client gửi lên); kiểm tra và trừ tồn kho an toàn bên trong **Database Transaction (`prisma.$transaction`)** kết hợp kỹ thuật **Optimistic Locking (cột `version` trên bảng `Product`)** nhằm chống bán quá số lượng tồn kho (`stock < 0`) khi có nhiều khách hàng đặt mua cùng một món cuối cùng tại cùng một thời điểm. |
| **MVP-05** | **Thanh toán Ví/Thẻ Mô phỏng (`Mock Payment`) và Chống Trừ tiền Trùng lặp (`Idempotency`)** | Mô phỏng cổng thanh toán qua Ví điện tử (MoMo/VNPay) hoặc Thẻ ngân hàng hỗ trợ cả 2 kịch bản Thanh toán thành công (`SUCCESS`) và Thanh toán thất bại (`FAILED`); bắt buộc kiểm tra khóa **`Idempotency-Key` (UUID)** trên mỗi yêu cầu thanh toán để đảm bảo khi khách hàng bấm đúp hoặc gửi lại yêu cầu do mạng chập chờn thì hệ thống chỉ trừ tiền đúng 1 lần; tự động hủy đơn (`CANCELLED`) và hoàn trả lại số lượng tồn kho (`Restock Rollback`) nếu giao dịch thanh toán thất bại. |
| **MVP-06** | **Biên nhận, Theo dõi Trạng thái, Lịch sử Đơn hàng và Tích điểm (`LoyaltyTransaction`)** | Hiển thị biên nhận điện tử ngay sau khi thanh toán thành công kèm mã đơn hàng (`#BL-XXXX`); theo dõi tiến trình trạng thái đơn hàng trực quan (`PENDING -> PAID -> PREPARING -> COMPLETED / CANCELLED`) và tra cứu danh sách lịch sử đơn hàng cá nhân; tự động ghi nhận giao dịch cộng điểm thưởng (`EARN`) và đổi điểm giảm giá (`REDEEM`) thông qua thực thể `LoyaltyTransaction`. |

---

### 3.2 Phạm vi mở rộng (Future / Extended Scope)

Các tính năng có giá trị gia tăng được định hướng thiết kế sẵn điểm mở rộng trong kiến trúc dữ liệu nhưng sẽ triển khai ở các phiên bản sau giai đoạn MVP:

1. **Phân hạng Thành viên tự động (Tiered Membership):** Tự động nâng hạng thẻ thành viên (*Đồng, Bạc, Vàng, Kim Cương*) dựa trên tổng điểm tích lũy `LoyaltyTransaction` với mức chiết khấu ưu đãi riêng.
2. **Thông báo đẩy Thời gian thực (Real-time Web Push / WebSocket):** Gửi thông báo đẩy tức thời đến màn hình khóa điện thoại của khách hàng ngay khi nhân viên quầy chuyển trạng thái đơn sang `PREPARING` hoặc `COMPLETED`.
3. **Đặt hàng theo Nhóm (Group Order):** Cho phép nhiều người dùng cùng quét một mã QR để thêm đồ uống vào chung một giỏ hàng tập thể trước khi người chủ phòng chốt đơn thanh toán.
4. **Gợi ý Thực đơn Thông minh (Personalized Recommendation):** Đề xuất đồ uống và combo bánh ngọt dựa trên lịch sử mua hàng cá nhân và thời tiết/khung giờ trong ngày.

---

### 3.3 Các nội dung KHÔNG thực hiện trong dự án (Out-of-Scope)

Để tập trung nguồn lực vào độ sâu kỹ thuật của kiến trúc phân tầng, tính toàn vẹn giao dịch đồng thời (Concurrency) và quy trình CI/CD tự động hóa, nhóm xác định rõ các hạng mục **không thực hiện (Out-of-Scope)** trong phạm vi Assignment 2:

| STT | Hạng mục không thực hiện (Out-of-Scope) | Lý do loại trừ và Giải pháp thay thế trong MVP |
| :--- | :--- | :--- |
| **1** | **Giao diện Quản trị kho và CRUD Sản phẩm phức tạp (Admin Back-office UI)** | Việc xây dựng các màn hình nhập kho, thêm/sửa/xóa sản phẩm chỉ lặp lại thao tác CRUD cơ bản và làm phân tán thời gian của 2 Sprint. Thay vào đó, nhóm sử dụng kịch bản **Database Migration, Prisma Seed (`seed.ts`) và Prisma Studio** để khởi tạo và bổ sung tồn kho (`Restock`) khi kiểm thử. |
| **2** | **Tích hợp Cổng thanh toán Ngân hàng / Ví điện tử thương mại bằng tiền thật** | Việc đăng ký tài khoản doanh nghiệp (Merchant) với MoMo/VNPay/Ngân hàng đòi hỏi giấy phép pháp lý ngoài phạm vi môn học. Nhóm xây dựng **Mock Payment Service** mô phỏng đầy đủ độ trễ mạng, mã giao dịch, kịch bản lỗi và cơ chế chống trùng lặp `Idempotency-Key`. |
| **3** | **Hệ thống Định vị Bản đồ GPS và Điều phối Tài xế Giao hàng (Live Delivery Tracking)** | Nghiệp vụ cốt lõi của BrewLite tập trung vào mô hình đặt món trước trên điện thoại và nhận tại quầy hoặc nhận đơn tiêu chuẩn, không bao gồm bài toán định tuyến bản đồ cho đội ngũ shipper. |
| **4** | **Ứng dụng Di động Native độc lập trên App Store / Google Play (iOS Swift / Android Kotlin)** | Hệ thống được phát triển dưới dạng ứng dụng web **Next.js theo hướng Mobile-first / Progressive Web App (PWA)**, cho phép truy cập trực tiếp qua trình duyệt di động và cài đặt ra màn hình chính mà không cần duy trì mã nguồn Native riêng biệt. |
| **5** | **Kiến trúc Microservices phân tán đa cơ sở dữ liệu** | Không tách hệ thống thành nhiều Microservices chạy trên các CSDL rời rạc nhằm tránh độ phức tạp không cần thiết của Distributed Transaction (Saga/2PC) trong phạm vi 2 Sprint; thay vào đó áp dụng kiến trúc **Modular Monolith** trên NestJS. |

---

## 4. Giả định, Ràng buộc và các Rủi ro ban đầu

### 4.1 Các Giả định (Assumptions)

1. **Hạ tầng thiết bị của người dùng:** Khách hàng truy cập BrewLite bằng thiết bị di động hoặc máy tính có trình duyệt web hiện đại (hỗ trợ JavaScript, `localStorage` và HTTPS) kèm kết nối mạng Internet ổn định tại thời điểm gửi yêu cầu đặt đơn và thanh toán.
2. **Tính sẵn sàng của dữ liệu danh mục ban đầu:** Danh sách thực đơn tối thiểu (8–10 món đồ uống thuộc các nhóm Cà phê, Trà, Đá xay, Bánh ngọt), đơn giá gốc (`basePrice`), cấu hình giá Size/Topping và mã khuyến mãi mẫu được nạp sẵn vào PostgreSQL thông qua script `seed` trước khi vận hành.
3. **Định danh phiên giao dịch từ Client:** Trình duyệt phía Client có khả năng sinh chuỗi định danh duy nhất theo chuẩn `UUID v4` để đính kèm làm khóa `Idempotency-Key` cho mỗi lần yêu cầu thanh toán đơn hàng.
4. **Môi trường triển khai Cloud/Container:** Nền tảng triển khai Production (Render / Railway / Fly.io hoặc VPS tương đương) hỗ trợ chạy Docker Container và cung cấp kết nối TLS/HTTPS mặc định cho cả Frontend và Backend API.

---

### 4.2 Các Ràng buộc (Constraints)

1. **Ràng buộc Công nghệ Bắt buộc (Mandatory Tech Stack):**
   - Frontend bắt buộc sử dụng **Next.js** thiết kế theo hướng **Mobile-first / PWA**.
   - Backend bắt buộc sử dụng **NestJS** đóng vai trò API Server xử lý nghiệp vụ.
   - Hệ quản trị cơ sở dữ liệu bắt buộc sử dụng **PostgreSQL** và môi trường chạy phải được đóng gói bằng **Docker** (`docker-compose.yml`). Nhóm có thể bổ sung thư viện phụ trợ (Prisma, Zustand, Jest, Playwright) nhưng tuyệt đối không thay thế 3 thành phần cốt lõi trên.
2. **Ràng buộc Kiến trúc Phần mềm (Architectural Constraints):**
   - Backend phải tuân thủ chặt chẽ **Kiến trúc phân lớp 3 tầng (Presentation Layer – Business Logic Layer – Data Access Layer)**.
   - Toàn bộ nghiệp vụ tính tổng tiền đơn hàng, áp mã giảm giá và kiểm tra tồn kho bắt buộc thực hiện tại **Business Logic Layer**; nghiêm cấm việc tin tưởng tổng tiền gửi lên từ phía Client.
3. **Ràng buộc Quy trình và Thời gian (Process & Schedule Constraints):**
   - Dự án thực hiện trong thời gian cố định **2 Sprint** với quy mô **6 thành viên**.
   - Bắt buộc tuân thủ **Quy tắc thực hiện tuần tự**: Năm task (`Task 1 -> Task 2 -> Task 3 -> Task 4 -> Task 5`) phải được hoàn thành và lưu vết commit/Pull Request trên kho mã nguồn theo đúng thứ tự.
4. **Ràng buộc Bảo mật và Bàn giao (Security & Delivery Constraints):**
   - Cơ sở dữ liệu PostgreSQL trên môi trường Production tuyệt đối không được mở public trực tiếp ra Internet.
   - Không được để lộ bất kỳ khóa bí mật nào (`JWT_SECRET`, `DATABASE_URL`, API Keys) trong mã nguồn repository hoặc trong log của CI/CD pipeline.

---

### 4.3 Danh mục các Rủi ro ban đầu và Biện pháp Giảm thiểu (Initial Risks & Mitigation)

| Mã rủi ro | Mô tả rủi ro ban đầu | Nhóm ảnh hưởng | Mức độ | Biện pháp phòng ngừa và giảm thiểu (Mitigation Strategy) |
| :--- | :--- | :--- | :--- | :--- |
| **RISK-01** | **Xung đột đặt hàng đồng thời (Race Condition / Concurrency):** Hai hoặc nhiều khách hàng cùng bấm đặt mua sản phẩm chỉ còn đúng 1 phần cuối cùng trong kho tại cùng một mili-giây, dẫn đến bán vượt tồn kho (`stock < 0`). | Nghiệp vụ & Dữ liệu | **Cao** | Bọc toàn bộ thao tác kiểm tra kho và tạo đơn trong **Database Transaction (`prisma.$transaction`)** kết hợp kỹ thuật **Optimistic Locking** (kiểm tra điều kiện `version = currentVersion AND stock >= qty` khi cập nhật). Nếu xung đột, lập tức Rollback và trả về `HTTP 409 Conflict`. |
| **RISK-02** | **Trừ tiền trùng lặp khi mạng chập chờn (Double Charging):** Khách hàng bấm nút Thanh toán nhiều lần liên tiếp hoặc trình duyệt tự gửi lại request khi kết nối mạng bị gián đoạn. | Thanh toán & Uy tín | **Cao** | Bắt buộc sử dụng khóa **`Idempotency-Key` (Unique)** lưu trong bảng `Payment`. Nếu hệ thống nhận được request mang `Idempotency-Key` đã xử lý thành công trước đó, lập tức trả về kết quả cũ mà không gọi lại dịch vụ trừ tiền. |
| **RISK-03** | **Giả mạo đơn giá từ phía trình duyệt (Client-side Price Tampering):** Người dùng can thiệp vào payload request `POST /orders` để sửa giá món hoặc mức giảm giá về `0đ`. | Bảo mật & Tài chính | **Cao** | API `POST /orders` chỉ nhận định danh `productId`, `size`, `toppings`, `quantity` và `promoCode`. Tầng **Business Logic Layer (`OrdersService`)** tự truy vấn đơn giá gốc từ PostgreSQL để tính toán lại `subtotalAmount`, `discountAmount` và `finalAmount`. |
| **RISK-04** | **Sai lệch hoặc mâu thuẫn giữa Tài liệu Yêu cầu (SRS), Sơ đồ UML và Mã nguồn thực tế:** Thành viên sửa code nhưng quên cập nhật sơ đồ hoặc vẽ sơ đồ không khớp với tên lớp/thuộc tính trong Database. | Quy trình & Nghiệm thu | **Trung bình** | Thống nhất bộ 7 thực thể cốt lõi (`User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction`) ngay từ Task 2.3 làm chuẩn cho `schema.prisma`; kiểm soát mọi thay đổi qua Pull Request và bảng `docs/traceability-matrix.md`. |
| **RISK-05** | **Lỗi tích hợp môi trường và gián đoạn Pipeline CI/CD sát hạn nộp bài:** Code chạy được trên máy cá nhân nhưng lỗi khi build Docker hoặc trượt bài kiểm thử trên GitHub Actions. | Kỹ thuật & Triển khai | **Trung bình** | Thiết lập `docker-compose.yml` ngay từ Sprint 1 (Task 4.1) và kích hoạt cổng kiểm soát chất lượng CI (`Install -> Lint -> Unit Test -> Build`) chặn merge các PR bị lỗi; cấu hình cơ chế Smoke Test (`GET /health`) và hướng dẫn Rollback rõ ràng. |
