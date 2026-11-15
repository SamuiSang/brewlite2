import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DiscountType } from '@prisma/client';

export class ValidatePromotionDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999999999)
  cartSubtotal?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999999999)
  subtotal?: number;

  @IsOptional()
  @IsIn(['PICKUP', 'DELIVERY'])
  deliveryMethod?: string;
}

export class CreatePromotionDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty({ message: 'Mã khuyến mãi không được để trống' })
  @MaxLength(50)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsEnum(DiscountType, { message: 'Loại giảm giá phải là PERCENTAGE hoặc FIXED_AMOUNT' })
  discountType!: DiscountType;

  @IsNumber({}, { message: 'Giá trị giảm giá phải là số hợp lệ' })
  @Min(0, { message: 'Giá trị giảm giá không được âm' })
  discountValue!: number;

  @IsOptional()
  @IsNumber({}, { message: 'Đơn hàng tối thiểu phải là số hợp lệ' })
  @Min(0, { message: 'Đơn hàng tối thiểu không được âm' })
  minOrderValue?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giảm giá tối đa phải là số hợp lệ' })
  @Min(0, { message: 'Giảm giá tối đa không được âm' })
  maxDiscountAmount?: number;

  @IsOptional()
  @IsInt({ message: 'Giới hạn lượt dùng phải là số nguyên' })
  @Min(1, { message: 'Giới hạn lượt dùng tối thiểu là 1' })
  usageLimit?: number;

  @IsOptional()
  @IsBoolean()
  firstOrderOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  deliveryOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Thời gian bắt đầu phải là ngày hợp lệ (ISO format)' })
  startsAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Thời gian hết hạn phải là ngày hợp lệ (ISO format)' })
  expiresAt?: Date;
}

export class UpdatePromotionDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsEnum(DiscountType, { message: 'Loại giảm giá phải là PERCENTAGE hoặc FIXED_AMOUNT' })
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber({}, { message: 'Giá trị giảm giá phải là số hợp lệ' })
  @Min(0, { message: 'Giá trị giảm giá không được âm' })
  discountValue?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Đơn hàng tối thiểu phải là số hợp lệ' })
  @Min(0, { message: 'Đơn hàng tối thiểu không được âm' })
  minOrderValue?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giảm giá tối đa phải là số hợp lệ' })
  @Min(0, { message: 'Giảm giá tối đa không được âm' })
  maxDiscountAmount?: number;

  @IsOptional()
  @IsInt({ message: 'Giới hạn lượt dùng phải là số nguyên' })
  @Min(1, { message: 'Giới hạn lượt dùng tối thiểu là 1' })
  usageLimit?: number;

  @IsOptional()
  @IsBoolean()
  firstOrderOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  deliveryOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Thời gian bắt đầu phải là ngày hợp lệ (ISO format)' })
  startsAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Thời gian hết hạn phải là ngày hợp lệ (ISO format)' })
  expiresAt?: Date;
}

export class QueryPromotionDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

