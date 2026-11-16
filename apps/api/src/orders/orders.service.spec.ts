import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DiscountType, OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';
import { OrderCancelScenario } from './dto/update-order-status.dto';

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

  describe('Module 6 - Anti-IDOR, State Machine & 4 Kịch bản Hủy Đơn Hoàn Kho', () => {
    const baseOrderRecord = {
      id: 'order-uuid-601',
      orderCode: 'BL-20261115-6010',
      userId: 'user-owner-A',
      promotionId: 'promo-uuid-1',
      status: OrderStatus.PENDING,
      subtotalAmount: '73000',
      discountAmount: '20000',
      loyaltyPointsUsed: 15,
      finalAmount: '53000',
      note: 'Quầy Quận 1',
      expiresAt: new Date(Date.now() + 600000),
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
          unitPrice: '36500',
          lineTotal: '73000',
        },
      ],
      promotion: { code: 'BREW20K' },
      payment: null,
      statusLogs: [],
      user: { id: 'user-owner-A', fullName: 'Hàn Minh Hiếu', email: 'hieu@brewlite.vn', phone: '0901234567' },
    };

    it('ORD-T02: Chặn Anti-IDOR (403 Forbidden) khi Khách B truy cập biên nhận của Khách A', async () => {
      (prisma as any).order = {
        findUnique: jest.fn().mockResolvedValue(baseOrderRecord),
      };

      await expect(
        service.getOrderById(baseOrderRecord.id, { userId: 'user-other-B', role: 'CUSTOMER' }),
      ).rejects.toThrow(ForbiddenException);

      // Chủ đơn (Customer A) hoặc Barista (STAFF) được phép xem
      const ownerRes = await service.getOrderById(baseOrderRecord.id, {
        userId: 'user-owner-A',
        role: 'CUSTOMER',
      });
      expect(ownerRes.orderCode).toBe(baseOrderRecord.orderCode);
    });

    it('AC-06.04 & AC-06.05: Chuyển trạng thái hợp lệ PAID -> PREPARING -> COMPLETED và từ chối nhảy cóc PENDING -> COMPLETED', async () => {
      (prisma as any).order = {
        findUnique: jest.fn().mockResolvedValue({ ...baseOrderRecord, status: OrderStatus.PENDING }),
      };

      await expect(
        service.updateOrderStatus(baseOrderRecord.id, OrderStatus.COMPLETED, {
          userId: 'staff-1',
          role: 'STAFF',
        }),
      ).rejects.toThrow(BadRequestException);

      (prisma as any).order.findUnique.mockResolvedValue({ ...baseOrderRecord, status: OrderStatus.PAID });
      const mockTx = {
        order: {
          update: jest.fn().mockResolvedValue({ ...baseOrderRecord, status: OrderStatus.PREPARING }),
        },
        orderStatusLog: { create: jest.fn().mockResolvedValue({}) },
      };
      ((prisma as any).$transaction as jest.Mock).mockImplementation(async (cb) => await cb(mockTx));

      const res = await service.updateOrderStatus(baseOrderRecord.id, OrderStatus.PREPARING, {
        userId: 'staff-1',
        role: 'STAFF',
      });
      expect(res.order.status).toBe(OrderStatus.PREPARING);
    });

    it('Kịch bản Hủy #1 (ONLINE_CUSTOMER_CANCEL): Khách tự hủy đơn PENDING -> hoàn nguyên liệu, voucher và điểm Hạt', async () => {
      (prisma as any).order = {
        findUnique: jest.fn().mockResolvedValue(baseOrderRecord),
      };

      const mockTx = {
        order: {
          update: jest.fn().mockResolvedValue({ ...baseOrderRecord, status: OrderStatus.CANCELLED }),
        },
        recipeItem: {
          findMany: jest.fn().mockResolvedValue([mockRecipeItem]),
        },
        ingredient: {
          update: jest.fn().mockResolvedValue({}),
        },
        promotion: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        loyaltyTransaction: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
        },
        user: {
          update: jest.fn().mockResolvedValue({}),
        },
        orderStatusLog: {
          create: jest.fn().mockResolvedValue({}),
        },
      };
      ((prisma as any).$transaction as jest.Mock).mockImplementation(async (cb) => await cb(mockTx));

      const res = await service.cancelOrder(
        baseOrderRecord.id,
        { scenario: OrderCancelScenario.ONLINE_CUSTOMER_CANCEL, reason: 'Đổi ý' },
        { userId: 'user-owner-A', role: 'CUSTOMER' },
      );

      expect(res.order.status).toBe(OrderStatus.CANCELLED);
      // 25g * 2 ly = 50g được cộng trả về kho + version tăng 1
      expect(mockTx.ingredient.update).toHaveBeenCalledWith({
        where: { id: mockRecipeItem.ingredientId },
        data: { stockQuantity: { increment: 50 }, version: { increment: 1 } },
      });
      expect(mockTx.promotion.updateMany).toHaveBeenCalled();
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-owner-A' },
        data: { loyaltyPoints: { increment: 15 } },
      });
    });

    it('Kịch bản Hủy #2 (PAYMENT_TIMEOUT_TTL): Tự động hủy đơn PENDING quá hạn expiresAt và nhả kho', async () => {
      const expiredOrder = {
        ...baseOrderRecord,
        expiresAt: new Date(Date.now() - 60000),
        payment: { id: 'pay-1', status: PaymentStatus.PENDING },
      };
      (prisma as any).order = {
        findMany: jest.fn().mockResolvedValue([expiredOrder]),
      };

      const mockTx = {
        order: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        recipeItem: { findMany: jest.fn().mockResolvedValue([mockRecipeItem]) },
        ingredient: { update: jest.fn().mockResolvedValue({}) },
        promotion: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        loyaltyTransaction: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
        },
        user: { update: jest.fn().mockResolvedValue({}) },
        payment: { update: jest.fn().mockResolvedValue({}) },
        orderStatusLog: { create: jest.fn().mockResolvedValue({}) },
      };
      ((prisma as any).$transaction as jest.Mock).mockImplementation(async (cb) => await cb(mockTx));

      const ttlRes = await service.expireOverdueOrders('user-owner-A');
      expect(ttlRes.expiredCount).toBe(1);
      expect(ttlRes.expiredOrderCodes).toContain(expiredOrder.orderCode);
      expect(mockTx.payment.update).toHaveBeenCalledWith({
        where: { orderId: expiredOrder.id },
        data: { status: PaymentStatus.FAILED },
      });
      expect(mockTx.ingredient.update).toHaveBeenCalledWith({
        where: { id: mockRecipeItem.ingredientId },
        data: { stockQuantity: { increment: 50 }, version: { increment: 1 } },
      });
    });

    it('Kịch bản Hủy #3 (OFFLINE_COUNTER_CANCEL): Chỉ STAFF/ADMIN được hủy tại quầy, CUSTOMER bị chặn 403', async () => {
      (prisma as any).order = {
        findUnique: jest.fn().mockResolvedValue(baseOrderRecord),
      };

      await expect(
        service.cancelOrder(
          baseOrderRecord.id,
          { scenario: OrderCancelScenario.OFFLINE_COUNTER_CANCEL },
          { userId: 'user-owner-A', role: 'CUSTOMER' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Kịch bản Hủy #4 (OUT_OF_STOCK_REFUND): Đơn đã PAID hết nguyên liệu -> hoàn tiền Payment.REFUNDED & hoàn kho', async () => {
      const paidOrder = {
        ...baseOrderRecord,
        status: OrderStatus.PAID,
        payment: { id: 'pay-paid-1', status: PaymentStatus.SUCCESS },
      };
      (prisma as any).order = {
        findUnique: jest.fn().mockResolvedValue(paidOrder),
      };

      const mockTx = {
        order: {
          update: jest.fn().mockResolvedValue({ ...paidOrder, status: OrderStatus.CANCELLED }),
        },
        recipeItem: { findMany: jest.fn().mockResolvedValue([mockRecipeItem]) },
        ingredient: { update: jest.fn().mockResolvedValue({}) },
        promotion: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        loyaltyTransaction: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
        },
        user: { update: jest.fn().mockResolvedValue({}) },
        payment: { update: jest.fn().mockResolvedValue({ status: PaymentStatus.REFUNDED }) },
        orderStatusLog: { create: jest.fn().mockResolvedValue({}) },
      };
      ((prisma as any).$transaction as jest.Mock).mockImplementation(async (cb) => await cb(mockTx));

      const res = await service.cancelOrder(
        paidOrder.id,
        {
          scenario: OrderCancelScenario.OUT_OF_STOCK_REFUND,
          reason: 'Quầy hết kem cheese bất khả kháng',
        },
        { userId: 'staff-1', role: 'STAFF' },
      );

      expect(res.refundIssued).toBe(true);
      expect(res.order.status).toBe(OrderStatus.CANCELLED);
      expect(mockTx.payment.update).toHaveBeenCalledWith({
        where: { orderId: paidOrder.id },
        data: { status: PaymentStatus.REFUNDED },
      });
    });
  });
});
