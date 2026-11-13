// apps/web/src/components/ProductCard.tsx
'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
  onSelectProduct?: (product: Product) => void;
}

/**
 * Định dạng số tiền sang định dạng tiền tệ Việt Nam (VNĐ).
 * Ví dụ: 45000 -> 45.000 đ
 */
export function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')} đ`;
}

/**
 * Bản đồ hiển thị tên nhãn danh mục in hoa tiếng Việt theo đúng bản vẽ Figma Cloud BrewLite 2
 */
const CATEGORY_NAMES: Record<string, string> = {
  ESPRESSO: 'CÀ PHÊ PHA MÁY',
  COLD_BREW: 'CÀ PHÊ Ủ LẠNH',
  TEA: 'TRÀ TRÁI CÂY',
  FREEZE: 'ĐÁ XAY',
  PASTRY: 'BÁNH NƯỚNG',
  COFFEE: 'CÀ PHÊ',
};

/**
 * Component hiển thị thẻ từng món đồ uống trong thực đơn (ProductCard).
 * Khớp 100% bản vẽ Figma Cloud BrewLite 2 (Node 3:2 Desktop & Node 3:6 Mobile):
 * - Bề mặt thẻ kem sữa (#FFFAF0) bo góc mềm mại 16px (rounded-2xl)
 * - Đường viền be nhạt (#E8D7B8) tinh tế
 * - Tên món dùng font Lora (font-serif) màu nâu cà phê đậm (#3F3027)
 * - Giá tiền màu nâu đỏ đất nung (#7D3F32) nổi bật
 * - Nút chọn món (+) nền kem ấm (#F3E8D4) icon nâu đỏ (#7D3F32)
 * - Khi TẠM HẾT: Badge 'Tạm hết' góc ảnh, ảnh grayscale, nút pill 'Tạm hết' nền (#E8D7B8) chữ (#786B5A)
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
}) => {
  const isOutOfStock = product.isSoldOut || product.availableStock <= 0;

  const handleCardClick = () => {
    if (!isOutOfStock && onSelectProduct) {
      onSelectProduct(product);
    }
  };

  return (
    <article
      data-testid="product-card"
      data-product-id={product.id}
      data-sold-out={isOutOfStock}
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#FFFAF0] p-3 sm:p-4 border border-[#E8D7B8] shadow-2xs transition-all duration-300 ${
        isOutOfStock
          ? 'cursor-not-allowed opacity-80'
          : 'hover:-translate-y-1 hover:shadow-md hover:border-[#7D3F32]/40 cursor-pointer'
      }`}
    >
      {/* Khung ảnh sản phẩm bo góc 12px chuẩn Figma */}
      <div className={`relative mb-2.5 sm:mb-3.5 aspect-[4/3] w-full overflow-hidden rounded-xl ${
        isOutOfStock ? 'bg-[#EAE0D0]' : 'bg-[#F3E8D4]'
      }`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl || '/images/drinks/ca-phe-muoi-con-dao.jpg'}
          alt={product.name}
          className={`h-full w-full object-cover transition-all duration-500 ${
            isOutOfStock ? 'grayscale-[90%] opacity-70 contrast-[0.92]' : 'group-hover:scale-105'
          }`}
          loading="lazy"
        />

        {/* Badge Tạm hết ở góc trên bên trái ảnh chuẩn Figma */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5">
            <span className="inline-flex items-center rounded-full bg-[#FFFAF0]/95 backdrop-blur-xs px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-[#786B5A] shadow-2xs border border-[#E8D7B8]">
              Tạm hết
            </span>
          </div>
        )}
      </div>

      {/* Thông tin sản phẩm */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {/* Danh mục in hoa nhỏ */}
          <span className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#786B5A]">
            {CATEGORY_NAMES[product.category] || product.category}
          </span>

          {/* Tên món font Lora serif */}
          <h3 className={`mt-0.5 sm:mt-1 font-serif text-sm sm:text-base font-bold transition-colors line-clamp-1 ${
            isOutOfStock ? 'text-[#786B5A]' : 'text-[#3F3027] group-hover:text-[#7D3F32]'
          }`}>
            {product.name}
          </h3>

          {/* Mô tả ngắn */}
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-[#786B5A] line-clamp-2 leading-relaxed min-h-[1.75rem] sm:min-h-[2rem]">
            {product.description || 'Pha chế tỉ mỉ từ nguyên liệu tươi ngon nhất.'}
          </p>
        </div>

        {/* Hàng chân thẻ: Giá niêm yết và Nút hành động */}
        <div className="mt-3 sm:mt-4 flex items-center justify-between pt-1.5 sm:pt-2">
          {/* Giá tiền nâu đỏ đất nung (#7D3F32) */}
          <span className={`text-sm sm:text-base font-extrabold ${
            isOutOfStock ? 'text-[#786B5A]' : 'text-[#7D3F32]'
          }`}>
            {formatVnd(product.basePrice)}
          </span>

          {/* Nút hành động */}
          {isOutOfStock ? (
            <span
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-[#E8D7B8] text-[#786B5A] cursor-not-allowed select-none"
              aria-label={`Món ${product.name} đã tạm hết`}
            >
              Tạm hết
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              aria-label={`Chọn món ${product.name}`}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F3E8D4] hover:bg-[#E8D7B8] text-[#7D3F32] flex items-center justify-center transition-all duration-200 active:scale-90 shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
