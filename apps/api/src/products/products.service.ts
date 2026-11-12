// apps/api/src/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  GetProductsDto,
  ProductResponseDto,
  ProductDetailResponseDto,
} from './dto/get-products.dto';

/**
 * Service xử lý logic nghiệp vụ cho phân hệ Thực đơn & Món đồ uống (Products Module).
 * Thuộc Business Logic Layer trong kiến trúc 3 tầng (ADR-003).
 * Phụ trách tính toán tồn kho khả dụng (availableStock) từ định mức RecipeItem & Ingredient.
 */
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách sản phẩm đang mở bán, hỗ trợ lọc theo danh mục và tìm kiếm từ khóa.
   * Tự động đối soát công thức RecipeItem để tính số lượng ly phục vụ tối đa (availableStock).
   *
   * @param query DTO chứa category và keyword tìm kiếm
   * @returns Danh sách sản phẩm kèm trạng thái khả dụng và cờ hết hàng (isSoldOut)
   */
  async findAll(query?: GetProductsDto): Promise<ProductResponseDto[]> {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (query?.category) {
      where.category = query.category;
    }

    if (query?.search && query.search.trim().length > 0) {
      const keyword = query.search.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { slug: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        recipeItems: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return products.map((product) => this.mapToProductResponse(product));
  }

  /**
   * Lấy chi tiết thông tin 1 món đồ uống theo ID hoặc Slug.
   * Ném ngoại lệ NotFoundException (404) nếu không tìm thấy hoặc món đã ngừng phục vụ.
   *
   * @param id Mã định danh UUID hoặc Slug của sản phẩm
   * @returns Chi tiết món kèm định mức công thức pha chế
   */
  async findOne(id: string): Promise<ProductDetailResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        isActive: true,
      },
      include: {
        recipeItems: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(
        `Không tìm thấy sản phẩm với mã "${id}" hoặc sản phẩm đã ngừng phục vụ.`,
      );
    }

    return this.mapToProductDetailResponse(product);
  }

  /**
   * Tính toán số lượng khả dụng (availableStock) dựa trên định mức nguyên liệu thô.
   * Công thức: availableStock = min(floor(stockQuantity / quantityRequired))
   */
  private calculateAvailableStock(recipeItems: any[]): number {
    if (!recipeItems || recipeItems.length === 0) {
      // Nếu món chưa gắn công thức thì mặc định khả dụng
      return 999;
    }

    let minServings = Number.MAX_SAFE_INTEGER;

    for (const item of recipeItems) {
      const stock = Number(item.ingredient?.stockQuantity ?? 0);
      const required = Number(item.quantityRequired ?? 0);

      if (required <= 0) continue;

      const servings = Math.floor(stock / required);
      if (servings < minServings) {
        minServings = servings;
      }
    }

    return minServings === Number.MAX_SAFE_INTEGER ? 0 : Math.max(0, minServings);
  }

  /**
   * Chuyển đổi thực thể Prisma Product sang ProductResponseDto chuẩn
   */
  private mapToProductResponse(product: any): ProductResponseDto {
    const availableStock = this.calculateAvailableStock(product.recipeItems);
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      basePrice: Number(product.basePrice),
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      availableStock,
      isSoldOut: availableStock <= 0,
    };
  }

  /**
   * Chuyển đổi thực thể Prisma Product sang ProductDetailResponseDto kèm định mức Recipe
   */
  private mapToProductDetailResponse(product: any): ProductDetailResponseDto {
    const baseResponse = this.mapToProductResponse(product);
    return {
      ...baseResponse,
      recipeItems: (product.recipeItems || []).map((r: any) => ({
        id: r.id,
        ingredientId: r.ingredientId,
        ingredientCode: r.ingredient?.code ?? '',
        ingredientName: r.ingredient?.name ?? 'Nguyên liệu',
        ingredientUnit: r.ingredient?.unit ?? 'đơn vị',
        quantityRequired: Number(r.quantityRequired),
      })),
    };
  }
}

