'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { CheckCircle2, XCircle, ArrowRight, Home, Receipt } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F3E8D4] text-[#3F3027] flex flex-col justify-between">
      <header className="bg-[#FFFAF0] border-b border-[#E8D7B8] px-4 sm:px-8 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/menu" className="font-serif text-2xl font-bold text-[#7D3F32]">
            BrewLite
          </Link>
          <span className="text-xs text-[#786B5A] font-semibold">Kết quả thanh toán VNPay</span>
        </div>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 my-auto">
        <div className="bg-[#FFFAF0] border border-[#E8D7B8] rounded-3xl p-6 sm:p-8 shadow-md text-center">
          {isSuccess ? (
            <>
              <div className="w-16 h-16 bg-green-100 text-[#2E7D32] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h1 className="font-serif text-2xl font-bold text-[#3F3027] mb-2">
                Thanh toán Thành công!
              </h1>
              <p className="text-sm text-[#786B5A] mb-6">
                Cổng VNPay Sandbox đã ghi nhận giao dịch thành công. Đơn hàng của bạn đang được pha chế.
              </p>

              <div className="bg-[#F3E8D4]/50 border border-[#E8D7B8] rounded-2xl p-4 text-left text-xs space-y-2.5 mb-6">
                <div className="flex justify-between">
                  <span className="text-[#786B5A]">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-[#7D3F32]">{orderCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786B5A]">Mã giao dịch VNPay:</span>
                  <span className="font-mono font-bold text-[#3F3027]">{transactionNo || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786B5A]">Ngân hàng thanh toán:</span>
                  <span className="font-semibold text-[#005BAA]">{bankCode || 'VNPAY'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786B5A]">Số tiền đã thanh toán:</span>
                  <span className="font-bold text-[#7D3F32] text-sm">
                    {amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                {payDate && (
                  <div className="flex justify-between">
                    <span className="text-[#786B5A]">Thời gian giao dịch:</span>
                    <span className="font-mono text-[#3F3027]">{payDate}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/orders"
                  className="flex-1 h-12 bg-[#7D3F32] hover:bg-[#693327] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Xem đơn hàng</span>
                </Link>
                <Link
                  href="/menu"
                  className="flex-1 h-12 bg-white hover:bg-neutral-50 text-[#3F3027] border border-[#E8D7B8] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Home className="w-4 h-4" />
                  <span>Về thực đơn</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 text-[#B42318] rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10" />
              </div>
              <h1 className="font-serif text-2xl font-bold text-[#3F3027] mb-2">
                Thanh toán Không thành công
              </h1>
              <p className="text-sm text-[#786B5A] mb-6">
                Giao dịch chưa được hoàn tất hoặc đã bị hủy bởi người dùng (Mã lỗi: {responseCode || 'CANCELLED'}).
                Hệ thống đã tự động hoàn trả số lượng nguyên liệu vào kho.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/checkout"
                  className="flex-1 h-12 bg-[#7D3F32] hover:bg-[#693327] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <span>Thử thanh toán lại</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/cart"
                  className="flex-1 h-12 bg-white hover:bg-neutral-50 text-[#3F3027] border border-[#E8D7B8] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <span>Quay lại giỏ hàng</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[#786B5A]">
        BrewLite © 2026 · Cổng thanh toán VNPay Sandbox
      </footer>
    </div>
  );
}

export default function VnpayReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3E8D4] flex items-center justify-center">Đang tải kết quả...</div>}>
      <VnpayReturnContent />
    </Suspense>
  );
}
