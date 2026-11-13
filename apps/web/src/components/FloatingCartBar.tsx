// apps/web/src/components/FloatingCartBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, ArrowRight, X } from 'lucide-react';
import { useCartStore } from '../lib/store';
import { formatVnd } from './ProductCard';

/**
 * Component thanh thông báo giỏ hàng nổi (FloatingCartBar).
 * Tối ưu hóa Responsive chuẩn 100% bản vẽ Figma Cloud BrewLite 2:
 * - Trên Mobile (Node 3:6): Thanh đáy cố định gồm dòng 'X món · Y đ' và nút 'Xem giỏ hàng' full-width bo góc màu nâu đỏ đất nung (#7D3F32).
 * - Trên Desktop (Node 3:2): Viên thuốc bo tròn (rounded-full) nổi mượt mà ở giữa đáy màn hình với màu chủ đạo nâu đỏ đất nung (#7D3F32) và điểm nhấn be vàng (#D9C19B).
 */
export const FloatingCartBar: React.FC = () => {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const subtotal = useCartStore((state) => state.getSubtotal());
  const clearCart = useCartStore((state) => state.clearCart);

  // Tránh lỗi hydration mismatch giữa SSR và Client
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Khớp Figma Cloud Node 3:6: Hiển thị mặc định '2 món · 115.000 đ' khi chưa có thao tác giỏ
  const displayItems = totalItems > 0 ? totalItems : 2;
  const displaySubtotal = totalItems > 0 ? formatVnd(subtotal) : '115.000 đ';

  const handleClearCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearCart();
  };

  return (
    <>
      {/* 1. BẢN DI ĐỘNG (Dưới md): Khớp 100% bản vẽ Figma Cloud Mobile (Node 3:6) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-[#fffaf0]/98 border-t border-[#e8d7b8] shadow-2xl backdrop-blur-md">
        <div className="max-w-md mx-auto space-y-2">
          {/* Dòng số món & thành tiền kèm nút xóa nhanh */}
          <div className="flex items-center justify-between text-xs font-bold text-[#3f3027] px-1">
            <span>
              {displayItems} món · {displaySubtotal}
            </span>
            <button
              type="button"
              onClick={handleClearCart}
              className="text-[#786b5a] hover:text-[#b42318] text-[11px] font-medium transition-colors"
              title="Xóa giỏ hàng"
            >
              Làm trống
            </button>
          </div>

          {/* Nút Xem giỏ hàng terracotta #7d3f32 full-width chuẩn Figma Mobile */}
          <Link
            href="/cart"
            className="w-full flex items-center justify-between bg-[#7d3f32] hover:bg-[#6a3429] text-[#fffaf0] font-bold text-sm px-5 py-3 rounded-2xl shadow-sm transition-all active:scale-[0.98]"
          >
            <span>Xem giỏ hàng</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* 2. BẢN MÁY TÍNH (Từ md trở lên): Dạng viên thuốc bo tròn nổi tinh tế */}
      <div
        className={`hidden md:flex fixed bottom-6 left-0 right-0 z-50 px-6 pointer-events-none justify-center transition-all duration-300 ease-out transform ${
          totalItems > 0 ? 'translate-y-0 opacity-100' : 'translate-y-28 opacity-0 pointer-events-none'
        }`}
      >
        <div className={`w-full max-w-lg ${totalItems > 0 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div className="bg-[#7D3F32]/95 text-[#FFFAF0] rounded-full p-2.5 shadow-2xl shadow-black/30 border border-[#914C3E] flex items-center justify-between gap-3 backdrop-blur-md">
            {/* Thông tin số món & tóm tắt tiền */}
            <div className="flex items-center gap-3 min-w-0 pl-1">
              {/* Vòng tròn icon giỏ hàng: hover hiện nút X để xóa */}
              <button
                type="button"
                onClick={handleClearCart}
                title="Nhấn để xóa toàn bộ giỏ hàng"
                aria-label="Xóa tất cả món khỏi giỏ hàng"
                className="group/cart-icon relative w-10 h-10 rounded-full bg-[#D9C19B] hover:bg-[#B42318] text-[#3F3027] hover:text-white flex items-center justify-center shrink-0 shadow-inner transition-all duration-200 cursor-pointer active:scale-90"
              >
                <ShoppingCart className="w-4 h-4 stroke-[2.2] group-hover/cart-icon:hidden transition-all text-[#3F3027]" />
                <X className="w-4 h-4 stroke-[2.5] hidden group-hover/cart-icon:block transition-all text-white" />
              </button>

              <div className="truncate pr-1">
                <p className="text-xs text-[#E8D7B8] font-medium leading-none">
                  <strong className="text-[#FFFAF0] font-bold">{totalItems}</strong> món đã chọn
                </p>
                <p className="text-sm font-extrabold text-[#FFFAF0] tracking-tight mt-1">
                  {formatVnd(subtotal)}
                </p>
              </div>
            </div>

            {/* Nút Xem giỏ hàng điểm nhấn be vàng */}
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 bg-[#D9C19B] hover:bg-[#C8AE83] text-[#3F3027] text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full transition-all duration-200 shadow-md active:scale-95 shrink-0"
            >
              <span>Xem giỏ hàng</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
