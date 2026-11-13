import { Body, Controller, Get, HttpCode, Post, ValidationPipe } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PromotionsService } from './promotions.service';

export class ValidatePromotionDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @IsInt()
  @Min(1)
  @Max(999999999)
  cartSubtotal!: number;

  @IsOptional()
  @IsIn(['PICKUP', 'DELIVERY'])
  deliveryMethod?: string;
}

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Post('validate')
  @HttpCode(200)
  validate(@Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) body: ValidatePromotionDto) {
    return this.promotions.validate(body.code, body.cartSubtotal, body.deliveryMethod);
  }

  @Get('active')
  active() { return this.promotions.active(); }
}
