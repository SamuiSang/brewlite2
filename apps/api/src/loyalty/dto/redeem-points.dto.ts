import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

/**
 * DTO kiểm tra nháp quy đổi điểm thưởng trước khi đặt đơn / đổi quà
 */
export class RedeemPreviewDto {
  @Type(() => Number)
  @IsInt({ message: 'Số điểm (Hạt) muốn quy đổi phải là số nguyên.' })
  @Min(1, { message: 'Số điểm quy đổi phải lớn hơn 0.' })
  pointsToRedeem: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Giá trị đơn hàng phải là số hợp lệ.' })
  @Min(0, { message: 'Giá trị đơn hàng không được âm.' })
  orderAmount: number;
}

/**
 * DTO xác nhận quy đổi Hạt thưởng thành quà tặng hoặc giảm giá đơn hàng
 */
export class RedeemPointsDto {
  @Type(() => Number)
  @IsInt({ message: 'Số điểm (Hạt) muốn quy đổi phải là số nguyên.' })
  @Min(1, { message: 'Số điểm quy đổi phải lớn hơn 0.' })
  pointsToRedeem: number;

  @IsOptional()
  @IsString()
  rewardId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID('4', { message: 'orderId phải là UUID hợp lệ.' })
  orderId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  orderAmount?: number;
}
