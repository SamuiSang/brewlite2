import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  CreatePromotionDto,
  QueryPromotionDto,
  UpdatePromotionDto,
  ValidatePromotionDto,
} from './dto/promotions.dto';
import { PromotionsService } from './promotions.service';

export {
  CreatePromotionDto,
  QueryPromotionDto,
  UpdatePromotionDto,
  ValidatePromotionDto,
};

@Controller(['promotions', 'api/v1/promotions'])
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  /**
   * UC-02.3: Thẩm định mã khuyến mãi cho giỏ hàng
   * POST /api/v1/promotions/validate hoặc POST /api/v1/promotions/validate-voucher
   */
  @Post(['validate', 'validate-voucher'])
  @HttpCode(HttpStatus.OK)
  validate(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    body: ValidatePromotionDto,
  ) {
    const amount = body.cartSubtotal ?? body.subtotal;
    if (amount === undefined || amount === null) {
      throw new BadRequestException('Giá trị đơn hàng (cartSubtotal hoặc subtotal) không hợp lệ');
    }
    return this.promotions.validate(body.code, amount, body.deliveryMethod);
  }

  /**
   * Lấy danh sách ưu đãi đang khả dụng cho khách hàng
   * GET /api/v1/promotions/active
   */
  @Get('active')
  active() {
    return this.promotions.active();
  }

  /**
   * Tạo mới mã khuyến mãi (Admin/Backoffice)
   * POST /api/v1/promotions
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    dto: CreatePromotionDto,
  ) {
    return this.promotions.create(dto);
  }

  /**
   * Lấy danh sách toàn bộ mã khuyến mãi kèm bộ lọc
   * GET /api/v1/promotions
   */
  @Get()
  findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: QueryPromotionDto,
  ) {
    return this.promotions.findAll(query);
  }

  /**
   * Tra cứu chi tiết mã khuyến mãi theo ID hoặc Code
   * GET /api/v1/promotions/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promotions.findOne(id);
  }

  /**
   * Cập nhật thông tin mã khuyến mãi
   * PATCH /api/v1/promotions/:id
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    dto: UpdatePromotionDto,
  ) {
    return this.promotions.update(id, dto);
  }

  /**
   * Xóa mã khuyến mãi
   * DELETE /api/v1/promotions/:id
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promotions.remove(id);
  }
}
