import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsUUID('4', { message: 'productId phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'productId không được để trống' })
  productId: string;

  @IsString({ message: 'size phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'size không được để trống (S, M, L)' })
  size: 'S' | 'M' | 'L';

  @IsOptional()
  @IsString()
  sugarLevel?: string;

  @IsOptional()
  @IsString()
  iceLevel?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toppings?: string[];

  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number;
}

export enum DeliveryMethod {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

export class CreateOrderDto {
  @IsOptional()
  @IsUUID('4', { message: 'userId phải là UUID hợp lệ' })
  userId?: string;

  @IsArray({ message: 'items phải là một danh sách món' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;

  @IsOptional()
  @IsString()
  receiverName?: string;

  @IsOptional()
  @IsString()
  receiverPhone?: string;
}

