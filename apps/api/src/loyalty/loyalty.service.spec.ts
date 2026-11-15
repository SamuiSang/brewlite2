import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyTxType, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyService } from './loyalty.service';

describe('LoyaltyService - Chức năng 6 (LOY-T01: Tích điểm & Quy đổi Hạt thưởng)', () => {
  let service: LoyaltyService;
  let prisma: any;

  const mockUser = {
    id: 'user-loyalty-1',
    fullName: 'Hàn Minh Hiếu',
    email: 'hieu@brewlite.vn',
    role: 'CUSTOMER',
    loyaltyPoints: 420,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue({ ...mockUser, loyaltyPoints: 429 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      order: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      loyaltyTransaction: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(async ({ data }) => ({
          id: 'ltx-new-1',
          ...data,
          createdAt: new Date(),
        })),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => await cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
  });

  describe('calculateEarnedPoints() & getTierProgress()', () => {
    it('1. Quy đổi chính xác 10.000đ = 1 Hạt và làm tròn xuống (floor)', () => {
      expect(service.calculateEarnedPoints(95000)).toBe(9);
      expect(service.calculateEarnedPoints(38000)).toBe(3);
      expect(service.calculateEarnedPoints(9999)).toBe(0);
      expect(service.calculateEarnedPoints(0)).toBe(0);
      expect(service.calculateEarnedPoints(-10000)).toBe(0);
    });

    it('2. Tính hạng thành viên Vàng (420 / 500 Hạt -> còn 80 Hạt lên Kim Cương)', () => {
      const tier = service.getTierProgress(420);
      expect(tier.tierName).toBe('Thành viên Vàng');
      expect(tier.nextTierName).toBe('Kim Cương');
      expect(tier.remainingPoints).toBe(80);
      expect(tier.progressPercent).toBe(84);
    });
  });

  describe('earnPointsFromOrder() - Idempotent EARN', () => {
    it('3. Cộng điểm chính xác khi đơn hàng đã thanh toán và chưa từng EARN trước đó', async () => {
      prisma.loyaltyTransaction.findFirst.mockResolvedValue(null);
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        orderCode: 'BL-8924',
        userId: mockUser.id,
        finalAmount: '95000',
        status: OrderStatus.PAID,
      });

      const res = await service.earnPointsFromOrder('order-1');
      expect(res.alreadyAwarded).toBe(false);
      expect(res.earnedPoints).toBe(9);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { loyaltyPoints: { increment: 9 } },
      });
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          orderId: 'order-1',
          type: LoyaltyTxType.EARN,
          points: 9,
        }),
      });
    });

    it('4. Chặn cộng điểm trùng lặp (Idempotent) nếu Webhook IPN gọi lại cho cùng orderId', async () => {
      prisma.loyaltyTransaction.findFirst.mockResolvedValue({
        id: 'ltx-existing',
        orderId: 'order-1',
        type: LoyaltyTxType.EARN,
        points: 9,
      });

      const res = await service.earnPointsFromOrder('order-1');
      expect(res.alreadyAwarded).toBe(true);
      expect(res.earnedPoints).toBe(0);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('previewRedeem() & redeemPoints() - Anti-negative & Cap 50%', () => {
    it('5. Chặn quy đổi khi số điểm nhỏ hơn mức tối thiểu 10 Hạt', async () => {
      await expect(service.previewRedeem(mockUser.id, 5, 100000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('6. Chặn quy đổi khi số dư Hạt không đủ (chống âm điểm)', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, loyaltyPoints: 30 });
      await expect(
        service.redeemPoints(mockUser.id, { pointsToRedeem: 50, rewardId: 'OAT_MILK' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('7. Chặn quy đổi vượt quá 50% tổng giá trị đơn hàng', async () => {
      await expect(service.previewRedeem(mockUser.id, 60, 100000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('8. Quy đổi thành công 50 Hạt nâng cấp sữa yến mạch (Figma Frame 08 -> 370 Hạt còn lại)', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ loyaltyPoints: 370 });

      const res = await service.redeemPoints(mockUser.id, {
        pointsToRedeem: 50,
        rewardId: 'OAT_MILK',
      });

      expect(res.success).toBe(true);
      expect(res.pointsUsed).toBe(50);
      expect(res.remainingPoints).toBe(370);
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          type: LoyaltyTxType.REDEEM,
          points: -50,
        }),
      });
    });

    it('9. Ném NotFoundException nếu user không tồn tại khi tra cứu số dư', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getBalanceAndHistory('missing-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('refundPointsOnCancel()', () => {
    it('10. Hoàn trả lại số Hạt đã tiêu khi đơn hàng bị hủy', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-cancel-1',
        orderCode: 'BL-8820',
        userId: mockUser.id,
        loyaltyPointsUsed: 20,
      });
      prisma.loyaltyTransaction.findFirst.mockResolvedValue(null);

      const res = await service.refundPointsOnCancel('order-cancel-1');
      expect(res.refundedPoints).toBe(20);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { loyaltyPoints: { increment: 20 } },
      });
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: LoyaltyTxType.REFUND,
          points: 20,
        }),
      });
    });
  });
});
