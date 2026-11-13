// apps/api/test/orders-payments.integration-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PaymentsService } from '../src/payments/payments.service';
import { OrdersService } from '../src/orders/orders.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { sortObject } from '../src/payments/vnpay.util';
import * as crypto from 'crypto';

/**
 * Task 5.2 - Bộ Integration Test nâng cao:
 * Luồng tích hợp liên module: Đặt đơn (Orders) -> Thanh toán Sandbox (Payments) -> Webhook IPN -> Idempotency Check.
 */
describe('Orders & Payments Integration Test (Task 5.2 - Quang)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let paymentsService: PaymentsService;
  let ordersService: OrdersService;

  const VNP_HASH_SECRET = 'GJZGJZTKHBYBESRSLCLSPZXGFPEXVPGF';
  const VNP_TMN_CODE = '8VXIB1MM';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    paymentsService = app.get<PaymentsService>(PaymentsService);
    ordersService = app.get<OrdersService>(OrdersService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Luồng tích hợp hoàn chỉnh: Tạo đơn -> Tạo link VNPay Sandbox -> Webhook SUCCESS -> Đơn hàng chuyển PAID', async () => {
    // 1. Tạo đơn hàng mẫu
    const testOrder = await prisma.order.create({
      data: {
        orderCode: 'BL-INTEG-' + Math.floor(1000 + Math.random() * 9000),
        status: OrderStatus.PENDING,
        subtotalAmount: 50000,
        discountAmount: 0,
        finalAmount: 50000,
      },
    });

    const idempotencyKey = 'idem-integ-' + Date.now();

    // 2. Khởi tạo thanh toán với Idempotency-Key
    const paymentRes = await paymentsService.createPayment(
      { orderId: testOrder.id },
      idempotencyKey,
      '127.0.0.1',
    );

    expect(paymentRes.success).toBe(true);
    expect(paymentRes.isDuplicate).toBe(false);
    expect(paymentRes.paymentUrl).toContain('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
    expect(paymentRes.paymentUrl).toContain('vnp_TmnCode=8VXIB1MM');

    // 3. Kiểm tra tính Idempotent: Gọi lại cùng Idempotency-Key trả về kết quả lưu trữ
    const duplicateRes = await paymentsService.createPayment(
      { orderId: testOrder.id },
      idempotencyKey,
      '127.0.0.1',
    );
    expect(duplicateRes.isDuplicate).toBe(true);
    expect(duplicateRes.paymentUrl).toBe(paymentRes.paymentUrl);

    // 4. Giả lập Cổng VNPay Sandbox bắn Webhook IPN (Server-to-Server)
    const ipnParams: Record<string, any> = {
      vnp_Amount: '5000000',
      vnp_Command: 'pay',
      vnp_OrderInfo: `Thanh toan don hang ${testOrder.orderCode}`,
      vnp_ResponseCode: '00', // Thành công
      vnp_TmnCode: VNP_TMN_CODE,
      vnp_TransactionNo: '14678901',
      vnp_TxnRef: testOrder.orderCode,
      vnp_Version: '2.1.0',
    };

    const sorted = sortObject(ipnParams);
    const signData = Object.entries(sorted)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    ipnParams['vnp_SecureHash'] = crypto
      .createHmac('sha512', VNP_HASH_SECRET)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    const ipnRes = await paymentsService.handleVnpayIpn(ipnParams);
    expect(ipnRes).toEqual({ RspCode: '00', Message: 'Confirm Success' });

    // 5. Kiểm tra CSDL: Đơn hàng đã chuyển sang trạng thái PAID
    const updatedOrder = await prisma.order.findUnique({
      where: { id: testOrder.id },
      include: { payment: true },
    });

    expect(updatedOrder?.status).toBe(OrderStatus.PAID);
    expect(updatedOrder?.payment?.status).toBe(PaymentStatus.SUCCESS);

    // Dọn dẹp bản ghi test
    await prisma.payment.deleteMany({ where: { orderId: testOrder.id } });
    await prisma.order.delete({ where: { id: testOrder.id } });
  });
});
