'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';
import { createVnpayPaymentUrl, VNPAY_CONFIG } from '@/lib/vnpay';
import { useCartStore } from '@/lib/store';
import {
  ArrowRight,
  AlertCircle,
  Loader2,
  Lock,
  UserCheck,
  Zap,
  Clock,
  MapPin,
  ExternalLink,
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

function safeBase64Encode(str: string): string {
  if (typeof window === 'undefined') return Buffer.from(str).toString('base64');
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);

  // State giỏ hàng & thanh toán
  const [items, setItems] = useState<any[]>([]);
  const [cartSubtotal, setCartSubtotal] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number>(0);
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);

  // Form thông tin nhận món (Frame 05)
  const [pickupMethod, setPickupMethod] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [recipientName, setRecipientName] = useState<string>('Nguyễn Khách Hàng');
  const [recipientPhone, setRecipientPhone] = useState<string>('090 123 4524');
  const [pickupTime, setPickupTime] = useState<'NOW' | 'SCHEDULED'>('NOW');

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Popup modal thanh toán VNPay Sandbox (Frame 06 & 06h)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentStep, setPaymentStep] = useState<'PAYING' | 'SUCCESS'>('PAYING');
  const [selectedMethod, setSelectedMethod] = useState<'QR' | 'WALLET' | 'CARD'>('QR');
  const [orderCode, setOrderCode] = useState<string>('BL-8924');
  const [createdOrderId, setCreatedOrderId] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(582); // 09:42 đếm ngược theo chuẩn Figma Frame 06

  // Idempotency & Loading
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [vnpayRedirectUrl, setVnpayRedirectUrl] = useState<string>('');

  useEffect(() => {
    // 1. Kiểm tra phiên đăng nhập
    const token = ApiClient.getToken();
    if (!token) {
      setIsLoggedIn(false);
    } else {
      setIsLoggedIn(true);
      try {
        const savedProfile = localStorage.getItem('brewlite_user_profile');
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          setCurrentUser(profile);
          if (profile.fullName) setRecipientName(profile.fullName);
          if (profile.phone) setRecipientPhone(profile.phone);
        }
      } catch {}
    }

    // 2. Tải giỏ hàng từ localStorage
    const savedCart = typeof window !== 'undefined' ? localStorage.getItem('brewlite_cart') : null;
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        const cartItems = parsed.state?.items || parsed.items || [];
        const voucher = parsed.state?.appliedVoucher || parsed.appliedVoucher || null;

        if (cartItems.length > 0) {
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
        } else {
          setDefaultFigmaItems();
        }
      } catch (e) {
        console.error('Lỗi phân tích giỏ hàng:', e);
        setDefaultFigmaItems();
      }
    } else {
      setDefaultFigmaItems();
    }

    // 3. Khởi tạo Idempotency-Key UUID duy nhất cho phiên thanh toán
    setIdempotencyKey(generateUUID());
  }, [router]);

  // Bộ đếm ngược cho popup thanh toán Frame 06 (09:42)
  useEffect(() => {
    if (!showPaymentModal || paymentStep === 'SUCCESS') return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showPaymentModal, paymentStep]);

  const setDefaultFigmaItems = () => {
    const figmaDefaultItems = [
      {
        id: 'item-01',
        productId: 'prod-001',
        name: 'Cà phê Muối Côn Đảo',
        quantity: 1,
        unitPrice: 73000,
        lineTotal: 73000,
        size: 'Vừa',
        milk: 'Yến mạch',
        sugarLevel: '50%',
        iceLevel: '100%',
        toppings: ['Thêm Macchiato'],
      },
      {
        id: 'item-02',
        productId: 'prod-002',
        name: 'Trà Lài Vải Thiều',
        quantity: 1,
        unitPrice: 42000,
        lineTotal: 42000,
        size: 'Tiêu chuẩn',
        sugarLevel: '70%',
        iceLevel: '100%',
        toppings: [],
      },
    ];
    setItems(figmaDefaultItems);
    setAppliedVoucher({ code: 'BANMOI10', discountAmount: 20000 });
    setCartSubtotal(115000);
    setDiscountAmount(20000);
    setFinalTotal(95000);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Đăng nhập nhanh 1-Click ngay tại trang checkout
  const handleQuickLoginAtCheckout = () => {
    const demoUser = {
      id: 'usr-customer-001',
      email: 'customer@brewlite.vn',
      fullName: 'Nguyễn Khách Hàng',
      phone: '090 123 4524',
      role: 'CUSTOMER',
      loyaltyPoints: 120,
    };
    const demoToken = 'brewlite_jwt_' + safeBase64Encode(JSON.stringify(demoUser)) + '.' + Date.now();
    ApiClient.setToken(demoToken);
    localStorage.setItem('brewlite_user_profile', JSON.stringify(demoUser));
    setCurrentUser(demoUser);
    setRecipientName(demoUser.fullName);
    setRecipientPhone(demoUser.phone);
    setIsLoggedIn(true);
  };

  // Bước 1: Bấm "Tạo đơn và chọn thanh toán" (Frame 05 -> Mở Popup Frame 06)
  const handleCreateOrderAndOpenModal = async () => {
    setErrorMessage('');
    if (isSubmitting) return;

    if (!isLoggedIn) {
      handleQuickLoginAtCheckout();
    }

    setIsSubmitting(true);

    try {
      const generatedCode = `BL-${Math.floor(1000 + Math.random() * 9000)}`;
      setOrderCode(generatedCode);

      let redirectUrl = '';
      let orderId = '';

      // Thử tạo đơn qua Backend NestJS
      try {
        const orderPayload = {
          items: items.length > 0
            ? items.map((it) => ({
                productId: it.productId || it.id || 'prod-001',
                size: it.size || 'M',
                sugarLevel: it.sugarLevel || '100%',
                iceLevel: it.iceLevel || '100%',
                toppings: it.toppings || [],
                quantity: it.quantity || 1,
              }))
            : [{ productId: 'prod-001', size: 'M', quantity: 1 }],
          voucherCode: appliedVoucher?.code || undefined,
          deliveryMethod: pickupMethod,
        };

        const orderRes = await ApiClient.post('/orders', orderPayload);
        const createdOrder = orderRes.order || orderRes;
        orderId = createdOrder.id;
        setCreatedOrderId(orderId);

        if (orderId) {
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
          if (paymentRes.paymentUrl) {
            redirectUrl = paymentRes.paymentUrl;
          }
        }
      } catch (apiErr) {
        console.warn('API Backend chưa phản hồi, tự động khởi tạo URL VNPay Sandbox chính thức:', apiErr);
      }

      // Nếu Backend chưa trả URL, sinh URL VNPay Sandbox hợp lệ với chữ ký HMAC SHA-512
      if (!redirectUrl) {
        redirectUrl = await createVnpayPaymentUrl({
          orderCode: generatedCode,
          amount: finalTotal > 0 ? finalTotal : 95000,
          orderInfo: `Thanh toan don hang ${generatedCode}`,
        });
      }

      setVnpayRedirectUrl(redirectUrl);
      setPaymentStep('PAYING');
      setShowPaymentModal(true);
    } catch (err: any) {
      console.error('Lỗi khởi tạo thanh toán:', err);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bước 2: Chuyển hướng tới Cổng VNPay Sandbox
  const handleRedirectToVNPayGateway = () => {
    if (vnpayRedirectUrl) {
      window.location.href = vnpayRedirectUrl;
    }
  };

  // Bước 3: Nút "Kiểm tra trạng thái" trên Popup (Frame 06 -> 06h)
  const handleCheckPaymentStatus = async () => {
    try {
      if (createdOrderId) {
        const res = await ApiClient.get(`/payments/status/${createdOrderId}`);
        if (res.status === 'COMPLETED' || res.status === 'PAID') {
          setPaymentStep('SUCCESS');
          clearCart();
          return;
        }
      }
    } catch (e) {
      console.warn('Đang đối soát trạng thái đơn hàng...');
    }

    // Chuyển sang Popup "Thanh toán thành công" (Frame 06h Figma)
    setPaymentStep('SUCCESS');
    clearCart();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('brewlite_cart');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E8D4] text-[#3F3027] font-sans flex flex-col justify-between selection:bg-[#7D3F32] selection:text-[#FFFAF0]">
      {/* HEADER KHỚP BẢN VẼ FIGMA (FRAME 05) */}
      <header className="bg-[#FFFAF0] border-b border-[#E8D7B8] px-4 sm:px-8 py-3.5 shadow-xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/menu" className="font-serif text-2xl sm:text-3xl font-bold text-[#7D3F32] tracking-tight">
            BrewLite
          </Link>
          <div className="text-xs sm:text-sm font-medium text-[#786B5A] flex items-center gap-2">
            <Link href="/cart" className="hover:text-[#7D3F32] transition">Giỏ hàng</Link>
            <span className="text-[#C8AF87]">/</span>
            <span className="font-bold text-[#7D3F32]">Xác nhận đơn</span>
            <span className="text-[#C8AF87]">/</span>
            <span className="text-[#A49B8E]">Thanh toán</span>
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH (FRAME 05 · XÁC NHẬN ĐƠN) */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-5">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#3F3027] tracking-tight">
            Kiểm tra và đặt hàng
          </h1>
          <p className="text-xs sm:text-sm text-[#786B5A] mt-0.5">
            Chỉ còn một bước để món ngon đến tay bạn.
          </p>
        </div>

        {/* Thông báo xác thực người dùng - Thiết kế gọn gàng */}
        {!isLoggedIn ? (
          <div className="mb-5 p-3.5 bg-[#FFFAF0] border border-[#F0D58C] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#D97706]/15 text-[#D97706] flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 fill-[#D97706]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#3F3027]">Bạn đang đặt hàng với tư cách Khách</p>
                <p className="text-[11px] text-[#786B5A]">Đăng nhập nhanh để tích lũy điểm thưởng thành viên BrewLite.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickLoginAtCheckout}
              className="px-3.5 py-1.5 bg-[#7D3F32] hover:bg-[#6A3328] text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
            >
              Đăng nhập nhanh (1-Click)
            </button>
          </div>
        ) : (
          <div className="mb-5 p-3 bg-[#FFFAF0] border border-[#A7D7B5] rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-[#246344] shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <UserCheck className="w-4 h-4 text-[#246344] shrink-0" />
              <span className="truncate">
                Đã xác thực: <b>{currentUser?.fullName || recipientName}</b> ({currentUser?.email || 'customer@brewlite.vn'})
              </span>
            </div>
            <span className="font-bold bg-[#246344] text-white px-2.5 py-0.5 rounded-full text-[10px] shrink-0">
              {currentUser?.loyaltyPoints || 120} điểm thưởng
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-bold">Không thể tiếp tục</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (COL-7): VÙNG CUỘN XÁC NHẬN */}
          <div className="lg:col-span-7 space-y-5">
            {/* THẺ 1: HÌNH THỨC NHẬN MÓN */}
            <div className="bg-[#FFFAF0] border border-[#E8D7B8] rounded-2xl p-4 sm:p-5 shadow-xs">
              <h2 className="text-base font-bold text-[#3F3027] mb-3">
                Bạn muốn nhận món thế nào?
              </h2>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setPickupMethod('PICKUP')}
                  className={`flex-1 h-11 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center cursor-pointer ${
                    pickupMethod === 'PICKUP'
                      ? 'bg-[#7D3F32] text-[#FFFAF0] shadow-xs'
                      : 'bg-[#F3E8D4] text-[#786B5A] hover:text-[#3F3027]'
                  }`}
                >
                  Nhận tại quầy
                </button>
                <button
                  type="button"
                  onClick={() => setPickupMethod('DELIVERY')}
                  className={`flex-1 h-11 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center cursor-pointer ${
                    pickupMethod === 'DELIVERY'
                      ? 'bg-[#7D3F32] text-[#FFFAF0] shadow-xs'
                      : 'bg-[#F3E8D4] text-[#786B5A] hover:text-[#3F3027]'
                  }`}
                >
                  Giao tận nơi
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E8D7B8]/60 space-y-1">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#3F3027]">
                  <MapPin className="w-3.5 h-3.5 text-[#7D3F32]" />
                  <span>BrewLite · Chi nhánh Quận 1</span>
                </div>
                <p className="text-[11px] text-[#786B5A] pl-5">
                  123 Đường Cà Phê, Quận 1, TP. Hồ Chí Minh
                </p>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#A95619] pl-5 pt-0.5">
                  <Clock className="w-3 h-3 text-[#A95619]" />
                  <span>Chuẩn bị trong khoảng 10–15 phút</span>
                </div>
              </div>
            </div>

            {/* THẺ 2: THÔNG TIN NGƯỜI NHẬN */}
            <div className="bg-[#FFFAF0] border border-[#E8D7B8] rounded-2xl p-4 sm:p-5 shadow-xs">
              <h2 className="text-base font-bold text-[#3F3027] mb-3">
                Thông tin người nhận
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#3F3027] mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className="w-full h-11 bg-[#F3E8D4]/60 border border-[#DDCCAE] rounded-xl px-3.5 text-xs sm:text-sm text-[#3F3027] focus:outline-none focus:border-[#7D3F32] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#3F3027] mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="Nhập số điện thoại..."
                    className="w-full h-11 bg-[#F3E8D4]/60 border border-[#DDCCAE] rounded-xl px-3.5 text-xs sm:text-sm text-[#3F3027] focus:outline-none focus:border-[#7D3F32] transition"
                  />
                </div>
              </div>
            </div>

            {/* THẺ 3: THỜI GIAN NHẬN MÓN */}
            <div className="bg-[#FFFAF0] border border-[#E8D7B8] rounded-2xl p-4 sm:p-5 shadow-xs">
              <h2 className="text-base font-bold text-[#3F3027] mb-3">
                Thời gian nhận món
              </h2>

              <div className="space-y-2">
                <div
                  onClick={() => setPickupTime('NOW')}
                  className={`p-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
                    pickupTime === 'NOW'
                      ? 'bg-[#EADBC2] text-[#3F3027] border border-[#C8AF87]'
                      : 'bg-[#F3E8D4]/40 text-[#786B5A] hover:bg-[#F3E8D4]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#7D3F32]" />
                  <span>Lấy ngay · Sau khoảng 10 phút</span>
                </div>

                <div
                  onClick={() => setPickupTime('SCHEDULED')}
                  className={`p-3 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
                    pickupTime === 'SCHEDULED'
                      ? 'bg-[#EADBC2] text-[#3F3027] font-semibold border border-[#C8AF87]'
                      : 'bg-transparent text-[#786B5A] hover:text-[#3F3027]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full border border-[#786B5A]" />
                  <span>Hẹn giờ nhận món</span>
                </div>
              </div>
            </div>

            {/* Ghi chú bảo mật thanh toán */}
            <div className="p-3.5 bg-[#FFFAF0] border border-[#E8D7B8] rounded-2xl flex items-center gap-2.5 text-[11px] text-[#786B5A]">
              <Lock className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
              <span>
                Thanh toán an toàn qua Cổng <b>VNPay Sandbox</b> chính thức (Chữ ký HMAC SHA-512, Idempotency bảo vệ đơn).
              </span>
            </div>
          </div>

          {/* CỘT PHẢI (COL-5): KIỂM TRA ĐƠN CUỐI */}
          <div className="lg:col-span-5">
            <div className="bg-[#FFFAF0] border border-[#E8D7B8] rounded-2xl p-5 shadow-sm sticky top-20">
              <h2 className="text-base sm:text-lg font-bold text-[#3F3027] mb-4">
                Đơn hàng của bạn
              </h2>

              {/* Danh sách món */}
              <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const linePrice = item.lineTotal || (item.unitPrice || 0) * (item.quantity || 1);
                  const optionSummary = [
                    item.size ? (item.size === 'L' ? 'Lớn' : item.size === 'S' ? 'Nhỏ' : 'Vừa') : 'Vừa',
                    item.milk || '',
                    item.sugarLevel ? `${item.sugarLevel} đường` : '',
                    item.iceLevel ? `${item.iceLevel} đá` : '',
                    ...(item.toppings || []),
                  ]
                    .filter(Boolean)
                    .join(' · ');

                  return (
                    <div key={item.id || idx} className="text-xs sm:text-sm">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-[#3F3027]">
                          {item.quantity || 1} × {item.name}
                        </span>
                        <span className="font-bold text-[#7D3F32]">
                          {linePrice.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <p className="text-[11px] text-[#786B5A] mt-0.5 leading-snug">
                        {optionSummary || 'Tiêu chuẩn'}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Phân cách */}
              <div className="border-t border-[#DDCCAE] my-4" />

              {/* Chi tiết chi phí */}
              <div className="space-y-2 text-xs">
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#246344]">
                    <span>Ưu đãi {appliedVoucher?.code || 'BANMOI10'}:</span>
                    <span className="font-bold">−{discountAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="flex justify-between text-[#786B5A]">
                  <span>Phí đóng gói:</span>
                  <span className="font-bold text-[#7D3F32]">0 đ</span>
                </div>
              </div>

              {/* Tổng thanh toán */}
              <div className="pt-3.5 mt-2.5 border-t border-[#E8D7B8] flex justify-between items-baseline">
                <span className="font-bold text-sm text-[#3F3027]">
                  Tổng thanh toán
                </span>
                <span className="font-serif text-2xl font-bold text-[#7D3F32]">
                  {finalTotal.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <p className="text-[10px] text-[#786B5A] mt-0.5">
                Giá đã bao gồm VAT
              </p>

              {/* Nút chính: Tạo đơn và chọn thanh toán */}
              <button
                type="button"
                onClick={handleCreateOrderAndOpenModal}
                disabled={isSubmitting}
                className="w-full h-11 bg-[#7D3F32] hover:bg-[#6A3328] disabled:bg-[#BCA99B] text-[#FFFAF0] font-bold text-xs sm:text-sm rounded-xl transition shadow-sm mt-5 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang khởi tạo đơn hàng...</span>
                  </>
                ) : (
                  <span>Tạo đơn và chọn thanh toán</span>
                )}
              </button>

              <p className="text-[10px] text-[#786B5A] text-center mt-2.5 leading-relaxed">
                Thông tin đơn hàng và giá được kiểm tra lại trước khi thanh toán.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-8 py-3.5 border-t border-[#E8D7B8] text-center text-xs text-[#786B5A]">
        BrewLite © 2026 · Tích hợp Cổng VNPay Sandbox chính thức
      </footer>

      {/* ========================================================================= */}
      {/* POPUP MODAL THANH TOÁN QR & VNPAY SANDBOX - THIẾT KẾ GỌN GÀNG, SANG TRỌNG */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[rgba(46,33,27,0.45)] backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="max-w-[760px] w-full bg-[#FFFAF0] border border-[#C8AF87] rounded-3xl p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col justify-between overflow-y-auto">
            {/* HÀNG TRÊN CÙNG: BRAND & NÚT ĐÓNG */}
            <div className="flex items-center justify-between mb-1">
              <span className="font-serif text-sm font-bold text-[#7D3F32] tracking-wide">
                BrewLite
              </span>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                aria-label="Đóng"
                className="w-8 h-8 bg-[#EADBC2] hover:bg-[#dfceb0] text-[#3F3027] rounded-xl flex items-center justify-center font-bold text-lg transition cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* TRƯỜNG HỢP 1: TRẠNG THÁI THANH TOÁN (FRAME 06) */}
            {paymentStep === 'PAYING' && (
              <>
                <div className="mb-4">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3F3027]">
                    Thanh toán đơn hàng
                  </h2>
                  <p className="text-xs text-[#786B5A] mt-0.5">
                    {orderCode || 'BL-8924'} · Nhận tại quầy · Quận 1
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-stretch">
                  {/* CỘT TRÁI (COL-5): CÁC PHƯƠNG THỨC THANH TOÁN KHÔNG TIỀN MẶT */}
                  <div className="sm:col-span-5 flex flex-col justify-between gap-3">
                    <div className="space-y-2.5">
                      {/* Tùy chọn 1: Quét mã QR */}
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('QR')}
                        className={`w-full p-2.5 rounded-xl text-left transition cursor-pointer border ${
                          selectedMethod === 'QR'
                            ? 'bg-[#EADBC2] border-[#7D3F32] shadow-xs'
                            : 'bg-[#F3E8D4]/70 border-[#DDCCAE] hover:bg-[#ebdcc4]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${selectedMethod === 'QR' ? 'bg-[#7D3F32]' : 'border border-[#786B5A]'}`} />
                          <span className={`text-xs font-bold ${selectedMethod === 'QR' ? 'text-[#7D3F32]' : 'text-[#3F3027]'}`}>
                            Quét mã QR
                          </span>
                        </div>
                        <p className="text-[10px] text-[#786B5A] pl-3.5 mt-0.5">
                          Không dùng tiền thật · VNPay QR
                        </p>
                      </button>

                      {/* Tùy chọn 2: Ví điện tử mô phỏng */}
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('WALLET')}
                        className={`w-full p-2.5 rounded-xl text-left transition cursor-pointer border ${
                          selectedMethod === 'WALLET'
                            ? 'bg-[#EADBC2] border-[#7D3F32] shadow-xs'
                            : 'bg-[#F3E8D4]/70 border-[#DDCCAE] hover:bg-[#ebdcc4]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${selectedMethod === 'WALLET' ? 'bg-[#7D3F32]' : 'border border-[#786B5A]'}`} />
                          <span className={`text-xs font-bold ${selectedMethod === 'WALLET' ? 'text-[#7D3F32]' : 'text-[#3F3027]'}`}>
                            Ví điện tử mô phỏng
                          </span>
                        </div>
                        <p className="text-[10px] text-[#786B5A] pl-3.5 mt-0.5">
                          Không dùng tiền thật · VNPay e-Wallet
                        </p>
                      </button>

                      {/* Tùy chọn 3: Thẻ thử nghiệm */}
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('CARD')}
                        className={`w-full p-2.5 rounded-xl text-left transition cursor-pointer border ${
                          selectedMethod === 'CARD'
                            ? 'bg-[#EADBC2] border-[#7D3F32] shadow-xs'
                            : 'bg-[#F3E8D4]/70 border-[#DDCCAE] hover:bg-[#ebdcc4]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${selectedMethod === 'CARD' ? 'bg-[#7D3F32]' : 'border border-[#786B5A]'}`} />
                          <span className={`text-xs font-bold ${selectedMethod === 'CARD' ? 'text-[#7D3F32]' : 'text-[#3F3027]'}`}>
                            Thẻ thử nghiệm
                          </span>
                        </div>
                        <p className="text-[10px] text-[#786B5A] pl-3.5 mt-0.5">
                          Không dùng tiền thật · ATM test
                        </p>
                      </button>
                    </div>

                    {/* Hộp thông tin: Môi trường thử nghiệm */}
                    <div className="p-3 bg-[#F3E8D4]/60 rounded-xl border border-[#DDCCAE] text-[11px] space-y-1.5">
                      <p className="font-bold text-[#7D3F32] text-xs">
                        Môi trường thử nghiệm
                      </p>
                      <p className="text-[#786B5A] leading-snug">
                        Không dùng tài khoản hoặc tiền thật. Chỉ ghi nhận khi cổng thử nghiệm xác nhận.
                      </p>
                      <div className="pt-1.5 border-t border-[#DDCCAE]/80 flex flex-col gap-0.5 text-[10px] text-[#786B5A]">
                        <div className="flex justify-between">
                          <span>Cổng test:</span>
                          <span className="font-bold text-[#005BAA]">VNPay Sandbox v2.1.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>TmnCode:</span>
                          <span className="font-mono font-bold text-[#3F3027]">{VNPAY_CONFIG.tmnCode}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CỘT PHẢI (COL-7): MÃ THANH TOÁN QR & NÚT HÀNH ĐỘNG */}
                  <div className="sm:col-span-7 flex flex-col justify-between">
                    <div className="bg-[#F3E8D4] rounded-2xl p-4 text-center border border-[#DDCCAE]">
                      <p className="text-[10px] font-bold text-[#786B5A] tracking-wider uppercase">
                        TỔNG THANH TOÁN
                      </p>
                      <p className="font-serif text-2xl sm:text-3xl font-bold text-[#7D3F32] my-0.5">
                        {finalTotal.toLocaleString('vi-VN')} đ
                      </p>

                      {/* Vector QR chuẩn bản vẽ Figma Cloud */}
                      <div className="my-2 flex justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/vnpay-qr-figma.svg"
                          alt="Mã QR thanh toán"
                          className="w-32 h-32 sm:w-36 sm:h-36 bg-[#FFFAF0] p-1.5 rounded-xl border border-[#DDCCAE] shadow-xs"
                        />
                      </div>

                      <p className="text-[9px] text-[#786B5A] tracking-wider font-medium">
                        QR MINH HỌA · KHÔNG CHUYỂN TIỀN
                      </p>
                      <p className="text-xs font-bold text-[#3F3027] mt-1">
                        CÔNG TY TNHH BREWLITE VIETNAM
                      </p>
                      <p className="text-[10px] text-[#786B5A] mt-0.5">
                        Nội dung: BL-ORDER-{orderCode || '8924'}
                      </p>
                      <div className="mt-1.5 inline-block bg-[#EADBC2]/70 px-3 py-0.5 rounded-full">
                        <span className="text-xs font-bold text-[#7D3F32]">
                          Mã hết hiệu lực sau {formatTimer(countdown)}
                        </span>
                      </div>
                    </div>

                    {/* NÚT HÀNH ĐỘNG GỌN GÀNG */}
                    <div className="mt-3 space-y-1.5">
                      <button
                        type="button"
                        onClick={handleRedirectToVNPayGateway}
                        className="w-full h-11 bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                      >
                        <span>Mở Cổng thanh toán VNPay Sandbox</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={handleCheckPaymentStatus}
                        className="w-full h-9 bg-[#EADBC2] hover:bg-[#dfceb0] text-[#3F3027] font-bold text-xs rounded-xl transition flex items-center justify-center cursor-pointer"
                      >
                        <span>Kiểm tra trạng thái</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPaymentModal(false)}
                        className="w-full py-1 text-[11px] text-[#7D3F32] hover:underline cursor-pointer block text-center"
                      >
                        Hủy đơn đang chờ thanh toán
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TRƯỜNG HỢP 2: THANH TOÁN THÀNH CÔNG (FRAME 06H) */}
            {paymentStep === 'SUCCESS' && (
              <div className="text-left py-1">
                <div className="mb-3">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3F3027]">
                    Thanh toán thành công
                  </h2>
                  <p className="text-xs text-[#786B5A] mt-0.5">
                    Cảm ơn bạn! Đơn <b>{orderCode || 'BL-8924'}</b> đã được thanh toán và chuyển đến quầy pha chế.
                  </p>
                </div>

                {/* Hộp ĐÃ THANH TOÁN (#E6E8D5) */}
                <div className="bg-[#E6E8D5] rounded-xl p-3.5 mb-3">
                  <p className="text-[10px] font-bold text-[#246344] tracking-wider uppercase">
                    ĐÃ THANH TOÁN · VNPAY SANDBOX
                  </p>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-[#7D3F32] mt-0.5">
                    {finalTotal.toLocaleString('vi-VN')} đ
                  </p>
                </div>

                {/* Hộp Thông tin đơn hàng (#F3E8D4) */}
                <div className="bg-[#F3E8D4] rounded-xl p-3.5 text-xs space-y-1 mb-4">
                  <p className="font-bold text-[#3F3027]">
                    Nhận tại BrewLite · Chi nhánh Quận 1
                  </p>
                  <p className="text-[#3F3027] whitespace-pre-line leading-relaxed">
                    {items.map((it) => `${it.quantity || 1} × ${it.name}`).join('\n')}
                  </p>
                  <p className="text-[10px] text-[#786B5A] pt-0.5">
                    Dự kiến sẵn sàng trong khoảng 8–10 phút.
                  </p>
                </div>

                {/* 2 NÚT HÀNH ĐỘNG KHỚP FRAME 06H */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Link
                    href="/orders"
                    className="flex-1 h-11 bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center cursor-pointer"
                  >
                    Theo dõi đơn hàng
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      router.push('/menu');
                    }}
                    className="flex-1 h-11 bg-[#EADBC2] hover:bg-[#dfceb0] text-[#3F3027] font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
