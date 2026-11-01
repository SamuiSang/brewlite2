# ĐẶC TẢ YÊU CẦU CHỨC NĂNG & USE CASE – CHỨC NĂNG 1 (BREWLITE 2)

- **Dự án:** BrewLite 2 – Hệ thống Đặt đồ uống Trực tuyến (Mobile-first / PWA)
- **Tài liệu:** `docs/requirements/usecase-menu-spec.md`
- **Giai đoạn:** Task 1.2 & Task 1.3 – Khai thác và Đặc tả Yêu cầu
- **Thành viên phụ trách:** **Phương Duy (Dev Team)**
- **Nhánh Git (Local):** `docs/task1.2-1.3-duy`
- **Phạm vi chức năng:**
  - `FR-01`: Xem thực đơn (Menu) đồ uống & Xem chi tiết thông tin sản phẩm.
  - `FR-02`: Tìm kiếm đồ uống & Lọc theo danh mục.
  - `UC-01`: Đặc tả chi tiết Use Case Duyệt thực đơn và Xem chi tiết món.

---

## 1. YÊU CẦU CHỨC NĂNG FR-01: XEM THỰC ĐƠN & CHI TIẾT SẢN PHẨM

### 1.1 Mô tả Chi tiết (Description)
- **Mã yêu cầu:** `FR-01`
- **Tên yêu cầu:** Xem danh sách thực đơn (Menu) đồ uống và Xem chi tiết thông tin sản phẩm.
- **Đối tượng sử dụng (Actor):** Khách hàng (Bao gồm cả khách vãng lai `Guest` chưa đăng nhập và khách hàng thành viên đã có tài khoản).
- **Mô tả nghiệp vụ:** 
  - Hệ thống cung cấp giao diện thực đơn trực quan theo định hướng Mobile-first / PWA. Khách hàng khi truy cập vào ứng dụng có thể duyệt qua danh sách các món đồ uống hiện có của quán.
  - Mỗi sản phẩm trên thực đơn hiển thị các trường thông tin cơ bản: Hình ảnh minh họa chất lượng cao (tối ưu nén webp/jpg), Tên món, Mô tả tóm tắt, Đơn giá gốc (`basePrice`, đơn vị VNĐ), Danh mục sản phẩm, và Nhãn trạng thái tồn kho khả dụng (**Còn hàng** hoặc **Hết hàng / Sold Out**).
  - Khi người dùng bấm vào một thẻ sản phẩm còn hàng, hệ thống hỗ trợ xem thông tin chi tiết đầy đủ (mô tả hương vị, nguyên liệu đặc trưng) và chuyển tiếp mở Modal tùy biến (chọn Size, mức đá/đường, thêm Topping của Chức năng 2).
- **Xử lý các trạng thái giao diện (UI States):**
  - **Trạng thái đang tải (Loading State):** Hiển thị khung xương xám (Skeleton Shimmer) mô phỏng vị trí các thẻ món trong thời gian chờ API phản hồi, chống giật vỡ bố cục (Layout Shift).
  - **Trạng thái rỗng (Empty State):** Khi cơ sở dữ liệu chưa có sản phẩm nào đang kích hoạt.
  - **Trạng thái lỗi kết nối (Error State):** Bắt lỗi mạng hoặc mã lỗi 500/503 từ API, hiển thị thông báo lỗi thân thiện kèm nút *"Thử lại (Retry)"* để người dùng tải lại trang mà không cần F5 trình duyệt.
  - **Trạng thái hết hàng (Sold Out State):** Tự động làm mờ thẻ sản phẩm (opacity 50%), gắn huy hiệu *"Hết hàng"*, và vô hiệu hóa (`disabled`) nút chọn món.

---

### 1.2 Phân loại Mức độ Ưu tiên theo MoSCoW

| Mã Yêu Cầu | Nội Dung Yêu Cầu Kiểm Chứng Được | Mức Ưu Tiên (MoSCoW) | Ghi Chú Nghiệp Vụ |
| :---: | :--- | :---: | :--- |
| **FR-01.1** | Hiển thị danh sách các món đồ uống đang kích hoạt (`isActive = true`) kèm tên, hình ảnh minh họa và đơn giá gốc. | **Must** | Yêu cầu cốt lõi bắt buộc của MVP |
| **FR-01.2** | Hiển thị nhãn trạng thái tồn kho khả dụng; tự động làm mờ thẻ món và khóa nút chọn khi tồn kho tính ra bằng 0. | **Must** | Chốt chặn tồn kho Client (Task 10.3) |
| **FR-01.3** | Xử lý trọn vẹn 3 trạng thái giao diện người dùng: Skeleton Loading, Empty State và Error State có nút Thử lại. | **Must** | Bắt buộc theo tiêu chuẩn đánh giá đồ án |
| **FR-01.4** | Xem thông tin chi tiết món đồ uống (mô tả đầy đủ thành phần hương vị, hình ảnh lớn). | **Must** | Phục vụ bước chọn món |
| **FR-01.5** | Tối ưu hóa tải lười hình ảnh (Lazy Loading) và lưu cache dữ liệu danh mục phía Client. | **Should** | Tối ưu tốc độ tải trang trên di động |
| **FR-01.6** | Gắn nhãn huy hiệu nổi bật: "Bán chạy (Best Seller)" hoặc "Món mới (New)". | **Could** | Tùy chọn làm thêm nếu kịp tiến độ Sprint |
| **FR-01.7** | Đánh giá số sao, bình luận review của khách hàng hoặc tính toán hàm lượng calo chi tiết cho từng ly nước. | **Won't** | Không thực hiện trong phạm vi MVP Assignment 2 |

---

### 1.3 Các Quy tắc Nghiệp vụ Cốt lõi (Business Rules - BR)

| Mã Quy Tắc | Nội Dung Quy Tắc Nghiệp Vụ |
| :---: | :--- |
| **BR-01.1** | **Điều kiện hiển thị sản phẩm:** Chỉ những sản phẩm có cờ `isActive = true` trong cơ sở dữ liệu mới được hiển thị lên giao diện thực đơn. Những sản phẩm tạm ngưng bán hoặc bị ẩn (`isActive = false`) phải được lọc bỏ ngay từ câu truy vấn SQL/Prisma tại tầng Data Access Layer. |
| **BR-01.2** | **Công thức tính tồn kho từ nguyên liệu thô:** Cơ sở dữ liệu không quản lý tồn kho theo số ly pha sẵn. Tồn kho khả dụng của sản phẩm ($\text{availableStock}$) được tính toán theo thời gian thực dựa trên số lượng tồn kho của các nguyên vật liệu thô cấu thành (`Ingredient.stockQuantity`) chia cho định mức yêu cầu trong công thức pha chế (`RecipeItem.quantityRequired`):<br>$$\text{availableStock} = \min_{i \in \text{Ingredients}} \left( \left\lfloor \frac{\text{Ingredient}_i\text{.stockQuantity}}{\text{RecipeItem}_i\text{.quantityRequired}} \right\rfloor \right)$$<br>*Ví dụ thực tế:* Để pha 1 ly "Cà phê sữa đá" cần định lượng: 15g hạt cà phê, 25ml sữa đặc, và 1 ly nhựa. Nếu trong kho còn: 150g hạt cà phê (pha được 10 ly), 500ml sữa đặc (pha được 20 ly), nhưng chỉ còn 8 cái ly nhựa $\rightarrow$ Tồn kho khả dụng tối đa chỉ là $\min(10, 20, 8) = 8$ ly. |
| **BR-01.3** | **Xác định trạng thái Còn hàng / Hết hàng:** Món được xác định là "Còn hàng" khi $\text{availableStock} > 0$. Khi $\text{availableStock} = 0$ (do thiếu hụt bất kỳ nguyên liệu bắt buộc nào theo công thức), món ngay lập tức được xác định là "Hết hàng". |
| **BR-01.4** | **Chốt chặn tồn kho phía Client (Task 10.3):** Khi sản phẩm rơi vào trạng thái "Hết hàng" ($\text{availableStock} = 0$), giao diện phía Client phải tự động phản ứng: giảm độ mờ thẻ sản phẩm (opacity 50%), hiển thị nhãn badge *"Hết hàng (Sold Out)"*, và vô hiệu hóa (`disabled`) nút chọn món/thêm vào giỏ hàng nhằm triệt tiêu nguy cơ người dùng đặt hàng ảo. |
| **BR-01.5** | **Quy chuẩn đơn giá hiển thị:** Đơn giá gốc (`basePrice`) hiển thị trên thực đơn là số nguyên dương tính theo đơn vị Đồng (VNĐ, kiểu dữ liệu `Decimal` trong CSDL), chưa bao gồm các khoản phụ thu kích cỡ (Size M/L) và các topping đi kèm. |

---

### 1.4 Tiêu chí Nghiệm thu (Acceptance Criteria - AC)

| Mã AC | Điều Kiện Tiên Quyết (Given) | Hành Động Kích Hoạt (When) | Kết Quả Kỳ Vọng Hệ Thống (Then) | Ánh Xạ FR / BR |
| :---: | :--- | :--- | :--- | :---: |
| **AC-01.01** | CSDL đã nạp sẵn 8–10 món đồ uống mẫu; Backend API đang chạy bình thường. | Khách hàng mở trang `/menu` trên trình duyệt điện thoại. | Giao diện hiển thị đầy đủ danh sách món kèm ảnh minh họa, tên món và giá gốc rõ ràng. Thời gian phản hồi API $< 300\text{ms}$. | FR-01.1<br>BR-01.1 |
| **AC-01.02** | Khách hàng vừa truy cập trang `/menu` và dữ liệu đang được tải từ máy chủ. | Trình duyệt đang chờ phản hồi từ API `GET /api/v1/products`. | Màn hình hiển thị các khối khung xương xám (Skeleton Shimmer) nhấp nháy tại đúng vị trí các card món ăn, không xảy ra hiện tượng chớp nháy trắng hay giật khung hình. | FR-01.3 |
| **AC-01.03** | Một món đồ uống có nguyên liệu thô trong kho không đủ định lượng pha chế ($\text{availableStock} = 0$). | Giao diện Menu kết xuất danh sách thẻ sản phẩm. | Thẻ của món đó tự động bị làm mờ (opacity 50%), xuất hiện nhãn *"Hết hàng"*, nút bấm chọn món chuyển sang trạng thái disabled (không thể bấm chuột hay chạm cảm ứng). | FR-01.2<br>BR-01.2<br>BR-01.4 |
| **AC-01.04** | Thiết bị người dùng bị mất kết nối Internet hoặc Backend API trả về lỗi 500/503. | Quá trình gọi API tải thực đơn thất bại. | Giao diện bắt lỗi và hiển thị component `ErrorState` ("Không thể tải thực đơn. Vui lòng kiểm tra kết nối mạng") kèm nút bấm *"Thử lại (Retry)"*. Bấm nút sẽ kích hoạt gọi lại API. | FR-01.3 |
| **AC-01.05** | Khách hàng đang duyệt thực đơn và bấm vào một sản phẩm đang ở trạng thái còn hàng. | Khách hàng click/chạm vào thẻ món ăn. | Hệ thống mở xem thông tin chi tiết món và kích hoạt chuyển giao dữ liệu sang Modal tùy biến Size/Topping (`ProductCustomizationModal`). | FR-01.4<br>BR-01.3 |
| **AC-01.06** | Cơ sở dữ liệu chưa có bất kỳ sản phẩm nào được kích hoạt (`isActive = true`). | Khách hàng mở trang `/menu`. | Giao diện hiển thị component `EmptyState` thông báo: *"Thực đơn hiện đang được cập nhật, vui lòng quay lại sau"*. | FR-01.3<br>BR-01.1 |

---

## 2. YÊU CẦU CHỨC NĂNG FR-02: TÌM KIẾM ĐỒ UỐNG & LỌC THEO DANH MỤC

### 2.1 Mô tả Chi tiết (Description)
- **Mã yêu cầu:** `FR-02`
- **Tên yêu cầu:** Tìm kiếm đồ uống và Lọc sản phẩm theo danh mục.
- **Đối tượng sử dụng (Actor):** Khách hàng (Bao gồm cả khách vãng lai `Guest` và khách hàng thành viên).
- **Mô tả nghiệp vụ:**
  - Hệ thống hỗ trợ người dùng nhanh chóng tìm thấy món đồ uống mong muốn thông qua 2 cơ chế tương tác linh hoạt:
    1. **Thanh tab danh mục (Category Tabs / Filter):** Thanh trượt ngang trên giao diện điện thoại chứa các nhóm món: **"Tất cả" (Mặc định)**, **"Cà phê"** (`COFFEE`), **"Trà trái cây"** (`TEA`), **"Đá xay"** (`FREEZE`), và **"Bánh ngọt"** (`PASTRY`). Khi người dùng bấm chọn một tab, danh sách sản phẩm tức thời lọc lại chỉ hiển thị các món thuộc danh mục đó.
    2. **Thanh tìm kiếm theo từ khóa (Search Bar):** Ô nhập văn bản cho phép khách hàng gõ tên món (ví dụ: "cà phê", "sen", "đào", "matcha"). Hệ thống hỗ trợ tìm kiếm không phân biệt chữ hoa/chữ thường (Case-insensitive) và hỗ trợ cả tiếng Việt có dấu lẫn không dấu.
  - **Kết hợp bộ lọc (Filter Intersection):** Người dùng có thể vừa chọn danh mục vừa nhập từ khóa tìm kiếm (Ví dụ: Đang ở tab "Cà phê" và gõ "sữa" $\rightarrow$ Chỉ hiển thị các món Cà phê có chữ "sữa").
  - **Xử lý kết quả rỗng (Empty Search State):** Khi từ khóa tìm kiếm hoặc danh mục không có sản phẩm nào thỏa mãn, hệ thống không báo lỗi mạng mà hiển thị component `EmptyState` ("Không tìm thấy đồ uống phù hợp") kèm nút bấm tiện ích *"Xóa bộ lọc (Clear Filter)"* để đặt lại về trạng thái ban đầu.

---

### 2.2 Phân loại Mức độ Ưu tiên theo MoSCoW

| Mã Yêu Cầu | Nội Dung Yêu Cầu Kiểm Chứng Được | Mức Ưu Tiên (MoSCoW) | Ghi Chú Nghiệp Vụ |
| :---: | :--- | :---: | :--- |
| **FR-02.1** | Lọc danh sách món theo danh mục (Tất cả, Cà phê, Trà trái cây, Đá xay, Bánh ngọt). | **Must** | Bắt buộc cho trải nghiệm duyệt Menu |
| **FR-02.2** | Tìm kiếm đồ uống theo từ khóa tên món không phân biệt hoa thường và dấu tiếng Việt. | **Must** | Bắt buộc giúp khách tìm món nhanh |
| **FR-02.3** | Kết hợp đồng thời điều kiện lọc danh mục và từ khóa tìm kiếm (phép giao logic AND). | **Must** | Tránh sai lệch kết quả lọc |
| **FR-02.4** | Hiển thị giao diện EmptyState và nút "Xóa bộ lọc" khi không có kết quả phù hợp. | **Must** | Xử lý trải nghiệm rỗng thân thiện |
| **FR-02.5** | Áp dụng cơ chế Debounce (trì hoãn 300ms) khi nhập từ khóa tìm kiếm phía Client. | **Should** | Giảm thiểu gửi request liên tục lên server |
| **FR-02.6** | Đồng bộ trạng thái lọc và từ khóa lên URL query params (`?category=...&search=...`). | **Should** | Hỗ trợ lưu lịch sử duyệt và tải lại trang |
| **FR-02.7** | Gợi ý từ khóa tìm kiếm phổ biến hoặc tự động hoàn thành từ khóa (Auto-complete). | **Could** | Tùy chọn mở rộng nếu còn thời gian |
| **FR-02.8** | Bộ lọc nâng cao đa tiêu chí theo khoảng giá (Slider) hoặc độ ngọt/calo (ngoài MVP). | **Won't** | Không thực hiện trong phạm vi Assignment 2 |

---

### 2.3 Các Quy tắc Nghiệp vụ Cốt lõi (Business Rules - BR)

| Mã Quy Tắc | Nội Dung Quy Tắc Nghiệp Vụ |
| :---: | :--- |
| **BR-02.1** | **Quy tắc lọc theo danh mục:**<br>• Khi tham số danh mục là rỗng hoặc "Tất cả" (`category = ALL`), hệ thống truy vấn toàn bộ các món đang bán (`isActive = true`).<br>• Khi người dùng chọn một danh mục cụ thể (`category \in \{\text{COFFEE, TEA, FREEZE, PASTRY}\}`), hệ thống chỉ trả về các sản phẩm có `Product.category` trùng khớp chính xác với giá trị được chọn. |
| **BR-02.2** | **Quy tắc tìm kiếm từ khóa:** Từ khóa tìm kiếm (`search`) được chuẩn hóa tự động: cắt bỏ khoảng trắng thừa ở hai đầu chuỗi (`trim()`), chuyển đổi về chữ thường và so khớp chuỗi con (`contains` / `ILIKE`) trên trường `Product.name`. Từ khóa phải hỗ trợ cả trường hợp có dấu tiếng Việt chuẩn và không dấu (ví dụ: gõ "ca phe" hay "cà phê" đều tìm ra sản phẩm). |
| **BR-02.3** | **Quy tắc kết hợp điều kiện (Logic AND):** Khi người dùng vừa chọn danh mục cụ thể vừa nhập từ khóa tìm kiếm, điều kiện truy vấn áp dụng phép giao logic đồng thời:<br>$$\text{Sản phẩm hiển thị} = \{ p \in \text{Products} \mid p\text{.isActive} = \text{true} \land p\text{.category} = \text{SelectedCategory} \land p\text{.name} \text{ chứa } \text{Keyword} \}$$ |
| **BR-02.4** | **Quy tắc xử lý kết quả rỗng & Khôi phục bộ lọc:** Khi tập kết quả trả về có độ dài bằng 0 (`products.length == 0`):<br>• Hệ thống không được hiển thị màn hình lỗi máy chủ (ErrorState).<br>• Hệ thống hiển thị component `EmptyState` với thông điệp: *"Không tìm thấy đồ uống phù hợp với bộ lọc hiện tại"*, kèm nút bấm *"Xóa bộ lọc"*.<br>• Khi người dùng bấm *"Xóa bộ lọc"*, hệ thống tự động reset tab danh mục về "Tất cả", xóa trắng ô tìm kiếm, và tải lại danh sách đầy đủ. |

---

### 2.4 Tiêu chí Nghiệm thu (Acceptance Criteria - AC)

| Mã AC | Điều Kiện Tiên Quyết (Given) | Hành Động Kích Hoạt (When) | Kết Quả Kỳ Vọng Hệ Thống (Then) | Ánh Xạ FR / BR |
| :---: | :--- | :--- | :--- | :---: |
| **AC-02.01** | Khách hàng đang ở màn hình Menu hiển thị danh sách tất cả các món. | Bấm chọn vào tab danh mục "Cà phê". | Danh sách sản phẩm lập tức cập nhật, chỉ hiển thị các món thuộc danh mục Cà phê (ví dụ: Cà phê đen, Cà phê sữa, Bạc xỉu); tab "Cà phê" được highlight sáng màu biểu thị đang chọn. | FR-02.1<br>BR-02.1 |
| **AC-02.02** | Khách hàng đang ở màn hình Menu. | Nhập từ khóa "sen" vào thanh tìm kiếm. | Sau khoảng trễ debounce 300ms, danh sách sản phẩm lọc lại và chỉ hiển thị món "Trà sen vàng", không bị giật trang hay mất trạng thái giao diện. | FR-02.2<br>BR-02.2 |
| **AC-02.03** | Khách hàng đang chọn tab "Trà trái cây". | Nhập từ khóa "đào" vào ô tìm kiếm. | Hệ thống lọc đồng thời cả 2 điều kiện: Chỉ hiển thị các món vừa thuộc nhóm Trà trái cây vừa có chữ "đào" trong tên (ví dụ: "Trà đào hồng đài"). | FR-02.3<br>BR-02.3 |
| **AC-02.04** | Khách hàng nhập từ khóa không khớp với bất kỳ món nào (ví dụ: "xyz123"). | Nhập xong từ khóa tìm kiếm. | Màn hình hiển thị component `EmptyState` với dòng chữ *"Không tìm thấy đồ uống phù hợp"* kèm nút bấm *"Xóa bộ lọc"*. | FR-02.4<br>BR-02.4 |
| **AC-02.05** | Màn hình đang ở trạng thái rỗng `EmptyState` do từ khóa không khớp. | Khách hàng click vào nút *"Xóa bộ lọc"*. | Ô tìm kiếm được xóa trắng, tab danh mục tự động nhảy về "Tất cả", và danh sách thực đơn ban đầu được khôi phục hiển thị đầy đủ ngay lập tức. | FR-02.4<br>BR-02.4 |
| **AC-02.06** | Khách hàng gõ liên tục chuỗi ký tự nhanh vào ô tìm kiếm (ví dụ: gõ "m-a-t-c-h-a"). | Đang gõ bàn phím liên tục. | Cơ chế Debounce 300ms chỉ phát ra đúng 1 request API cuối cùng sau khi khách hàng dừng gõ 300ms, không spam gửi 6 request liên tiếp lên Backend. | FR-02.5 |

---

## 3. ĐẶC TẢ CHI TIẾT USE CASE: UC-01 – DUYỆT THỰC ĐƠN, LỌC DANH MỤC VÀ XEM CHI TIẾT SẢN PHẨM

### 3.1 Thông tin Tổng quan (Overview)

- **Mã Use Case:** `UC-01`
- **Tên Use Case:** Duyệt thực đơn, Lọc danh mục và Xem chi tiết sản phẩm *(Browse Menu, Filter Categories & View Product Details)*.
- **Mức độ trọng tâm:** Use Case trọng tâm của Chức năng 1 (Nhiệm vụ Task 1.3 trong Đồ án BrewLite 2).
- **Sơ đồ phân rã Use Case (PlantUML & SVG):**
  - Tệp nguồn PlantUML: [`docs/diagrams/uc-01-menu.puml`](file:///d:/VSCode/BrewLite2/docs/diagrams/uc-01-menu.puml)
  - Tệp bản vẽ Vector SVG: [`docs/diagrams/uc-01-menu.svg`](file:///d:/VSCode/BrewLite2/docs/diagrams/uc-01-menu.svg)
- **Phân rã các Use Case thành phần (Sub-use cases):**
  - `UC-01.1`: **Xem danh sách thực đơn đồ uống** (Use Case cơ sở / Base Use Case).
  - `UC-01.2`: **Lọc đồ uống theo danh mục** (Quan hệ `<<extend>>` từ UC-01.1 khi khách hàng bấm chọn tab danh mục).
  - `UC-01.3`: **Tìm kiếm đồ uống theo từ khóa tên món** (Quan hệ `<<extend>>` từ UC-01.1 khi khách hàng nhập từ khóa tìm kiếm).
  - `UC-01.4`: **Xem chi tiết thông tin món & trạng thái tồn kho** (Quan hệ `<<include>>` khi khách hàng bấm vào một thẻ món ăn cụ thể).
- **Tác nhân chính (Primary Actor):** Khách hàng *(Customer / Guest)* – Hệ thống cho phép cả khách vãng lai chưa đăng nhập và khách hàng thành viên đều có thể duyệt menu tự do.
- **Tác nhân phụ / Hệ thống hỗ trợ (Supporting Actor / Secondary System):**
  - Hệ quản trị CSDL PostgreSQL (Lưu trữ bảng sản phẩm `Product`, nguyên liệu `Ingredient`, công thức định mức `RecipeItem`).
  - Dịch vụ Backend API NestJS (`ProductsService`, `ProductsController`).
- **Mục đích (Goal):** Cho phép khách hàng khám phá toàn bộ danh mục thức uống của quán với thông tin trực quan (hình ảnh, tên món, giá niêm yết, thành phần hương vị), lọc và tìm kiếm món yêu thích theo nhu cầu, đồng thời nắm bắt chính xác trạng thái còn hàng/hết hàng được tính toán tự động theo thời gian thực từ kho nguyên liệu thô.
- **Điểm kích hoạt (Trigger):** Khách hàng truy cập vào trang chủ hoặc điều hướng đến màn hình Thực đơn `/menu` trên ứng dụng web BrewLite 2 (qua trình duyệt máy tính hoặc thiết bị di động).
- **Tiền điều kiện (Pre-conditions):**
  1. Ứng dụng web BrewLite 2 đang hoạt động bình thường trên môi trường triển khai.
  2. Cơ sở dữ liệu PostgreSQL đã hoàn tất khởi tạo schema và nạp dữ liệu mẫu ban đầu (`prisma db seed`) với tối thiểu 8 – 10 sản phẩm đồ uống đa dạng thuộc các danh mục (`COFFEE`, `TEA`, `FREEZE`, `PASTRY`).
  3. Bảng nguyên liệu thô `Ingredient` và bảng công thức định mức `RecipeItem` đã được cấu hình đầy đủ để phục vụ việc tính toán tồn kho động.
  4. Backend API sẵn sàng phản hồi endpoint `GET /api/v1/products`.
- **Hậu điều kiện (Post-conditions):**
  - **Trường hợp thành công (Success End Condition):**
    - Màn hình Menu kết xuất đầy đủ các thẻ món ăn (`ProductCard`) kèm hình ảnh, tên món, đơn giá gốc rõ ràng.
    - Nhãn trạng thái tồn kho hiển thị minh bạch: Món còn hàng cho phép bấm vào xem chi tiết để chuyển sang bước tùy biến Size/Topping (Chức năng 2); Món hết hàng tự động làm mờ và khóa nút bấm chọn món.
    - Bộ lọc danh mục và thanh tìm kiếm phản hồi chính xác theo thao tác người dùng.
  - **Trường hợp thất bại (Failure End Condition):**
    - Nếu mất mạng hoặc máy chủ gặp sự cố: Giao diện hiển thị component `ErrorState` thông báo lỗi nhẹ nhàng kèm nút *"Thử lại"*, tuyệt đối không làm trắng trang hay sập ứng dụng.
    - Nếu không có sản phẩm khớp với bộ lọc: Giao diện hiển thị component `EmptyState` kèm nút *"Xóa bộ lọc"*.

---

### 3.2 Luồng Sự kiện Chính (Main Flow / Basic Course of Events)

| Bước | Hành Động của Tác Nhân (Actor Action) | Phản Hồi của Hệ Thống (System Response) |
| :---: | :--- | :--- |
| **1** | Khách hàng truy cập vào màn hình Menu bằng đường dẫn `/menu` hoặc bấm biểu tượng "Thực đơn" trên thanh điều hướng. | |
| **2** | | Ứng dụng Frontend (Next.js) ngay lập tức hiển thị giao diện chờ dạng khung xương (**Skeleton Loading State**) tại các vị trí thẻ món ăn nhằm giữ ổn định khung hình (tránh hiện tượng giật vỡ bố cục - Cumulative Layout Shift), đồng thời phát request HTTP `GET /api/v1/products` lên máy chủ Backend. |
| **3** | | Tầng API Backend (NestJS `ProductsController`) tiếp nhận yêu cầu, xác thực các tham số truy vấn (`QueryProductDto`), sau đó chuyển tiếp cho `ProductsService`. |
| **4** | | `ProductsService` tương tác với CSDL PostgreSQL thông qua Prisma ORM: Truy vấn các bản ghi sản phẩm có trạng thái hoạt động `isActive = true`. Đối với mỗi sản phẩm, hệ thống nạp các dòng công thức tương ứng (`RecipeItem`) và số lượng tồn kho nguyên liệu thô hiện tại (`Ingredient.stockQuantity`) để tính toán tồn kho khả dụng $\text{availableStock}$. |
| **5** | | Backend tổng hợp dữ liệu thành mảng DTO (`ProductResponseDto[]`) và phản hồi mã trạng thái HTTP `200 OK` về cho Frontend. |
| **6** | | Frontend tắt hiệu ứng Skeleton Loading và render giao diện Menu hoàn chỉnh: Gồm thanh cuộn danh mục (`CategoryFilter`) ở trên cùng và lưới các thẻ sản phẩm (`ProductCard`) ở phía dưới.<br>• Món có $\text{availableStock} > 0$: Hiển thị bình thường kèm nút chọn món mở.<br>• Món có $\text{availableStock} = 0$: Tự động làm mờ 50%, hiển thị nhãn *"Hết hàng (Sold Out)"* và vô hiệu hóa nút bấm. |
| **7** | Khách hàng có thể thao tác lọc theo danh mục hoặc nhập từ khóa tìm kiếm món. *(Kích hoạt UC mở rộng `UC-01.2` hoặc `UC-01.3`)*. | Hệ thống lọc tức thời danh sách món thỏa mãn và kết xuất lại lưới sản phẩm tương ứng mà không cần tải lại toàn bộ trang web. |
| **8** | Khách hàng bấm (click chuột hoặc chạm màn hình cảm ứng) vào một thẻ món ăn đang ở trạng thái còn hàng. | Hệ thống thực thi Use Case bao gồm `UC-01.4` (Xem chi tiết sản phẩm): Mở xem thông tin chi tiết (mô tả hương vị, nguyên liệu đặc trưng) và kích hoạt mở Modal tùy biến sản phẩm (`ProductCustomizationModal` thuộc Chức năng 2) để khách hàng chọn Size và Topping. |

---

### 3.3 Các Luồng Thay Thế / Rẽ Nhánh (Alternative Flows)

#### Luồng Thay Thế 7a: Lọc hoặc Tìm kiếm cho ra kết quả rỗng (Không có món thỏa mãn)
- **Điểm rẽ nhánh:** Xuất hiện tại **Bước 7** của Luồng chính, khi người dùng chọn một danh mục chưa có món nào hoặc nhập từ khóa tìm kiếm không khớp với bất kỳ sản phẩm nào trong cơ sở dữ liệu (`products.length == 0`).
- **Diễn biến:**
  1. Hệ thống Frontend ẩn lưới danh sách sản phẩm.
  2. Giao diện hiển thị component thông báo rỗng (`EmptyState`) với hình minh họa trực quan và thông điệp: *"Không tìm thấy đồ uống phù hợp với bộ lọc hiện tại"*.
  3. Bên dưới thông điệp hiển thị một nút bấm hành động tiện ích: *"Xóa bộ lọc (Clear Filter)"*.
  4. Khách hàng bấm vào nút *"Xóa bộ lọc"*.
  5. Hệ thống tức thời đặt lại tab danh mục về "Tất cả", xóa trắng ô tìm kiếm, và tải lại danh sách đầy đủ tất cả các món ăn đang phục vụ.
- **Điểm kết thúc:** Quay lại **Bước 6** của Luồng chính.

#### Luồng Thay Thế 7b: Khách hàng nhập từ khóa tìm kiếm liên tục (Cơ chế Debounce)
- **Điểm rẽ nhánh:** Xuất hiện tại **Bước 7** của Luồng chính khi khách hàng gõ ký tự vào ô tìm kiếm.
- **Diễn biến:**
  1. Khách hàng gõ các ký tự liên tiếp (ví dụ: gõ từng chữ "c-a-p-h-e").
  2. Thay vì kích hoạt gửi request API hoặc lọc mảng dữ liệu sau mỗi phím bấm, hệ thống áp dụng cơ chế trì hoãn thông minh (`Debounce`) với thời gian chờ 300 mili-giây.
  3. Chỉ khi khách hàng dừng bấm phím quá 300ms, hệ thống mới chính thức thực thi logic tìm kiếm và cập nhật kết quả lên màn hình.
- **Điểm kết thúc:** Giúp giao diện hoạt động mượt mà, loại bỏ hiện tượng giật lắc và tối ưu hóa hiệu năng thiết bị di động.

---

### 3.4 Các Luồng Ngoại Lệ (Exception Flows)

#### Luồng Ngoại Lệ 2a / 5a: Sự cố Mất kết nối mạng hoặc Lỗi máy chủ Backend (Network / Server Error)
- **Điểm phát sinh:** Xuất hiện tại **Bước 2** hoặc **Bước 5** của Luồng chính, khi thiết bị của khách hàng bị ngắt kết nối Internet (mất sóng Wifi/4G) hoặc máy chủ Backend trả về các mã lỗi HTTP `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`, hoặc quá thời gian chờ (Timeout > 10s).
- **Diễn biến:**
  1. Tầng dịch vụ Frontend bắt được ngoại lệ (Catch Exception).
  2. Hệ thống chủ động tắt hiệu ứng Skeleton Loading để tránh tình trạng nhấp nháy treo vô tận.
  3. Giao diện kết xuất component báo lỗi thân thiện (`ErrorState`) với nội dung: *"Không thể tải thực đơn. Vui lòng kiểm tra kết nối mạng của bạn và thử lại!"*.
  4. Trên màn hình lỗi có gắn kèm một nút bấm chức năng nổi bật: *"Thử lại (Retry)"*.
  5. Khách hàng kiểm tra lại kết nối mạng và bấm nút *"Thử lại"*.
- **Điểm kết thúc:** Hệ thống quay trở lại thực hiện lại từ **Bước 2** của Luồng chính. Ứng dụng không bị sập hay trắng trang.

#### Luồng Ngoại Lệ 6a: Sản phẩm hết hàng do thiếu hụt nguyên vật liệu thô (Out of Stock Barrier - Task 10.3)
- **Điểm phát sinh:** Xuất hiện tại **Bước 6** của Luồng chính khi tính toán tồn kho thành phẩm.
- **Diễn biến:**
  1. Tại tầng Backend, khi kiểm tra định mức công thức pha chế (`RecipeItem`) của món với tồn kho thực tế trong bảng `Ingredient`, hệ thống phát hiện có ít nhất một nguyên liệu cấu thành không còn đủ định lượng để pha chế tối thiểu 1 ly ($\text{availableStock} = 0$). *(Ví dụ: Món "Cà phê sữa đá" còn đủ bột cà phê nhưng kho đã hết sạch sữa đặc hoặc hết ly nhựa)*.
  2. Backend trả về trường `stock: 0` và `isAvailable: false` trong DTO của sản phẩm đó.
  3. Tại tầng Frontend, thẻ hiển thị của sản phẩm này tự động kích hoạt chế độ khóa phòng thủ:
     - Thẻ sản phẩm bị giảm độ tương phản và mờ đi (`opacity: 0.5`).
     - Hiển thị nhãn huy hiệu màu xám đậm: *"Hết hàng (Sold Out)"* đè lên góc ảnh sản phẩm.
     - Nút bấm thêm món chuyển sang trạng thái vô hiệu hóa (`disabled = true`, con trỏ chuột đổi thành `not-allowed`).
  4. Nếu khách hàng cố tình bấm/chạm vào thẻ món ăn, hệ thống ngăn chặn hoàn toàn sự kiện bấm chuột (`pointer-events: none`), không mở Modal tùy biến và không cho phép đưa sản phẩm vào giỏ hàng.
- **Điểm kết thúc:** Ngăn chặn triệt để rủi ro khách đặt mua hàng ảo khi quán không còn khả năng phục vụ.

---

### 3.5 Các Yêu Cầu Phi Chức Năng Liên Quan (Non-Functional Requirements)

1. **Hiệu năng & Trải nghiệm Người dùng (Performance & UX):**
   - Thời gian hiển thị Skeleton Loading ban đầu không vượt quá **100ms** kể từ khi người dùng nhấp mở trang.
   - Thời gian phản hồi trung bình của API tải thực đơn `GET /api/v1/products` phải dưới **300ms** trong điều kiện mạng bình thường.
   - Thao tác lọc tab danh mục diễn ra gần như tức thì (độ trễ dưới **50ms**) nhờ cơ chế lọc dữ liệu phía Client (Client-side filtering trên mảng sản phẩm đã nạp).
2. **Khả năng Tương thích & Thiết kế Đáp ứng (Responsive & Mobile-first):**
   - Giao diện được thiết kế ưu tiên màn hình điện thoại di động (chiều rộng chuẩn từ 360px – 430px) và tự động mở rộng hài hòa trên máy tính bảng (Tablet) cũng như máy tính để bàn (Desktop).
   - Thanh lọc danh mục hỗ trợ cử chỉ vuốt trượt cảm ứng (Touch-scroll/Swipe) mượt mà trên màn hình cảm ứng di động.
   - Diện tích tương tác (Touch Target) của các tab và nút chọn món đạt kích thước tối thiểu $44 \times 44\text{px}$ theo tiêu chuẩn Accessibility của Google.
3. **Tính Độc lập & Toàn vẹn (Modularity & Loose Coupling):**
   - Chức năng 1 (`Menu & Chi tiết món`) hoạt động độc lập hoàn toàn với việc người dùng đã đăng nhập hay chưa.
   - Khi chọn món còn hàng, Chức năng 1 chỉ làm nhiệm vụ truyền dữ liệu sản phẩm mục tiêu sang Component Modal của Chức năng 2 (Giỏ hàng & Topping) thông qua Props/State, đảm bảo tính tách biệt ranh giới module rõ ràng.



