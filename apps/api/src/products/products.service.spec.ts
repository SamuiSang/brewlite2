import { NotFoundException } from '@nestjs/common';
import { ProductCategory } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unit Test Jest cho ProductsService (Task 4 - Bước 3A - Phụ trách: Quang).
 * Kiểm thử toàn diện tầng Business Logic Layer (ADR-003):
 * - Tra cứu danh sách thực đơn (findAll) kèm cờ tồn kho khả dụng (availableStock, isSoldOut).
 * - Lọc danh mục (category) và tìm kiếm từ khóa (search).
 * - Thuật toán tính định mức nguyên liệu thô (BOM - RecipeItem).
 * - Tra cứu chi tiết sản phẩm (findOne) và xử lý ngoại lệ NotFoundException (404).
 */
describe('ProductsService', () => {
  let service: ProductsService;
  let mockPrisma: any;

  const mockDate = new Date('2026-11-10T00:00:00.000Z');

  const mockProductCoffee = {
    id: 'prod-001-uuid',
    name: 'Cà phê Muối Côn Đảo',
    slug: 'ca-phe-muoi-con-dao',
    description: 'Cà phê Robusta Đắk Lắk ủ lạnh kết hợp kem muối béo mặn',
    category: ProductCategory.COFFEE,
    basePrice: 45000,
    imageUrl: '/images/drinks/ca-phe-muoi-con-dao.jpg',
    isActive: true,
    createdAt: mockDate,
    updatedAt: mockDate,
    recipeItems: [
      {
        id: 'rec-1',
        productId: 'prod-001-uuid',
        ingredientId: 'ing-coffee',
        quantityRequired: 20,
        ingredient: {
          id: 'ing-coffee',
          code: 'ING-COFFEE-01',
          name: 'Hạt cà phê Robusta',
          unit: 'gram',
          stockQuantity: 1000, // 1000 / 20 = 50 ly
        },
      },
      {
        id: 'rec-2',
        productId: 'prod-001-uuid',
        ingredientId: 'ing-salt-cream',
        quantityRequired: 30,
        ingredient: {
          id: 'ing-salt-cream',
          code: 'ING-CREAM-01',
          name: 'Kem béo mặn Côn Đảo',
          unit: 'ml',
          stockQuantity: 600, // 600 / 30 = 20 ly (yếu tố giới hạn)
        },
      },
    ],
  };

  const mockProductSoldOut = {
    id: 'prod-002-uuid',
    name: 'Bánh Sừng Bò Bơ',
    slug: 'banh-sung-bo-bo',
    description: 'Bánh sừng bò bơ Pháp ngàn lớp thơm ngậy',
    category: ProductCategory.PASTRY,
    basePrice: 38000,
    imageUrl: '/images/drinks/banh-sung-bo-bo.jpg',
    isActive: true,
    createdAt: mockDate,
    updatedAt: mockDate,
    recipeItems: [
      {
        id: 'rec-3',
        productId: 'prod-002-uuid',
        ingredientId: 'ing-flour',
        quantityRequired: 1,
        ingredient: {
          id: 'ing-flour',
          code: 'ING-PASTRY-01',
          name: 'Bột bánh sừng bò đông lạnh',
          unit: 'cái',
          stockQuantity: 0, // Hết hàng: 0 / 1 = 0 ly
        },
      },
    ],
  };

  const mockProductNoRecipe = {
    id: 'prod-003-uuid',
    name: 'Nước suối đóng chai',
    slug: 'nuoc-suoi-dong-chai',
    description: 'Nước khoáng thiên nhiên 500ml',
    category: ProductCategory.FREEZE,
    basePrice: 15000,
    imageUrl: null,
    isActive: true,
    createdAt: mockDate,
    updatedAt: mockDate,
    recipeItems: [], // Không gắn định mức nguyên liệu
  };

  beforeEach(() => {
    mockPrisma = {
      product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    service = new ProductsService(mockPrisma as PrismaService);
  });

  describe('findAll', () => {
    it('nên trả về toàn bộ danh sách món đang hoạt động và tính tồn kho khả dụng', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        mockProductCoffee,
        mockProductSoldOut,
        mockProductNoRecipe,
      ]);

      const result = await service.findAll();

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          recipeItems: {
            include: { ingredient: true },
          },
        },
        orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
      });

      expect(result).toHaveLength(3);

      // Cà phê Muối: Tồn kho giới hạn theo kem muối (20 ly), chưa hết hàng
      expect(result[0].id).toBe('prod-001-uuid');
      expect(result[0].availableStock).toBe(20);
      expect(result[0].isSoldOut).toBe(false);
      expect(result[0].basePrice).toBe(45000);

      // Bánh Sừng Bò: Bột đông lạnh = 0 -> availableStock = 0, isSoldOut = true
      expect(result[1].id).toBe('prod-002-uuid');
      expect(result[1].availableStock).toBe(0);
      expect(result[1].isSoldOut).toBe(true);

      // Món không có recipeItems: Mặc định 999 ly khả dụng
      expect(result[2].id).toBe('prod-003-uuid');
      expect(result[2].availableStock).toBe(999);
      expect(result[2].isSoldOut).toBe(false);
    });

    it('nên truyền bộ lọc category vào truy vấn Prisma khi có tham số category', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProductCoffee]);

      const result = await service.findAll({ category: ProductCategory.COFFEE });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            category: ProductCategory.COFFEE,
          },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe(ProductCategory.COFFEE);
    });

    it('nên tìm kiếm theo từ khóa không phân biệt hoa thường khi có tham số search', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProductCoffee]);

      const result = await service.findAll({ search: '  Côn Đảo  ' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            OR: [
              { name: { contains: 'Côn Đảo', mode: 'insensitive' } },
              { slug: { contains: 'Côn Đảo', mode: 'insensitive' } },
              { description: { contains: 'Côn Đảo', mode: 'insensitive' } },
            ],
          },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('nên trả về chi tiết sản phẩm kèm danh sách recipeItems khi tìm thấy bằng UUID', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(mockProductCoffee);

      const result = await service.findOne('prod-001-uuid');

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ id: 'prod-001-uuid' }, { slug: 'prod-001-uuid' }],
          isActive: true,
        },
        include: {
          recipeItems: {
            include: { ingredient: true },
          },
        },
      });

      expect(result.id).toBe('prod-001-uuid');
      expect(result.name).toBe('Cà phê Muối Côn Đảo');
      expect(result.availableStock).toBe(20);
      expect(result.recipeItems).toHaveLength(2);
      expect(result.recipeItems[0]).toEqual({
        id: 'rec-1',
        ingredientId: 'ing-coffee',
        ingredientCode: 'ING-COFFEE-01',
        ingredientName: 'Hạt cà phê Robusta',
        ingredientUnit: 'gram',
        quantityRequired: 20,
      });
    });

    it('nên trả về chi tiết sản phẩm khi tìm thấy bằng Slug', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(mockProductCoffee);

      const result = await service.findOne('ca-phe-muoi-con-dao');

      expect(result.slug).toBe('ca-phe-muoi-con-dao');
      expect(result.availableStock).toBe(20);
    });

    it('nên ném ngoại lệ NotFoundException (HTTP 404) khi không tìm thấy món', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Không tìm thấy sản phẩm với mã "non-existent-id" hoặc sản phẩm đã ngừng phục vụ.',
      );
    });
  });
});
