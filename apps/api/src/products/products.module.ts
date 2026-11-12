// apps/api/src/products/products.module.ts
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

/**
 * Module Sản phẩm & Thực đơn (ProductsModule) - Modular Monolith boundary (Chức năng 1 - Duy & Chiến).
 * Đóng gói Controller (Presentation), Service (Business Logic) và tương tác PrismaService (DAL).
 */
@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

