import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';

/**
 * 4 kịch bản ngoại lệ hủy đơn & giải phóng tồn kho theo yêu cầu kiểm thử hệ thống
 */
export enum OrderCancelScenario {
  ONLINE_CUSTOMER_CANCEL = 'ONLINE_CUSTOMER_CANCEL',
  PAYMENT_TIMEOUT_TTL = 'PAYMENT_TIMEOUT_TTL',
  OFFLINE_COUNTER_CANCEL = 'OFFLINE_COUNTER_CANCEL',
  OUT_OF_STOCK_REFUND = 'OUT_OF_STOCK_REFUND',
}

/**
 * DTO chuyển trạng thái đơn hàng dành cho Nhân viên / Barista / Admin
 */
export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message: 'Trạng thái không hợp lệ (PENDING, PAID, PREPARING, COMPLETED, CANCELLED).',
  })
  status: OrderStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO hủy đơn hàng & hoàn kho nguyên liệu / hoàn điểm / hoàn tiền
 */
export class CancelOrderDto {
  @IsOptional()
  @IsEnum(OrderCancelScenario, {
    message:
      'Kịch bản hủy đơn phải thuộc: ONLINE_CUSTOMER_CANCEL, PAYMENT_TIMEOUT_TTL, OFFLINE_COUNTER_CANCEL, OUT_OF_STOCK_REFUND.',
  })
  scenario?: OrderCancelScenario;

  @IsOptional()
  @IsString()
  reason?: string;
}
