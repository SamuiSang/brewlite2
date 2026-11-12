import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductCategory } from '@prisma/client';

/**
 * Unit Test Jest cho ProductsController (Task 4 - Bước 3A - Phụ trách: Quang).
 * Kiểm thử Presentation Layer trong kiến trúc 3 tầng (ADR-003):
 * - Endpoint GET /api/v1/products.
 * - Endpoint GET /api/v1/products/:id.
 */
describe('ProductsController', () => {
  let controller: ProductsController;
  let mockProductsService: any;

  const mockProductResponse = [
    {
      id: 'prod-001',
      name: 'Cà phê Muối Côn Đảo',
      slug: 'ca-phe-muoi-con-dao',
      description: 'Cà phê Robusta Đắk Lắk ủ lạnh kết hợp kem muối béo mặn',
      category: ProductCategory.COFFEE,
      basePrice: 45000,
      imageUrl: '/images/drinks/ca-phe-muoi-con-dao.jpg',
      isActive: true,
      availableStock: 20,
      isSoldOut: false,
    },
  ];

  const mockProductDetail = {
    ...mockProductResponse[0],
    recipeItems: [
      {
        id: 'rec-1',
        ingredientId: 'ing-coffee',
        ingredientCode: 'ING-COFFEE-01',
        ingredientName: 'Hạt cà phê Robusta',
        ingredientUnit: 'gram',
        quantityRequired: 20,
      },
    ],
  };

  beforeEach(() => {
    mockProductsService = {
      findAll: jest.fn().mockResolvedValue(mockProductResponse),
      findOne: jest.fn().mockResolvedValue(mockProductDetail),
    };

    controller = new ProductsController(mockProductsService as ProductsService);
  });

  describe('findAll', () => {
    it('nên gọi productsService.findAll và trả về danh sách sản phẩm', async () => {
      const query = { category: ProductCategory.COFFEE, search: 'Muối' };
      const result = await controller.findAll(query);

      expect(mockProductsService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockProductResponse);
    });
  });

  describe('findOne', () => {
    it('nên gọi productsService.findOne với ID tương ứng', async () => {
      const result = await controller.findOne('prod-001');

      expect(mockProductsService.findOne).toHaveBeenCalledWith('prod-001');
      expect(result).toEqual(mockProductDetail);
    });
  });
});
