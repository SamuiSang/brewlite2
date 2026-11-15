import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Promotion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto, QueryPromotionDto, UpdatePromotionDto } from './dto/promotions.dto';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  private formatPromotion(p: Promotion) {
    return {
      id: p.id,
      code: p.code,
      description: p.description,
      discountType: p.discountType,
      discountValue: p.discountValue.toNumber(),
      minOrderValue: p.minOrderValue.toNumber(),
      maxDiscountAmount: p.maxDiscountAmount?.toNumber() ?? null,
      usageLimit: p.usageLimit,
      usedCount: p.usedCount,
      remainingUses: p.usageLimit === null ? null : Math.max(0, p.usageLimit - p.usedCount),
      firstOrderOnly: p.firstOrderOnly,
      deliveryOnly: p.deliveryOnly,
      isActive: p.isActive,
      startsAt: p.startsAt,
      expiresAt: p.expiresAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async create(dto: CreatePromotionDto) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.promotion.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException(`Mã khuyến mãi '${code}' đã tồn tại`);
    }

    const created = await this.prisma.promotion.create({
      data: {
        code,
        description: dto.description ?? null,
        discountType: dto.discountType,
        discountValue: new Prisma.Decimal(dto.discountValue),
        minOrderValue: dto.minOrderValue !== undefined ? new Prisma.Decimal(dto.minOrderValue) : new Prisma.Decimal(0),
        maxDiscountAmount: dto.maxDiscountAmount !== undefined ? new Prisma.Decimal(dto.maxDiscountAmount) : null,
        usageLimit: dto.usageLimit ?? null,
        firstOrderOnly: dto.firstOrderOnly ?? false,
        deliveryOnly: dto.deliveryOnly ?? false,
        isActive: dto.isActive ?? true,
        startsAt: dto.startsAt ?? new Date(),
        expiresAt: dto.expiresAt ?? null,
      },
    });

    return this.formatPromotion(created);
  }

  async findAll(query?: QueryPromotionDto) {
    const where: Prisma.PromotionWhereInput = {};
    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query?.search) {
      const search = query.search.trim();
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const list = await this.prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return list.map((p) => this.formatPromotion(p));
  }

  async findOne(idOrCode: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrCode);
    const promotion = await this.prisma.promotion.findFirst({
      where: isUuid
        ? { id: idOrCode }
        : { code: { equals: idOrCode.trim(), mode: 'insensitive' } },
    });

    if (!promotion) {
      throw new NotFoundException(`Không tìm thấy mã khuyến mãi '${idOrCode}'`);
    }

    return this.formatPromotion(promotion);
  }

  async update(id: string, dto: UpdatePromotionDto) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy mã khuyến mãi với ID '${id}'`);
    }

    let code = existing.code;
    if (dto.code) {
      code = dto.code.trim().toUpperCase();
      if (code !== existing.code) {
        const duplicate = await this.prisma.promotion.findFirst({
          where: { code: { equals: code, mode: 'insensitive' }, id: { not: id } },
        });
        if (duplicate) {
          throw new ConflictException(`Mã khuyến mãi '${code}' đã tồn tại`);
        }
      }
    }

    const updated = await this.prisma.promotion.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.discountType !== undefined && { discountType: dto.discountType }),
        ...(dto.discountValue !== undefined && { discountValue: new Prisma.Decimal(dto.discountValue) }),
        ...(dto.minOrderValue !== undefined && { minOrderValue: new Prisma.Decimal(dto.minOrderValue) }),
        ...(dto.maxDiscountAmount !== undefined && {
          maxDiscountAmount: dto.maxDiscountAmount !== null ? new Prisma.Decimal(dto.maxDiscountAmount) : null,
        }),
        ...(dto.usageLimit !== undefined && { usageLimit: dto.usageLimit }),
        ...(dto.firstOrderOnly !== undefined && { firstOrderOnly: dto.firstOrderOnly }),
        ...(dto.deliveryOnly !== undefined && { deliveryOnly: dto.deliveryOnly }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.startsAt !== undefined && { startsAt: dto.startsAt }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt }),
      },
    });

    return this.formatPromotion(updated);
  }

  async remove(id: string) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy mã khuyến mãi với ID '${id}'`);
    }

    await this.prisma.promotion.delete({ where: { id } });
    return {
      success: true,
      message: `Đã xóa mã khuyến mãi '${existing.code}' thành công`,
      id,
    };
  }

  async validate(rawCode: string, cartSubtotal: number, deliveryMethod = 'PICKUP') {
    if (
      typeof rawCode !== 'string' ||
      !rawCode.trim() ||
      rawCode.length > 50 ||
      !Number.isSafeInteger(cartSubtotal) ||
      cartSubtotal <= 0 ||
      cartSubtotal > 999999999
    ) {
      throw new BadRequestException('Mã hoặc giá trị giỏ hàng không hợp lệ');
    }
    const code = rawCode.trim().toUpperCase();
    const promotion = await this.prisma.promotion.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
    });
    if (!promotion) throw new BadRequestException('Mã khuyến mãi không hợp lệ hoặc không tồn tại');
    if (promotion.firstOrderOnly) {
      throw new BadRequestException('Mã đơn đầu tiên cần tài khoản đã xác thực; chức năng xác thực chưa khả dụng');
    }
    if (promotion.deliveryOnly && deliveryMethod !== 'DELIVERY') {
      throw new BadRequestException('Chỉ áp dụng cho đơn giao hàng');
    }
    const now = new Date();
    if (!promotion.isActive) throw new BadRequestException('Mã khuyến mãi không còn hiệu lực');
    if (now < promotion.startsAt) throw new BadRequestException('Mã khuyến mãi chưa đến thời gian sử dụng');
    if (promotion.expiresAt !== null && now > promotion.expiresAt) {
      throw new BadRequestException('Mã khuyến mãi đã hết hạn sử dụng');
    }
    if (promotion.usageLimit !== null && promotion.usedCount >= promotion.usageLimit) {
      throw new BadRequestException('Mã khuyến mãi đã hết lượt sử dụng');
    }
    const subtotal = new Prisma.Decimal(cartSubtotal);
    if (subtotal.lt(promotion.minOrderValue)) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu phải từ ${Number(promotion.minOrderValue).toLocaleString('vi-VN')}đ để sử dụng mã này`,
      );
    }
    let discount =
      promotion.discountType === 'PERCENTAGE'
        ? subtotal.mul(promotion.discountValue).div(100)
        : promotion.discountValue;
    if (promotion.discountType === 'PERCENTAGE' && promotion.maxDiscountAmount !== null) {
      discount = Prisma.Decimal.min(discount, promotion.maxDiscountAmount);
    }
    discount = Prisma.Decimal.max(0, Prisma.Decimal.min(subtotal, discount));
    return {
      promoId: promotion.id,
      code: promotion.code,
      discountAmount: discount.floor().toNumber(),
      minOrderValue: promotion.minOrderValue.toNumber(),
    };
  }

  async active() {
    const now = new Date();
    const promotions = await this.prisma.promotion.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
      orderBy: { expiresAt: 'asc' },
    });
    return promotions
      .filter((p) => p.usageLimit === null || p.usedCount < p.usageLimit)
      .map((p) => ({
        promoId: p.id,
        code: p.code,
        description: p.description,
        discountType: p.discountType,
        discountValue: p.discountValue.toNumber(),
        minOrderValue: p.minOrderValue.toNumber(),
        maxDiscountAmount: p.maxDiscountAmount?.toNumber() ?? null,
        expiresAt: p.expiresAt,
        remainingUses: p.usageLimit === null ? null : Math.max(0, p.usageLimit - p.usedCount),
        firstOrderOnly: p.firstOrderOnly,
        deliveryOnly: p.deliveryOnly,
      }));
  }
}
