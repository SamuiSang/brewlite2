import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DiscountType, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService - Chức năng 4 (UC-04: Khởi tạo đơn & Khóa tồn kho Optimistic Locking)', () => {
  let service: OrdersService;
  let prisma: PrismaService;

  const mockProduct = {
    id: 'prod-uuid-1',
    name: 'Cà Phê Sữa Đá Sài Gòn',
    slug: 'ca-phe-sua-da',
    category: 'COFFEE',
    basePrice: '29000',
    isActive: true,
  };

  const mockIngredientRobusta = {
    id: 'ing-uuid-robusta',
    code: 'ING-ROBUSTA',
    name: 'Hạt Cà Phê Robusta',
    unit: 'g',
    stockQuantity: '500',
    version: 1,
  };

  const mockRecipeItem = {
    id: 'recipe-uuid-1',
    productId: 'prod-uuid-1',
    ingredientId: 'ing-uuid-robusta',
    quantityRequired: '25',
    ingredient: mockIngredientRobusta,
  };

  const mockUser = {
    id: 'user-uuid-1',
    email: 'customer@brewlite.vn',
    fullName: 'Nguyễn Văn Khách Hàng',
  };

  const mockPromotion = {
    id: 'promo-uuid-1',
    code: 'BREW20K',
    discountType: DiscountType.FIXED_AMOUNT,
    discountValue: '20000',
    minOrderValue: '50000',
    maxDiscountAmount: null,
    usageLimit: 100,
    usedCount: 5,
    isActive: true,
    startsAt: new Date(Date.now() - 10000),
    expiresAt: new Date(Date.now() + 1000000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn().mockResolvedValue(mockUser),
              findUnique: jest.fn().mockResolvedValue(mockUser),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder()', () => {
    it('1. Phải tính tiền 100% tại Server, bỏ qua hoàn toàn nếu client cố tình sửa giá', async () => {
      const mockTx = {
        product: {
          findUnique: jest.fn().mockResolvedValue(mockProduct),
        },
        recipeItem: {
          findMany: jest.fn().mockResolvedValue([mockRecipeItem]),
        },
        ingredient: {
          findUnique: jest.fn().mockResolvedValue(mockIngredientRobusta),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        promotion: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
        order: {
          create: jest.fn().mockImplementation(({ data }) => ({
            id: 'order-123',
            orderCode: data.orderCode,
            userId: data.userId,
            status: OrderStatus.PENDING,
            subtotalAmount: data.subtotalAmount,
            discountAmount: data.discountAmount,
            finalAmount: data.finalAmount,
            note: data.note,
            expiresAt: data.expiresAt,
            createdAt: new Date(),
            items: [
              {
                id: 'item-1',
                productId: mockProduct.id,
                productName: mockProduct.name,
                size: 'M',
                sugarLevel: '100%',
                iceLevel: '100%',
                toppingsJson: null,
                quantity: 2,
                unitPrice: 29000,
                lineTotal: 58000,
              },
            ],
          })),
        },
      };

      ((prisma as any).$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await service.createOrder({
        userId: mockUser.id,
        items: [
          {
            productId: mockProduct.id,
            size: 'M',
            quantity: 2,
          },
        ],
      });

      expect(result.success).toBe(true);
      // Đơn giá 29.000 * 2 = 58.000đ được tính trực tiếp từ database
      expect(result.order.subtotalAmount).toBe(58000);
      expect(result.order.finalAmount).toBe(58000);
      expect(mockTx.product.findUnique).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
      });
    });

    it('2. Phải áp dụng mã khuyến mãi hợp lệ và tăng usedCount trong transaction', async () => {
      const mockTx = {
        product: {
          findUnique: jest.fn().mockResolvedValue(mockProduct),
        },
        recipeItem: {
          findMany: jest.fn().mockResolvedValue([mockRecipeItem]),
        },
        ingredient: {
          findUnique: jest.fn().mockResolvedValue(mockIngredientRobusta),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        promotion: {
          findUnique: jest.fn().mockResolvedValue(mockPromotion),
          update: jest.fn().mockResolvedValue({ ...mockPromotion, usedCount: 6 }),
        },
        order: {
          create: jest.fn().mockImplementation(({ data }) => ({
            id: 'order-123',
            orderCode: data.orderCode,
            userId: data.userId,
            status: OrderStatus.PENDING,
            subtotalAmount: data.subtotalAmount,
            discountAmount: data.discountAmount,
            finalAmount: data.finalAmount,
            note: data.note,
            expiresAt: data.expiresAt,
            createdAt: new Date(),
            promotion: mockPromotion,
            items: [],
          })),
        },
      };

      ((prisma as any).$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await service.createOrder({
        userId: mockUser.id,
        promoCode: 'BREW20K',
        items: [
          {
            productId: mockProduct.id,
            size: 'M',
            quantity: 2, // 29.000 * 2 = 58.000đ (> minOrderValue 50.000đ)
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.order.subtotalAmount).toBe(58000);
      expect(result.order.discountAmount).toBe(20000);
      expect(result.order.finalAmount).toBe(38000); // 58.000 - 20.000 = 38.000đ
      expect(mockTx.promotion.update).toHaveBeenCalledWith({
        where: { id: mockPromotion.id },
        data: { usedCount: { increment: 1 } },
      });
    });

    it('3. Phải ném lỗi ConflictException (409) khi kho không đủ nguyên liệu theo định mức RecipeItem', async () => {
      const lowStockIngredient = {
        ...mockIngredientRobusta,
        stockQuantity: '10', // Chỉ còn 10g, trong khi 1 ly cần 25g
      };

      const mockTx = {
        product: {
          findUnique: jest.fn().mockResolvedValue(mockProduct),
        },
        recipeItem: {
          findMany: jest.fn().mockResolvedValue([mockRecipeItem]),
        },
        ingredient: {
          findUnique: jest.fn().mockResolvedValue(lowStockIngredient),
        },
      };

      ((prisma as any).$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await expect(
        service.createOrder({
          userId: mockUser.id,
          items: [{ productId: mockProduct.id, size: 'M', quantity: 1 }],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('4. Phải ném lỗi ConflictException (409) khi xảy ra va chạm đồng thời (Optimistic Lock version mismatch)', async () => {
      const mockTx = {
        product: {
          findUnique: jest.fn().mockResolvedValue(mockProduct),
        },
        recipeItem: {
          findMany: jest.fn().mockResolvedValue([mockRecipeItem]),
        },
        ingredient: {
          findUnique: jest.fn().mockResolvedValue(mockIngredientRobusta),
          // Mô phỏng đụng độ đồng thời: count === 0 do version đã bị đơn khác thay đổi
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
      };

      ((prisma as any).$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await expect(
        service.createOrder({
          userId: mockUser.id,
          items: [{ productId: mockProduct.id, size: 'M', quantity: 1 }],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('5. Phải ném lỗi BadRequestException khi giỏ hàng rỗng', async () => {
      await expect(
        service.createOrder({
          userId: mockUser.id,
          items: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
