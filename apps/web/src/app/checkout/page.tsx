'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';
import {
  ShieldCheck,
  CreditCard,
  ArrowRight,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  Loader2,
  Lock,
} from 'lucide-react';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function CheckoutPage() {
  const router = useRouter();

  // State giỏ hàng & thanh toán
  const [items, setItems] = useState<any[]>([]);
  const [cartSubtotal, setCartSubtotal] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number>(0);
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);

  // Idempotency & Loading
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [redirectingUrl, setRedirectingUrl] = useState<string>('');

  useEffect(() => {
    // 1. Kiểm tra phiên đăng nhập (Yêu cầu xác thực trước khi thanh toán)
    const token = typeof window !== 'undefined' ? localStorage.getItem('brewlite_access_token') : null;
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }

    // 2. Tải giỏ hàng từ localStorage
    const savedCart = typeof window !== 'undefined' ? localStorage.getItem('brewlite_cart') : null;
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        const cartItems = parsed.state?.items || parsed.items || [];
        const voucher = parsed.state?.appliedVoucher || parsed.appliedVoucher || null;
        setItems(cartItems);
        setAppliedVoucher(voucher);

        const subtotal = cartItems.reduce(
          (sum: number, it: any) => sum + (it.lineTotal || (it.unitPrice || 0) * (it.quantity || 1)),
          0
        );
        const discount = voucher?.discountAmount || 0;
        setCartSubtotal(subtotal);
        setDiscountAmount(discount);
        setFinalTotal(Math.max(0, subtotal - discount));
      } catch (e) {
        console.error('Lỗi phân tích giỏ hàng:', e);
      }
    } else {
      // Mẫu thử nghiệm
      setCartSubtotal(45000);
      setFinalTotal(45000);
    }

    // 3. Khởi tạo một Idempotency-Key UUID duy nhất cho phiên thanh toán
    setIdempotencyKey(generateUUID());
  }, [router]);

  // Xử lý gửi yêu cầu đặt đơn và khởi tạo Cổng Thanh Toán VNPay Sandbox
  const handleProceedPayment = async () => {
    setErrorMessage('');
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // BƯỚC 1: Khởi tạo Đơn hàng (hoặc lấy ID đơn hàng chờ thanh toán)
      const orderPayload = {
        items: items.length > 0
          ? items.map((it) => ({
              productId: it.productId || it.id,
              size: it.size || 'M',
              sugarLevel: it.sugarLevel || '100%',
              iceLevel: it.iceLevel || '100%',
              toppings: it.toppings || [],
              quantity: it.quantity || 1,
            }))
          : [{ productId: 'prod-001', size: 'M', quantity: 1 }],
        voucherCode: appliedVoucher?.code || undefined,
        deliveryMethod: 'PICKUP',
      };

      const orderRes = await ApiClient.post('/orders', orderPayload);
      const createdOrder = orderRes.order || orderRes;
      const orderId = createdOrder.id;

      if (!orderId) {
        throw new Error('Không thể khởi tạo mã đơn hàng từ hệ thống');
      }

      // BƯỚC 2: Gọi API Cổng Thanh toán VNPay Sandbox với Idempotency-Key
      const paymentRes = await ApiClient.post(
        '/payments',
        {
          orderId: orderId,
          method: 'VNPAY',
        },
        {
          'Idempotency-Key': idempotencyKey,
        }
      );

      if (!paymentRes.success || !paymentRes.paymentUrl) {
        throw new Error(paymentRes.message || 'Không thể tạo link thanh toán VNPay Sandbox');
      }

      // BƯỚC 3: Chuyển hướng người dùng sang Cổng thanh toán VNPay Sandbox chính thức
      setRedirectingUrl(paymentRes.paymentUrl);
      window.location.href = paymentRes.paymentUrl;
    } catch (err: any) {
      console.error('Lỗi khởi tạo thanh toán:', err);
      setErrorMessage(
        err.message || 'Có lỗi xảy ra khi kết nối tới Cổng VNPay Sandbox. Vui lòng thử lại.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E8D4] text-[#3F3027] flex flex-col justify-between">
      {/* HEADER */}
      <header className="bg-[#FFFAF0] border-b border-[#E8D7B8] px-4 sm:px-8 py-4 shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/menu" className="font-serif text-2xl sm:text-3xl font-bold text-[#7D3F32] tracking-tight">
            BrewLite
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#786B5A]">
            <Lock className="w-3.5 h-3.5 text-[#2E7D32]" />
            <span>Thanh toán an toàn 256-bit SSL</span>
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3F3027]">
            Thanh toán Đơn hàng
          </h1>
          <p className="text-sm text-[#786B5A] mt-1">
            Cổng thanh toán chính thức qua môi trường kiểm thử VNPay Sandbox.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-bold">Không thể tiếp tục thanh toán</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI: CHỌN PHƯƠNG THỨC THANH TOÁN (DUY NHẤT VNPAY SANDBOX) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#FFFAF0] border border-[#E8D7B8] rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#3F3027] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#7D3F32]" />
                Phương thức thanh toán trực tuyến
              </h2>

              {/* Tùy chọn duy nhất: VNPay Sandbox */}
              <div className="p-4 border-2 border-[#7D3F32] bg-[#F7EFE1] rounded-xl flex items-center justify-between transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-white rounded-lg border border-[#E8D7B8] flex items-center justify-center p-1.5 shadow-xs">
                    <span className="font-black text-[#005BAA] text-sm tracking-tighter">
                      VNPAY
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#3F3027]">Cổng VNPay Sandbox</span>
                      <span className="text-[10px] bg-[#2E7D32] text-white px-2 py-0.5 rounded-full font-bold">
                        Đang hoạt động
                      </span>
                    </div>
                    <p className="text-xs text-[#786B5A] mt-0.5">
                      Hỗ trợ Thẻ ATM nội địa, Quét mã VNPAY-QR và Internet Banking
                    </p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-[#7D3F32] flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-[#7D3F32] rounded-full" />
                </div>
              </div>

              {/* Hộp thông tin cấu hình minh bạch */}
              <div className="mt-4 p-3 bg-white rounded-xl border border-[#E8D7B8] text-xs text-[#786B5A] space-y-1">
                <div className="flex justify-between">
                  <span>Mã Website (TmnCode):</span>
                  <span className="font-mono font-bold text-[#3F3027]">8VXIB1MM</span>
                </div>
                <div className="flex justify-between">
                  <span>Môi trường Cổng:</span>
                  <span className="font-semibold text-[#005BAA]">TEST / Sandbox v2.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Chống trùng lặp:</span>
                  <span className="font-mono text-[11px] text-[#2E7D32]">Idempotency-Key bảo vệ</span>
                </div>
              </div>
            </div>

            {/* Thẻ cam kết bảo mật */}
            <div className="bg-[#FFFAF0] border border-[#E8D7B8] rounded-2xl p-5 shadow-sm flex items-start gap-3.5">
              <ShieldCheck className="w-6 h-6 text-[#2E7D32] shrink-0 mt-0.5" />
              <div className="text-xs text-[#786B5A] space-y-1">
                <p className="font-bold text-[#3F3027]">Bảo vệ giao dịch 2 bước (Server-to-Server)</p>
                <p>
                  Hệ thống không tự động chuyển trạng thái đơn hàng một chiều trên giao diện.
                  Mọi giao dịch đều được đối soát ngầm qua Webhook IPN có chữ ký số HMAC SHA512.
                </p>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <div className="lg:col-span-5">
            <div className="bg-[#FFFAF0] border border-[#E8D7B8] rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="text-base font-bold text-[#3F3027] mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#7D3F32]" />
                Tóm tắt chi phí
              </h2>

              <div className="space-y-3 text-sm pb-4 border-b border-[#E8D7B8]">
                <div className="flex justify-between text-[#786B5A]">
                  <span>Tạm tính ({items.length || 1} món):</span>
                  <span className="font-semibold text-[#3F3027]">{cartSubtotal.toLocaleString('vi-VN')} đ</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#2E7D32]">
                    <span>Ưu đãi voucher ({appliedVoucher?.code}):</span>
                    <span className="font-semibold">−{discountAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                <div className="flex justify-between text-[#786B5A]">
                  <span>Phí tiện ích cổng:</span>
                  <span className="text-[#2E7D32] font-semibold">Miễn phí (Sandbox)</span>
                </div>
              </div>

              <div className="pt-4 pb-6 flex justify-between items-baseline">
                <span className="font-bold text-base text-[#3F3027]">Tổng thanh toán:</span>
                <span className="font-serif text-2xl font-bold text-[#7D3F32]">
                  {finalTotal.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <button
                type="button"
                onClick={handleProceedPayment}
                disabled={isSubmitting}
                className="w-full h-12 bg-[#7D3F32] hover:bg-[#693327] disabled:bg-[#BCA99B] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang kết nối tới VNPay...</span>
                  </>
                ) : (
                  <>
                    <span>Thanh toán qua VNPay Sandbox</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {redirectingUrl && (
                <div className="mt-3 text-center">
                  <a
                    href={redirectingUrl}
                    className="text-xs text-[#005BAA] hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    Bấm vào đây nếu trình duyệt không tự chuyển hướng
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <p className="text-[11px] text-[#786B5A] text-center mt-4">
                Bằng việc bấm nút, bạn đồng ý chuyển sang cổng VNPay Sandbox để xác thực thanh toán.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-12 py-4 border-t border-[#E8D7B8] text-center text-xs text-[#786B5A]">
        BrewLite © 2026 · Tích hợp Cổng VNPay Sandbox chính thức
      </footer>
    </div>
  );
}
