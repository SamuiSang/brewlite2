# BrewLite – Tóm tắt yêu cầu phần mềm (SRS)

- **Giai đoạn:** Task 1.2 – Yêu cầu chức năng; Task 1.3 – Use Case.
- **Thực hiện:** Quỳnh – Chức năng 2: Tùy biến món, Giỏ hàng và Khuyến mãi.
- **Nguồn:** `docs/phancong.docx`, Mục 2.1–2.2; [Bối cảnh và phạm vi](context-and-scope.md), MVP-02.
- **Phạm vi:** FR-03 và UC-02, không thay thế phần thành viên khác. Bảng tổng quan phân công có nhắc FR-09 nhưng Task 1.2 trong ảnh và README gộp khuyến mãi vào FR-03; tài liệu này dùng FR-03, không tự tạo FR-09.

## 1. Yêu cầu chức năng FR-03

### 1.1 Mô tả

**FR-03 – Tùy biến đồ uống, Quản lý giỏ hàng và Áp dụng khuyến mãi:** Khách hàng, kể cả khách chưa đăng nhập, chọn Size/Topping, thêm món, cập nhật số lượng, xóa món và áp mã hợp lệ. Giỏ hàng dùng Zustand, lưu `localStorage`; hiển thị cấu hình, giá tạm tính, tổng số lượng, tiền giảm và tổng tiền dự kiến.

Giỏ không giữ chỗ/trừ tồn kho. Giá Client chỉ phục vụ hiển thị. Tính lại giá/mã, kiểm tra và khóa tồn kho khi tạo đơn thuộc FR-05; thanh toán thuộc FR-06.

### 1.2 Yêu cầu và MoSCoW

| Mã | Yêu cầu có thể kiểm tra | MoSCoW |
| :--- | :--- | :--- |
| FR-03.1 | Mở tùy biến cho món đang bán và `stock > 0`; chọn đúng một size hỗ trợ, không hoặc nhiều topping hợp lệ. Size S cộng 0đ, M cộng 6.000đ, L cộng 10.000đ theo phân công; topping lấy giá từ danh mục. | Must |
| FR-03.2 | Cập nhật giá ngay khi đổi size, topping hoặc số lượng; hiển thị phụ thu và thành tiền. | Must |
| FR-03.3 | Gộp dòng cùng sản phẩm và toàn bộ cấu hình, không phụ thuộc thứ tự topping; cấu hình khác tạo dòng riêng. Badge bằng tổng số ly. | Must |
| FR-03.4 | Tăng/giảm số lượng nguyên dương, xóa dòng; giảm từ 1 về 0 yêu cầu xác nhận. Tổng số ly cùng sản phẩm trên mọi cấu hình không vượt tồn kho gần nhất. | Must |
| FR-03.5 | Lưu bằng Zustand persist/`localStorage`; khôi phục cấu hình/số lượng sau F5, đồng bộ lại giá/tồn và xác thực lại mã. | Must |
| FR-03.6 | Gọi `POST /api/v1/promotions/validate`; chỉ áp mã tồn tại, hoạt động, trong thời hạn, còn lượt và đạt giá trị đơn tối thiểu. Backend tính lại giá trị giỏ từ danh mục, không tin tổng Client gửi. | Must |
| FR-03.7 | Hiển thị tạm tính, giảm giá, tổng dự kiến; cho bỏ mã. Giỏ thay đổi phải xác thực lại, không giữ giảm cũ như đã hợp lệ. | Must |
| FR-03.8 | Hiển thị giỏ rỗng, trạng thái đang kiểm tra, lỗi có lý do; cho thử lại khi lỗi mạng/API, không làm mất giỏ. | Must |
| FR-03.9 | Chọn đường/đá theo tùy chọn món hỗ trợ; hiển thị và dùng cấu hình này trong khóa gộp dòng. | Should |
| FR-03.10 | Thông báo ngắn khi thêm/xóa món thành công. | Could |
| FR-03.11 | Không đồng bộ giỏ giữa thiết bị, chồng nhiều mã, quản trị chương trình khuyến mãi hoặc giữ hàng từ giỏ trong MVP. | Won't (MVP) |

Must là bắt buộc nghiệm thu; Should là ưu tiên kế tiếp; Could là tùy chọn; Won't là ngoài MVP. Đường/đá có trong Mục 2.1 phân công nhưng không phải trọng tâm MVP-02, nên đề xuất Should, cần PO xác nhận.

### 1.3 Quy tắc nghiệp vụ

| Mã | Quy tắc |
| :--- | :--- |
| BR-03.1 | Đơn giá = giá gốc + phụ thu size + tổng giá topping; thành tiền dòng = đơn giá × số lượng; tạm tính giỏ = tổng thành tiền dòng. Topping là tập ID duy nhất, không tính trùng. |
| BR-03.2 | Khóa gộp gồm `productId`, `sizeId`, tập `toppingIds` đã sắp xếp và đường/đá nếu hỗ trợ. Số lượng không thuộc khóa. |
| BR-03.3 | Số lượng nguyên dương; tổng theo `productId` trên mọi dòng ≤ `stock` gần nhất. Giỏ không bảo đảm giữ hàng; FR-05 kiểm tra lại trong giao dịch tạo đơn. |
| BR-03.4 | Một mã tại một thời điểm; mã mới hợp lệ thay mã cũ. Mã mới sai không thay mã cũ nếu mã cũ còn hợp lệ với giỏ hiện tại. Giỏ rỗng không áp mã. |
| BR-03.5 | Mã đang hoạt động, `startsAt <= serverNow < expiresAt`, còn lượt và tạm tính trước giảm ≥ mức tối thiểu. Backend dùng giờ máy chủ; kiểm tra mã không tiêu thụ lượt. |
| BR-03.6 | Tiền giảm theo cấu hình Backend, không âm, không vượt tạm tính hoặc mức giảm tối đa nếu có. Tổng dự kiến = tạm tính − giảm giá, luôn ≥ 0. Tiền tính bằng số nguyên VND. |
| BR-03.7 | Giỏ đổi vô hiệu kết quả mã cũ. Chỉ nhận phản hồi xác thực khớp phiên bản giỏ hiện tại; bỏ phản hồi trễ. Lỗi mạng giữ mã nhập nhưng không áp giảm chưa xác thực. |
| BR-03.8 | F5 khôi phục cấu hình/số lượng, không coi giá/mã lưu là có thẩm quyền. Nếu giỏ vượt tồn mới, đánh dấu dòng cần sửa và chặn chuyển đặt đơn đến khi khách sửa/xóa. |

Chi tiết chưa chốt trong phân công (một mã, biên thời gian, gộp đường/đá, tổng tồn nhiều cấu hình, bỏ phản hồi cũ) là quyết định đặc tả đề xuất, cần PO xác nhận trước Task 4–5. API dùng `/api/v1` theo Mục 2.2 phân công.

### 1.4 Tiêu chí nghiệm thu (Acceptance Criteria)

Fixture độc lập cho từng tình huống: món A giá 30.000đ, topping T1 giá 5.000đ, T2 giá 7.000đ; size S/M/L theo FR-03.1. Đây là dữ liệu kiểm thử, không phải seed bắt buộc.

| Mã | Given | When | Then | Truy vết |
| :--- | :--- | :--- | :--- | :--- |
| AC-03.01 | A còn hàng, số lượng 2 | Chọn M/T1 rồi đổi L/T1 | Giá M là 41.000đ, thành tiền 82.000đ; L là 45.000đ, thành tiền 90.000đ, cập nhật ngay. | FR-03.1–2 |
| AC-03.02 | Giỏ A/M/T1+T2 số lượng 1, tồn đủ | Thêm A/M/T2+T1 số lượng 2 | Một dòng số lượng 3, đơn giá 48.000đ; badge 3; không tính trùng topping. | FR-03.3 |
| AC-03.03 | Giỏ A/M/T1 | Thêm A/L/T1 | Hai dòng; nếu hỗ trợ đường/đá thì cấu hình đường/đá khác cũng tách dòng. | FR-03.3, FR-03.9 |
| AC-03.04 | A tồn 3; A/M có 2 ly, A/L có 1 ly | Tăng A/L hoặc thêm cấu hình A khác | Bị chặn, giữ số lượng; báo “Chỉ còn 3 sản phẩm trong kho”. Dữ liệu âm, thập phân, không phải số bị từ chối. | FR-03.4 |
| AC-03.05 | Một dòng có 1 ly | Giảm về 0; hủy, rồi thử lại và xác nhận | Hủy giữ dòng; xác nhận xóa và cập nhật tổng/badge. Xóa dòng cuối hiện giỏ rỗng, bỏ giảm giá. | FR-03.4, FR-03.8 |
| AC-03.06 | Giỏ đã lưu nhiều cấu hình | F5 cùng trình duyệt và origin | Khôi phục cấu hình/số lượng; đồng bộ giá/tồn, xác thực lại mã trước khi áp giảm. | FR-03.5, FR-03.7 |
| AC-03.07 | Fixture BREWLITE20 đang hoạt động, còn lượt, giảm 20%, tối thiểu 100.000đ, tối đa 30.000đ; giỏ 200.000đ | Áp mã thành công | Giảm 30.000đ, tổng 170.000đ, chỉ một mã được áp dụng. | FR-03.6–7 |
| AC-03.08 | Mã sai, chưa bắt đầu, hết hạn, ngừng hoạt động, hết lượt hoặc giỏ chưa đạt tối thiểu | Áp từng trường hợp, gồm đúng `expiresAt` | API trả `400 Bad Request` kèm lý do, không giảm giá; bằng mức tối thiểu thì đạt điều kiện giá trị đơn. | FR-03.6 |
| AC-03.09 | Mã tối thiểu 100.000đ đang áp, giỏ 120.000đ | Giảm giỏ xuống 80.000đ | Bỏ hiệu lực giảm cũ, xác thực lại và báo không đủ tối thiểu; phản hồi giỏ cũ đến trễ không được áp lại. | FR-03.7 |
| AC-03.10 | Giỏ có món; mất mạng hoặc API lỗi máy chủ | Áp mã rồi thử lại khi phục hồi | Hiện chờ/lỗi/thử lại, giữ giỏ; không báo mã sai vì lỗi mạng hoặc áp giảm chưa xác thực. | FR-03.8 |
| AC-03.11 | Giỏ đang có mã hợp lệ | Bỏ mã; sau đó thử áp vào giỏ rỗng | Bỏ mã cho giảm 0, tổng bằng tạm tính; giỏ rỗng không gửi yêu cầu áp mã. | FR-03.6–7 |
| AC-03.12 | Món hết hàng/ngừng bán, hoặc giỏ lưu vượt tồn mới | Thêm món hoặc mở giỏ lưu | Khóa thêm món không hợp lệ; giỏ cũ báo dòng cần sửa, chặn chuyển đặt đơn. Không trừ kho trong UC-02. | FR-03.1, FR-03.4–5 |
| AC-03.13 | `localStorage` không ghi được hoặc dữ liệu lưu hỏng | Mở/cập nhật giỏ | Không lỗi trắng; bỏ dữ liệu hỏng an toàn, báo không lưu bền vững; giỏ hợp lệ trong phiên vẫn dùng được. | FR-03.5, FR-03.8 |

## 2. Chức năng 2 – UC-02 (Quỳnh)

### 2.1 Use Case Diagram

- **Actor:** Khách hàng (Customer/Guest), không bắt buộc đăng nhập.
- **Ranh giới:** BrewLite – Tùy biến món, Giỏ hàng và Khuyến mãi. API/CSDL là nội bộ, không phải actor bên ngoài.
- **Nguồn:** [uc-02-cart-promotion.puml](../diagrams/uc-02-cart-promotion.puml).
- **Kết xuất:** [uc-02-cart-promotion.svg](../diagrams/uc-02-cart-promotion.svg).

| Mã | Use Case thành phần | Quan hệ |
| :--- | :--- | :--- |
| UC-02.1 | Tùy biến đồ uống (size/topping, đường/đá nếu hỗ trợ) | `<<include>>` Tính giá tạm tính theo tùy chọn. |
| UC-02.2 | Quản lý giỏ (thêm, xem, tăng/giảm số lượng, xóa) | Khách tương tác trực tiếp; xem/xóa không bắt buộc mở lại tùy biến. |
| UC-02.3 | Áp dụng mã khuyến mãi | `<<extend>>` UC-02.2 tại điểm “Áp mã”, khi giỏ không rỗng và khách yêu cầu; `<<include>>` Kiểm tra điều kiện khuyến mãi. |

Mũi tên `include` đi đến hành vi bắt buộc; `extend` đi từ UC-02.3 đến UC-02.2. Không dùng quan hệ này để biểu diễn thứ tự xử lý.

![UC-02 – Tùy biến món, Giỏ hàng và Khuyến mãi](../diagrams/uc-02-cart-promotion.svg)

### 2.2 Đặc tả Use Case

#### 2.2.1 Thông tin chung

| Thuộc tính | Nội dung |
| :--- | :--- |
| Mã và tên | **UC-02 – Tùy biến đồ uống, Quản lý giỏ hàng và Áp dụng khuyến mãi** |
| Truy vết | FR-03.1–10; BR-03.1–8; AC-03.01–13 |
| Actor | Khách hàng (Guest hoặc Registered Customer) |
| Mục tiêu | Chuẩn bị giỏ với cấu hình và tổng tiền dự kiến hợp lệ trước bước đặt đơn. |
| Trigger | Chọn món còn hàng trên Menu hoặc mở biểu tượng Giỏ hàng. |
| Tiền điều kiện chung | Truy cập được ứng dụng và danh mục món/tùy chọn. Mở giỏ không yêu cầu giỏ có món. |
| Tiền điều kiện thêm | Món đang bán (`isAvailable = true` theo phân công), `stock > 0`; tùy chọn còn hỗ trợ. Tên trường trạng thái cần thống nhất với module sản phẩm; không giả định có đồng thời `isActive` và `isAvailable`. |
| Tiền điều kiện áp mã | Giỏ không rỗng; Backend truy cập được giá/tùy chọn và khuyến mãi. |
| Hậu điều kiện thành công | Giỏ đúng cấu hình/số lượng, badge và tiền dự kiến; lưu `localStorage` nếu khả dụng. Mã chỉ có hiệu lực với phiên bản giỏ đã xác thực. |
| Bảo đảm khi thất bại | Không áp thay đổi sai hoặc giảm chưa xác thực; giữ giỏ hợp lệ trong phiên. Không tạo đơn, trừ kho, tiêu thụ lượt mã hoặc thanh toán. |

#### 2.2.2 Luồng chính

1. Khách chọn đồ uống còn hàng; hệ thống mở `ProductCustomizationModal`, hiển thị giá gốc và tùy chọn.
2. Khách chọn size (S +0đ, M +6.000đ, L +10.000đ), topping, số lượng; chọn đường/đá nếu món hỗ trợ.
3. Hệ thống cập nhật giá tức thời theo BR-03.1; khách bấm **Thêm vào giỏ**.
4. Hệ thống kiểm tra tùy chọn, số lượng và tổng theo sản phẩm so với tồn gần nhất; gộp/thêm dòng theo BR-03.2, cập nhật Zustand, `localStorage` và badge.
5. Khách mở `/cart`; hệ thống hiển thị cấu hình, số lượng, thành tiền từng dòng và tạm tính giỏ.
6. Khách nhập mã, ví dụ `BREWLITE20`, bấm **Áp dụng**. Hệ thống hiện đang kiểm tra, gửi `POST /api/v1/promotions/validate` với mã và sản phẩm/cấu hình/số lượng; không dùng giá Client làm căn cứ tin cậy.
7. Backend tính lại giá trị giỏ từ danh mục, kiểm tra mã theo BR-03.5–6 và trả kết quả. Luồng chính giả định mã hợp lệ và giỏ không đổi khi chờ.
8. Hệ thống hiển thị mã, tiền giảm, tổng dự kiến. Khách xem lại; UC-02 kết thúc với giỏ sẵn sàng chuyển bước đặt đơn thuộc FR-05.

#### 2.2.3 Luồng thay thế

| Mã / Điểm rẽ | Xử lý và điểm quay lại |
| :--- | :--- |
| A1 – Trigger mở giỏ | Khôi phục giỏ hợp lệ, đồng bộ giá/tồn và xác thực lại mã nếu có; vào bước 5. Nếu rỗng, hiện giỏ rỗng/nút về Menu, không kiểm tra mã; kết thúc. |
| A2 – Bước 2 | Đóng modal trước khi thêm: bỏ lựa chọn chưa xác nhận, giữ giỏ cũ; kết thúc. |
| A3 – Bước 4 | Trùng toàn bộ cấu hình: cộng số lượng sau kiểm tra tổng tồn; khác cấu hình: dòng mới. Tiếp bước 5. |
| A4 – Bước 5 | Tăng/giảm về số nguyên dương hợp lệ: cập nhật giỏ/badge, lưu, tính lại và vô hiệu kết quả mã cũ; xác thực lại mã nếu có. Quay lại bước 5. |
| A5 – Bước 5 | Giảm từ 1 về 0 hoặc chọn xóa: xác nhận; hủy giữ nguyên, đồng ý xóa rồi xử lý như A4. Xóa dòng cuối hiện giỏ rỗng, bỏ giảm và chặn chuyển đặt đơn. |
| A6 – Bước 6 | Không dùng mã: bỏ bước 6–7, tiền giảm 0; tiếp bước 8. |
| A7 – Bước 8 | Bỏ mã: giảm 0, tổng bằng tạm tính. Đổi mã: chỉ thay khi mã mới hợp lệ; mã mới sai không ghi đè mã cũ còn hợp lệ. Quay lại bước 5. |

#### 2.2.4 Luồng ngoại lệ

| Mã / Điểm lỗi | Xử lý và cách tiếp tục |
| :--- | :--- |
| E1 – Bước 1/4 | Món hết hàng/ngừng bán hoặc tùy chọn không còn hỗ trợ: chặn thêm, báo lý do, yêu cầu chọn lại; giữ giỏ cũ. |
| E2 – Bước 4/5 | Tổng số ly cùng sản phẩm vượt kho: chặn tăng/thêm, báo **“Chỉ còn X sản phẩm trong kho”**, giữ số lượng hợp lệ trước thao tác. Giỏ lưu vượt tồn mới phải sửa/xóa trước khi chuyển đặt đơn. |
| E3 – Bước 7 | Mã sai/chưa bắt đầu/hết hạn/ngừng hoạt động/hết lượt/không đủ tối thiểu: API trả `400 Bad Request` kèm lý do; không áp mã bị từ chối, cho sửa/bỏ mã, giữ giỏ. |
| E4 – Bước 6/7 | Mất mạng/lỗi máy chủ: báo không thể kiểm tra, không kết luận mã sai; giữ mã nhập và giỏ, không giảm chưa xác thực, cho thử lại hoặc tiếp tục không dùng mã. |
| E5 – Bước 4/5 hoặc A1 | Không ghi được `localStorage`: giữ giỏ trong phiên, báo không lưu bền vững. Dữ liệu khôi phục hỏng: bỏ an toàn, không làm ứng dụng lỗi trắng. |
| E6 – Bước 7 | Giỏ đổi trong lúc chờ: bỏ phản hồi phiên bản cũ; tính lại và kiểm tra mã với giỏ mới. Chỉ sang bước 8 khi kết quả khớp giỏ hiện tại hoặc không dùng mã. |

#### 2.2.5 Ranh giới tích hợp

| Thành phần | Trách nhiệm | Ranh giới |
| :--- | :--- | :--- |
| Menu/Sản phẩm (FR-01, FR-02) | Cung cấp món, giá, tùy chọn, tồn kho. | UC-02 không quản trị danh mục. |
| UI + Zustand | Tùy biến, gộp dòng, kiểm tra số lượng gần nhất, lưu giỏ, tổng dự kiến. | Không quyết định giá thanh toán hoặc giữ hàng. |
| Promotions API | Xác thực mã, tính giảm từ dữ liệu tin cậy trên Backend. | Không tạo đơn hoặc tiêu thụ lượt dùng khi chỉ kiểm tra mã. |
| Đặt đơn (FR-05) | Nhận giỏ, kiểm tra lại giá/mã/tồn và khóa kho. | Tạo đơn và giao dịch tồn kho nằm ngoài UC-02. |

**Bàn giao Task 1.2–1.3:** FR-03 + MoSCoW + AC, đặc tả UC-02 trong tài liệu này; PlantUML và SVG tại `docs/diagrams/uc-02-cart-promotion.*`. Activity, Sequence, Class, ADR-002, UI/API và CI thuộc giai đoạn sau, chưa được ghi nhận là đã hiện thực.
