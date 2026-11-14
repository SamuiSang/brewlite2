import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';
import { DeliveryMethod } from './dto/create-order.dto';

/**
 * Concurrency Test cho Task 5 (Bước 6):
 * Kịch bản: 2 khách hàng gửi request đồng thời mua 1 ly cà phê cuối cùng.
 * Mục tiêu: Chứng minh cơ chế Optimistic Locking (cột version & stockQuantity)
 * đảm bảo tính nhất quán (ACID Isolation):
 * - Chính xác 1 request thành công (201 Created)
 * - Request còn lại bị từ chối với 409 ConflictException (CONCURRENCY_CONFLICT hoặc INSUFFICIENT_INGREDIENT)
 * - Tồn kho nguyên liệu giảm về đúng 0, tuyệt đối không bị âm
 */
describe('OrdersService - Concurrency & Race Condition Test (2 khách mua ly cuối cùng)', () => {
  let service: OrdersService;

  const mockProduct = {
    id: 'prod-concurrency-1',
    name: 'Cà phê Muối Côn Đảo',
    slug: 'ca-phe-muoi-con-dao',
    category: 'COFFEE',
    basePrice: '45000',
    isActive: true,
  };

  const mockRecipeItem = {
    id: 'recipe-concurrency-1',
    productId: 'prod-concurrency-1',
    ingredientId: 'ing-robusta-last-shot',
    quantityRequired: '25', // Cần 25g bột cà phê cho 1 ly
    ingredient: {
      id: 'ing-robusta-last-shot',
      name: 'Hạt cà phê Robusta',
      unit: 'g',
    },
  };

  // Giả lập trạng thái Database nội bộ để mô phỏng chính xác tranh chấp đồng thời
  let dbIngredient = {
    id: 'ing-robusta-last-shot',
    code: 'ING-ROBUSTA',
    name: 'Hạt cà phê Robusta',
    unit: 'g',
    stockQuantity: 25, // Chỉ còn đúng 25g - vừa vặn cho 1 ly duy nhất!
    version: 1,        // Phiên bản ban đầu = 1
  };

  beforeEach(async () => {
    // Reset database state trước mỗi ca test
    dbIngredient = {
      id: 'ing-robusta-last-shot',
      code: 'ING-ROBUSTA',
      name: 'Hạt cà phê Robusta',
      unit: 'g',
      stockQuantity: 25,
      version: 1,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn().mockResolvedValue({ id: 'user-any', email: 'guest@brewlite.vn' }),
              findUnique: jest.fn().mockResolvedValue({ id: 'user-any', email: 'guest@brewlite.vn' }),
            },
            $transaction: jest.fn().mockImplementation(async (callback) => {
              // Mô phỏng transaction với race condition:
              // Hai request đọc dữ liệu gần như cùng lúc
              const tx = {
                product: {
                  findUnique: jest.fn().mockResolvedValue(mockProduct),
                },
                recipeItem: {
                  findMany: jest.fn().mockResolvedValue([mockRecipeItem]),
                },
                ingredient: {
                  findUnique: jest.fn().mockImplementation(async () => ({
                    ...dbIngredient,
                    stockQuantity: String(dbIngredient.stockQuantity),
                  })),
                  updateMany: jest.fn().mockImplementation(async ({ where }) => {
                    // Kiểm tra điều kiện Optimistic Locking nguyên tử:
                    // WHERE id = ... AND version = currentVersion AND stockQuantity >= requiredQty
                    if (
                      where.id === dbIngredient.id &&
                      where.version === dbIngredient.version &&
                      dbIngredient.stockQuantity >= 25
                    ) {
                      // Cập nhật thành công: trừ kho và tăng version
                      dbIngredient.stockQuantity -= 25;
                      dbIngredient.version += 1;
                      return { count: 1 };
                    }
                    // Nếu version bị lệch hoặc kho không đủ -> 0 rows affected
                    return { count: 0 };
                  }),
                },
                promotion: {
                  findUnique: jest.fn().mockResolvedValue(null),
                },
                order: {
                  create: jest.fn().mockImplementation(({ data }) => ({
                    id: 'order-' + Math.random().toString(36).substring(7),
                    orderCode: 'BL-TEST-' + Math.floor(1000 + Math.random() * 9000),
                    status: 'PENDING',
                    subtotalAmount: data.subtotalAmount,
                    discountAmount: data.discountAmount,
                    finalAmount: data.finalAmount,
                    items: [],
                  })),
                },
              };

              return await callback(tx);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('2 khách hàng đồng thời gửi request mua 1 ly cuối: 1 khách thành công, 1 khách nhận 409 Conflict, kho còn đúng 0g', async () => {
    const customerOrderPayload = {
      items: [
        {
          productId: mockProduct.id,
          size: 'M' as const,
          quantity: 1, // Cần 25g
        },
      ],
      deliveryMethod: DeliveryMethod.PICKUP,
    };

    // Bắn 2 request hoàn toàn song song qua Promise.allSettled
    const [resultA, resultB] = await Promise.allSettled([
      service.createOrder(customerOrderPayload),
      service.createOrder(customerOrderPayload),
    ]);

    const results = [resultA, resultB];
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // 1. Phải có chính xác 1 đơn hàng thành công
    expect(fulfilled.length).toBe(1);
    const successOrder = (fulfilled[0] as PromiseFulfilledResult<any>).value;
    expect(successOrder.success).toBe(true);
    expect(successOrder.order.status).toBe('PENDING');

    // 2. Phải có chính xác 1 đơn hàng bị từ chối với lỗi ConflictException (409)
    expect(rejected.length).toBe(1);
    const failedReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(failedReason).toBeInstanceOf(ConflictException);
    expect(failedReason.getStatus()).toBe(409);

    // 3. Tồn kho nguyên liệu còn lại phải bằng chính xác 0g (tuyệt đối không âm)
    expect(dbIngredient.stockQuantity).toBe(0);

    // 4. Version của nguyên liệu đã tăng đúng 1 lần (từ 1 lên 2)
    expect(dbIngredient.version).toBe(2);
  });
});

