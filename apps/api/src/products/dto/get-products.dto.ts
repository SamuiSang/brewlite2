// apps/api/src/products/dto/get-products.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductCategory } from '@prisma/client';

export { ProductCategory };

/**
 * DTO lọc và tìm kiếm danh sách sản phẩm (UC-01 - Menu Query)
 */
export class GetProductsDto {
  @IsOptional()
  @IsEnum(ProductCategory, {
    message: 'Danh mục phải là một trong các giá trị: COFFEE, TEA, FREEZE, PASTRY',
  })
  category?: ProductCategory;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;
}

/**
 * DTO dữ liệu trả về của từng sản phẩm trong thực đơn
 */
export interface ProductResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: ProductCategory;
  basePrice: number;
  imageUrl: string | null;
  isActive: boolean;
  availableStock: number;
  isSoldOut: boolean;
}

/**
 * DTO chi tiết sản phẩm kèm định mức công thức pha chế
 */
export interface ProductDetailResponseDto extends ProductResponseDto {
  recipeItems: Array<{
    id: string;
    ingredientId: string;
    ingredientCode: string;
    ingredientName: string;
    ingredientUnit: string;
    quantityRequired: number;
  }>;
}

