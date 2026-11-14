// apps/api/src/payments/dto/create-payment.dto.ts
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsNotEmpty({ message: 'Mã đơn hàng orderId không được để trống' })
  @IsString({ message: 'orderId phải là chuỗi ký tự' })
  orderId: string;

  @IsOptional()
  @IsEnum(PaymentMethod, {
    message: 'Phương thức thanh toán chỉ hỗ trợ VNPAY Sandbox',
  })
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  bankCode?: string;

  @IsOptional()
  @IsString()
  language?: string;
}
