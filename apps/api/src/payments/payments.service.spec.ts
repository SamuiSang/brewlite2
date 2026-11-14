// apps/api/src/payments/payments.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import { buildVnpayPaymentUrl, verifyVnpaySignature, sortObject } from './vnpay.util';
import * as crypto from 'crypto';

describe('PaymentsService & VNPay Sandbox Gateway (Quang - Chức năng 5)', () => {
  let service: PaymentsService;
  let prisma: PrismaService;

  const VNP_TMN_CODE = '8VXIB1MM';
  const VNP_HASH_SECRET = 'GJZGJZTKHBYBESRSLCLSPZXGFPEXVPGF';
  const VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

  const mockOrder = {
    id: 'order-test-uuid-1',
    orderCode: 'BL-9999',
    userId: 'user-test-1',
    status: OrderStatus.PENDING,
    subtotalAmount: '45000',
    discountAmount: '0',
    finalAmount: '45000',
    items: [
      {
        id: 'order-item-1',
        productId: 'prod-001',
        quantity: 1,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: {
            payment: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              upsert: jest.fn(),
              update: jest.fn(),
            },
            order: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            recipeItem: {
              findMany: jest.fn(),
            },
            ingredient: {
              update: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (callback) => {
              return await callback(prisma);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('1. VNPay Utility & Checksum Signature Tests', () => {
    it('sortObject sắp xếp các key theo bảng chữ cái A-Z chuẩn VNPay', () => {
      const input = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_Amount: 4500000,
        vnp_TmnCode: '8VXIB1MM',
      };
      const sorted = sortObject(input);
      const keys = Object.keys(sorted);
      expect(keys).toEqual([
        'vnp_Amount',
        'vnp_Command',
        'vnp_TmnCode',
        'vnp_Version',
      ]);
    });

    it('buildVnpayPaymentUrl tạo URL Sandbox đầy đủ tham số và chữ ký HMAC SHA512', () => {
      const url = buildVnpayPaymentUrl({
        tmnCode: VNP_TMN_CODE,
        hashSecret: VNP_HASH_SECRET,
        vnpUrl: VNP_URL,
        returnUrl: 'http://localhost:3000/checkout/vnpay-return',
        orderId: 'order-1',
        orderCode: 'BL-9999',
        amount: 45000,
        orderInfo: 'Thanh toan don hang BL-9999',
      });

      expect(url).toContain(VNP_URL);
      expect(url).toContain('vnp_TmnCode=8VXIB1MM');
      expect(url).toContain('vnp_Amount=4500000');
      expect(url).toContain('vnp_SecureHash=');
    });

    it('verifyVnpaySignature xác thực chữ ký số chính xác và phát hiện giả mạo', () => {
      const params: Record<string, any> = {
        vnp_Amount: '4500000',
        vnp_Command: 'pay',
        vnp_OrderInfo: 'Thanh toan don hang BL-9999',
        vnp_ResponseCode: '00',
        vnp_TmnCode: VNP_TMN_CODE,
        vnp_TxnRef: 'BL-9999',
        vnp_Version: '2.1.0',
      };

      const sorted = sortObject(params);
      const signData = Object.entries(sorted)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      const hash = crypto
        .createHmac('sha512', VNP_HASH_SECRET)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');

      params['vnp_SecureHash'] = hash;

      // 1. Chữ ký chuẩn -> isValid: true
      const resultValid = verifyVnpaySignature(params, VNP_HASH_SECRET);
      expect(resultValid.isValid).toBe(true);

      // 2. Bị sửa số tiền -> isValid: false
      const tamperedParams = { ...params, vnp_Amount: '9999999' };
      const resultTampered = verifyVnpaySignature(tamperedParams, VNP_HASH_SECRET);
      expect(resultTampered.isValid).toBe(false);
    });
  });

  describe('2. PaymentsService - Idempotency & Create Payment Tests', () => {
    it('ném lỗi BadRequestException nếu thiếu header Idempotency-Key', async () => {
      await expect(
        service.createPayment({ orderId: 'order-1' }, ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('từ chối mọi phương thức khác VNPAY Sandbox (không cho phép mock ví khác)', async () => {
      await expect(
        service.createPayment(
          { orderId: 'order-1', method: PaymentMethod.MOMO },
          'uuid-key-1',
        ),
      ).rejects.toThrow('Hệ thống hiện tại CHỈ cho phép thanh toán qua Cổng VNPay Sandbox (VNPAY)');
    });

    it('Idempotency-Key: trả về kết quả đã lưu nếu cùng 1 key gửi lại, không trừ tiền lần 2', async () => {
      const key = 'idem-uuid-existing-123';
      const existing = {
        id: 'pay-1',
        orderId: 'order-test-uuid-1',
        idempotencyKey: key,
        amount: '45000',
        method: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
        paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?test=1',
        order: mockOrder,
      };

      jest.spyOn(prisma.payment, 'findUnique').mockResolvedValue(existing as any);

      const res = await service.createPayment({ orderId: 'order-test-uuid-1' }, key);
      expect(res.success).toBe(true);
      expect(res.isDuplicate).toBe(true);
      expect(res.paymentUrl).toBe(existing.paymentUrl);
      expect(prisma.payment.upsert).not.toHaveBeenCalled();
    });

    it('ném lỗi NotFoundException nếu không tìm thấy đơn hàng', async () => {
      jest.spyOn(prisma.payment, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.order, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createPayment({ orderId: 'non-existent-order' }, 'key-new-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('khởi tạo thành công link VNPay Sandbox cho đơn hàng PENDING', async () => {
      jest.spyOn(prisma.payment, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder as any);
      jest.spyOn(prisma.payment, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.payment, 'upsert').mockResolvedValue({
        id: 'pay-new-1',
        orderId: mockOrder.id,
        amount: mockOrder.finalAmount,
        status: PaymentStatus.PENDING,
      } as any);

      const res = await service.createPayment(
        { orderId: mockOrder.id, method: PaymentMethod.VNPAY },
        'key-new-2',
      );

      expect(res.success).toBe(true);
      expect(res.isDuplicate).toBe(false);
      expect(res.paymentUrl).toContain('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
      expect(res.paymentUrl).toContain('vnp_TmnCode=8VXIB1MM');
    });
  });

  describe('3. VNPay IPN Webhook (Server-to-Server) & Hoàn kho Tests', () => {
    it('từ chối đối soát và trả về RspCode 97 khi chữ ký số không hợp lệ', async () => {
      const badQuery = {
        vnp_Amount: '4500000',
        vnp_TxnRef: 'BL-9999',
        vnp_SecureHash: 'invalid_forged_hash',
      };

      const res = await service.handleVnpayIpn(badQuery);
      expect(res).toEqual({ RspCode: '97', Message: 'Invalid Checksum' });
    });

    it('trả về RspCode 01 nếu không tìm thấy đơn hàng tương ứng', async () => {
      const validQuery: Record<string, any> = {
        vnp_Amount: '4500000',
        vnp_Command: 'pay',
        vnp_ResponseCode: '00',
        vnp_TmnCode: VNP_TMN_CODE,
        vnp_TxnRef: 'UNKNOWN-ORDER',
      };
      const sorted = sortObject(validQuery);
      const signData = Object.entries(sorted)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      validQuery['vnp_SecureHash'] = crypto
        .createHmac('sha512', VNP_HASH_SECRET)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');

      jest.spyOn(prisma.order, 'findFirst').mockResolvedValue(null);

      const res = await service.handleVnpayIpn(validQuery);
      expect(res).toEqual({ RspCode: '01', Message: 'Order not found' });
    });

    it('khi thanh toán thành công (vnp_ResponseCode=00): chuyển Order sang PAID và Payment sang SUCCESS', async () => {
      const validQuery: Record<string, any> = {
        vnp_Amount: '4500000',
        vnp_Command: 'pay',
        vnp_ResponseCode: '00',
        vnp_TmnCode: VNP_TMN_CODE,
        vnp_TransactionNo: '14567890',
        vnp_TxnRef: 'BL-9999',
      };
      const sorted = sortObject(validQuery);
      const signData = Object.entries(sorted)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      validQuery['vnp_SecureHash'] = crypto
        .createHmac('sha512', VNP_HASH_SECRET)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');

      jest.spyOn(prisma.order, 'findFirst').mockResolvedValue({
        ...mockOrder,
        payment: null,
      } as any);

      const res = await service.handleVnpayIpn(validQuery);
      expect(res).toEqual({ RspCode: '00', Message: 'Confirm Success' });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: mockOrder.id },
        data: { status: OrderStatus.PAID },
      });
    });

    it('khi thanh toán thất bại (vnp_ResponseCode=24 hủy giao dịch): hủy Order và tự động hoàn trả tồn kho nguyên liệu', async () => {
      const cancelQuery: Record<string, any> = {
        vnp_Amount: '4500000',
        vnp_Command: 'pay',
        vnp_ResponseCode: '24', // Khách hàng hủy giao dịch
        vnp_TmnCode: VNP_TMN_CODE,
        vnp_TransactionNo: '14567891',
        vnp_TxnRef: 'BL-9999',
      };
      const sorted = sortObject(cancelQuery);
      const signData = Object.entries(sorted)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      cancelQuery['vnp_SecureHash'] = crypto
        .createHmac('sha512', VNP_HASH_SECRET)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');

      jest.spyOn(prisma.order, 'findFirst').mockResolvedValue({
        ...mockOrder,
        items: [{ productId: 'prod-001', quantity: 2 }],
      } as any);

      jest.spyOn(prisma.recipeItem, 'findMany').mockResolvedValue([
        {
          id: 'recipe-1',
          productId: 'prod-001',
          ingredientId: 'ing-coffee-beans',
          quantityRequired: '20',
        },
      ] as any);

      const res = await service.handleVnpayIpn(cancelQuery);
      expect(res).toEqual({ RspCode: '00', Message: 'Confirm Success' });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: mockOrder.id },
        data: { status: OrderStatus.CANCELLED },
      });
      // Hoàn trả nguyên liệu: 20g * 2 ly = 40g
      expect(prisma.ingredient.update).toHaveBeenCalledWith({
        where: { id: 'ing-coffee-beans' },
        data: {
          stockQuantity: { increment: 40 },
          version: { increment: 1 },
        },
      });
    });
  });
});
