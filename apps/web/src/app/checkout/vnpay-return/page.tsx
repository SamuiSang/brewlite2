'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { ArrowRight, Home, Receipt, RefreshCw } from 'lucide-react';

function VnpayReturnContent() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);

  const [mounted, setMounted] = useState(false);

  const orderCode = searchParams.get('vnp_TxnRef') || '';
  const responseCode = searchParams.get('vnp_ResponseCode') || '';
  const transactionNo = searchParams.get('vnp_TransactionNo') || '';
  const rawAmount = searchParams.get('vnp_Amount') || '0';
  const bankCode = searchParams.get('vnp_BankCode') || '';
  const payDate = searchParams.get('vnp_PayDate') || '';

  const amount = Number(rawAmount) / 100;
  const isSuccess = responseCode === '00';

  useEffect(() => {
    setMounted(true);
    if (isSuccess) {
      // Xóa sạch giỏ hàng khi thanh toán thành công
      clearCart();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('brewlite_cart');
      }
    }
  }, [isSuccess, clearCart]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F3E8D4] text-[#3F3027] font-sans flex flex-col justify-between selection:bg-[#7D3F32] selection:text-[#FFFAF0]">
      {/* HEADER KHỚP BẢN VẼ FIGMA */}
      <header className="bg-[#FFFAF0] border-b border-[#E8D7B8] px-4 sm:px-8 py-4 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/menu" className="font-serif text-2xl sm:text-3xl font-bold text-[#7D3F32] tracking-tight">
            BrewLite
          </Link>
          <span className="text-xs text-[#786B5A] font-semibold">Kết quả thanh toán VNPay</span>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH (KHỚP FRAME 06H & 06D TRONG FIGMA CLOUD) */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 my-auto">
        <div className="bg-[#FFFAF0] border border-[#C8AF87] rounded-3xl p-6 sm:p-8 shadow-xl text-left relative">
          <div className="flex items-center justify-between mb-3">
            <span className="font-serif text-base font-semibold text-[#7D3F32]">
              BrewLite
            </span>
          </div>

          {isSuccess ? (
            /* TRẠNG THÁI THÀNH CÔNG (FRAME 06H FIGMA) */
            <>
              <div className="mb-4">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#3F3027]">
                  Thanh toán thành công
                </h1>
                <p className="text-xs sm:text-sm text-[#786B5A] mt-1">
                  Cảm ơn bạn! Đơn <b>{orderCode || 'BL-8924'}</b> đã được thanh toán và chuyển đến quầy pha chế.
                </p>
              </div>

              {/* Hộp ĐÃ THANH TOÁN · VNPAY SANDBOX (#E6E8D5) */}
              <div className="bg-[#E6E8D5] rounded-xl p-4 mb-4">
                <p className="text-[10px] font-bold text-[#246344] tracking-wider uppercase">
                  ĐÃ THANH TOÁN · VNPAY SANDBOX
                </p>
                <p className="font-serif text-3xl font-semibold text-[#7D3F32] mt-1">
                  {amount > 0 ? `${amount.toLocaleString('vi-VN')} đ` : '95.000 đ'}
                </p>
              </div>

              {/* Hộp thông tin đơn hàng (#F3E8D4) */}
              <div className="bg-[#F3E8D4] rounded-xl p-4 text-xs space-y-2 mb-6">
                <p className="font-bold text-[#3F3027]">
                  Nhận tại BrewLite · Chi nhánh Quận 1
                </p>
                <div className="space-y-1 text-[#786B5A]">
                  <div className="flex justify-between">
                    <span>Mã giao dịch VNPay:</span>
                    <span className="font-mono font-bold text-[#3F3027]">{transactionNo || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ngân hàng thanh toán:</span>
                    <span className="font-semibold text-[#005BAA]">{bankCode || 'VNPAY'}</span>
                  </div>
                  {payDate && (
                    <div className="flex justify-between">
                      <span>Thời gian giao dịch:</span>
                      <span className="font-mono text-[#3F3027]">{payDate}</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-[#786B5A] pt-1 border-t border-[#DDCCAE]">
                  Dự kiến sẵn sàng trong khoảng 8–10 phút.
                </p>
              </div>

              {/* 2 NÚT HÀNH ĐỘNG KHỚP FRAME 06H */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/orders"
                  className="flex-1 h-12 bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] font-bold text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Theo dõi đơn hàng</span>
                </Link>
                <Link
                  href="/menu"
                  className="flex-1 h-12 bg-[#EADBC2] hover:bg-[#dfceb0] text-[#3F3027] font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Về thực đơn</span>
                </Link>
              </div>
            </>
          ) : (
            /* TRẠNG THÁI THẤT BẠI / HỦY (FRAME 06D FIGMA) */
            <>
              <div className="mb-4">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#3F3027]">
                  Thanh toán chưa thành công
                </h1>
                <p className="text-xs sm:text-sm text-[#786B5A] mt-1">
                  Đơn hàng vẫn chưa được thanh toán (Mã phản hồi: {responseCode || 'CANCELLED'}).
                </p>
              </div>

              {/* Hộp Trạng thái chưa thanh toán */}
              <div className="bg-[#F3E8D4] rounded-xl p-4 mb-4 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#3F3027]">{orderCode || 'BL-8924'}</span>
                  <span className="text-[10px] font-bold bg-[#E4D5BB] text-[#786B5A] px-2.5 py-1 rounded-full">
                    Chưa thanh toán
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-[#786B5A]">Tổng đơn hàng:</span>
                  <span className="font-serif text-2xl font-bold text-[#7D3F32]">
                    {amount > 0 ? `${amount.toLocaleString('vi-VN')} đ` : '95.000 đ'}
                  </span>
                </div>
              </div>

              {/* Hộp lưu ý theo Frame 06d */}
              <div className="bg-[#EFE3CE] rounded-xl p-4 text-xs space-y-1 mb-6">
                <p className="font-bold text-[#7D3F32]">
                  Bạn có thể thử lại
                </p>
                <p className="text-[#3F3027] leading-relaxed">
                  Giao dịch chưa được trừ tiền hoặc đã bị hủy bởi người dùng. Bạn có thể tiến hành thanh toán lại bất cứ lúc nào.
                </p>
              </div>

              {/* 2 NÚT HÀNH ĐỘNG */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/checkout"
                  className="flex-1 h-12 bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] font-bold text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Thử lại</span>
                </Link>
                <Link
                  href="/cart"
                  className="flex-1 h-12 bg-[#EADBC2] hover:bg-[#dfceb0] text-[#3F3027] font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Quay lại giỏ hàng</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-4 border-t border-[#E8D7B8] text-center text-xs text-[#786B5A]">
        BrewLite © 2026 · Cổng thanh toán VNPay Sandbox
      </footer>
    </div>
  );
}

export default function VnpayReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3E8D4] flex items-center justify-center text-[#786B5A] text-sm">Đang tải kết quả...</div>}>
      <VnpayReturnContent />
    </Suspense>
  );
}
