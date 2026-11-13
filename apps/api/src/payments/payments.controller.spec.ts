// apps/api/src/payments/payments.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: {
            createPayment: jest.fn().mockResolvedValue({
              success: true,
              paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?test=1',
            }),
            handleVnpayIpn: jest.fn().mockResolvedValue({
              RspCode: '00',
              Message: 'Confirm Success',
            }),
            handleVnpayReturn: jest.fn().mockResolvedValue({
              isValidSignature: true,
              isSuccess: true,
              orderCode: 'BL-9999',
            }),
            getPaymentStatus: jest.fn().mockResolvedValue({
              orderId: 'order-1',
              orderStatus: 'PAID',
              paymentStatus: 'SUCCESS',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  it('createPayment gọi service.createPayment với Idempotency-Key', async () => {
    const req: any = {
      headers: { 'x-forwarded-for': '127.0.0.1' },
      socket: {},
    };

    const res = await controller.createPayment(
      { orderId: 'order-1' },
      'uuid-key-123',
      req,
    );

    expect(service.createPayment).toHaveBeenCalledWith(
      { orderId: 'order-1' },
      'uuid-key-123',
      '127.0.0.1',
    );
    expect(res.success).toBe(true);
  });

  it('handleVnpayIpn gọi service.handleVnpayIpn', async () => {
    const query = { vnp_ResponseCode: '00', vnp_TxnRef: 'BL-9999' };
    const res = await controller.handleVnpayIpn(query);
    expect(service.handleVnpayIpn).toHaveBeenCalledWith(query);
    expect(res.RspCode).toBe('00');
  });

  it('handleVnpayReturn gọi service.handleVnpayReturn', async () => {
    const query = { vnp_ResponseCode: '00', vnp_TxnRef: 'BL-9999' };
    const res = await controller.handleVnpayReturn(query);
    expect(service.handleVnpayReturn).toHaveBeenCalledWith(query);
    expect(res.isSuccess).toBe(true);
  });

  it('getPaymentStatus gọi service.getPaymentStatus', async () => {
    const res = await controller.getPaymentStatus('order-1');
    expect(service.getPaymentStatus).toHaveBeenCalledWith('order-1');
    expect(res.orderStatus).toBe('PAID');
  });
});
