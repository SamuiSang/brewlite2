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
 * Bản đồ hiển thị tên nhãn danh mục in hoa tiếng Việt theo đúng bản vẽ Figma
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
 * Khớp 100% cả bản Desktop (4 cột) và bản Mobile (2 cột):
 * - Thẻ trắng bo góc mềm mại (rounded-2xl sm:rounded-3xl)
 * - Khung ảnh bo góc (rounded-xl sm:rounded-2xl)
 * - Danh mục in hoa nhỏ màu xám ghi
 * - Tên món chữ đậm đen
 * - Mô tả ngắn 1-2 dòng thanh lịch
 * - Khi CÒN HÀNG: Nút tròn nhỏ có icon Lucide Plus '+' màu xanh rêu
 * - Khi TẠM HẾT: Ảnh sản phẩm chuyển tông xám rõ rệt (grayscale 90%), Badge 'Tạm hết' góc trên ảnh, nút pill 'Tạm hết' màu xám ở chân thẻ
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
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl bg-white p-3 sm:p-4 border border-[#E5E8E1] shadow-2xs transition-all duration-300 ${
        isOutOfStock
          ? 'cursor-not-allowed bg-[#FAF9F7]/70'
          : 'hover:-translate-y-1 hover:shadow-md hover:border-[#183B2B]/30 cursor-pointer'
      }`}
    >
      {/* Khung ảnh sản phẩm */}
      <div className={`relative mb-2.5 sm:mb-3.5 aspect-[4/3] w-full overflow-hidden rounded-xl sm:rounded-2xl ${
        isOutOfStock ? 'bg-[#EAE7E1]' : 'bg-[#F0EDE6]'
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

        {/* Badge Tạm hết ở góc trên bên trái ảnh (Chuẩn Figma gốc) */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5">
            <span className="inline-flex items-center rounded-full bg-white/95 backdrop-blur-xs px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-[#59665F] shadow-2xs border border-[#E5E8E1]">
              Tạm hết
            </span>
          </div>
        )}
      </div>

      {/* Thông tin sản phẩm */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {/* Danh mục in hoa nhỏ */}
          <span className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#59665F]">
            {CATEGORY_NAMES[product.category] || product.category}
          </span>

          {/* Tên món */}
          <h3 className={`mt-0.5 sm:mt-1 text-sm sm:text-base font-bold transition-colors line-clamp-1 ${
            isOutOfStock ? 'text-[#59665F]' : 'text-[#182B22] group-hover:text-[#183B2B]'
          }`}>
            {product.name}
          </h3>

          {/* Mô tả ngắn */}
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-[#59665F] line-clamp-2 leading-relaxed min-h-[1.75rem] sm:min-h-[2rem]">
            {product.description || 'Pha chế tỉ mỉ từ nguyên liệu tươi ngon nhất.'}
          </p>
        </div>

        {/* Hàng chân thẻ: Giá niêm yết và Nút hành động */}
        <div className="mt-3 sm:mt-4 flex items-center justify-between pt-1.5 sm:pt-2">
          {/* Giá tiền */}
          <span className={`text-sm sm:text-base font-extrabold ${
            isOutOfStock ? 'text-[#59665F]' : 'text-[#182B22]'
          }`}>
            {formatVnd(product.basePrice)}
          </span>

          {/* Nút hành động */}
          {isOutOfStock ? (
            <span
              className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-[#EFECE6] text-[#59665F] cursor-not-allowed select-none"
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
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E8EDE7] hover:bg-[#D5E0D4] text-[#183B2B] flex items-center justify-center transition-all duration-200 active:scale-90 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
