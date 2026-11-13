// apps/api/src/payments/payments.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * API Khởi tạo thanh toán qua Cổng VNPay Sandbox
   * POST /api/v1/payments
   * Bắt buộc có header: Idempotency-Key: <UUID>
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @Req() req: Request,
  ) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    return await this.paymentsService.createPayment(dto, idempotencyKey, clientIp);
  }

  /**
   * Webhook IPN nhận ngầm từ VNPay Sandbox (Server-to-Server)
   * GET /api/v1/payments/vnpay-ipn
   */
  @Get('vnpay-ipn')
  async handleVnpayIpn(@Query() query: Record<string, any>) {
    return await this.paymentsService.handleVnpayIpn(query);
  }

  /**
   * Endpoint Webhook đối soát chung cho Cổng Sandbox
   * POST /api/v1/payments/webhook
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: Record<string, any>,
    @Query() query: Record<string, any>,
  ) {
    const payload = Object.keys(query).length > 0 ? query : body;
    return await this.paymentsService.handleVnpayIpn(payload);
  }

  /**
   * Endpoint tiếp nhận kết quả khi VNPay redirect khách hàng về Website
   * GET /api/v1/payments/vnpay-return
   */
  @Get('vnpay-return')
  async handleVnpayReturn(@Query() query: Record<string, any>) {
    return await this.paymentsService.handleVnpayReturn(query);
  }

  /**
   * Kiểm tra trạng thái thanh toán của một đơn hàng
   * GET /api/v1/payments/status/:orderId
   */
  @Get('status/:orderId')
  async getPaymentStatus(@Param('orderId') orderId: string) {
    return await this.paymentsService.getPaymentStatus(orderId);
  }
}
