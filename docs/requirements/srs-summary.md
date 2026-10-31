# BrewLite – Tóm tắt yêu cầu phần mềm (SRS)

- **Giai đoạn:** Task 1.2 – Yêu cầu chức năng; Task 1.3 – Use Case.
- **Thành viên đóng góp:**
  - **Quỳnh:** Chức năng 2 – Tùy biến món, Giỏ hàng và Khuyến mãi (`FR-03`, `UC-02`).
  - **Hiếu:** Chức năng 3 – Đăng ký, Đăng nhập & Xác thực Phân quyền JWT (`FR-04`, `UC-03`).
  - **Chiến:** Chức năng 4 – Khởi tạo Đơn hàng, Tính tiền tại Business Layer & Khóa tồn kho nguyên liệu an toàn (`FR-05`, `UC-04`).
- **Nguồn:** `docs/phancong.docx`, Mục 2.1–2.2 & Mục 4.1–4.2; [Bối cảnh và phạm vi](context-and-scope.md), MVP-02 & MVP-04.
- **Phạm vi tài liệu:** Tổng hợp yêu cầu chức năng, MoSCoW, Quy tắc nghiệp vụ, Tiêu chí nghiệm thu (AC) và sơ đồ Use Case của các phân hệ chức năng trong hệ thống BrewLite.

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

**Bàn giao Task 1.2–1.3 (Quỳnh):** FR-03 + MoSCoW + AC, đặc tả UC-02 trong tài liệu này; PlantUML và SVG tại `docs/diagrams/uc-02-cart-promotion.*`. Activity, Sequence, Class, ADR-002, UI/API và CI thuộc giai đoạn sau, chưa được ghi nhận là đã hiện thực.

---

## 3. Yêu cầu chức năng FR-05 (Chiến)

### 3.1 Mô tả

**FR-05 – Khởi tạo đơn hàng, Tính tiền tại Business Layer & Khóa tồn kho nguyên liệu an toàn (Database Transaction):** Khách hàng đã đăng nhập tài khoản (`Authenticated Customer`) sở hữu JWT Token hợp lệ thực hiện chuyển đổi giỏ hàng thành đơn hàng chính thức thông qua endpoint `POST /api/v1/orders`. Hệ thống BrewLite **chỉ hỗ trợ đặt hàng cho khách hàng đã đăng nhập**, tuyệt đối không hỗ trợ khách vãng lai.

Hệ thống tiếp nhận payload `CreateOrderDto`, thực hiện kiểm tra token qua `JwtAuthGuard`, xác thực dữ liệu đầu vào qua `ValidationPipe` và **tính toán lại 100% tổng tiền đơn hàng tại tầng Business Logic Layer (NestJS OrdersService)** dựa trên đơn giá gốc và phụ thu từ CSDL PostgreSQL (tuyệt đối không tin tưởng hoặc sử dụng các trường giá tiền, tạm tính do Client gửi lên, tuân thủ nghiêm ngặt nguyên lý kiến trúc phân tầng của Thầy Phiêu).

Nhằm khắc phục triệt để *"sai lầm kinh điển"* trong quản lý vận hành F&B (quán đồ uống không bao giờ lưu trữ sẵn ly cà phê thành phẩm trong kho mà quản lý theo nguyên vật liệu pha chế thô), hệ thống quản lý tồn kho theo bảng `Ingredient` (hạt cà phê, sữa đặc, đường, ly nhựa...). Mỗi món đồ uống (`Product`) được định nghĩa cấu thành qua công thức định mức `RecipeItem` (ví dụ: 1 ly Cà phê Đen = 10g hạt cà phê + 1 cái ly nhựa; 1 ly Cà phê Sữa = 10g hạt cà phê + 20ml sữa đặc + 1 cái ly nhựa).

Khi đặt hàng, hệ thống tổng hợp nhu cầu nguyên vật liệu cần tiêu hao từ `RecipeItem` của tất cả các món trong giỏ hàng. Toàn bộ quá trình kiểm tra đủ nguyên liệu, trừ tồn kho nguyên liệu bằng kỹ thuật **Optimistic Locking (dựa trên cột `version` của bảng `Ingredient`)** và tạo đơn hàng được thực thi bên trong một **Database Transaction (`prisma.$transaction`)** duy nhất. Cơ chế này ngăn chặn triệt để hiện tượng bán âm kho (`stockQuantity < 0`) hoặc xung đột đồng thời (Concurrency) khi nhiều khách hàng cùng bấm mua ly cuối cùng trong 1 tích tắc, hoặc khách đặt số lượng vượt quá khả năng pha chế từ nguyên liệu hiện có (ví dụ: kho còn 100g cà phê chỉ pha được tối đa 10 ly, khách đặt 11 ly).

Đơn hàng được khởi tạo với mã chuẩn `#BL-YYYYMMDD-XXXX` ở trạng thái ban đầu là `PENDING` (thời hạn thanh toán 15 phút) cùng các bản ghi chi tiết `OrderItem` và `OrderItemTopping` trước khi chuyển sang bước thanh toán (`FR-06` / `UC-05`).

### 3.2 Yêu cầu và MoSCoW

| Mã | Yêu cầu có thể kiểm tra | MoSCoW |
| :--- | :--- | :--- |
| FR-05.1 | Khởi tạo đơn hàng qua endpoint `POST /api/v1/orders`, bắt buộc Header `Authorization: Bearer <JWT>` hợp lệ. Tiếp nhận payload `CreateOrderDto` gồm danh sách món (`items`: `productId`, `size`, `toppings`, `quantity`) và mã khuyến mãi (`promoCode`, tùy chọn). Hệ thống chỉ cho phép Khách hàng đã đăng nhập (`Authenticated Customer`) tạo đơn; không hỗ trợ khách vãng lai. | Must |
| FR-05.2 | Xác thực DTO nghiêm ngặt bằng `ValidationPipe`: danh sách `items` không được rỗng (`items.length >= 1`), `productId` phải là UUID hợp lệ, số lượng `quantity` phải là số nguyên dương $\ge 1$. | Must |
| FR-05.3 | Tính toán lại 100% tổng tiền tại Business Layer: truy vấn trực tiếp giá gốc (`basePrice`), phụ thu kích cỡ (`sizePrice`), đơn giá các loại topping từ CSDL; tuyệt đối bỏ qua mọi giá tiền gửi từ Client (Server-Authoritative Pricing). | Must |
| FR-05.4 | Thực thi toàn bộ quy trình đối soát định mức công thức, kiểm tra tồn kho nguyên liệu, trừ tồn kho nguyên liệu, tính giá và ghi nhận đơn hàng bên trong một Database Transaction duy nhất (`prisma.$transaction`). Nếu xảy ra bất kỳ lỗi nào, tự động ROLLBACK toàn bộ 100%. | Must |
| FR-05.5 | Áp dụng kỹ thuật Optimistic Locking trên bảng nguyên liệu thô `Ingredient` (dựa trên cột `version` và định mức `RecipeItem`). Kiểm tra đồng thời điều kiện $\text{stockQuantity} \ge \text{requiredQty}$ và $\text{version} = \text{currentVersion}$. Nếu có xung đột phiên bản hoặc thiếu nguyên liệu, kích hoạt Rollback ngay lập tức và trả về HTTP `409 Conflict`. | Must |
| FR-05.6 | Xử lý mã giảm giá (`promoCode`) trong transaction: kiểm tra mã tồn tại, đang kích hoạt, trong thời hạn hiệu lực, còn lượt dùng và tổng tiền trước giảm đạt giá trị đơn tối thiểu (`minOrderValue`). Áp dụng giảm giá và tăng số lượt dùng `usedCount` lên 1 trong cùng transaction. | Must |
| FR-05.7 | Khởi tạo bản ghi `Order` với trạng thái ban đầu `PENDING`, sinh mã đơn chuẩn nghiệp vụ `#BL-YYYYMMDD-XXXX`, hạn thanh toán `paymentDeadline` 15 phút kể từ thời điểm tạo. | Must |
| FR-05.8 | Lưu chi tiết từng dòng món ăn vào bảng `OrderItem` (kèm `unitPrice`, `quantity`, `subtotal`, `size`) và danh sách topping vào `OrderItemTopping` để bảo toàn dữ liệu lịch sử tại thời điểm đặt đơn (Data Snapshotting). | Must |
| FR-05.9 | Trả về HTTP `201 Created` kèm `orderId`, `orderCode`, `finalAmount`, `status` (`PENDING`) và `paymentDeadline` để Client điều hướng ngay sang bước thanh toán và xóa sạch giỏ hàng (`clearCart`). | Must |
| FR-05.10 | Hỗ trợ lưu trường ghi chú đơn hàng (`note`, tối đa 255 ký tự) cho yêu cầu pha chế hoặc chỉ dẫn giao hàng. | Should |
| FR-05.11 | Bắt buộc xác thực tài khoản qua `JwtAuthGuard`: trích xuất `userId` từ JWT token để liên kết đơn hàng với tài khoản khách hàng, phục vụ tra cứu lịch sử đơn và tích điểm Loyalty; chặn mọi request không có token hợp lệ với HTTP `401 Unauthorized`. | Must |
| FR-05.12 | Không lưu thông tin thẻ ngân hàng, không gọi cổng thanh toán thật, không quản trị nhập kho phức tạp trong phạm vi MVP của FR-05 (thanh toán được xử lý độc lập tại FR-06). | Won't (MVP) |

### 3.3 Quy tắc nghiệp vụ (Business Rules)

| Mã | Quy tắc nghiệp vụ |
| :--- | :--- |
| BR-05.1 | **Server-Authoritative Pricing (Tính giá tuyệt đối từ Máy chủ):** Tổng tiền đơn hàng là giá trị có thẩm quyền duy nhất do Business Logic Layer tính toán từ CSDL. Tuyệt đối không sử dụng giá gửi từ Client. Công thức đơn giá dòng: $\text{unitPrice} = \text{basePrice} + \text{sizePrice} + \sum \text{toppingPrices}$; Thành tiền dòng: $\text{itemTotal} = \text{unitPrice} \times \text{quantity}$; Tổng đơn trước giảm: $\text{rawTotal} = \sum \text{itemTotal}$. |
| BR-05.2 | **Atomic Transaction (Tính nguyên tử của Giao dịch):** Toàn bộ thao tác đọc giá, xác thực khuyến mãi, đối soát định mức nguyên liệu theo `RecipeItem`, trừ tồn kho `Ingredient` có kiểm tra phiên bản, tạo `Order` và tạo `OrderItem` phải nằm trong một giao dịch cơ sở dữ liệu duy nhất (`prisma.$transaction`). Không chấp nhận tình trạng ghi nhận đơn mà chưa trừ kho nguyên liệu hoặc trừ kho mà không tạo được đơn. |
| BR-05.3 | **Optimistic Concurrency Control trên Nguyên liệu thô (Chống bán âm kho bằng Optimistic Lock):** Quán cà phê quản lý tồn kho theo nguyên liệu thô (`Ingredient`), mỗi món đồ uống được cấu thành từ các nguyên liệu theo tỷ lệ định mức `RecipeItem` (ví dụ: 1 ly Cà phê Đen = 10g hạt cà phê + 1 cái ly nhựa). Khi khách đặt hàng, hệ thống tổng hợp nhu cầu nguyên liệu cần thiết: $\text{requiredQty} = \sum (\text{itemQuantity} \times \text{recipeQuantity})$. Hệ thống thực thi câu lệnh SQL cập nhật nguyên tử có kiểm tra phiên bản:<br>```sql UPDATE "Ingredient" SET "stockQuantity" = "stockQuantity" - :requiredQty, "version" = "version" + 1 WHERE "id" = :id AND "version" = :currentVersion AND "stockQuantity" >= :requiredQty;```<br>Nếu câu lệnh trả về `affectedRows == 0` (do `version` đã thay đổi bởi giao dịch khác hoặc $\text{stockQuantity} < \text{requiredQty}$), hệ thống ném lỗi xung đột, tự động Rollback 100% transaction và trả về HTTP `409 Conflict`. |
| BR-05.4 | **Promotion Validation in Transaction (Xác thực Khuyến mãi trong Giao dịch):** Mã khuyến mãi (`promoCode`) chỉ được áp dụng nếu: `isActive = true`, `startDate <= now() <= endDate`, `usedCount < maxUsage`, và $\text{rawTotal} \ge \text{minOrderValue}$. Số tiền giảm `discountAmount` không vượt quá mức giảm tối đa (`maxDiscount`) và không vượt quá `rawTotal`. Tổng thanh toán cuối cùng: $\text{finalAmount} = \max(0, \text{rawTotal} - \text{discountAmount})$. Cập nhật `usedCount = usedCount + 1` ngay trong transaction. |
| BR-05.5 | **Order State & Code Convention (Quy ước Mã đơn và Trạng thái):** Mã đơn sinh theo mẫu `#BL-YYYYMMDD-XXXX` (trong đó YYYYMMDD là ngày hiện tại, XXXX là chuỗi 4 chữ số ngẫu nhiên hoặc tăng dần). Đơn mới tạo luôn có trạng thái ban đầu là `PENDING`. |
| BR-05.6 | **Payment Timeout & Restock Rollback (Hạn thanh toán và Thu hồi tồn kho nguyên liệu):** Đơn hàng `PENDING` được gán thời hạn thanh toán `paymentDeadline` là 15 phút. Nếu quá 15 phút chưa thanh toán thành công hoặc thanh toán thất bại tại `FR-06`, đơn hàng chuyển sang `CANCELLED` và hệ thống tự động hoàn trả số lượng tồn kho nguyên liệu (`Restock Rollback` cho từng `Ingredient` theo công thức `RecipeItem`). |
| BR-05.7 | **Data Snapshotting (Đóng băng dữ liệu lịch sử):** Bảng `OrderItem` phải lưu bản sao đơn giá `unitPrice` và thành tiền `subtotal` tại thời điểm đặt đơn. Mọi biến động giá của sản phẩm trong tương lai không được phép làm thay đổi giá trị của đơn hàng đã khởi tạo. |
| BR-05.8 | **Authenticated Actor & Idempotent Submission (Bắt buộc Khách đăng nhập & Chống gửi kép):** Hệ thống chỉ phục vụ Khách hàng đã đăng nhập (`Authenticated Customer`) với JWT hợp lệ. Giao diện Client bắt buộc vô hiệu hóa nút bấm "Đặt hàng" ngay khi yêu cầu đầu tiên được gửi đi, hiển thị trạng thái xử lý (`isSubmitting`) để ngăn chặn việc người dùng bấm nhiều lần sinh ra các đơn hàng trùng lặp. |

### 3.4 Tiêu chí nghiệm thu (Acceptance Criteria)

**Dữ liệu kiểm thử cố định (Test Fixtures):**
- **Nguyên vật liệu thô (`Ingredient`):**
  - Hạt Cà phê Robusta (ID: `I01`, `stockQuantity = 100` gam, `version = 1`).
  - Ly nhựa mang đi (ID: `I02`, `stockQuantity = 50` cái, `version = 1`).
  - Sữa đặc pha chế (ID: `I03`, `stockQuantity = 200` ml, `version = 1`).
- **Định mức công thức (`RecipeItem`):**
  - Món Cà phê Đen Đá (ID: `P01`, `basePrice = 25.000đ`): Định mức gồm 10g Hạt Cà phê (`I01`) + 1 Ly nhựa (`I02`). *(Với 100g Cà phê hiện có trong kho, tối đa chỉ pha chế được 10 ly Cà phê Đen)*.
  - Phụ thu kích cỡ: Size M (`sizePrice = 6.000đ`).
  - Topping Thạch Cà phê (ID: `T01`, `price = 5.000đ`).
- **Mã khuyến mãi:** `BREW10` giảm 10% tối đa 20.000đ cho đơn từ 50.000đ, còn 5 lượt dùng (`usedCount = 0`, `maxUsage = 5`).

| Mã | Given (Tiền đề) | When (Hành động) | Then (Kết quả kỳ vọng) | Truy vết |
| :--- | :--- | :--- | :--- | :--- |
| AC-05.01 | Khách chọn 1 Cà phê Đen Đá size M, 1 Topping T01 (Client hiển thị nhầm hoặc cố tình gửi payload giá 1.000đ). | Gửi `POST /api/v1/orders` kèm JWT hợp lệ. | Backend tính lại đơn giá = 25k + 6k + 5k = 36.000đ; tổng đơn = 36.000đ; bỏ qua hoàn toàn giá Client; tạo đơn `PENDING` thành công. | FR-05.1, FR-05.3, BR-05.1 |
| AC-05.02 | Món P01 cần 10g cà phê `I01` và 1 ly nhựa `I02`. Kho có 100g `I01` (`version = 1`), 50 cái `I02` (`version = 1`). | Khách đặt mua số lượng 10 ly Cà phê Đen. | Transaction thành công: `I01.stockQuantity` giảm còn `0g`, `version` tăng lên `2`; `I02.stockQuantity` giảm còn `40 cái`, `version` tăng lên `2`; đơn hàng mã `#BL-XXXX` được lưu trạng thái `PENDING`. | FR-05.4, FR-05.5, BR-05.3 |
| AC-05.03 | Kho chỉ còn 10g cà phê `I01` (`version = 1`, vừa đủ đúng 1 ly). Hai khách hàng A và B cùng bấm đặt mua 1 ly Cà phê Đen tại cùng thời điểm. | Cả 2 request gửi đồng thời đến `POST /api/v1/orders`. | Khách A nhanh hơn được commit: `I01.stockQuantity` về `0`, `version = 2`. Khách B gặp xung đột `version = 1` không khớp hoặc `stockQuantity < 10g` $\rightarrow$ Câu lệnh Optimistic Lock trả về `affectedRows == 0` $\rightarrow$ Rollback transaction của B, trả về HTTP `409 Conflict` ("Sản phẩm/Nguyên liệu pha chế vừa hết hàng hoặc thay đổi tồn kho, vui lòng kiểm tra lại giỏ hàng"). Không xảy ra âm kho. | FR-05.5, BR-05.3 |
| AC-05.04 | Kho có 100g cà phê `I01` (tối đa pha được 10 ly). Khách đặt mua 11 ly Cà phê Đen (cần 110g cà phê). | Gửi `POST /api/v1/orders`. | Hệ thống đối soát định mức `RecipeItem`, phát hiện thiếu 10g cà phê $\rightarrow$ Rollback transaction, trả về HTTP `409 Conflict` kèm mã lỗi `INSUFFICIENT_INGREDIENT`: "Nguyên liệu pha chế không đủ để đáp ứng số lượng yêu cầu". Tồn kho các nguyên liệu giữ nguyên. | FR-05.4, FR-05.5, BR-05.3 |
| AC-05.05 | Giỏ hàng đạt tạm tính 72.000đ (2 ly 36k); mã `BREW10` hợp lệ, giảm 10%, còn 5 lượt dùng (`usedCount = 0`). | Gửi `POST /api/v1/orders` kèm `promoCode: "BREW10"`. | Giảm giá = 7.200đ; Tổng thanh toán = 64.800đ; `usedCount` của mã tăng lên 1 trong transaction; đơn hàng lưu đúng tổng tiền 64.800đ. | FR-05.6, BR-05.4 |
| AC-05.06 | Mã `BREW10` yêu cầu đơn tối thiểu 50.000đ; giỏ hàng chỉ có 1 ly giá 36.000đ. | Gửi `POST /api/v1/orders` kèm `promoCode: "BREW10"`. | Transaction Rollback, trả về HTTP `400 Bad Request` báo mã không đạt giá trị đơn tối thiểu; không tạo đơn, không trừ kho nguyên liệu. | FR-05.6, BR-05.4 |
| AC-05.07 | Mã khuyến mãi đã hết hạn (`endDate < now()`) hoặc đã đạt trần số lượt (`usedCount == maxUsage`). | Gửi `POST /api/v1/orders` kèm mã này. | Transaction Rollback, trả về HTTP `400 Bad Request` báo mã đã hết hạn hoặc hết lượt; không tạo đơn, tồn kho nguyên liệu giữ nguyên. | FR-05.6, BR-05.4 |
| AC-05.08 | Payload gửi lên có `items: []` (giỏ hàng rỗng) hoặc số lượng `quantity = 0` hoặc số âm. | Gửi `POST /api/v1/orders`. | ValidationPipe chặn ngay tại Presentation Layer, trả về HTTP `400 Bad Request`; không gọi đến tầng Service, không mở Transaction. | FR-05.2 |
| AC-05.09 | Món Cà phê Đen có `isAvailable = false` (quán tạm ngừng phục vụ món này). | Gửi `POST /api/v1/orders`. | Transaction Rollback, trả về HTTP `409 Conflict`: "Món Cà phê Đen hiện đang ngừng bán". Không tạo đơn, không trừ kho. | FR-05.4, BR-05.2 |
| AC-05.10 | Đơn hàng tạo thành công. | Kiểm tra bản ghi trong bảng `Order` và `OrderItem`. | Bảng `Order` có `status = PENDING`, `orderCode` định dạng `#BL-YYYYMMDD-XXXX`, `paymentDeadline` là 15 phút sau; bảng `OrderItem` lưu đúng đơn giá 36.000đ. | FR-05.7, FR-05.8, BR-05.5 |
| AC-05.11 | Khách hàng chưa đăng nhập hoặc không gửi Header `Authorization` hoặc token JWT hết hạn/không hợp lệ. | Gửi `POST /api/v1/orders`. | `JwtAuthGuard` chặn ngay tại Controller, trả về HTTP `401 Unauthorized` ("Yêu cầu đăng nhập để tiến hành đặt hàng"); không tạo đơn, không mở Transaction. | FR-05.1, FR-05.11 |
| AC-05.12 | Sự cố máy chủ ngắt kết nối PostgreSQL đột ngột giữa chừng khi đang insert `OrderItem`. | Giao dịch gặp ngoại lệ CSDL. | Prisma tự động ROLLBACK toàn bộ; không có đơn hàng nào được tạo, tồn kho nguyên liệu `Ingredient` không bị suy giảm; trả về HTTP `500 Internal Server Error`. | FR-05.4, BR-05.2 |

---

**Bàn giao Task 1.2 (Chiến):** Hoàn thành yêu cầu chức năng `FR-05` (Khởi tạo đơn hàng, Tính tiền tại Business Layer & Khóa tồn kho nguyên liệu an toàn) kèm phân loại MoSCoW, 8 Quy tắc nghiệp vụ (BR-05.1–BR-05.8) và 12 Tiêu chí nghiệm thu (AC-05.01–AC-05.12).


---

## 4. Chức năng 3 – Yêu cầu chức năng FR-04 & Đặc tả UC-03 (Hiếu – PO)

### 4.1 Mô tả nghiệp vụ

**FR-04 – Đăng ký, Đăng nhập, Quản lý Hồ sơ, Xác thực Phân quyền JWT & Giám sát Health Check:** 
Cung cấp toàn diện cơ chế định danh, quản lý tài khoản thành viên, băm mật khẩu một chiều an toàn bằng Bcrypt, cấp phát và xác minh chuỗi JSON Web Token (JWT) có chữ ký số cho mọi thao tác nhạy cảm (đặt đơn hàng, thanh toán, xem lịch sử đơn, tích lũy điểm thưởng). Hệ thống hỗ trợ chuyển hướng thông minh bảo toàn giỏ hàng khi người dùng chưa đăng nhập bấm nút thanh toán (edirect=/checkout), đồng thời cung cấp endpoint giám sát sức khỏe đa tầng GET /api/v1/health phục vụ tự động hóa kiểm tra kết nối CSDL và hạ tầng triển khai.

### 4.2 Bảng phân loại Yêu cầu và MoSCoW

| Mã | Yêu cầu kiểm thử được | Mức ưu tiên (MoSCoW) |
| :--- | :--- | :---: |
| **FR-04.1** | Cho phép khách hàng đăng ký tài khoản mới với họ tên, email, mật khẩu và số điện thoại; bắt buộc kiểm tra tính duy nhất của email trong CSDL. | **Must** |
| **FR-04.2** | Mật khẩu lưu trữ bắt buộc phải băm bằng thuật toán Bcrypt với hệ số làm chậm \saltRounds >= 10\; tuyệt đối không lưu plain-text. | **Must** |
| **FR-04.3** | Xác thực đăng nhập qua email và mật khẩu bằng phép đối chiếu thời gian không đổi (\crypt.compare\); cấp phát JWT accessToken có thời hạn sống 24h. | **Must** |
| **FR-04.4** | Token JWT chứa payload chuẩn gồm: mã người dùng (\sub\), \email\, và vai trò phân quyền (\ole: CUSTOMER / STAFF / ADMIN\). | **Must** |
| **FR-04.5** | Lớp bảo vệ \JwtAuthGuard\ tự động kiểm tra chữ ký số và thời hạn của token trong Header \Authorization: Bearer <token>\ cho các API tạo đơn, thanh toán, lịch sử đơn và loyalty. | **Must** |
| **FR-04.6** | Cung cấp endpoint \GET /api/v1/auth/me\ trả về thông tin hồ sơ cá nhân và số dư điểm thưởng tích lũy hiện có của người dùng đăng nhập. | **Must** |
| **FR-04.7** | Cung cấp endpoint \GET /api/v1/health\ thực hiện kiểm tra kết nối thực tế tới PostgreSQL (\SELECT 1\); trả về 200 OK khi DB sẵn sàng và 503 khi mất kết nối. | **Must** |
| **FR-04.8** | Khi khách vãng lai bấm "Tiến hành Đặt hàng", hệ thống tự động chuyển hướng sang \/login?redirect=/checkout\ và quay lại trang checkout sau khi đăng nhập thành công mà không mất giỏ hàng. | **Should** |
| **FR-04.9** | Giao diện tự động xóa token và chuyển hướng về màn hình đăng nhập khi nhận được phản hồi HTTP 401 Unauthorized từ Backend. | **Should** |
| **FR-04.10**| Đăng nhập bằng tài khoản mạng xã hội (Google / Facebook OAuth) hoặc xác thực 2 bước (2FA). | **Won't (MVP)** |

### 4.3 Quy tắc nghiệp vụ (Business Rules)

| Mã | Quy tắc nghiệp vụ |
| :--- | :--- |
| **BR-04.1** | **Bảo mật Mật khẩu (Password Security):** Mật khẩu phải có độ dài tối thiểu 6 ký tự. Trước khi ghi xuống CSDL PostgreSQL, chuỗi mật khẩu bắt buộc phải đi qua hàm băm \crypt.hash(password, 10)\. |
| **BR-04.2** | **Tính Duy nhất của Danh tính (Unique Identity):** Mỗi địa chỉ email chỉ được liên kết với một tài khoản duy nhất (không phân biệt chữ hoa/thường). Đăng ký trùng email lập tức bị từ chối với mã lỗi HTTP \409 Conflict\. |
| **BR-04.3** | **Phiên làm việc Không trạng thái (Stateless JWT Session):** Máy chủ API không lưu trữ session trong bộ nhớ RAM mà xác thực tính hợp lệ của client hoàn toàn dựa trên chữ ký số của chuỗi JWT ký bằng bí mật \JWT_SECRET\. |
| **BR-04.4** | **Phân quyền và Ngăn chặn Trái phép (Access Control):** Mọi request tới API yêu cầu quyền thành viên (\POST /orders\, \POST /payments\, \GET /orders/my-orders\) nếu thiếu token, token sai chữ ký hoặc hết hạn đều bị \JwtAuthGuard\ chặn lại với mã lỗi HTTP \401 Unauthorized\. |
| **BR-04.5** | **Khởi tạo Điểm thưởng (Loyalty Initialization):** Tài khoản mới tạo mặc định có số dư điểm tích lũy \loyaltyPoints = 0\ và vai trò \ole = 'CUSTOMER'\. |
| **BR-04.6** | **Kiểm tra Sức khỏe CSDL Thực tế (Active DB Probing):** Endpoint \/health\ bắt buộc phải thực thi một câu lệnh truy vấn nhẹ xuống PostgreSQL để đo lường độ trễ mạng và xác nhận kết nối CSDL, không trả về trạng thái tĩnh giả lập. |
| **BR-04.7** | **Bảo toàn Ngữ cảnh Giỏ hàng (Cart Context Preservation):** Quá trình đăng nhập/đăng ký trong luồng mua hàng không được phép kích hoạt hành vi xóa dữ liệu trong Zustand Store hoặc \localStorage\. |

### 4.4 Tiêu chí nghiệm thu (Acceptance Criteria)

| Mã | Given (Tiền đề) | When (Hành động) | Then (Kết quả kỳ vọng) | Truy vết |
| :--- | :--- | :--- | :--- | :--- |
| **AC-04.01** | Khách nhập email \hieu.customer@brewlite.com\, mật khẩu \pass1234\, họ tên \Tran Trung Hieu\. | Gửi \POST /api/v1/auth/register\. | Tài khoản được tạo thành công trong bảng \User\; \passwordHash\ bắt đầu bằng \\\\$\; trả về HTTP \201 Created\ kèm accessToken. | FR-04.1, FR-04.2, BR-04.1 |
| **AC-04.02** | Email \hieu.customer@brewlite.com\ đã có trong CSDL. | Người dùng khác cố đăng ký với email này. | Backend ném \ConflictException\, trả về HTTP \409 Conflict\: "Email đã được sử dụng trong hệ thống"; không tạo thêm bản ghi. | FR-04.1, BR-04.2 |
| **AC-04.03** | Tài khoản tồn tại với mật khẩu đúng \pass1234\. | Gửi \POST /api/v1/auth/login\ với đúng thông tin. | \crypt.compare\ trả về true; JwtService ký token; trả về HTTP \200 OK\ kèm \ccessToken\ chứa payload \{sub, email, role}\. | FR-04.3, FR-04.4, BR-04.3 |
| **AC-04.04** | Tài khoản tồn tại nhưng người dùng nhập sai mật khẩu hoặc nhập email không tồn tại. | Gửi \POST /api/v1/auth/login\. | Backend từ chối ngay lập tức, trả về HTTP \401 Unauthorized\: "Email hoặc mật khẩu không chính xác"; không tiết lộ chi tiết lỗi cụ thể. | FR-04.3, BR-04.4 |
| **AC-04.05** | Form đăng ký/đăng nhập gửi body rỗng hoặc email sai định dạng (ví dụ \bc@\) hoặc password < 6 ký tự. | Gửi request lên API. | ValidationPipe chặn ngay tại Presentation Layer, trả về HTTP \400 Bad Request\ kèm danh sách lỗi chi tiết; không gọi vào AuthService. | FR-04.1, BR-04.1 |
| **AC-04.06** | Khách hàng có token JWT hợp lệ gọi \GET /api/v1/auth/me\ kèm Header \Authorization: Bearer <token>\. | Gửi request. | \JwtAuthGuard\ xác thực thành công; trả về HTTP \200 OK\ kèm hồ sơ \{id, email, fullName, role, loyaltyPoints}\. | FR-04.4, FR-04.6, BR-04.4 |
| **AC-04.07** | Request gọi \POST /api/v1/orders\ nhưng không có header Authorization hoặc token bị sửa đổi payload. | Gửi request. | \JwtAuthGuard\ chặn request, ném \UnauthorizedException\ trả về HTTP \401 Unauthorized\; đơn hàng không được khởi tạo. | FR-04.5, BR-04.4 |
| **AC-04.08** | Khách có 2 món trong giỏ hàng, bấm nút "Thanh toán" khi chưa đăng nhập. | UI kích hoạt chuyển hướng. | Trình duyệt chuyển sang \/login?redirect=/checkout\; sau khi đăng nhập thành công, tự động đưa về \/checkout\ với 2 món nguyên vẹn. | FR-04.8, BR-04.7 |
| **AC-04.09** | CSDL PostgreSQL đang chạy bình thường. | Gửi \GET /api/v1/health\. | Backend thực thi \SELECT 1\, trả về HTTP \200 OK\ kèm payload \{ status: "ok", checks: { database: { status: "connected" } } }\. | FR-04.7, BR-04.6 |
| **AC-04.10** | Dịch vụ CSDL PostgreSQL bị ngắt kết nối đột ngột hoặc treo mạng. | Gửi \GET /api/v1/health\. | Truy vấn lỗi, trả về HTTP \503 Service Unavailable\ kèm \{ status: "degraded", checks: { database: { status: "disconnected" } } }\. | FR-04.7, BR-04.6 |

---

### 4.5 Đặc tả chi tiết Use Case UC-03

#### 4.5.1 Thông tin định danh Use Case
- **Mã Use Case:** \UC-03\
- **Tên Use Case:** Đăng ký, Đăng nhập và Xác thực người dùng bằng JWT
- **Actor:** Khách hàng (Guest / Authenticated Customer)
- **Tiền điều kiện:** Backend API và PostgreSQL hoạt động bình thường (\GET /api/v1/health\ trả về 200 OK).
- **Hậu điều kiện:** Khách hàng được cấp phát chuỗi \ccessToken\ (JWT) lưu tại Client, có quyền thực hiện các thao tác tạo đơn và thanh toán.

#### 4.5.2 Luồng sự kiện chính (Main Flow – Đăng nhập hệ thống)
1. Khách hàng truy cập trang Đăng nhập (\/login\), nhập Email và Mật khẩu, bấm nút "Đăng nhập".
2. Next.js UI kiểm tra định dạng email và độ dài mật khẩu tại Client.
3. Sau khi hợp lệ, giao diện gửi \POST /api/v1/auth/login\ kèm \LoginDto\.
4. AuthController tiếp nhận request và chuyển cho AuthService.
5. AuthService gọi Prisma truy vấn thông tin User trong bảng \User\ theo email.
6. AuthService thực hiện đối chiếu mật khẩu qua \crypt.compare(password, user.passwordHash)\.
7. Khi mật khẩu hợp lệ, JwtService ký và phát hành chuỗi \ccessToken\ chứa payload \{sub: user.id, email, role}\.
8. AuthController trả về HTTP 200 OK kèm \{accessToken, user}\.
9. Next.js Client lưu token vào \localStorage\ và cấu hình Axios/Fetch Interceptor tự động gán header \Authorization: Bearer <token>\.
10. Hệ thống điều hướng khách hàng về trang Đích (mặc định là \/menu\ hoặc trang được chỉ định bởi \edirect\).

#### 4.5.3 Luồng thay thế (Alternative Flows)
- **AF-01: Đăng ký tài khoản mới:** Khách hàng điền họ tên, email, mật khẩu; Backend kiểm tra tính duy nhất, băm mật khẩu bằng Bcrypt (\saltRounds = 10\), lưu user mới với \loyaltyPoints = 0\ và cấp phát token tự động đăng nhập.
- **AF-02: Đăng nhập trong luồng Thanh toán (\edirect=/checkout\):** Khách bấm thanh toán khi chưa login -> hệ thống chuyển hướng sang \/login?redirect=/checkout\ -> sau khi login thành công tự động quay lại \/checkout\ mà không mất sản phẩm trong giỏ hàng.

#### 4.5.4 Luồng ngoại lệ (Exception Flows)
- **EF-01: Trùng Email khi Đăng ký:** Backend trả về HTTP \409 Conflict\. UI hiển thị cảnh báo email đã được đăng ký.
- **EF-02: Sai Email hoặc Mật khẩu:** Backend trả về HTTP \401 Unauthorized\. UI thông báo thông tin đăng nhập không chính xác.
- **EF-03: Token hết hạn hoặc không hợp lệ:** JwtAuthGuard tại Backend chặn request, trả về HTTP \401 Unauthorized\. Client tự động xóa token và chuyển hướng về trang \/login\.

---

**Bàn giao Task 1.2 & 1.3 (Hiếu – PO):** Hoàn thành yêu cầu chức năng \FR-04\ (Đăng ký, Đăng nhập, JWT, Profile & Health Check) kèm phân loại MoSCoW, 7 Quy tắc nghiệp vụ (BR-04.1–BR-04.7), 10 Tiêu chí nghiệm thu (AC-04.01–AC-04.10) và Đặc tả Use Case chi tiết \UC-03\.
