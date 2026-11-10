# ADR-002: Tổ chức Monorepo và quản lý trạng thái giỏ hàng bằng Zustand

- **Trạng thái:** Đề xuất — chờ nhóm duyệt.
- **Ngày:** 2026-11-09.
- **Người phụ trách:** Quỳnh.
- **Phạm vi:** Task 3.1 — quyết định tổ chức repository và quản lý trạng thái phía Client.
- **Yêu cầu liên quan:** FR-03, FR-09, UC-02; tích hợp UC-01 và UC-04.

## 1. Bối cảnh

BrewLite có giao diện Next.js, Backend NestJS và cơ sở dữ liệu PostgreSQL. Sáu thành viên phát triển theo từng chức năng xuyên suốt từ yêu cầu, sơ đồ đến code và kiểm thử. Một thay đổi về giỏ hàng hoặc khuyến mãi thường liên quan đồng thời đến giao diện, Backend và tài liệu, nên các phần này cần được quản lý nhất quán.

Giỏ hàng được dùng chung giữa màn hình Menu, hộp tùy biến món, biểu tượng đếm số ly và trang giỏ hàng. Khách vãng lai cũng được sử dụng giỏ; giỏ cần được khôi phục sau khi tải lại trang. FR-03 đã quy định Zustand kết hợp `localStorage`; ADR này giải thích lựa chọn đó và giới hạn sử dụng, không thay đổi yêu cầu đã thống nhất.

Tại thời điểm viết ADR, `apps/web` và `apps/api` mới có `.gitkeep`, chưa có mã ứng dụng hoặc cấu hình workspace. Các nội dung bên dưới là quyết định thiết kế cho giai đoạn hiện thực, không phải báo cáo chức năng đã chạy.

## 2. Quyết định

### 2.1. Dùng Monorepo cho Web, API và tài liệu

Giữ một Git repository với cấu trúc:

```text
brewlite/
├── apps/
│   ├── web/                 # Next.js: giao diện và trạng thái phía Client
│   └── api/                 # NestJS: nghiệp vụ và truy cập PostgreSQL qua Prisma
├── docs/
│   ├── requirements/        # Yêu cầu và đặc tả use case
│   ├── diagrams/            # Nguồn PlantUML và ảnh SVG
│   └── architecture/
│       └── adr/             # Các quyết định kiến trúc
├── tests/                   # Kiểm thử tích hợp và luồng xuyên ứng dụng
└── .github/workflows/       # CI/CD khi triển khai Task 4–5
```

- `apps/web` và `apps/api` có cấu hình, dependency và quy trình build riêng; ở cùng repository không có nghĩa là cùng tiến trình chạy hoặc buộc triển khai cùng lúc.
- Web trao đổi với Backend qua HTTP/HTTPS. Không import mã nghiệp vụ NestJS, Prisma hoặc truy cập DB trực tiếp từ Web.
- Thay đổi chức năng được cập nhật cùng yêu cầu, sơ đồ và kiểm thử liên quan trong một PR để thuận tiện review và truy vết.
- Không tạo thêm `packages/shared`, công cụ điều phối build hoặc thư viện nội bộ khi chưa có nhu cầu dùng chung thực tế. Việc chọn package manager và cấu hình workspace thuộc bước khởi tạo ứng dụng ở Task 4.

Monorepo là cách tổ chức mã nguồn; không thay thế quyết định kiến trúc Modular Monolith và phân lớp bên trong Backend.

### 2.2. Dùng Zustand cho trạng thái giỏ hàng dùng chung

Đặt store giỏ hàng trong `apps/web`, dùng Zustand làm nguồn trạng thái chung cho UC-02:

| Nhóm trạng thái | Cách quản lý |
| --- | --- |
| Các dòng giỏ, cấu hình Size/Topping/đường/đá, số lượng | Zustand store |
| Mã đang áp dụng và thông tin giảm giá dự kiến | Zustand store; chỉ là dữ liệu tham khảo |
| Tổng số ly, tạm tính, tổng dự kiến | Tính từ dữ liệu giỏ hiện tại; tránh lưu nhiều bản sao dễ lệch |
| Tùy chọn đang chỉnh trong modal, trạng thái mở/đóng, loading và lỗi giao diện | State cục bộ tại component khi không cần chia sẻ |
| Giá chính thức, điều kiện khuyến mãi, tồn kho và đơn hàng | Backend và PostgreSQL có thẩm quyền; không do store quyết định |

Các thao tác thêm/gộp món, đổi số lượng, xóa món, làm rỗng giỏ và hủy mã được tập trung trong store thay vì lặp lại ở nhiều component. Component chỉ đọc phần state cần dùng qua selector. Cùng sản phẩm và cùng cấu hình được gộp dòng; kiểm tra số lượng áp dụng trên tổng các dòng của cùng sản phẩm.

### 2.3. Lưu giỏ bằng middleware `persist`

- Dùng `persist` của Zustand với `localStorage` để khôi phục giỏ trên cùng trình duyệt và cùng origin. Không yêu cầu đăng nhập; không cam kết đồng bộ nhiều thiết bị.
- Chỉ lưu dữ liệu cần khôi phục giỏ và mã giảm giá dự kiến. Không lưu JWT, mật khẩu, dữ liệu thanh toán hoặc secret trong store giỏ hay khóa lưu giỏ.
- Dữ liệu đọc lại là đầu vào không đáng tin: kiểm tra cấu trúc, số lượng nguyên dương và các tùy chọn hợp lệ trước khi dùng. Dữ liệu hỏng được đưa về giỏ rỗng an toàn và thông báo cho người dùng.
- Xử lý riêng lỗi đọc/ghi khi trình duyệt chặn lưu trữ hoặc hết dung lượng. Giữ giỏ trong bộ nhớ nếu còn dùng được; báo thay đổi có thể mất khi tải lại, không để giao diện bị crash.
- Với Next.js, chỉ truy cập `localStorage` ở Client. Không dùng store chứa giỏ của người dùng như singleton có thể thay đổi trong môi trường Server. Giao diện cần trạng thái chờ khôi phục giỏ để tránh lệch nội dung khi hydration.
- Khi cấu trúc dữ liệu lưu thay đổi, dùng phiên bản dữ liệu và bước chuyển đổi có kiểm tra; nếu không chuyển đổi được phải thông báo việc khởi tạo lại giỏ.

### 2.4. Giữ ranh giới tin cậy giữa Client và Server

Zustand phục vụ tương tác và tính tiền **dự kiến**, không bảo đảm giá hoặc tồn kho chính thức:

1. Khi mở giỏ hoặc chuẩn bị đặt hàng, lấy lại trạng thái sản phẩm; món ngừng bán phải được xử lý trước khi tiếp tục. Chưa kiểm tra được thì không cho đặt hàng.
2. Mã khuyến mãi được Backend kiểm tra theo FR-09. Chỉ áp kết quả nếu giỏ chưa thay đổi trong lúc chờ; không cộng dồn nhiều mã. Khi giỏ đổi, tính lại giảm dự kiến và gỡ mã nếu không còn đủ điều kiện.
3. Kiểm tra mã ở UC-02 không giữ/trừ kho hoặc tăng lượt sử dụng mã. Khi tạo đơn ở UC-04, Backend tính lại giá, kiểm tra khuyến mãi và cập nhật kho/lượt dùng trong giao dịch có kiểm soát đồng thời; không tin giá tiền từ Client.

## 3. Các phương án đã cân nhắc

### 3.1. Tổ chức repository

| Phương án | Ưu điểm | Hạn chế và kết luận |
| --- | --- | --- |
| **Monorepo — chọn** | Một PR có thể chứa thay đổi Web, API và tài liệu; thống nhất lịch sử và truy vết cho nhóm sáu người | Cần quy ước thư mục, review và CI rõ; tránh chạy toàn bộ pipeline không cần thiết khi dự án lớn hơn |
| Tách repository Web/API/tài liệu | Phân quyền và phát hành từng phần độc lập hơn | Thay đổi liên quan nhiều phần phải phối hợp nhiều PR và phiên bản; chưa cần cho quy mô đồ án |

### 3.2. Quản lý trạng thái Client

| Phương án | Ưu điểm | Hạn chế và kết luận |
| --- | --- | --- |
| **Zustand — chọn** | API store/action trực tiếp, selector cho từng component, có middleware `persist`; phù hợp state giỏ dùng chung | Nhóm phải tự quy định cấu trúc store, validation và xử lý hydration; persistence không tự giải quyết mọi dữ liệu lỗi |
| Redux Toolkit | Quy ước slice/action và công cụ theo dõi thay đổi rõ; phù hợp khi nhiều miền trạng thái và luồng phức tạp | Vẫn cần thêm quy ước/cấu hình và giải pháp persistence; chưa đem lại lợi ích đủ lớn cho phạm vi giỏ hiện tại |
| React Context + `useReducer` | Có sẵn trong React, không thêm thư viện | Cần tự xây persistence và cách chia context để hạn chế cập nhật lan rộng; không phù hợp bằng Zustand với FR-03 đã chọn |
| Chỉ dùng state cục bộ và truyền props | Đơn giản cho trạng thái riêng của một component | Khó giữ đồng nhất giỏ giữa nhiều trang, modal và Cart Badge; chỉ dùng cho trạng thái giao diện cục bộ |

Lựa chọn không dựa vào tuyên bố Zustand luôn nhanh hơn Redux. Chưa có benchmark trên BrewLite; tiêu chí chính là phạm vi trạng thái, mức cấu hình cần thiết và sự phù hợp với FR-03.

## 4. Hệ quả và đánh đổi

### Lợi ích

- Giảm việc phối hợp thay đổi giữa nhiều repository; tài liệu thiết kế đi cùng mã nguồn.
- Giỏ và Cart Badge đọc cùng một nguồn trạng thái, tránh mỗi màn hình giữ một bản giỏ riêng.
- Khách vãng lai có thể khôi phục giỏ mà không cần lưu giỏ trên Server trong MVP.
- Giới hạn store ở Client giúp giữ rõ trách nhiệm nghiệp vụ và dữ liệu có thẩm quyền của Backend.

### Hạn chế và biện pháp

| Hạn chế/rủi ro | Biện pháp |
| --- | --- |
| Monorepo dễ phát sinh phụ thuộc chéo và conflict khi nhiều người sửa cùng phần | Giữ ranh giới Web/API; chia công việc theo chức năng; review PR trước merge |
| `localStorage` bị xóa, bị chặn hoặc bị sửa từ trình duyệt | Validation khi đọc; bắt lỗi lưu trữ; cảnh báo mất khả năng lưu; Server xác thực lại khi tạo đơn |
| Giá, tồn kho hoặc điều kiện mã trong giỏ có thể cũ | Làm mới trạng thái sản phẩm; Backend kiểm tra mã và tính lại dữ liệu chính thức tại UC-04 |
| Khác biệt SSR/Client gây hydration mismatch | Chỉ khôi phục ở Client; có trạng thái chờ; không chia sẻ state người dùng giữa các yêu cầu Server |
| Không có giỏ chung giữa các thiết bị | Chấp nhận giới hạn MVP theo FR-03.14; chỉ thiết kế đồng bộ Server khi có yêu cầu mới |

## 5. Tiêu chí kiểm chứng khi hiện thực

Các mục sau là kiểm tra cần thực hiện ở Task 4–5, **chưa phải kết quả kiểm thử**:

- Menu, modal và Cart Badge cùng đọc/cập nhật giỏ; cùng cấu hình được gộp, khác cấu hình tạo dòng riêng.
- Đổi thứ tự chọn Topping không làm sinh dòng trùng; tổng số lượng cùng sản phẩm không vượt tồn kho tham khảo.
- Tải lại trang khôi phục đúng món, tùy chọn và số lượng; JSON hỏng, dữ liệu sai, lỗi đọc/ghi không làm crash giao diện.
- SSR và lần render đầu ở Client nhất quán; không có giỏ của người dùng này xuất hiện trong yêu cầu của người khác.
- Đổi giỏ khi đang chờ kiểm tra mã không áp kết quả cũ; giỏ rỗng hoặc không đủ điều kiện thì gỡ mã.
- Sửa giá hoặc tiền giảm trong `localStorage` không làm thay đổi giá chính thức của đơn do Backend tính.
- Web và API có thể kiểm tra/build riêng; CI kiểm tra các phần liên quan theo cấu hình được triển khai ở Task 4.

## 6. Khi nào xem xét lại

Xem xét lại quyết định nếu cần giỏ đồng bộ nhiều thiết bị, nhiều người cùng sửa giỏ, nhiều miền trạng thái phức tạp hoặc Web/API có vòng đời và quyền truy cập cần tách biệt. Không bổ sung đồng bộ Server, Redux Toolkit hay công cụ Monorepo chỉ để dự phòng.

## 7. Tài liệu liên quan

- [Assignment 2 — Task 3.1 và phân công Quỳnh](https://docs.google.com/document/d/1I6J6lxQZov31-HoRR_Ba8F1_nQDI-SLdpF5pizUDTag/edit?tab=t.8mb2tkoxafv3).
- [README — cấu trúc repository và quy ước phát triển](../../../README.md).
- [Bối cảnh và phạm vi — MVP-02](../../requirements/context-and-scope.md).
- [SRS — phân hệ 2, FR-03 và FR-09](../../requirements/srs-summary.md#5-phân-hệ-chức-năng-2-quỳnh-yêu-cầu-chức-năng-fr-03--fr-09).
- [Đặc tả UC-02 và ranh giới với UC-04](../../requirements/usecase-checkout-spec.md).
- [Class UC-02 — giỏ hàng và khuyến mãi](../../diagrams/class-02-cart-promotion.puml).
