import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrdersService } from './orders.service';

@Controller(['orders', 'api/v1/orders'])
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
   * Tra cứu đơn hàng theo ID (UUID)
   * GET /api/v1/orders/:id
   */
  @Get(':id')
  async getOrderById(@Param('id') id: string): Promise<OrderResponseDto['order']> {
    return await this.ordersService.getOrderById(id);
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
}

