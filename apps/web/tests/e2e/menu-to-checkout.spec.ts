// apps/web/tests/e2e/menu-to-checkout.spec.ts
import { test, expect } from '@playwright/test';

/**
 * Danh sách 18 món thực đơn chuẩn Figma Cloud BrewLite 2 để mock API trong kiểm thử E2E.
 * Đảm bảo các bài kiểm thử chạy độc lập 100%, tốc độ cao và không phụ thuộc vào trạng thái API backend.
 */
const MOCK_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Cà phê Muối Côn Đảo',
    slug: 'ca-phe-muoi-con-dao',
    description: 'Đậm vị cà phê, mịn màng kem muối.',
    category: 'ESPRESSO',
    basePrice: 45000,
    imageUrl: '/images/drinks/ca-phe-muoi-con-dao.jpg',
    isActive: true,
    availableStock: 25,
    isSoldOut: false,
  },
  {
    id: 'prod-002',
    name: 'Trà Lài Vải Thiều',
    slug: 'tra-lai-vai-thieu',
    description: 'Hương lài thanh, vải thiều ngọt dịu.',
    category: 'TEA',
    basePrice: 42000,
    imageUrl: '/images/drinks/tra-lai-vai-thieu.jpg',
    isActive: true,
    availableStock: 20,
    isSoldOut: false,
  },
  {
    id: 'prod-003',
    name: 'Matcha Dừa Non',
    slug: 'matcha-dua-non',
    description: 'Matcha đậm thơm, dừa non béo nhẹ.',
    category: 'TEA',
    basePrice: 55000,
    imageUrl: '/images/drinks/matcha-dua-non.jpg',
    isActive: true,
    availableStock: 15,
    isSoldOut: false,
  },
  {
    id: 'prod-004',
    name: 'Bánh Sừng Bò Bơ',
    slug: 'banh-sung-bo-bo',
    description: 'Vỏ giòn thơm, lớp bơ tan nhẹ.',
    category: 'PASTRY',
    basePrice: 32000,
    imageUrl: '/images/drinks/banh-sung-bo-bo.jpg',
    isActive: true,
    availableStock: 0,
    isSoldOut: true,
  },
  {
    id: 'prod-005',
    name: 'Cà phê Ủ Lạnh Cam Vàng',
    slug: 'ca-phe-u-lanh-cam-vang',
    description: 'Cà phê ủ lạnh 16 tiếng kết hợp tép cam tươi.',
    category: 'COLD_BREW',
    basePrice: 49000,
    imageUrl: '/images/drinks/ca-phe-u-lanh-cam-vang.jpg',
    isActive: true,
    availableStock: 18,
    isSoldOut: false,
  },
  {
    id: 'prod-006',
    name: 'Cold Brew Yến Mạch Quế',
    slug: 'cold-brew-yen-mach-que',
    description: 'Cà phê ủ lạnh êm dịu hòa cùng sữa yến mạch và quế thơm.',
    category: 'COLD_BREW',
    basePrice: 52000,
    imageUrl: '/images/drinks/cold-brew-yen-mach-que.jpg',
    isActive: true,
    availableStock: 12,
    isSoldOut: false,
  },
  {
    id: 'prod-007',
    name: 'Mocha Cacao Tuyết',
    slug: 'mocha-cacao-tuyet',
    description: 'Đá xay mịn cùng socola đen, espresso và kem whipping.',
    category: 'FREEZE',
    basePrice: 58000,
    imageUrl: '/images/drinks/mocha-cacao-tuyet.jpg',
    isActive: true,
    availableStock: 10,
    isSoldOut: false,
  },
  {
    id: 'prod-008',
    name: 'Matcha Tuyết Dừa Béo',
    slug: 'matcha-tuyet-dua-beo',
    description: 'Matcha Uji đá xay mịn cùng kem sữa dừa bồng bềnh.',
    category: 'FREEZE',
    basePrice: 59000,
    imageUrl: '/images/drinks/matcha-tuyet-dua-beo.jpg',
    isActive: true,
    availableStock: 14,
    isSoldOut: false,
  },
  {
    id: 'prod-009',
    name: 'Latte Hạt Phỉ Khói',
    slug: 'latte-hat-phi-khoi',
    description: 'Espresso phân tầng cùng sữa tươi và sốt hạt phỉ thơm lừng.',
    category: 'ESPRESSO',
    basePrice: 52000,
    imageUrl: '/images/drinks/latte-hat-phi-khoi.jpg',
    isActive: true,
    availableStock: 16,
    isSoldOut: false,
  },
  {
    id: 'prod-010',
    name: 'Trà Oolong Sen Vàng Đắk Lắk',
    slug: 'tra-oolong-sen-vang-dak-lak',
    description: 'Vị thanh ngọt của trà Oolong kết hợp hạt sen tươi bùi.',
    category: 'TEA',
    basePrice: 48000,
    imageUrl: '/images/drinks/tra-oolong-sen-vang-dak-lak.jpg',
    isActive: true,
    availableStock: 0,
    isSoldOut: true,
  },
  {
    id: 'prod-011',
    name: 'Cold Brew Mơ Rừng Tây Bắc',
    slug: 'cold-brew-mo-rung-tay-bac',
    description: 'Vị chua ngọt thanh tao của mơ rừng hòa cùng cà phê ủ chậm.',
    category: 'COLD_BREW',
    basePrice: 54000,
    imageUrl: '/images/drinks/cold-brew-mo-rung-tay-bac.jpg',
    isActive: true,
    availableStock: 12,
    isSoldOut: false,
  },
  {
    id: 'prod-012',
    name: 'Cold Brew Tonic Bưởi Hồng',
    slug: 'cold-brew-tonic-buoi-hong',
    description: 'Cà phê ủ lạnh sủi bọt cùng nước tonic và bưởi hồng tươi.',
    category: 'COLD_BREW',
    basePrice: 55000,
    imageUrl: '/images/drinks/cold-brew-tonic-buoi-hong.jpg',
    isActive: true,
    availableStock: 15,
    isSoldOut: false,
  },
  {
    id: 'prod-013',
    name: 'Caramel Macchiato Đá Xay',
    slug: 'caramel-macchiato-da-xay',
    description: 'Espresso phân tầng xay tuyết cùng sốt caramel béo ngậy.',
    category: 'FREEZE',
    basePrice: 58000,
    imageUrl: '/images/drinks/caramel-macchiato-da-xay.jpg',
    isActive: true,
    availableStock: 11,
    isSoldOut: false,
  },
  {
    id: 'prod-014',
    name: 'Socola Bạc Hà Băng Tuyết',
    slug: 'socola-bac-ha-bang-tuyet',
    description: 'Vị ngọt đắng của cacao hòa cùng tinh dầu bạc hà the mát.',
    category: 'FREEZE',
    basePrice: 59000,
    imageUrl: '/images/drinks/socola-bac-ha-bang-tuyet.jpg',
    isActive: true,
    availableStock: 8,
    isSoldOut: false,
  },
  {
    id: 'prod-015',
    name: 'Flat White Hạnh Nhân Nướng',
    slug: 'flat-white-hanh-nhan-nuong',
    description: 'Double espresso kết hợp sữa hạnh nhân béo bùi và latte art.',
    category: 'ESPRESSO',
    basePrice: 52000,
    imageUrl: '/images/drinks/flat-white-hanh-nhan-nuong.jpg',
    isActive: true,
    availableStock: 14,
    isSoldOut: false,
  },
  {
    id: 'prod-016',
    name: 'Trà Đào Cam Sả Tươi',
    slug: 'tra-dao-cam-sa-tuoi',
    description: 'Trà đen thanh mát ủ cùng cam tươi, sả thơm và đào ngâm giòn.',
    category: 'TEA',
    basePrice: 45000,
    imageUrl: '/images/drinks/tra-dao-cam-sa-tuoi.jpg',
    isActive: true,
    availableStock: 22,
    isSoldOut: false,
  },
  {
    id: 'prod-017',
    name: 'Trà Thanh Đào Sen Tuyết',
    slug: 'tra-thanh-dao-sen-tuyet',
    description: 'Hương hoa lài thanh tao hòa cùng hạt sen tươi và củ năng giòn.',
    category: 'TEA',
    basePrice: 48000,
    imageUrl: '/images/drinks/tra-thanh-dao-sen-tuyet.jpg',
    isActive: true,
    availableStock: 18,
    isSoldOut: false,
  },
  {
    id: 'prod-018',
    name: 'Bánh Tiramisu Cà Phê Rượu Rum',
    slug: 'banh-tiramisu-ca-phe-ruou-rum',
    description: 'Bánh tráng miệng Ý thơm lừng espresso, mascarpone và cacao.',
    category: 'PASTRY',
    basePrice: 62000,
    imageUrl: '/images/drinks/banh-tiramisu-ca-phe-ruou-rum.jpg',
    isActive: true,
    availableStock: 9,
    isSoldOut: false,
  },
];

/**
 * Bộ kiểm thử tự động End-to-End (E2E) cho BrewLite 2.
 * Kịch bản: Toàn bộ hành trình khách hàng từ Thực đơn đến Đặt hàng và Thanh toán thành công.
 * Đáp ứng đầy đủ tiêu chí chấp nhận Task 5.2 theo tài liệu SWE 2026 và thiết kế Figma Cloud.
 */
test.describe('Hành trình khách hàng: Từ Thực đơn đến Hoàn tất Thanh toán', () => {
  // Thiết lập route mock trước mỗi bài test
  test.beforeEach(async ({ page }) => {
    // Giả lập API danh sách sản phẩm GET /api/v1/products
    await page.route('**/api/v1/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PRODUCTS),
      });
    });

    // Giả lập API tạo đơn hàng POST /api/v1/orders
    await page.route('**/api/v1/orders', async (route) => {
      if (route.request().method() === 'POST') {
        const orderCode = `BL-${Math.floor(1000 + Math.random() * 9000)}`;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order: {
              orderCode,
              status: 'PENDING_PAYMENT',
              subtotalAmount: 100000,
              discountAmount: 20000,
              finalAmount: 80000,
              items: [
                {
                  productId: 'prod-003',
                  name: 'Matcha Dừa Non',
                  quantity: 1,
                  unitPrice: 55000,
                },
                {
                  productId: 'prod-001',
                  name: 'Cà phê Muối Côn Đảo',
                  quantity: 1,
                  unitPrice: 45000,
                },
              ],
            },
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('Luồng chính (Happy Path): Chọn món -> Thêm giỏ hàng -> Áp mã voucher -> Đặt hàng -> Thanh toán thành công', async ({
    page,
  }) => {
    // -------------------------------------------------------------
    // Bước 1: Khách hàng truy cập trang Thực đơn (/menu)
    // -------------------------------------------------------------
    await page.goto('/menu');
    await expect(page).toHaveURL(/.*menu/);

    // Xác thực Logo thương hiệu BrewLite hiển thị
    const headerLogo = page.locator('header').getByText('BrewLite').first();
    await expect(headerLogo).toBeVisible();

    // Xác thực danh sách thẻ món (ProductCard) hiển thị đầy đủ trên lưới (18 món)
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();
    const count = await productCards.count();
    expect(count).toBe(18);

    // -------------------------------------------------------------
    // Bước 2: Chọn 2 món đồ uống còn hàng và thêm vào giỏ hàng
    // -------------------------------------------------------------
    // Món 1: "Matcha Dừa Non" (55.000 đ)
    const matchaCard = productCards.filter({ hasText: 'Matcha Dừa Non' });
    await expect(matchaCard).toBeVisible();
    const addMatchaBtn = matchaCard.locator('button[aria-label="Chọn món Matcha Dừa Non"]');
    await addMatchaBtn.click();

    // Xác nhận thông báo Toast thêm món thành công hiển thị
    await expect(
      page.getByText('Đã thêm 1 "Matcha Dừa Non" vào giỏ hàng!'),
    ).toBeVisible();

    // Món 2: "Cà phê Muối Côn Đảo" (45.000 đ) -> Tổng tiền 100.000 đ (đủ điều kiện voucher >= 50.000 đ)
    const coffeeCard = productCards.filter({ hasText: 'Cà phê Muối Côn Đảo' });
    await expect(coffeeCard).toBeVisible();
    const addCoffeeBtn = coffeeCard.locator('button[aria-label="Chọn món Cà phê Muối Côn Đảo"]');
    await addCoffeeBtn.click();

    await expect(
      page.getByText('Đã thêm 1 "Cà phê Muối Côn Đảo" vào giỏ hàng!'),
    ).toBeVisible();

    // -------------------------------------------------------------
    // Bước 3: Xác nhận badge giỏ hàng trên Header cập nhật số lượng là 2
    // -------------------------------------------------------------
    const cartLink = page.locator('header a[aria-label="Xem giỏ hàng"]');
    await expect(cartLink).toBeVisible();
    const cartBadge = cartLink.locator('span');
    await expect(cartBadge).toHaveText('2');

    // -------------------------------------------------------------
    // Bước 4: Chuyển sang /cart, kiểm tra danh sách món và áp dụng mã voucher
    // -------------------------------------------------------------
    await cartLink.click();
    await expect(page).toHaveURL(/.*cart/);

    // Xác thực tiêu đề trang giỏ hàng
    await expect(
      page.getByRole('heading', { name: 'Giỏ hàng của bạn' }),
    ).toBeVisible();

    // Xác thực 2 món xuất hiện trong giỏ hàng
    await expect(page.getByText('Matcha Dừa Non').first()).toBeVisible();
    await expect(page.getByText('Cà phê Muối Côn Đảo').first()).toBeVisible();

    // Xác thực tổng tiền tạm tính ban đầu (55.000 + 45.000 = 100.000 đ)
    await expect(
      page.getByText('100.000 đ').filter({ visible: true }).first(),
    ).toBeVisible();

    // Nhập mã voucher ưu đãi "BANMOI10"
    const promoInput = page.locator('input[placeholder*="BANMOI10"]');
    await expect(promoInput).toBeVisible();
    await promoInput.fill('BANMOI10');

    const applyPromoBtn = page.getByRole('button', { name: 'Áp dụng' });
    await applyPromoBtn.click();

    // Xác thực mã ưu đãi áp dụng thành công và hiển thị giảm 20.000 đ
    await expect(page.getByText(/BANMOI10/i).first()).toBeVisible();
    await expect(page.getByText(/Giảm 20\.000\s*đ/i).first()).toBeVisible();

    // Xác thực tổng tiền sau khi giảm giá được tính lại chính xác (100.000 - 20.000 = 80.000 đ)
    await expect(
      page.getByText('80.000 đ').filter({ visible: true }).first(),
    ).toBeVisible();

    // -------------------------------------------------------------
    // Bước 5: Bấm Tiến hành đặt hàng / Chuyển sang bước Checkout
    // -------------------------------------------------------------
    const checkoutBtn = page
      .getByRole('button', { name: /Tiến hành đặt hàng/i })
      .filter({ visible: true })
      .first();
    await checkoutBtn.click();

    // Xác thực chuyển sang màn hình kiểm tra thông tin nhận hàng
    await expect(
      page.getByRole('heading', { name: 'Kiểm tra và đặt hàng' }),
    ).toBeVisible();

    // Kiểm tra các tùy chọn nhận hàng
    await expect(page.getByText('Bạn muốn nhận món thế nào?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nhận tại quầy' })).toBeVisible();

    // Bấm nút tạo đơn hàng và chọn thanh toán
    const createOrderBtn = page
      .getByRole('button', { name: 'Tạo đơn và chọn thanh toán' })
      .filter({ visible: true })
      .first();
    await createOrderBtn.click();

    // -------------------------------------------------------------
    // Bước 6: Popup thanh toán hiển thị, chọn phương thức thanh toán
    // -------------------------------------------------------------
    await expect(
      page.getByRole('heading', { name: 'Thanh toán đơn hàng' }),
    ).toBeVisible();

    // Kiểm tra 3 phương thức thanh toán không tiền mặt chuẩn Product Vision & Thầy quy định
    await expect(page.getByRole('button', { name: /Quét mã QR/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ví điện tử mô phỏng/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Thẻ thử nghiệm/i })).toBeVisible();

    // Xác nhận loại bỏ hoàn toàn tiền mặt (Không dùng tiền mặt theo yêu cầu của Thầy)
    await expect(page.getByRole('button', { name: /Tiền mặt tại quầy/i })).toHaveCount(0);

    // Thao tác chuyển đổi giữa các phương thức không tiền mặt (Ví điện tử và Mã QR)
    await page.getByRole('button', { name: /Ví điện tử mô phỏng/i }).click();
    await page.getByRole('button', { name: /Quét mã QR/i }).click();

    // Xác nhận mã QR và thông tin tài khoản thụ hưởng hiển thị
    await expect(page.getByText('CÔNG TY TNHH BREWLITE VIETNAM')).toBeVisible();

    // -------------------------------------------------------------
    // Bước 7: Xác nhận thanh toán và hoàn tất đơn hàng thành công
    // -------------------------------------------------------------
    const checkPaymentBtn = page.getByRole('button', { name: 'Kiểm tra trạng thái' });
    await checkPaymentBtn.click();

    // Xác thực popup chuyển sang trạng thái "Thanh toán thành công" (Frame 06h Figma)
    await expect(
      page.getByRole('heading', { name: 'Thanh toán thành công' }),
    ).toBeVisible();

    await expect(page.getByText(/ĐÃ THANH TOÁN/i)).toBeVisible();

    // Bấm nút "Theo dõi đơn hàng" để điều hướng đến trang quản lý đơn hàng
    const trackOrderLink = page.getByRole('link', { name: 'Theo dõi đơn hàng' });
    await expect(trackOrderLink).toBeVisible();
    await trackOrderLink.click();

    // Xác nhận điều hướng sang trang /orders thành công và tiêu đề Lịch sử đơn hàng hiển thị
    await expect(page).toHaveURL(/.*orders/);
    await expect(
      page.getByRole('heading', { name: 'Lịch sử đơn hàng' }),
    ).toBeVisible();
  });

  test('Quản lý giỏ hàng: Tăng, giảm số lượng món và xóa món khỏi giỏ', async ({ page }) => {
    // 1. Thêm 1 món vào giỏ từ thực đơn
    await page.goto('/menu');
    const coffeeCard = page
      .locator('[data-testid="product-card"]')
      .filter({ hasText: 'Cà phê Muối Côn Đảo' });
    await coffeeCard.locator('button[aria-label="Chọn món Cà phê Muối Côn Đảo"]').click();

    // Xác nhận toast xuất hiện
    await expect(
      page.getByText('Đã thêm 1 "Cà phê Muối Côn Đảo" vào giỏ hàng!'),
    ).toBeVisible();

    // 2. Chuyển sang giỏ hàng bằng client-side navigation để duy trì in-memory store
    const cartLink = page.locator('header a[aria-label="Xem giỏ hàng"]');
    await cartLink.click();
    await expect(page).toHaveURL(/.*cart/);

    await expect(page.getByText('Cà phê Muối Côn Đảo').first()).toBeVisible();

    // Giá 1 ly là 45.000 đ
    await expect(
      page.getByText('45.000 đ').filter({ visible: true }).first(),
    ).toBeVisible();

    // 3. Bấm nút tăng số lượng (+)
    const increaseBtn = page.locator('button[aria-label="Tăng số lượng"]').first();
    await increaseBtn.click();

    // Sau khi tăng lên 2 ly, tổng tiền thành 90.000 đ
    await expect(
      page.getByText('90.000 đ').filter({ visible: true }).first(),
    ).toBeVisible();

    // 4. Bấm nút giảm số lượng (−)
    const decreaseBtn = page.locator('button[aria-label="Giảm số lượng"]').first();
    await decreaseBtn.click();

    // Trở về 1 ly giá 45.000 đ
    await expect(
      page.getByText('45.000 đ').filter({ visible: true }).first(),
    ).toBeVisible();

    // 5. Bấm nút xóa món khỏi giỏ hàng
    const removeBtn = page.locator('button[title="Xóa món"]').first();
    await removeBtn.click();

    // Xác thực giỏ hàng trở về trạng thái trống (Empty State)
    await expect(page.getByText(/Giỏ hàng của bạn.*đang thảnh thơi/i)).toBeVisible();
  });

  test('Bảo vệ tính toàn vẹn: Món Tạm hết (Sold out) không thể thêm vào giỏ', async ({ page }) => {
    await page.goto('/menu');

    // Tìm món "Bánh Sừng Bò Bơ" (được đánh dấu Tạm hết theo chuẩn Figma)
    const soldOutCard = page
      .locator('[data-testid="product-card"]')
      .filter({ hasText: 'Bánh Sừng Bò Bơ' });
    await expect(soldOutCard).toBeVisible();

    // Kiểm tra thuộc tính data-sold-out="true"
    await expect(soldOutCard).toHaveAttribute('data-sold-out', 'true');

    // Kiểm tra có badge "Tạm hết"
    await expect(soldOutCard.getByText('Tạm hết').first()).toBeVisible();

    // Kiểm tra không có nút chọn món (+)
    const addBtn = soldOutCard.locator('button[aria-label="Chọn món Bánh Sừng Bò Bơ"]');
    await expect(addBtn).toHaveCount(0);

    // Click vào thẻ món tạm hết không kích hoạt thêm vào giỏ
    await soldOutCard.click();

    // Badge giỏ hàng trên Header vẫn phải là 0
    const cartLink = page.locator('header a[aria-label="Xem giỏ hàng"]');
    const badge = cartLink.locator('span');
    await expect(badge).toHaveText('0');
  });
});
