import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { CancelOrderDto, UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';
import { ValidatePromotionDto } from '../promotions/dto/promotions.dto';
import { PromotionsService } from '../promotions/promotions.service';

@Controller(['orders', 'api/v1/orders'])
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly promotionsService: PromotionsService,
  ) {}

  /**
   * UC-02.3: Thẩm định mã khuyến mãi trong luồng đặt hàng (Postman compatibility)
   * POST /orders/validate-voucher hoặc POST /api/v1/orders/validate-voucher
   */
  @Post('validate-voucher')
  @HttpCode(HttpStatus.OK)
  async validateVoucher(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: ValidatePromotionDto,
  ) {
    const amount = body.cartSubtotal ?? body.subtotal;
    if (amount === undefined || amount === null) {
      throw new BadRequestException('Giá trị đơn hàng (cartSubtotal hoặc subtotal) không hợp lệ');
    }
    return await this.promotionsService.validate(body.code, amount, body.deliveryMethod);
  }

  private extractRequester(req: any) {
    return {
      userId: req?.user?.sub || req?.user?.id,
      role: req?.user?.role,
    };
  }

  /**
   * UC-04: Khởi tạo đơn hàng & Khóa tồn kho nguyên liệu an toàn
   * POST /api/v1/orders
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return await this.ordersService.createOrder(dto);
  }

  /**
   * UC-06.2: Lấy lịch sử đơn hàng của chính người dùng đang đăng nhập
   * GET /api/v1/orders/my-orders (Đặt trước route động :id để tránh xung đột path)
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  async getMyOrders(@Req() req: any) {
    const { userId } = this.extractRequester(req);
    return await this.ordersService.findByUser(userId);
  }

  /**
   * Giải phóng tồn kho nguyên liệu cho các đơn PENDING quá hạn TTL thanh toán
   * POST /api/v1/orders/expire-overdue
   */
  @UseGuards(JwtAuthGuard)
  @Post('expire-overdue')
  async expireOverdue(@Req() req: any) {
    const { userId, role } = this.extractRequester(req);
    const scopeUserId = role === 'STAFF' || role === 'ADMIN' ? undefined : userId;
    return await this.ordersService.expireOverdueOrders(scopeUserId);
  }

  /**
   * Tra cứu đơn hàng theo mã công khai BL-YYYYMMDD-XXXX
   * GET /api/v1/orders/code/:orderCode
   */
  @Get('code/:orderCode')
  async getOrderByCode(
    @Param('orderCode') orderCode: string,
  ): Promise<OrderResponseDto['order']> {
    return await this.ordersService.getOrderByCode(orderCode);
  }

  /**
   * UC-06.1: Tra cứu chi tiết đơn hàng / Biên nhận điện tử kèm Anti-IDOR 403
   * GET /api/v1/orders/:id
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOrderById(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<OrderResponseDto['order']> {
    return await this.ordersService.getOrderById(id, this.extractRequester(req));
  }

  /**
   * UC-06.4: Cập nhật trạng thái pha chế theo State Machine (chỉ STAFF / ADMIN)
   * PATCH /api/v1/orders/:id/status
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: UpdateOrderStatusDto,
    @Req() req: any,
  ) {
    const requester = this.extractRequester(req);
    if (requester.role !== 'STAFF' && requester.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Chỉ Nhân viên quầy hoặc Quản trị viên mới có quyền cập nhật trạng thái đơn hàng.',
      );
    }
    return await this.ordersService.updateOrderStatus(id, dto.status, requester, dto.reason);
  }

  /**
   * Hủy đơn hàng & hoàn trả nguyên liệu / hoàn điểm / hoàn tiền (4 kịch bản)
   * POST /api/v1/orders/:id/cancel
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelOrder(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CancelOrderDto,
    @Req() req: any,
  ) {
    return await this.ordersService.cancelOrder(id, dto, this.extractRequester(req));
  }
}

