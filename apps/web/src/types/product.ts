// apps/web/src/types/product.ts
/**
 * Định nghĩa các danh mục sản phẩm đồ uống của BrewLite 2 (khớp 100% bản thiết kế Figma mới)
 */
export type ProductCategory = 'ESPRESSO' | 'COLD_BREW' | 'TEA' | 'FREEZE' | 'PASTRY' | 'COFFEE';

/**
 * Kiểu dữ liệu sản phẩm đồ uống trả về từ Backend API (GET /api/v1/products)
 */
export interface Product {
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
 * Các lựa chọn lọc danh mục trên giao diện người dùng
 */
export type CategoryFilterOption = 'ALL' | ProductCategory;
