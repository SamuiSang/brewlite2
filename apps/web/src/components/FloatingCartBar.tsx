// apps/web/src/components/FloatingCartBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, X } from 'lucide-react';
import { useCartStore } from '../lib/store';
import { formatVnd } from './ProductCard';

/**
 * Component thanh thông báo giỏ hàng nổi (FloatingCartBar).
 * Tối ưu hóa Responsive chuẩn 100% cả 2 bản vẽ Figma:
 * - Trên Mobile (Frame 01 · Di động): Thanh đáy gồm dòng 'X món · Y đ' và nút 'Xem giỏ hàng' full-width bo góc màu xanh rêu.
 * - Trên Desktop (Frame 01 · Máy tính): Viên thuốc bo tròn (rounded-full) nổi mượt mà ở giữa đáy màn hình.
 * - Hiệu ứng trượt từ dưới lên (slide-up) khi có món và trượt ngược xuống dưới (slide-down) khi xóa sạch giỏ.
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

  const isVisible = totalItems > 0;

  const handleClearCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearCart();
  };

  return (
    <>
      {/* 1. BẢN DI ĐỘNG (Dưới md): Khớp 100% bản vẽ Figma 01 · Thực đơn · Di động */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#FBF9F5]/98 border-t border-[#E5E8E1] shadow-2xl backdrop-blur-md transition-all duration-300 ease-out transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-md mx-auto space-y-2">
          {/* Dòng số món & thành tiền kèm nút xóa nhanh */}
          <div className="flex items-center justify-between text-xs font-bold text-[#182B22] px-1">
            <span>
              {totalItems} món · {formatVnd(subtotal)}
            </span>
            <button
              type="button"
              onClick={handleClearCart}
              className="text-[#59665F] hover:text-[#B42318] text-[11px] font-medium transition-colors"
              title="Xóa giỏ hàng"
            >
              Làm trống
            </button>
          </div>

          {/* Nút Xem giỏ hàng xanh rêu full-width chuẩn Figma Mobile */}
          <Link
            href="/cart"
            className="w-full flex items-center justify-between bg-[#183B2B] hover:bg-[#234D39] text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-sm transition-all active:scale-[0.98]"
          >
            <span>Xem giỏ hàng</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* 2. BẢN MÁY TÍNH (Từ md trở lên): Dạng viên thuốc bo tròn nổi tinh tế */}
      <div
        className={`hidden md:flex fixed bottom-6 left-0 right-0 z-50 px-6 pointer-events-none justify-center transition-all duration-300 ease-out transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-28 opacity-0 pointer-events-none'
        }`}
      >
        <div className={`w-full max-w-lg ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div className="bg-[#183B2B]/95 text-white rounded-full p-2.5 shadow-2xl shadow-black/30 border border-[#2D5341] flex items-center justify-between gap-3 backdrop-blur-md">
            {/* Thông tin số món & tóm tắt tiền */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Vòng tròn icon: hover hiện nút X */}
              <button
                type="button"
                onClick={handleClearCart}
                title="Nhấn để xóa toàn bộ giỏ hàng"
                aria-label="Xóa tất cả món khỏi giỏ hàng"
                className="group/cart-icon relative w-10 h-10 rounded-full bg-[#D98236] hover:bg-[#B42318] text-white flex items-center justify-center shrink-0 shadow-inner transition-all duration-200 cursor-pointer active:scale-90"
              >
                <ShoppingBag className="w-4 h-4 stroke-[2.2] group-hover/cart-icon:hidden transition-all" />
                <X className="w-4 h-4 stroke-[2.5] hidden group-hover/cart-icon:block transition-all text-white" />
              </button>

              <div className="truncate pr-1">
                <p className="text-xs text-[#E8EDE7] font-medium leading-none">
                  <strong className="text-white font-bold">{totalItems}</strong> món đã chọn
                </p>
                <p className="text-sm font-extrabold text-white tracking-tight mt-1">
                  {formatVnd(subtotal)}
                </p>
              </div>
            </div>

            {/* Nút Xem giỏ hàng caramel */}
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 bg-[#D98236] hover:bg-[#C47029] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full transition-all duration-200 shadow-md active:scale-95 shrink-0"
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
