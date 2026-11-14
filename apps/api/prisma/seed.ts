import { PrismaClient, UserRole, ProductCategory, DiscountType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- [BrewLite DB Seed] Bắt đầu nạp dữ liệu mẫu khởi tạo ---');

  // 1. DỌN DẸP DỮ LIỆU CŨ THEO THỨ TỰ RÀNG BUỘC KHÓA NGOẠI
  console.log('1. Đang làm sạch các bảng dữ liệu cũ...');
  await prisma.orderStatusLog.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.user.deleteMany();
  await prisma.idempotencyRecord.deleteMany();

  // 2. KHỞI TẠO NGUYÊN LIỆU KHO (INGREDIENTS & OCC VERSION)
  console.log('2. Đang nạp danh mục nguyên liệu pha chế (Raw Ingredients)...');
  const ingredientsData = [
    { code: 'ING-ROBUSTA', name: 'Hạt Cà Phê Robusta Đắk Lắk', unit: 'g', stockQuantity: 50000.0, minThreshold: 2000.0 },
    { code: 'ING-ARABICA', name: 'Hạt Cà Phê Arabica Cầu Đất', unit: 'g', stockQuantity: 30000.0, minThreshold: 1000.0 },
    { code: 'ING-MILK', name: 'Sữa Tươi Thanh Trùng Barista', unit: 'ml', stockQuantity: 100000.0, minThreshold: 5000.0 },
    { code: 'ING-CONDENSED', name: 'Sữa Đặc Có Đường Ngôi Sao', unit: 'ml', stockQuantity: 40000.0, minThreshold: 3000.0 },
    { code: 'ING-TEA-OOLONG', name: 'Cốt Trà Oolong Nướng Bảo Lộc', unit: 'ml', stockQuantity: 60000.0, minThreshold: 3000.0 },
    { code: 'ING-TEA-JASMINE', name: 'Cốt Trà Hoa Lài Thượng Hạng', unit: 'ml', stockQuantity: 50000.0, minThreshold: 2000.0 },
    { code: 'ING-PEACH-SYRUP', name: 'Siro Đào Tự Nhiên & Đào Miếng', unit: 'ml', stockQuantity: 25000.0, minThreshold: 1500.0 },
    { code: 'ING-MATCHA', name: 'Bột Trà Xanh Uji Nhật Bản', unit: 'g', stockQuantity: 10000.0, minThreshold: 800.0 },
    { code: 'ING-CARAMEL', name: 'Sốt Caramel Muối Đậm Đà', unit: 'ml', stockQuantity: 15000.0, minThreshold: 1000.0 },
    { code: 'ING-CROISSANT', name: 'Vỏ Bánh Croissant Cán Bơ Pháp', unit: 'item', stockQuantity: 100.0, minThreshold: 15.0 },
    { code: 'ING-CHEESE', name: 'Phô Mai Mozzarella & Cheddar', unit: 'g', stockQuantity: 12000.0, minThreshold: 1000.0 },
  ];

  const ingredientMap: Record<string, string> = {};
  for (const item of ingredientsData) {
    const created = await prisma.ingredient.create({
      data: {
        code: item.code,
        name: item.name,
        unit: item.unit,
        stockQuantity: item.stockQuantity,
        minThreshold: item.minThreshold,
        version: 0,
      },
    });
    ingredientMap[item.code] = created.id;
  }
  console.log(`-> Đã nạp thành công ${Object.keys(ingredientMap).length} nguyên liệu kho.`);

  // 3. KHỞI TẠO 10 MÓN ĐỒ UỐNG THỰC TẾ & CÔNG THỨC PHA CHẾ (BOM RECIPE)
  console.log('3. Đang nạp danh mục 10 món đồ uống thực tế & công thức định mức...');
  const productsData = [
    // --- 1. COFFEE ---
    {
      name: 'Cà Phê Sữa Đá Sài Gòn',
      slug: 'ca-phe-sua-da-sai-gon',
      description: 'Hạt Robusta Đắk Lắk pha phin truyền thống hòa quyện cùng sữa đặc béo ngậy.',
      category: ProductCategory.COFFEE,
      basePrice: 29000,
      imageUrl: '/images/products/ca-phe-sua-da.jpg',
      recipe: [
        { code: 'ING-ROBUSTA', qty: 25.0 },
        { code: 'ING-CONDENSED', qty: 40.0 },
      ],
    },
    {
      name: 'Bạc Xỉu 3 Tầng',
      slug: 'bac-xiu-3-tang',
      description: 'Hòa quyện giữa sữa tươi thanh trùng, sữa đặc dịu ngọt và một lớp cà phê thơm lừng.',
      category: ProductCategory.COFFEE,
      basePrice: 32000,
      imageUrl: '/images/products/bac-xiu.jpg',
      recipe: [
        { code: 'ING-ROBUSTA', qty: 15.0 },
        { code: 'ING-CONDENSED', qty: 30.0 },
        { code: 'ING-MILK', qty: 80.0 },
      ],
    },
    {
      name: 'Cà Phê Đen Đá Pha Phin',
      slug: 'ca-phe-den-da',
      description: 'Cà phê nguyên chất đậm đà, vị đắng thanh thuần túy dành cho người sành cà phê.',
      category: ProductCategory.COFFEE,
      basePrice: 25000,
      imageUrl: '/images/products/ca-phe-den-da.jpg',
      recipe: [
        { code: 'ING-ROBUSTA', qty: 30.0 },
      ],
    },

    // --- 2. TEA ---
    {
      name: 'Trà Đào Cam Sả Tươi',
      slug: 'tra-dao-cam-sa-tuoi',
      description: 'Cốt trà lài thơm ngát kết hợp cùng vị đào mọng nước và hương sả cam tươi sảng khoái.',
      category: ProductCategory.TEA,
      basePrice: 39000,
      imageUrl: '/images/products/tra-dao-cam-sa.jpg',
      recipe: [
        { code: 'ING-TEA-JASMINE', qty: 150.0 },
        { code: 'ING-PEACH-SYRUP', qty: 40.0 },
      ],
    },
    {
      name: 'Trà Sữa Oolong Nướng',
      slug: 'tra-sua-oolong-nuong',
      description: 'Trà Oolong nướng đậm đà, thơm lừng mùi khói đặc trưng kết hợp sữa tươi thanh béo.',
      category: ProductCategory.TEA,
      basePrice: 42000,
      imageUrl: '/images/products/tra-sua-oolong.jpg',
      recipe: [
        { code: 'ING-TEA-OOLONG', qty: 150.0 },
        { code: 'ING-MILK', qty: 60.0 },
        { code: 'ING-CONDENSED', qty: 25.0 },
      ],
    },
    {
      name: 'Trà Vải Hoa Lài Hạt Chia',
      slug: 'tra-vai-hoa-lai-hat-chia',
      description: 'Trà hoa lài thanh tao ướp hương vải ngọt thanh, bổ dưỡng với hạt chia giải nhiệt.',
      category: ProductCategory.TEA,
      basePrice: 39000,
      imageUrl: '/images/products/tra-vai-hoa-lai.jpg',
      recipe: [
        { code: 'ING-TEA-JASMINE', qty: 160.0 },
        { code: 'ING-PEACH-SYRUP', qty: 30.0 },
      ],
    },

    // --- 3. FREEZE ---
    {
      name: 'Matcha Uji Đá Xay',
      slug: 'matcha-uji-da-xay',
      description: 'Bột Matcha Uji chuẩn Nhật Bản xay nhuyễn cùng sữa tươi và lớp kem tươi mịn màng.',
      category: ProductCategory.FREEZE,
      basePrice: 49000,
      imageUrl: '/images/products/matcha-da-xay.jpg',
      recipe: [
        { code: 'ING-MATCHA', qty: 15.0 },
        { code: 'ING-MILK', qty: 100.0 },
        { code: 'ING-CONDENSED', qty: 20.0 },
      ],
    },
    {
      name: 'Caramel Macchiato Freeze',
      slug: 'caramel-macchiato-freeze',
      description: 'Đá xay sốt caramel muối béo ngậy kết hợp espresso Arabica đậm hương vị cà phê.',
      category: ProductCategory.FREEZE,
      basePrice: 52000,
      imageUrl: '/images/products/caramel-freeze.jpg',
      recipe: [
        { code: 'ING-ARABICA', qty: 18.0 },
        { code: 'ING-CARAMEL', qty: 35.0 },
        { code: 'ING-MILK', qty: 80.0 },
      ],
    },

    // --- 4. PASTRY ---
    {
      name: 'Bánh Croissant Bơ Tỏi Nướng',
      slug: 'croissant-bo-toi-nuong',
      description: 'Bánh sừng bò ngàn lớp thơm lừng bơ tỏi Pháp, giòn rụm bên ngoài và mềm xốp bên trong.',
      category: ProductCategory.PASTRY,
      basePrice: 35000,
      imageUrl: '/images/products/croissant-bo-toi.jpg',
      recipe: [
        { code: 'ING-CROISSANT', qty: 1.0 },
      ],
    },
    {
      name: 'Bánh Mì Phô Mai Chảy',
      slug: 'banh-mi-pho-mai-chay',
      description: 'Bánh mì nướng nóng hổi tràn ngập phô mai mozzarella kéo sợi béo ngậy tan chảy.',
      category: ProductCategory.PASTRY,
      basePrice: 39000,
      imageUrl: '/images/products/banh-mi-pho-mai.jpg',
      recipe: [
        { code: 'ING-CHEESE', qty: 80.0 },
      ],
    },
  ];

  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category,
        basePrice: p.basePrice,
        imageUrl: p.imageUrl,
        isActive: true,
        version: 0,
      },
    });

    for (const r of p.recipe) {
      await prisma.recipeItem.create({
        data: {
          productId: product.id,
          ingredientId: ingredientMap[r.code],
          quantityRequired: r.qty,
        },
      });
    }
  }
  console.log(`-> Đã nạp thành công 10 món đồ uống & bánh kèm đầy đủ định mức công thức RecipeItem.`);

  // 4. KHỞI TẠO MÃ KHUYẾN MÃI / VOUCHER (PROMOTIONS)
  console.log('4. Đang nạp danh mục mã khuyến mãi Voucher...');
  const promotionsData = [
    {
      code: 'BREWNEW',
      description: 'Dành cho khách hàng mới',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20.0,
      minOrderValue: 50000.0,
      maxDiscountAmount: 30000.0,
      usageLimit: 1000,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Hết hạn sau 90 ngày
    },
    {
      code: 'BREW20K',
      description: 'Áp dụng toàn thực đơn',
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 20000.0,
      minOrderValue: 80000.0,
      maxDiscountAmount: null,
      usageLimit: 500,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const promo of promotionsData) {
    await prisma.promotion.create({ data: promo });
  }
  console.log(`-> Đã nạp thành công ${promotionsData.length} mã khuyến mãi.`);

  // 5. KHỞI TẠO TÀI KHOẢN NGƯỜI DÙNG MẪU (USERS VỚI MẬT KHẨU BĂM BCRYPT)
  console.log('5. Đang nạp tài khoản người dùng mẫu (Khách hàng, Barista, Admin)...');
  // Mật khẩu chung đã băm bcrypt (saltRounds = 10) cho chuỗi "Password123@":
  const defaultPasswordHash = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW';

  await prisma.user.create({
    data: {
      email: 'customer@brewlite.vn',
      fullName: 'Nguyễn Văn Khách Hàng',
      phone: '0901234567',
      passwordHash: defaultPasswordHash,
      role: UserRole.CUSTOMER,
      loyaltyPoints: 120, // Đã tích lũy sẵn 120 điểm
    },
  });

  await prisma.user.create({
    data: {
      email: 'barista@brewlite.vn',
      fullName: 'Trần Thu Ngân (Barista Quầy)',
      phone: '0912345678',
      passwordHash: defaultPasswordHash,
      role: UserRole.STAFF,
      loyaltyPoints: 0,
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@brewlite.vn',
      fullName: 'Quản Trị Viên BrewLite Store',
      phone: '0988888888',
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      loyaltyPoints: 0,
    },
  });
  console.log('-> Đã tạo 3 tài khoản người dùng mẫu (customer@brewlite.vn, barista@brewlite.vn, admin@brewlite.vn).');

  console.log('--- [BrewLite DB Seed] Hoàn tất nạp dữ liệu mẫu 100% thành công! ---');
}

main()
  .catch((e) => {
    console.error('Lỗi trong quá trình nạp dữ liệu DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
