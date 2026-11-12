// apps/api/src/products/products.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  GetProductsDto,
  ProductResponseDto,
  ProductDetailResponseDto,
} from './dto/get-products.dto';

/**
 * Controller phụ trách các endpoint tra cứu Thực đơn đồ uống (Menu / Products API).
 * Tuân thủ chuẩn RESTful API v1: GET /api/v1/products & GET /api/v1/products/:id.
 * Thuộc Presentation Layer trong kiến trúc 3 tầng (ADR-003).
 */
@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Endpoint lấy danh sách món đang mở bán, hỗ trợ lọc theo danh mục và tìm kiếm từ khóa.
   *
   * @param query Bộ lọc danh mục (COFFEE, TEA, FREEZE, PASTRY) và từ khóa tìm kiếm
   * @returns Danh sách món kèm trạng thái tồn kho khả dụng
   */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findAll(@Query() query: GetProductsDto): Promise<ProductResponseDto[]> {
    return await this.productsService.findAll(query);
  }

  /**
   * Endpoint lấy thông tin chi tiết một món đồ uống theo ID hoặc Slug.
   *
   * @param id UUID hoặc slug của sản phẩm
   * @returns Thông tin chi tiết món kèm định mức công thức pha chế
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProductDetailResponseDto> {
    return await this.productsService.findOne(id);
  }
}

