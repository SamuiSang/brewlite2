// apps/api/src/payments/payments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import { buildVnpayPaymentUrl, verifyVnpaySignature } from './vnpay.util';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  // Cấu hình Cổng thanh toán VNPay Sandbox chính thức
  private readonly vnpTmnCode = process.env.VNP_TMN_CODE || '8VXIB1MM';
  private readonly vnpHashSecret =
    process.env.VNP_HASH_SECRET || 'GJZGJZTKHBYBESRSLCLSPZXGFPEXVPGF';
  private readonly vnpUrl =
    process.env.VNP_URL ||
    'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  private readonly vnpReturnUrl =
    process.env.VNP_RETURN_URL ||
    'http://localhost:3000/checkout/vnpay-return';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Khởi tạo giao dịch thanh toán qua Cổng VNPay Sandbox
   * Tuân thủ Idempotency-Key chống tạo giao dịch hoặc trừ tiền trùng lặp
   */
  async createPayment(
    dto: CreatePaymentDto,
    idempotencyKey?: string,
    clientIp: string = '127.0.0.1',
  ) {
    if (!idempotencyKey || typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
      throw new BadRequestException('Bắt buộc phải có header "Idempotency-Key" (UUID)');
    }

    const trimmedKey = idempotencyKey.trim();

    // 1. Kiểm tra Idempotency-Key đã tồn tại chưa
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: trimmedKey },
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

    if (existingPayment) {
      this.logger.log(
        `[Idempotency] Tìm thấy giao dịch đã tạo cho key: ${trimmedKey}, trả về kết quả lưu trữ`,
      );
      return {
        success: true,
        isDuplicate: true,
        message: 'Giao dịch thanh toán đã được khởi tạo trước đó',
        payment: existingPayment,
        paymentUrl: existingPayment.paymentUrl,
      };
    }

    // 2. Chỉ cho phép thanh toán VNPAY Sandbox, từ chối mọi mock khác
    if (dto.method && dto.method !== PaymentMethod.VNPAY) {
      throw new BadRequestException(
        'Hệ thống hiện tại CHỈ cho phép thanh toán qua Cổng VNPay Sandbox (VNPAY)',
      );
    }

    // 3. Tìm đơn hàng cần thanh toán
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã "${dto.orderId}"`);
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Đơn hàng này đã được thanh toán thành công');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Đơn hàng này đã bị hủy, không thể thanh toán');
    }

    // 4. Kiểm tra đơn hàng đã có bản ghi thanh toán thành công trước đó chưa
    const orderSuccessfulPayment = await this.prisma.payment.findFirst({
      where: {
        orderId: order.id,
        status: PaymentStatus.SUCCESS,
      },
    });

    if (orderSuccessfulPayment) {
      throw new BadRequestException('Đơn hàng đã có thanh toán thành công');
    }

    // 5. Tạo URL thanh toán VNPay Sandbox có chữ ký HMAC SHA512
    const paymentUrl = buildVnpayPaymentUrl({
      tmnCode: this.vnpTmnCode,
      hashSecret: this.vnpHashSecret,
      vnpUrl: this.vnpUrl,
      returnUrl: this.vnpReturnUrl,
      orderId: order.id,
      orderCode: order.orderCode,
      amount: Number(order.finalAmount),
      orderInfo: `Thanh toan don hang ${order.orderCode} qua BrewLite`,
      ipAddr: clientIp,
      bankCode: dto.bankCode,
      locale: dto.language || 'vn',
    });

    // 6. Lưu bản ghi Payment trạng thái PENDING
    // Nếu đơn hàng đã có Payment cũ (do lần thử trước chưa hoàn tất), cập nhật lại
    const payment = await this.prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        idempotencyKey: trimmedKey,
        amount: order.finalAmount,
        method: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
        paymentUrl: paymentUrl,
        transactionRef: order.orderCode,
      },
      update: {
        idempotencyKey: trimmedKey,
        amount: order.finalAmount,
        method: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
        paymentUrl: paymentUrl,
        transactionRef: order.orderCode,
      },
    });

    this.logger.log(
      `Khởi tạo thanh toán VNPay thành công cho đơn #${order.orderCode}: ${paymentUrl}`,
    );

    return {
      success: true,
      isDuplicate: false,
      message: 'Khởi tạo link thanh toán VNPay Sandbox thành công',
      payment,
      paymentUrl,
    };
  }

  /**
   * Xử lý IPN / Webhook gửi ngầm từ Cổng VNPay Sandbox
   * Chuẩn 2 bước Server-to-Server, đối soát chữ ký số và cập nhật CSDL trong Transaction
   */
  async handleVnpayIpn(queryParams: Record<string, any>) {
    this.logger.log(
      `[VNPay IPN] Tiếp nhận dữ liệu đối soát: ${JSON.stringify(queryParams)}`,
    );

    // 1. Kiểm tra chữ ký số HMAC SHA512
    const verification = verifyVnpaySignature(queryParams, this.vnpHashSecret);
    if (!verification.isValid) {
      this.logger.warn(
        `[VNPay IPN] Chữ ký không hợp lệ! Nhận: ${verification.secureHash}, Tính: ${verification.calculatedHash}`,
      );
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    const orderCode = queryParams['vnp_TxnRef'];
    const vnpResponseCode = queryParams['vnp_ResponseCode'];
    const vnpTransactionNo = queryParams['vnp_TransactionNo'];
    const vnpAmount = Number(queryParams['vnp_Amount'] || 0) / 100;

    // 2. Tìm đơn hàng tương ứng
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ orderCode: orderCode }, { id: orderCode }],
      },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      this.logger.warn(`[VNPay IPN] Không tìm thấy đơn hàng: ${orderCode}`);
      return { RspCode: '01', Message: 'Order not found' };
    }

    // 3. Kiểm tra số tiền có khớp không
    if (Math.round(Number(order.finalAmount)) !== Math.round(vnpAmount)) {
      this.logger.warn(
        `[VNPay IPN] Số tiền không khớp! Đơn: ${order.finalAmount}, VNPay: ${vnpAmount}`,
      );
      return { RspCode: '04', Message: 'Invalid Amount' };
    }

    // 4. Nếu đơn hàng đã được xác nhận thanh toán trước đó
    if (order.status === OrderStatus.PAID) {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // 5. Cập nhật trạng thái trong Database Transaction
    if (vnpResponseCode === '00') {
      // THANH TOÁN THÀNH CÔNG: Chuyển Order -> PAID, Payment -> SUCCESS
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.upsert({
          where: { orderId: order.id },
          create: {
            orderId: order.id,
            idempotencyKey: 'vnpay-' + (vnpTransactionNo || Date.now()),
            amount: order.finalAmount,
            method: PaymentMethod.VNPAY,
            status: PaymentStatus.SUCCESS,
            transactionRef: String(vnpTransactionNo || ''),
            webhookPayload: queryParams,
            paidAt: new Date(),
          },
          update: {
            status: PaymentStatus.SUCCESS,
            transactionRef: String(vnpTransactionNo || ''),
            webhookPayload: queryParams,
            paidAt: new Date(),
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
        });
      });

      this.logger.log(
        `[VNPay IPN] Đơn hàng #${order.orderCode} đã thanh toán THÀNH CÔNG qua VNPay`,
      );
      return { RspCode: '00', Message: 'Confirm Success' };
    } else {
      // THANH TOÁN THẤT BẠI HOẶC KHÁCH HỦY:
      // Chuyển Order -> CANCELLED, Payment -> FAILED và HOÀN TRẢ TỒN KHO NGUYÊN LIỆU
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.upsert({
          where: { orderId: order.id },
          create: {
            orderId: order.id,
            idempotencyKey: 'vnpay-' + (vnpTransactionNo || Date.now()),
            amount: order.finalAmount,
            method: PaymentMethod.VNPAY,
            status: PaymentStatus.FAILED,
            transactionRef: String(vnpTransactionNo || ''),
            webhookPayload: queryParams,
          },
          update: {
            status: PaymentStatus.FAILED,
            transactionRef: String(vnpTransactionNo || ''),
            webhookPayload: queryParams,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED },
        });

        // Hoàn trả nguyên liệu thô theo công thức RecipeItem
        for (const item of order.items) {
          const recipeItems = await tx.recipeItem.findMany({
            where: { productId: item.productId },
          });

          for (const recipe of recipeItems) {
            const refundQty = Number(recipe.quantityRequired) * item.quantity;
            await tx.ingredient.update({
              where: { id: recipe.ingredientId },
              data: {
                stockQuantity: {
                  increment: refundQty,
                },
                version: {
                  increment: 1,
                },
              },
            });
          }
        }
      });

      this.logger.log(
        `[VNPay IPN] Đơn hàng #${order.orderCode} thanh toán THẤT BẠI (Mã lỗi: ${vnpResponseCode}), đã hoàn trả kho nguyên liệu`,
      );
      return { RspCode: '00', Message: 'Confirm Success' };
    }
  }

  /**
   * Xử lý khi khách hàng hoàn tất thanh toán trên VNPay và được redirect về Website
   */
  async handleVnpayReturn(queryParams: Record<string, any>) {
    const verification = verifyVnpaySignature(queryParams, this.vnpHashSecret);
    const orderCode = queryParams['vnp_TxnRef'];
    const responseCode = queryParams['vnp_ResponseCode'];

    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ orderCode: orderCode }, { id: orderCode }],
      },
      include: { payment: true },
    });

    const isSuccess = verification.isValid && responseCode === '00';

    return {
      isValidSignature: verification.isValid,
      isSuccess,
      orderCode,
      orderId: order?.id,
      responseCode,
      message: isSuccess
        ? 'Giao dịch thanh toán qua VNPay thành công'
        : verification.isValid
        ? `Giao dịch không thành công hoặc khách hàng đã hủy (Mã phản hồi: ${responseCode})`
        : 'Chữ ký phản hồi không hợp lệ!',
      order,
    };
  }

  /**
   * Lấy trạng thái thanh toán hiện tại của một đơn hàng
   */
  async getPaymentStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${orderId}`);
    }

    return {
      orderId: order.id,
      orderCode: order.orderCode,
      orderStatus: order.status,
      paymentStatus: order.payment?.status || PaymentStatus.PENDING,
      amount: order.finalAmount,
      payment: order.payment,
    };
  }
}
