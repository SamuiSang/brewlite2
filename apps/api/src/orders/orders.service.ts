import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DiscountType,
  LoyaltyTxType,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderCancelScenario } from './dto/update-order-status.dto';

interface CalculatedItem {
  productId: string;
  productName: string;
  size: string;
  sugarLevel: string;
  iceLevel: string;
  toppings: string[] | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Chuẩn hóa dữ liệu đơn hàng trả về cho Client (loại bỏ Decimal thô của Prisma)
   */
  private formatOrder(order: any): OrderResponseDto['order'] {
    return {
      id: order.id,
      orderCode: order.orderCode,
      userId: order.userId,
      status: order.status,
      subtotalAmount: Number(order.subtotalAmount),
      discountAmount: Number(order.discountAmount),
      loyaltyPointsUsed: order.loyaltyPointsUsed ?? 0,
      finalAmount: Number(order.finalAmount),
      note: order.note ?? null,
      expiresAt: order.expiresAt ?? null,
      createdAt: order.createdAt,
      customerName: order.user?.fullName || null,
      promotionCode: order.promotion?.code || null,
      items: (order.items || []).map((it: any) => ({
        id: it.id,
        productId: it.productId,
        productName: it.productName,
        size: it.size,
        sugarLevel: it.sugarLevel,
        iceLevel: it.iceLevel,
        toppings: it.toppingsJson,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        lineTotal: Number(it.lineTotal),
      })),
      ...(order.payment
        ? {
            payment: {
              id: order.payment.id,
              method: order.payment.method,
              status: order.payment.status,
              amount: Number(order.payment.amount),
              transactionRef: order.payment.transactionRef ?? null,
              paidAt: order.payment.paidAt ?? null,
            },
          }
        : {}),
      ...(order.statusLogs
        ? {
            statusLogs: order.statusLogs.map((log: any) => ({
              id: log.id,
              previousStatus: log.previousStatus ?? null,
              newStatus: log.newStatus,
              changedBy: log.changedBy ?? null,
              reason: log.reason ?? null,
              createdAt: log.createdAt,
            })),
          }
        : {}),
    };
  }

  /**
   * Khởi tạo đơn hàng với cơ chế tính tiền 100% tại Server & Khóa tồn kho Optimistic Locking
   * Tuân thủ kiến trúc phân tầng 3-Tier và đặc tả UC-04 (FR-05)
   */
  async createOrder(dto: CreateOrderDto): Promise<OrderResponseDto> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng không được rỗng. Vui lòng chọn ít nhất 1 món.');
    }

    // 1. Xác định User khởi tạo đơn (nếu chưa truyền userId, gán khách hàng mẫu từ seed)
    let targetUserId = dto.userId;
    if (!targetUserId) {
      const defaultUser = await this.prisma.user.findFirst({
        where: { email: 'customer@brewlite.vn' },
      });
      if (!defaultUser) {
        throw new BadRequestException(
          'Không tìm thấy thông tin tài khoản người dùng để khởi tạo đơn hàng.',
        );
      }
      targetUserId = defaultUser.id;
    } else {
      const userExists = await this.prisma.user.findUnique({
        where: { id: targetUserId },
      });
      if (!userExists) {
        throw new NotFoundException(`Người dùng với ID ${targetUserId} không tồn tại.`);
      }
    }

    // 2. Thực thi toàn bộ chuỗi nghiệp vụ trong một Database Transaction duy nhất
    return await this.prisma.$transaction(async (tx) => {
      // ----------------------------------------------------------------------
      // BƯỚC 1: TÍNH TOÁN LẠI ĐƠN GIÁ 100% TỪ BẢNG PRODUCT (SERVER-SIDE PRICING)
      // Tuyệt đối không sử dụng giá gửi lên từ Client để ngăn ngừa gian lận giá
      // ----------------------------------------------------------------------
      const calculatedItems: CalculatedItem[] = [];
      let subtotalAmount = 0;

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || !product.isActive) {
          throw new ConflictException(
            `Món "${product?.name || item.productId}" hiện không khả dụng hoặc đã ngừng kinh doanh.`,
          );
        }

        const basePrice = Number(product.basePrice);

        // Phụ thu theo Size (S: -5.000đ nếu >20.000, M: 0đ chuẩn, L: +8.000đ)
        let sizeSurcharge = 0;
        if (item.size === 'L') {
          sizeSurcharge = 8000;
        } else if (item.size === 'S' && basePrice > 15000) {
          sizeSurcharge = -5000;
        }

        // Phụ thu theo Toppings (10.000đ/topping theo menu chuẩn Figma)
        const toppingCount = Array.isArray(item.toppings) ? item.toppings.length : 0;
        const toppingsSurcharge = toppingCount * 10000;

        const unitPrice = Math.max(0, basePrice + sizeSurcharge + toppingsSurcharge);
        const lineTotal = unitPrice * item.quantity;
        subtotalAmount += lineTotal;

        calculatedItems.push({
          productId: product.id,
          productName: product.name,
          size: item.size,
          sugarLevel: item.sugarLevel || '100%',
          iceLevel: item.iceLevel || '100%',
          toppings: item.toppings || null,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        });
      }

      // ----------------------------------------------------------------------
      // BƯỚC 2: TẬP HỢP TỔNG NHU CẦU NGUYÊN VẬT LIỆU THEO CÔNG THỨC RECIPEITEM
      // ----------------------------------------------------------------------
      const ingredientDemands = new Map<
        string,
        { required: number; name: string; unit: string }
      >();

      for (const item of dto.items) {
        const recipes = await tx.recipeItem.findMany({
          where: { productId: item.productId },
          include: { ingredient: true },
        });

        for (const recipe of recipes) {
          const current = ingredientDemands.get(recipe.ingredientId) || {
            required: 0,
            name: recipe.ingredient.name,
            unit: recipe.ingredient.unit,
          };
          current.required += Number(recipe.quantityRequired) * item.quantity;
          ingredientDemands.set(recipe.ingredientId, current);
        }
      }

      // ----------------------------------------------------------------------
      // BƯỚC 3: ĐỐI SOÁT & TRỪ TỒN KHO NGUYÊN LIỆU VỚI OPTIMISTIC LOCKING
      // Khóa lạc quan kiểm tra đồng thời version và stockQuantity >= required
      // ----------------------------------------------------------------------
      for (const [ingredientId, demand] of ingredientDemands.entries()) {
        const ingredient = await tx.ingredient.findUnique({
          where: { id: ingredientId },
        });

        const currentStock = ingredient ? Number(ingredient.stockQuantity) : 0;

        if (!ingredient || currentStock < demand.required) {
          throw new ConflictException({
            statusCode: 409,
            error: 'INSUFFICIENT_INGREDIENT',
            message: `Không đủ nguyên vật liệu: ${demand.name} (cần ${demand.required} ${demand.unit}, trong kho còn ${currentStock} ${demand.unit}). Vui lòng chọn món khác hoặc giảm số lượng.`,
          });
        }

        // Cập nhật nguyên tử có điều kiện version và stockQuantity
        const updateResult = await tx.ingredient.updateMany({
          where: {
            id: ingredientId,
            version: ingredient.version,
            stockQuantity: { gte: demand.required },
          },
          data: {
            stockQuantity: { decrement: demand.required },
            version: { increment: 1 },
          },
        });

        // Nếu count === 0: Có transaction khác commit trước làm lệch version hoặc hết kho
        if (updateResult.count === 0) {
          throw new ConflictException({
            statusCode: 409,
            error: 'CONCURRENCY_CONFLICT',
            message: `Xung đột đồng thời khi cập nhật nguyên liệu: ${demand.name}. Vui lòng thử lại.`,
          });
        }
      }

      // ----------------------------------------------------------------------
      // BƯỚC 4: THẨM ĐỊNH & ÁP DỤNG MÃ KHUYẾN MÃI (PROMOTION)
      // ----------------------------------------------------------------------
      let appliedPromotionId: string | null = null;
      let discountAmount = 0;

      if (dto.promoCode && dto.promoCode.trim().length > 0) {
        const normalizedCode = dto.promoCode.trim().toUpperCase();
        const promo = await tx.promotion.findUnique({
          where: { code: normalizedCode },
        });

        if (!promo || !promo.isActive) {
          throw new BadRequestException(
            `Mã ưu đãi "${normalizedCode}" không tồn tại hoặc đã bị tạm ngưng.`,
          );
        }

        if (promo.firstOrderOnly) {
          const previousOrder = await tx.order.findFirst({
            where: {
              userId: targetUserId,
              status: { not: OrderStatus.CANCELLED },
            },
          });
          if (previousOrder) {
            throw new BadRequestException('Mã ưu đãi này chỉ áp dụng cho đơn hàng đầu tiên.');
          }
        }
        if (promo.deliveryOnly && dto.deliveryMethod !== 'DELIVERY') {
          throw new BadRequestException('Chỉ áp dụng cho đơn giao hàng');
        }
        const now = new Date();
        if (promo.expiresAt !== null && promo.expiresAt < now) {
          throw new BadRequestException(`Mã ưu đãi "${promo.code}" đã hết hạn sử dụng.`);
        }
        if (promo.startsAt > now) {
          throw new BadRequestException(`Mã ưu đãi "${promo.code}" chưa đến ngày hiệu lực.`);
        }
        if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
          throw new BadRequestException(
            `Mã ưu đãi "${promo.code}" đã đạt giới hạn lượt sử dụng.`,
          );
        }

        const minOrder = Number(promo.minOrderValue);
        if (subtotalAmount < minOrder) {
          throw new BadRequestException(
            `Đơn hàng cần đạt tối thiểu ${minOrder.toLocaleString('vi-VN')} đ để áp dụng mã "${promo.code}".`,
          );
        }

        if (promo.discountType === DiscountType.PERCENTAGE) {
          const rawDiscount = (subtotalAmount * Number(promo.discountValue)) / 100;
          const maxDiscount = promo.maxDiscountAmount ? Number(promo.maxDiscountAmount) : null;
          discountAmount = maxDiscount ? Math.min(rawDiscount, maxDiscount) : rawDiscount;
        } else {
          discountAmount = Number(promo.discountValue);
        }

        discountAmount = Math.min(discountAmount, subtotalAmount);
        appliedPromotionId = promo.id;

        // Tăng số lượt sử dụng voucher
        await tx.promotion.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // ----------------------------------------------------------------------
      // BƯỚC 4.5: QUY ĐỔI ĐIỂM THƯỞNG (HẠT) NẾU KHÁCH CHỌN DÙNG TẠI CHECKOUT
      // Quy tắc BR-06.4: Tối thiểu 10 Hạt, 1 Hạt = 1.000đ, tối đa 50% tổng đơn
      // ----------------------------------------------------------------------
      let pointsUsed = 0;
      let pointsDiscount = 0;
      if (dto.loyaltyPointsUsed && dto.loyaltyPointsUsed > 0) {
        if (!Number.isInteger(dto.loyaltyPointsUsed) || dto.loyaltyPointsUsed < 10) {
          throw new BadRequestException('Số Hạt quy đổi tối thiểu mỗi lần là 10 Hạt.');
        }

        const userRecord = await tx.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, loyaltyPoints: true },
        });
        const balance = userRecord?.loyaltyPoints ?? 0;
        if (balance < dto.loyaltyPointsUsed) {
          throw new BadRequestException(
            `Số dư Hạt không đủ (hiện có ${balance} Hạt, yêu cầu ${dto.loyaltyPointsUsed} Hạt).`,
          );
        }

        const maxAllowedDiscount = Math.floor(Math.max(0, subtotalAmount - discountAmount) * 0.5);
        pointsDiscount = dto.loyaltyPointsUsed * 1000;
        if (pointsDiscount > maxAllowedDiscount) {
          throw new BadRequestException(
            `Điểm đổi không được giảm quá 50% giá trị đơn hàng còn lại (${maxAllowedDiscount.toLocaleString('vi-VN')} đ).`,
          );
        }

        const deductPoints = await tx.user.updateMany({
          where: {
            id: targetUserId,
            loyaltyPoints: { gte: dto.loyaltyPointsUsed },
          },
          data: {
            loyaltyPoints: { decrement: dto.loyaltyPointsUsed },
          },
        });

        if (deductPoints.count === 0) {
          throw new ConflictException('Số dư Hạt vừa thay đổi đồng thời. Vui lòng thử lại.');
        }

        pointsUsed = dto.loyaltyPointsUsed;
      }

      // ----------------------------------------------------------------------
      // BƯỚC 5: TẠO BẢN GHI ORDER VÀ CÁC DÒNG ORDERITEM (TRẠNG THÁI PENDING)
      // ----------------------------------------------------------------------
      const totalDiscount = discountAmount + pointsDiscount;
      const finalAmount = Math.max(0, subtotalAmount - totalDiscount);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderCode = `BL-${dateStr}-${randomSuffix}`;
      const ttlMinutes = Math.max(1, Number(process.env.ORDER_PAYMENT_TTL_MINUTES || 15));
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      const order = await tx.order.create({
        data: {
          orderCode,
          userId: targetUserId,
          promotionId: appliedPromotionId,
          status: OrderStatus.PENDING,
          subtotalAmount,
          discountAmount: totalDiscount,
          ...(pointsUsed > 0 ? { loyaltyPointsUsed: pointsUsed } : {}),
          finalAmount,
          note: dto.note || null,
          expiresAt,
          items: {
            create: calculatedItems.map((ci) => ({
              productId: ci.productId,
              productName: ci.productName,
              size: ci.size,
              sugarLevel: ci.sugarLevel,
              iceLevel: ci.iceLevel,
              toppingsJson: ci.toppings ? ci.toppings : undefined,
              quantity: ci.quantity,
              unitPrice: ci.unitPrice,
              lineTotal: ci.lineTotal,
            })),
          },
          statusLogs: {
            create: {
              previousStatus: null,
              newStatus: OrderStatus.PENDING,
              changedBy: targetUserId,
              reason: 'Khởi tạo đơn hàng từ giỏ hàng (Chức năng 4)',
            },
          },
        },
        include: {
          items: true,
          promotion: true,
        },
      });

      if (pointsUsed > 0 && (tx as any).loyaltyTransaction?.create) {
        await (tx as any).loyaltyTransaction.create({
          data: {
            userId: targetUserId,
            orderId: order.id,
            type: LoyaltyTxType.REDEEM,
            points: -pointsUsed,
            description: `Đổi ${pointsUsed} Hạt cho đơn hàng ${order.orderCode}`,
          },
        });
      }

      return {
        success: true,
        message: 'Khởi tạo đơn hàng và khóa nguyên liệu thành công.',
        order: this.formatOrder(order),
      };
    });
  }

  /**
   * Hoàn trả đồng bộ nguyên liệu kho, lượt voucher và Hạt thưởng khi hủy đơn hàng
   */
  private async restockOrderResources(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      orderCode: string;
      userId: string;
      promotionId?: string | null;
      loyaltyPointsUsed?: number;
      items?: Array<{ productId: string; quantity: number }>;
    },
  ) {
    // 1. Hoàn kho nguyên liệu theo BOM RecipeItem (tăng version Optimistic Lock)
    for (const item of order.items || []) {
      const recipes = await tx.recipeItem.findMany({
        where: { productId: item.productId },
      });

      for (const recipe of recipes) {
        const refundQty = Number(recipe.quantityRequired) * item.quantity;
        if (refundQty > 0) {
          await tx.ingredient.update({
            where: { id: recipe.ingredientId },
            data: {
              stockQuantity: { increment: refundQty },
              version: { increment: 1 },
            },
          });
        }
      }
    }

    // 2. Hoàn lượt sử dụng Promotion (nếu có)
    if (order.promotionId && (tx as any).promotion?.updateMany) {
      await (tx as any).promotion.updateMany({
        where: {
          id: order.promotionId,
          usedCount: { gt: 0 },
        },
        data: {
          usedCount: { decrement: 1 },
        },
      });
    }

    // 3. Hoàn Hạt thưởng đã tiêu (Idempotent theo orderId)
    const pointsUsed = Number(order.loyaltyPointsUsed || 0);
    if (pointsUsed > 0 && order.userId && (tx as any).loyaltyTransaction && (tx as any).user) {
      const existingRefund = await (tx as any).loyaltyTransaction.findFirst({
        where: {
          orderId: order.id,
          type: LoyaltyTxType.REFUND,
        },
      });

      if (!existingRefund) {
        await (tx as any).user.update({
          where: { id: order.userId },
          data: { loyaltyPoints: { increment: pointsUsed } },
        });
        await (tx as any).loyaltyTransaction.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            type: LoyaltyTxType.REFUND,
            points: pointsUsed,
            description: `Hoàn ${pointsUsed} Hạt do hủy đơn ${order.orderCode}`,
          },
        });
      }
    }
  }

  /**
   * Tự động giải phóng tồn kho cho các đơn PENDING đã quá hạn TTL thanh toán (Kịch bản hủy #2)
   */
  async expireOverdueOrders(userId?: string) {
    if (!this.prisma.order?.findMany || !this.prisma.$transaction) {
      return { success: true, expiredCount: 0, expiredOrderCodes: [] as string[] };
    }

    const now = new Date();
    const overdueOrders = await this.prisma.order.findMany({
      where: {
        ...(userId ? { userId } : {}),
        status: OrderStatus.PENDING,
        expiresAt: { lt: now },
      },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!overdueOrders || overdueOrders.length === 0) {
      return { success: true, expiredCount: 0, expiredOrderCodes: [] as string[] };
    }

    const expiredOrderCodes: string[] = [];

    for (const overdue of overdueOrders) {
      await this.prisma.$transaction(async (tx) => {
        // Cập nhật nguyên tử có điều kiện status = PENDING để tránh xung đột với webhook vừa tới
        const updated = await tx.order.updateMany({
          where: {
            id: overdue.id,
            status: OrderStatus.PENDING,
          },
          data: {
            status: OrderStatus.CANCELLED,
          },
        });

        if (updated.count === 0) {
          return;
        }

        await this.restockOrderResources(tx, overdue);

        if (overdue.payment && (tx as any).payment?.update) {
          await (tx as any).payment.update({
            where: { orderId: overdue.id },
            data: { status: PaymentStatus.FAILED },
          });
        }

        if ((tx as any).orderStatusLog?.create) {
          await (tx as any).orderStatusLog.create({
            data: {
              orderId: overdue.id,
              previousStatus: OrderStatus.PENDING,
              newStatus: OrderStatus.CANCELLED,
              changedBy: 'SYSTEM_TTL_CRON',
              reason: `[${OrderCancelScenario.PAYMENT_TIMEOUT_TTL}] Hết thời hạn giữ chỗ thanh toán. Nguyên liệu đã được trả lại kho.`,
            },
          });
        }

        expiredOrderCodes.push(overdue.orderCode);
      });
    }

    return {
      success: true,
      expiredCount: expiredOrderCodes.length,
      expiredOrderCodes,
    };
  }

  /**
   * UC-06.2: Tra cứu lịch sử đơn hàng cá nhân của khách hàng
   */
  async findByUser(userId: string) {
    await this.expireOverdueOrders(userId);

    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        promotion: true,
        payment: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    return {
      success: true,
      total: orders.length,
      orders: orders.map((order) => this.formatOrder(order)),
    };
  }

  /**
   * UC-06.1: Tra cứu đơn hàng theo ID kèm Anti-IDOR 403
   */
  async getOrderById(
    id: string,
    requester?: { userId?: string; role?: string },
  ): Promise<OrderResponseDto['order']> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        promotion: true,
        payment: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã ID: ${id}`);
    }

    const isPrivileged = requester?.role === 'STAFF' || requester?.role === 'ADMIN';
    if (requester?.userId && !isPrivileged && order.userId !== requester.userId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập biên nhận đơn hàng của tài khoản khác.',
      );
    }

    return this.formatOrder(order);
  }

  /**
   * Tra cứu đơn hàng theo mã công khai orderCode (ví dụ: BL-20261112-1234)
   */
  async getOrderByCode(orderCode: string): Promise<OrderResponseDto['order']> {
    const order = await this.prisma.order.findUnique({
      where: { orderCode },
      include: {
        items: true,
        promotion: true,
        payment: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã: ${orderCode}`);
    }

    return this.formatOrder(order);
  }

  /**
   * UC-06.4: Chuyển trạng thái đơn hàng theo State Machine nghiêm ngặt (BR-06.1)
   */
  async updateOrderStatus(
    id: string,
    targetStatus: OrderStatus,
    actor?: { userId?: string; role?: string },
    reason?: string,
  ) {
    const existing = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true, promotion: true },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã ID: ${id}`);
    }

    const allowedTargets = ALLOWED_ORDER_TRANSITIONS[existing.status] || [];
    if (!allowedTargets.includes(targetStatus)) {
      throw new BadRequestException(
        `Chuyển trạng thái không hợp lệ: không thể chuyển từ ${existing.status} sang ${targetStatus}.`,
      );
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: existing.id },
        data: { status: targetStatus },
        include: {
          items: true,
          promotion: true,
          payment: true,
          statusLogs: { orderBy: { createdAt: 'asc' } },
        },
      });

      if ((tx as any).orderStatusLog?.create) {
        await (tx as any).orderStatusLog.create({
          data: {
            orderId: existing.id,
            previousStatus: existing.status,
            newStatus: targetStatus,
            changedBy: actor?.userId || 'STAFF',
            reason: reason || `Cập nhật trạng thái từ ${existing.status} sang ${targetStatus}.`,
          },
        });
      }

      if (
        targetStatus === OrderStatus.PAID &&
        existing.userId &&
        (tx as any).loyaltyTransaction &&
        (tx as any).user
      ) {
        const alreadyEarned = await (tx as any).loyaltyTransaction.findFirst({
          where: { orderId: existing.id, type: LoyaltyTxType.EARN },
        });
        const points = Math.floor(Number(existing.finalAmount) / 10000);
        if (!alreadyEarned && points > 0) {
          await (tx as any).user.update({
            where: { id: existing.userId },
            data: { loyaltyPoints: { increment: points } },
          });
          await (tx as any).loyaltyTransaction.create({
            data: {
              userId: existing.userId,
              orderId: existing.id,
              type: LoyaltyTxType.EARN,
              points,
              description: `Tích lũy từ đơn hàng ${existing.orderCode}`,
            },
          });
        }
      }

      if (targetStatus === OrderStatus.CANCELLED) {
        await this.restockOrderResources(tx, existing);
        if (existing.payment && (tx as any).payment?.update) {
          const refundRequired =
            existing.status === OrderStatus.PAID ||
            existing.status === OrderStatus.PREPARING ||
            existing.payment.status === PaymentStatus.SUCCESS;
          await (tx as any).payment.update({
            where: { orderId: existing.id },
            data: {
              status: refundRequired ? PaymentStatus.REFUNDED : PaymentStatus.FAILED,
            },
          });
        }
      }

      return updated;
    });

    return {
      success: true,
      message: `Cập nhật trạng thái đơn hàng thành ${targetStatus}.`,
      order: this.formatOrder(updatedOrder),
    };
  }

  /**
   * Hủy đơn hàng & hoàn kho cho đủ 4 kịch bản ngoại lệ:
   * 1. ONLINE_CUSTOMER_CANCEL: Khách hủy đơn PENDING online
   * 2. PAYMENT_TIMEOUT_TTL: Quá hạn TTL giữ chỗ thanh toán
   * 3. OFFLINE_COUNTER_CANCEL: Nhân viên/Admin hủy tại quầy Offline
   * 4. OUT_OF_STOCK_REFUND: Hết nguyên liệu bất khả kháng sau khi đã PAID -> REFUNDED
   */
  async cancelOrder(
    id: string,
    dto: { scenario?: OrderCancelScenario; reason?: string },
    requester?: { userId?: string; role?: string },
  ) {
    const existing = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true, promotion: true },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã ID: ${id}`);
    }

    const isPrivileged = requester?.role === 'STAFF' || requester?.role === 'ADMIN';
    if (requester?.userId && !isPrivileged && existing.userId !== requester.userId) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng của tài khoản khác.');
    }

    if (
      existing.status === OrderStatus.COMPLETED ||
      existing.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Không thể hủy đơn hàng đang ở trạng thái ${existing.status}.`,
      );
    }

    const scenario =
      dto.scenario ||
      (existing.status === OrderStatus.PENDING
        ? OrderCancelScenario.ONLINE_CUSTOMER_CANCEL
        : OrderCancelScenario.OUT_OF_STOCK_REFUND);

    if (
      scenario === OrderCancelScenario.ONLINE_CUSTOMER_CANCEL &&
      existing.status !== OrderStatus.PENDING
    ) {
      throw new BadRequestException(
        'Khách hàng chỉ có thể tự hủy đơn Online khi chưa thanh toán (PENDING). Đơn đã thanh toán cần nhân viên xác nhận hoàn tiền.',
      );
    }

    if (
      scenario === OrderCancelScenario.PAYMENT_TIMEOUT_TTL &&
      existing.status !== OrderStatus.PENDING
    ) {
      throw new BadRequestException('Chỉ đơn hàng PENDING chưa thanh toán mới áp dụng hết hạn TTL.');
    }

    if (
      (scenario === OrderCancelScenario.OFFLINE_COUNTER_CANCEL ||
        scenario === OrderCancelScenario.OUT_OF_STOCK_REFUND) &&
      requester?.role &&
      !isPrivileged
    ) {
      throw new ForbiddenException(
        'Thao tác hủy đơn tại quầy hoặc xác nhận hoàn tiền hết món yêu cầu quyền Nhân viên / Quản trị viên.',
      );
    }

    const wasPaid =
      existing.status === OrderStatus.PAID ||
      existing.status === OrderStatus.PREPARING ||
      existing.payment?.status === PaymentStatus.SUCCESS;

    const cancelledOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: existing.id },
        data: { status: OrderStatus.CANCELLED },
        include: {
          items: true,
          promotion: true,
          payment: true,
          statusLogs: { orderBy: { createdAt: 'asc' } },
        },
      });

      await this.restockOrderResources(tx, existing);

      if (existing.payment && (tx as any).payment?.update) {
        const nextPaymentStatus =
          wasPaid || scenario === OrderCancelScenario.OUT_OF_STOCK_REFUND
            ? PaymentStatus.REFUNDED
            : PaymentStatus.FAILED;
        await (tx as any).payment.update({
          where: { orderId: existing.id },
          data: { status: nextPaymentStatus },
        });
      }

      if ((tx as any).orderStatusLog?.create) {
        await (tx as any).orderStatusLog.create({
          data: {
            orderId: existing.id,
            previousStatus: existing.status,
            newStatus: OrderStatus.CANCELLED,
            changedBy: requester?.userId || 'SYSTEM',
            reason: `[${scenario}] ${dto.reason || 'Hủy đơn hàng và giải phóng tồn kho nguyên liệu.'}`,
          },
        });
      }

      return updated;
    });

    return {
      success: true,
      scenario,
      refundIssued: wasPaid || scenario === OrderCancelScenario.OUT_OF_STOCK_REFUND,
      message:
        wasPaid || scenario === OrderCancelScenario.OUT_OF_STOCK_REFUND
          ? 'Đã hủy đơn hàng, hoàn trả nguyên liệu và khởi tạo lệnh hoàn tiền.'
          : 'Đã hủy đơn hàng và hoàn trả nguyên liệu giữ chỗ về kho.',
      order: this.formatOrder(cancelledOrder),
    };
  }
}

