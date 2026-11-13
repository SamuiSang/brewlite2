import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(rawCode: string, cartSubtotal: number, deliveryMethod = 'PICKUP') {
    if (typeof rawCode !== 'string' || !rawCode.trim() || rawCode.length > 50 || !Number.isSafeInteger(cartSubtotal) || cartSubtotal <= 0 || cartSubtotal > 999999999) {
      throw new BadRequestException('Mã hoặc giá trị giỏ hàng không hợp lệ');
    }
    const code = rawCode.trim().toUpperCase();
    const promotion = await this.prisma.promotion.findFirst({ where: { code: { equals: code, mode: 'insensitive' } } });
    if (!promotion) throw new BadRequestException('Mã khuyến mãi không hợp lệ hoặc không tồn tại');
    if (promotion.firstOrderOnly) throw new BadRequestException('Mã đơn đầu tiên cần tài khoản đã xác thực; chức năng xác thực chưa khả dụng');
    if (promotion.deliveryOnly && deliveryMethod !== 'DELIVERY') throw new BadRequestException('Mã chỉ áp dụng cho đơn giao hàng');
    const now = new Date();
    if (!promotion.isActive) throw new BadRequestException('Mã khuyến mãi không còn hiệu lực');
    if (now < promotion.startsAt) throw new BadRequestException('Mã khuyến mãi chưa đến thời gian sử dụng');
    if (promotion.expiresAt !== null && now > promotion.expiresAt) throw new BadRequestException('Mã khuyến mãi đã hết hạn sử dụng');
    if (promotion.usageLimit !== null && promotion.usedCount >= promotion.usageLimit) throw new BadRequestException('Mã khuyến mãi đã hết lượt sử dụng');
    const subtotal = new Prisma.Decimal(cartSubtotal);
    if (subtotal.lt(promotion.minOrderValue)) throw new BadRequestException(`Đơn hàng tối thiểu phải từ ${Number(promotion.minOrderValue).toLocaleString('vi-VN')}đ để sử dụng mã này`);
    let discount = promotion.discountType === 'PERCENTAGE' ? subtotal.mul(promotion.discountValue).div(100) : promotion.discountValue;
    if (promotion.discountType === 'PERCENTAGE' && promotion.maxDiscountAmount !== null) discount = Prisma.Decimal.min(discount, promotion.maxDiscountAmount);
    discount = Prisma.Decimal.max(0, Prisma.Decimal.min(subtotal, discount));
    return { promoId: promotion.id, code: promotion.code, discountAmount: discount.floor().toNumber(), minOrderValue: promotion.minOrderValue.toNumber() };
  }

  async active() {
    const now = new Date();
    const promotions = await this.prisma.promotion.findMany({ where: { isActive: true, startsAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }, orderBy: { expiresAt: 'asc' } });
    return promotions.filter(p => p.usageLimit === null || p.usedCount < p.usageLimit).map(p => ({
      promoId: p.id, code: p.code, description: p.description, discountType: p.discountType,
      discountValue: p.discountValue.toNumber(), minOrderValue: p.minOrderValue.toNumber(),
      maxDiscountAmount: p.maxDiscountAmount?.toNumber() ?? null, expiresAt: p.expiresAt,
      remainingUses: p.usageLimit === null ? null : Math.max(0, p.usageLimit - p.usedCount),
      firstOrderOnly: p.firstOrderOnly, deliveryOnly: p.deliveryOnly,
    }));
  }
}
