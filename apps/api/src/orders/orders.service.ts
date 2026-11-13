import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscountType, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';

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

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

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

        if (promo.firstOrderOnly) throw new BadRequestException('Mã đơn đầu tiên cần tài khoản đã xác thực; chức năng xác thực chưa khả dụng');
        if (promo.deliveryOnly && dto.deliveryMethod !== 'DELIVERY') throw new BadRequestException('Mã chỉ áp dụng cho đơn giao hàng');
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
      // BƯỚC 5: TẠO BẢN GHI ORDER VÀ CÁC DÒNG ORDERITEM (TRẠNG THÁI PENDING)
      // ----------------------------------------------------------------------
      const finalAmount = Math.max(0, subtotalAmount - discountAmount);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderCode = `BL-${dateStr}-${randomSuffix}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Hold Stock 15 phút

      const order = await tx.order.create({
        data: {
          orderCode,
          userId: targetUserId,
          promotionId: appliedPromotionId,
          status: OrderStatus.PENDING,
          subtotalAmount,
          discountAmount,
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

      return {
        success: true,
        message: 'Khởi tạo đơn hàng và khóa nguyên liệu thành công.',
        order: {
          id: order.id,
          orderCode: order.orderCode,
          userId: order.userId,
          status: order.status,
          subtotalAmount: Number(order.subtotalAmount),
          discountAmount: Number(order.discountAmount),
          finalAmount: Number(order.finalAmount),
          note: order.note,
          expiresAt: order.expiresAt,
          createdAt: order.createdAt,
          promotionCode: order.promotion?.code || null,
          items: order.items.map((it) => ({
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
        },
      };
    });
  }

  /**
   * Tra cứu đơn hàng theo ID
   */
  async getOrderById(id: string): Promise<OrderResponseDto['order']> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        promotion: true,
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã ID: ${id}`);
    }

    return {
      id: order.id,
      orderCode: order.orderCode,
      userId: order.userId,
      status: order.status,
      subtotalAmount: Number(order.subtotalAmount),
      discountAmount: Number(order.discountAmount),
      finalAmount: Number(order.finalAmount),
      note: order.note,
      expiresAt: order.expiresAt,
      createdAt: order.createdAt,
      promotionCode: order.promotion?.code || null,
      items: order.items.map((it) => ({
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
    };
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
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã: ${orderCode}`);
    }

    return {
      id: order.id,
      orderCode: order.orderCode,
      userId: order.userId,
      status: order.status,
      subtotalAmount: Number(order.subtotalAmount),
      discountAmount: Number(order.discountAmount),
      finalAmount: Number(order.finalAmount),
      note: order.note,
      expiresAt: order.expiresAt,
      createdAt: order.createdAt,
      promotionCode: order.promotion?.code || null,
      items: order.items.map((it) => ({
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
    };
  }
}

