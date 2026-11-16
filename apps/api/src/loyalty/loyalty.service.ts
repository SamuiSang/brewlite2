import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LoyaltyTxType, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedeemPointsDto } from './dto/redeem-points.dto';

export interface LoyaltyRewardItem {
  id: string;
  title: string;
  subtitle: string;
  pointsCost: number;
  discountValue: number;
}

/**
 * Danh mục quà đổi Hạt khớp bản thiết kế Figma BrewLite 2 (Frame 08 · Thành viên)
 */
export const LOYALTY_REWARD_CATALOG: LoyaltyRewardItem[] = [
  {
    id: 'OAT_MILK',
    title: 'Nâng cấp sữa yến mạch',
    subtitle: 'Miễn phí một lần nâng cấp loại sữa.',
    pointsCost: 50,
    discountValue: 10000,
  },
  {
    id: 'VOUCHER_15K',
    title: 'Ưu đãi 15.000 đ',
    subtitle: 'Áp dụng cho đơn từ 50.000 đ.',
    pointsCost: 100,
    discountValue: 15000,
  },
  {
    id: 'CROISSANT',
    title: 'Bánh sừng bò trong ngày',
    subtitle: 'Một chiếc bánh bơ thơm, giòn mới.',
    pointsCost: 150,
    discountValue: 32000,
  },
];

@Injectable()
export class LoyaltyService {
  static readonly VND_PER_POINT_EARN = 10000; // 10.000 đ = 1 điểm (BR-06.3)
  static readonly VND_PER_POINT_REDEEM = 1000; // 1 điểm = 1.000 đ (BR-06.4)
  static readonly MIN_REDEEM_POINTS = 10; // Tối thiểu 10 điểm/lần đổi (BR-06.4)
  static readonly MAX_REDEEM_RATIO = 0.5; // Tối đa 50% giá trị đơn hàng

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính số điểm tích lũy theo quy tắc làm tròn xuống: floor(finalAmount / 10.000)
   */
  calculateEarnedPoints(finalAmount: number): number {
    const safeAmount = Number(finalAmount);
    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      return 0;
    }
    return Math.floor(safeAmount / LoyaltyService.VND_PER_POINT_EARN);
  }

  /**
   * Xác định hạng thành viên & tiến độ nâng hạng (chuẩn Figma Frame 08)
   */
  getTierProgress(points: number) {
    const safePoints = Math.max(0, Math.floor(Number(points) || 0));
    if (safePoints >= 500) {
      return {
        tierName: 'Thành viên Kim Cương',
        nextTierName: null,
        targetPoints: 500,
        remainingPoints: 0,
        progressPercent: 100,
      };
    }
    if (safePoints >= 200) {
      return {
        tierName: 'Thành viên Vàng',
        nextTierName: 'Kim Cương',
        targetPoints: 500,
        remainingPoints: 500 - safePoints,
        progressPercent: Math.min(100, Math.round((safePoints / 500) * 100)),
      };
    }
    return {
      tierName: 'Thành viên Bạc',
      nextTierName: 'Vàng',
      targetPoints: 200,
      remainingPoints: 200 - safePoints,
      progressPercent: Math.min(100, Math.round((safePoints / 200) * 100)),
    };
  }

  /**
   * Lấy số dư điểm (Hạt) và lịch sử biến động giao dịch của người dùng
   */
  async getBalanceAndHistory(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        loyaltyPoints: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy thông tin thành viên (${userId}).`);
    }

    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        order: {
          select: {
            id: true,
            orderCode: true,
            status: true,
            finalAmount: true,
          },
        },
      },
    });

    const activeOrders = this.prisma.order?.findMany
      ? await this.prisma.order.findMany({
          where: {
            userId,
            status: { in: [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PREPARING] },
          },
          select: {
            orderCode: true,
            finalAmount: true,
          },
        })
      : [];

    const pendingEstimatedPoints = (activeOrders || []).reduce(
      (sum, o) => sum + this.calculateEarnedPoints(Number(o.finalAmount)),
      0,
    );

    const tier = this.getTierProgress(user.loyaltyPoints);
    const shortSuffix = user.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase().padStart(6, '0');

    return {
      success: true,
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      memberCode: `BL · ${shortSuffix.slice(0, 3)} ${shortSuffix.slice(3, 6)}`,
      loyaltyPoints: user.loyaltyPoints,
      points: user.loyaltyPoints,
      tier,
      pendingEstimatedPoints,
      pendingOrders: (activeOrders || []).map((o) => ({
        orderCode: o.orderCode,
        estimatedPoints: this.calculateEarnedPoints(Number(o.finalAmount)),
      })),
      rewards: LOYALTY_REWARD_CATALOG,
      transactions: transactions.map((tx) => ({
        id: tx.id,
        userId: tx.userId,
        orderId: tx.orderId,
        orderCode: tx.order?.orderCode || null,
        type: tx.type,
        points: tx.points,
        description: tx.description,
        createdAt: tx.createdAt,
      })),
    };
  }

  /**
   * Kiểm tra điều kiện đổi điểm chung cho cả Preview và Transaction thực tế
   */
  private validateRedemptionRules(
    currentBalance: number,
    pointsToRedeem: number,
    orderAmount?: number,
  ) {
    if (!Number.isInteger(pointsToRedeem) || pointsToRedeem < LoyaltyService.MIN_REDEEM_POINTS) {
      throw new BadRequestException(
        `Số Hạt quy đổi tối thiểu mỗi lần là ${LoyaltyService.MIN_REDEEM_POINTS} Hạt.`,
      );
    }

    if (currentBalance < pointsToRedeem) {
      throw new BadRequestException(
        `Số dư Hạt không đủ (hiện có ${currentBalance} Hạt, yêu cầu ${pointsToRedeem} Hạt).`,
      );
    }

    const discountAmount = pointsToRedeem * LoyaltyService.VND_PER_POINT_REDEEM;

    if (orderAmount !== undefined && orderAmount > 0) {
      const maxAllowedDiscount = Math.floor(orderAmount * LoyaltyService.MAX_REDEEM_RATIO);
      if (discountAmount > maxAllowedDiscount) {
        const maxPoints = Math.floor(maxAllowedDiscount / LoyaltyService.VND_PER_POINT_REDEEM);
        throw new BadRequestException(
          `Mức giảm tối đa 50% giá trị đơn hàng (tối đa ${maxPoints} Hạt tương đương ${maxAllowedDiscount.toLocaleString('vi-VN')} đ).`,
        );
      }
    }

    return {
      discountAmount,
      remainingBalance: currentBalance - pointsToRedeem,
    };
  }

  /**
   * Tính nháp giảm giá khi đổi điểm trên UI Checkout / Quầy thành viên (POST /loyalty/redeem-preview)
   */
  async previewRedeem(userId: string, pointsToRedeem: number, orderAmount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, loyaltyPoints: true },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng (${userId}).`);
    }

    const { discountAmount, remainingBalance } = this.validateRedemptionRules(
      user.loyaltyPoints,
      pointsToRedeem,
      orderAmount,
    );

    return {
      success: true,
      valid: true,
      pointsToRedeem,
      discountAmount,
      currentBalance: user.loyaltyPoints,
      remainingBalance,
      finalOrderAmount: Math.max(0, orderAmount - discountAmount),
    };
  }

  /**
   * Thực thi trừ điểm nguyên tử (Atomic Redeem) và ghi nhận LoyaltyTransaction REDEEM
   */
  async redeemPoints(userId: string, dto: RedeemPointsDto) {
    const reward = dto.rewardId
      ? LOYALTY_REWARD_CATALOG.find((r) => r.id === dto.rewardId)
      : undefined;
    const pointsCost = reward ? reward.pointsCost : dto.pointsToRedeem;

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, loyaltyPoints: true, fullName: true },
      });

      if (!user) {
        throw new NotFoundException(`Không tìm thấy thành viên (${userId}).`);
      }

      const { discountAmount } = this.validateRedemptionRules(
        user.loyaltyPoints,
        pointsCost,
        dto.orderAmount,
      );

      // Cập nhật nguyên tử có điều kiện để chống âm điểm khi bấm đúp đồng thời
      const deductResult = await tx.user.updateMany({
        where: {
          id: userId,
          loyaltyPoints: { gte: pointsCost },
        },
        data: {
          loyaltyPoints: { decrement: pointsCost },
        },
      });

      if (deductResult.count === 0) {
        throw new BadRequestException(
          'Số dư Hạt không đủ để thực hiện đổi quà hoặc vừa bị thay đổi đồng thời.',
        );
      }

      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true },
      });

      const txDescription =
        dto.description ||
        (reward
          ? `Đổi quà thành viên: ${reward.title}`
          : `Quy đổi ${pointsCost} Hạt thưởng (${discountAmount.toLocaleString('vi-VN')} đ)`);

      const loyaltyTx = await tx.loyaltyTransaction.create({
        data: {
          userId,
          orderId: dto.orderId || null,
          type: LoyaltyTxType.REDEEM,
          points: -pointsCost,
          description: txDescription,
        },
      });

      const voucherCode = reward
        ? `REWARD-${reward.id.slice(0, 4)}-${Date.now().toString().slice(-4)}`
        : null;

      return {
        success: true,
        message: `Đã đổi thành công ${pointsCost} Hạt thưởng!`,
        pointsUsed: pointsCost,
        discountAmount,
        remainingPoints: updatedUser?.loyaltyPoints ?? user.loyaltyPoints - pointsCost,
        rewardTitle: reward?.title || null,
        voucherCode,
        transaction: loyaltyTx,
      };
    });
  }

  /**
   * Tích điểm Idempotent cho đơn hàng đã thanh toán (chỉ cộng 1 lần duy nhất mỗi orderId)
   */
  async earnPointsFromOrder(orderId: string, txClient?: Prisma.TransactionClient) {
    const run = async (tx: Prisma.TransactionClient) => {
      const existingEarn = await tx.loyaltyTransaction.findFirst({
        where: {
          orderId,
          type: LoyaltyTxType.EARN,
        },
      });

      if (existingEarn) {
        return {
          success: true,
          alreadyAwarded: true,
          earnedPoints: 0,
          transaction: existingEarn,
        };
      }

      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, orderCode: true, userId: true, finalAmount: true, status: true },
      });

      if (!order) {
        throw new NotFoundException(`Không tìm thấy đơn hàng (${orderId}) để tích điểm.`);
      }

      const pointsToEarn = this.calculateEarnedPoints(Number(order.finalAmount));
      if (!order.userId || pointsToEarn <= 0) {
        return {
          success: true,
          alreadyAwarded: false,
          earnedPoints: 0,
          transaction: null,
        };
      }

      await tx.user.update({
        where: { id: order.userId },
        data: {
          loyaltyPoints: { increment: pointsToEarn },
        },
      });

      const loyaltyTx = await tx.loyaltyTransaction.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          type: LoyaltyTxType.EARN,
          points: pointsToEarn,
          description: `Tích lũy từ đơn hàng ${order.orderCode}`,
        },
      });

      return {
        success: true,
        alreadyAwarded: false,
        earnedPoints: pointsToEarn,
        transaction: loyaltyTx,
      };
    };

    if (txClient) {
      return await run(txClient);
    }
    return await this.prisma.$transaction(async (tx) => await run(tx));
  }

  /**
   * Hoàn lại Hạt đã tiêu nếu đơn hàng bị hủy trước khi hoàn thành (BR-06.5)
   */
  async refundPointsOnCancel(orderId: string, txClient?: Prisma.TransactionClient) {
    const run = async (tx: Prisma.TransactionClient) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, orderCode: true, userId: true, loyaltyPointsUsed: true },
      });

      if (!order || !order.userId || !order.loyaltyPointsUsed || order.loyaltyPointsUsed <= 0) {
        return { success: true, refundedPoints: 0 };
      }

      const existingRefund = await tx.loyaltyTransaction.findFirst({
        where: {
          orderId: order.id,
          type: LoyaltyTxType.REFUND,
        },
      });

      if (existingRefund) {
        return { success: true, refundedPoints: 0, alreadyRefunded: true };
      }

      await tx.user.update({
        where: { id: order.userId },
        data: {
          loyaltyPoints: { increment: order.loyaltyPointsUsed },
        },
      });

      const refundTx = await tx.loyaltyTransaction.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          type: LoyaltyTxType.REFUND,
          points: order.loyaltyPointsUsed,
          description: `Hoàn ${order.loyaltyPointsUsed} Hạt do hủy đơn ${order.orderCode}`,
        },
      });

      return {
        success: true,
        refundedPoints: order.loyaltyPointsUsed,
        transaction: refundTx,
      };
    };

    if (txClient) {
      return await run(txClient);
    }
    return await this.prisma.$transaction(async (tx) => await run(tx));
  }
}
