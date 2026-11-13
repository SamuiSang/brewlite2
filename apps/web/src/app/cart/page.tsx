'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Coffee,
  Loader2,
  QrCode,
  Clock,
  Store,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingCart,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useCartStore, CartItem } from '../../lib/store';

/**
 * Trang Giỏ hàng & Thanh toán BrewLite 2 (Cart & Checkout Flow).
 * Đồng bộ chuẩn 100% Figma Cloud BrewLite 2:
 * - Frame 03: Giỏ hàng máy tính (1440x1024)
 * - Frame 03b: Giỏ hàng di động (390x844) & Giỏ hàng trống
 * - Frame 05: Xác nhận đơn & Kiểm tra đặt hàng
 * - Frame 06: Popup thanh toán QR giả lập đa phương thức (880x760)
 * - Frame 06h: Popup thanh toán thành công
 */
export default function CartPage() {
  const router = useRouter();
  const {
    items,
    appliedVoucher,
    removeItem,
    updateQuantity,
    setAppliedVoucher,
    clearCart,
    getSubtotal,
    getFinalTotal,
    addItem,
    getTotalItems,
  } = useCartStore();

  // Tránh lỗi hydration mismatch trong Next.js
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Bước hiển thị: 'cart' (Frame 03) hoặc 'checkout' (Frame 05)
  const [currentStep, setCurrentStep] = useState<'cart' | 'checkout'>('cart');

  // Input mã giảm giá
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  // Form xác nhận đặt hàng (Frame 05)
  const [deliveryMethod, setDeliveryMethod] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [recipientName, setRecipientName] = useState('Nguyễn Duy');
  const [recipientPhone, setRecipientPhone] = useState('090 123 4524');
  const [pickupTimeMode, setPickupTimeMode] = useState<'NOW' | 'SCHEDULE'>('NOW');

  // Trạng thái gọi API đặt hàng
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<{
    message: string;
    ingredientName?: string;
  } | null>(null);

  // Modal thanh toán (Frame 06 & Frame 06h - 100% Không dùng tiền mặt)
  const [activePaymentOrder, setActivePaymentOrder] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'QR' | 'WALLET' | 'CARD'>('QR');
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [timeLeft, setTimeLeft] = useState(582); // Đếm ngược 09:42

  // Đếm ngược thời gian thanh toán 10 phút chuẩn Figma
  useEffect(() => {
    if (!activePaymentOrder || isPaidSuccess) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [activePaymentOrder, isPaidSuccess]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const subtotal = getSubtotal();
  const discount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const finalTotal = getFinalTotal();
  const totalCartItems = getTotalItems();

  // Xử lý áp dụng mã khuyến mãi chuẩn Figma (BANMOI10, BREW20K, CHAOBANMOI, BREWNEW)
  const handleApplyPromo = () => {
    setPromoError(null);
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError('Vui lòng nhập mã ưu đãi.');
      return;
    }

    if (code === 'BANMOI10' || code === 'BREW20K' || code === 'CHAOBANMOI') {
      if (subtotal < 50000) {
        setPromoError('Đơn hàng cần đạt tối thiểu 50.000 đ để áp dụng mã này.');
        return;
      }
      setAppliedVoucher({
        code,
        discountAmount: 20000,
        description: 'Giảm 20.000 đ',
      });
      setPromoInput('');
    } else if (code === 'BREWNEW') {
      if (subtotal < 50000) {
        setPromoError('Đơn hàng cần đạt tối thiểu 50.000 đ để áp dụng mã này.');
        return;
      }
      const rawDiscount = Math.round(subtotal * 0.2);
      const actualDiscount = Math.min(rawDiscount, 30000);
      setAppliedVoucher({
        code,
        discountAmount: actualDiscount,
        description: `Giảm 20% (${actualDiscount.toLocaleString('vi-VN')} đ)`,
      });
      setPromoInput('');
    } else {
      setPromoError(`Mã ưu đãi "${code}" không hợp lệ hoặc đã hết lượt.`);
    }
  };

  const handleRemovePromo = () => {
    setAppliedVoucher(null);
    setPromoError(null);
  };

  // Thêm nhanh món gợi ý khi giỏ hàng trống (Frame 03b)
  const handleQuickAdd = (name: string, price: number, img: string, prodId: string) => {
    addItem({
      productId: prodId,
      name,
      category: 'COFFEE',
      imageUrl: img,
      size: 'M',
      unitPrice: price,
      quantity: 1,
      optionsDesc: 'Tiêu chuẩn · 70% đường · 100% đá',
    });
  };

  // Tạo đơn hàng (gọi Backend NestJS API POST /api/v1/orders)
  const handleCreateOrder = async () => {
    if (items.length === 0) return;

    setIsSubmitting(true);
    setConflictError(null);

    const payload = {
      items: items.map((item) => ({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
      })),
      voucherCode: appliedVoucher?.code,
      deliveryMethod,
      recipientName,
      recipientPhone,
      paymentMethod,
    };

    try {
      const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Xung đột tồn kho hoặc va chạm đồng thời Optimistic Locking (Frame 02b Figma)
          setConflictError({
            message: data.message || 'Quầy pha chế vừa hết nguyên liệu hoặc có đơn khác chốt trước.',
            ingredientName: data.error === 'INSUFFICIENT_INGREDIENT' ? 'Kem Macchiato' : undefined,
          });
          return;
        }
        throw new Error(data.message || 'Không thể tạo đơn hàng, vui lòng thử lại.');
      }

      // Mở Popup thanh toán (Frame 06)
      const order = data.order || {
        orderCode: `BL-${Math.floor(1000 + Math.random() * 9000)}`,
        subtotalAmount: subtotal,
        discountAmount: discount,
        finalAmount: finalTotal,
        items: [...items],
      };
      setActivePaymentOrder(order);
      clearCart();
    } catch {
      // Giả lập đơn cho môi trường demo / offline
      const mockOrder = {
        orderCode: `BL-${Math.floor(1000 + Math.random() * 9000)}`,
        subtotalAmount: subtotal,
        discountAmount: discount,
        finalAmount: finalTotal,
        items: [...items],
      };
      setActivePaymentOrder(mockOrder);
      clearCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xác nhận thanh toán thành công (Chuyển sang Frame 06h)
  const handleConfirmPayment = () => {
    setIsCheckingPayment(true);
    setTimeout(() => {
      setIsCheckingPayment(false);
      setIsPaidSuccess(true);
    }, 600);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F3E8D4] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7D3F32]" />
      </div>
    );
  }

  // Header dùng chung đồng bộ với Thực đơn (/menu)
  const renderSharedHeader = () => (
    <header className="w-full bg-[#F3E8D4] py-3.5 sm:py-4 px-4 sm:px-10 lg:px-14">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between">
        {/* Logo BrewLite */}
        <Link href="/menu" className="flex flex-col group">
          <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-[#3F3027] leading-none">
            BrewLite
          </span>
          <span className="hidden sm:block text-[10px] uppercase tracking-widest text-[#786B5A] font-semibold mt-1">
            CÀ PHÊ NGUYÊN BẢN
          </span>
        </Link>

        {/* Menu điều hướng Desktop */}
        <nav className="hidden md:flex items-center gap-10 text-sm font-medium">
          <Link href="/menu" className="text-[#786B5A] hover:text-[#3F3027] transition-colors">
            Thực đơn
          </Link>
          <Link href="/orders" className="text-[#786B5A] hover:text-[#3F3027] transition-colors">
            Đơn hàng
          </Link>
          <span className="text-[#786B5A] hover:text-[#3F3027] cursor-pointer transition-colors">
            Ưu đãi
          </span>
          <span className="text-[#786B5A] hover:text-[#3F3027] cursor-pointer transition-colors">
            Tài khoản
          </span>
        </nav>

        {/* Cụm Tiện ích bên phải: Icon Giỏ hàng + Badge + Avatar Q */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/cart"
            className="relative p-2 text-[#7D3F32] transition-colors flex items-center justify-center rounded-full bg-[#E8D7B8]/40"
            aria-label="Xem giỏ hàng"
          >
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] min-w-[18px] min-h-[18px] rounded-full bg-[#7D3F32] text-[#FFFAF0] text-[10px] font-bold flex items-center justify-center leading-none shadow-xs select-none">
              {totalCartItems}
            </span>
          </Link>

          <div
            title="Tài khoản: Quỳnh"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#7D3F32] text-[#FFFAF0] flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs select-none cursor-pointer border border-[#914C3E]"
          >
            Q
          </div>
        </div>
      </div>
    </header>
  );

  // ==========================================================================
  // 1. TRƯỜNG HỢP: GIỎ HÀNG TRỐNG (FRAME 03b FIGMA)
  // ==========================================================================
  if (items.length === 0 && !activePaymentOrder) {
    return (
      <div className="min-h-screen bg-[#F3E8D4] text-[#3F3027] flex flex-col justify-between">
        <div>
          {renderSharedHeader()}

          <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
            {/* Minh họa Ly cà phê thảnh thơi (Frame 03b) */}
            <div className="bg-[#FFFAF0] rounded-[24px] p-8 sm:p-12 border border-[#DDCCAE] text-center max-w-xl mx-auto mb-10 shadow-sm">
              <div className="w-24 h-24 bg-[#F3E8D4] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#DDCCAE]">
                <Coffee className="w-12 h-12 text-[#7D3F32] stroke-[1.5]" />
              </div>
              <h1 className="font-serif text-[26px] sm:text-[34px] font-bold text-[#3F3027] leading-tight mb-3">
                Giỏ hàng của bạn<br />đang thảnh thơi
              </h1>
              <p className="text-[14px] text-[#786B5A] max-w-md mx-auto mb-8 leading-relaxed">
                Hãy chọn cho mình một ly cà phê đậm vị để bắt đầu ngày mới nhé.
              </p>
              <Link
                href="/menu"
                className="inline-flex items-center justify-center h-[48px] px-8 bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[14px] transition-colors shadow-sm"
              >
                Khám phá thực đơn ngay
              </Link>
            </div>

            {/* Gợi ý cho ngày mới (Frame 03b Figma) */}
            <div className="max-w-xl mx-auto">
              <p className="text-[11px] font-bold text-[#786B5A] tracking-widest uppercase mb-3.5">
                GỢI Ý CHO NGÀY MỚI
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Món gợi ý 1 */}
                <div
                  onClick={() =>
                    handleQuickAdd(
                      'Cà phê Muối Côn Đảo',
                      45000,
                      '/images/drinks/ca-phe-muoi-con-dao.jpg',
                      'prod-001'
                    )
                  }
                  className="bg-[#FFFAF0] rounded-[16px] p-3 sm:p-4 border border-[#DDCCAE] hover:border-[#7D3F32] cursor-pointer transition-all flex flex-col justify-between group shadow-xs"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-12 h-12 rounded-[10px] overflow-hidden bg-[#F3E8D4] flex-shrink-0">
                      <Image
                        src="/images/drinks/ca-phe-muoi-con-dao.jpg"
                        alt="Cà phê Muối Côn Đảo"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <p className="font-serif text-[13px] sm:text-[14px] font-bold text-[#3F3027] leading-tight">
                        Cà phê Muối Côn Đảo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#7D3F32]">45.000 đ</span>
                    <span className="text-[11px] font-semibold text-[#A95619] group-hover:underline">
                      + Thêm
                    </span>
                  </div>
                </div>

                {/* Món gợi ý 2 */}
                <div
                  onClick={() =>
                    handleQuickAdd(
                      'Trà Lài Vải Thiều',
                      42000,
                      '/images/drinks/tra-lai-vai-thieu.jpg',
                      'prod-002'
                    )
                  }
                  className="bg-[#FFFAF0] rounded-[16px] p-3 sm:p-4 border border-[#DDCCAE] hover:border-[#7D3F32] cursor-pointer transition-all flex flex-col justify-between group shadow-xs"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-12 h-12 rounded-[10px] overflow-hidden bg-[#F3E8D4] flex-shrink-0">
                      <Image
                        src="/images/drinks/tra-lai-vai-thieu.jpg"
                        alt="Trà Lài Vải Thiều"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <p className="font-serif text-[13px] sm:text-[14px] font-bold text-[#3F3027] leading-tight">
                        Trà Lài Vải Thiều
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#7D3F32]">42.000 đ</span>
                    <span className="text-[11px] font-semibold text-[#A95619] group-hover:underline">
                      + Thêm
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="w-full bg-[#7D3F32] text-[#FFFAF0] py-4 px-4 sm:px-10 lg:px-14">
          <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
            <span className="font-medium text-[#FFFAF0] text-[11px] sm:text-xs">
              BrewLite · Chậm một nhịp, đậm một gu.
            </span>
            <span className="text-[#D9C19B] text-[11px] sm:text-xs">
              Cà phê nguyên bản · Pha theo lựa chọn của bạn
            </span>
          </div>
        </footer>
      </div>
    );
  }

  // ==========================================================================
  // 2. TRƯỜNG HỢP: BƯỚC 2 - KIỂM TRA VÀ ĐẶT HÀNG (FRAME 05 FIGMA)
  // ==========================================================================
  if (currentStep === 'checkout' && !activePaymentOrder) {
    return (
      <div className="min-h-screen bg-[#F3E8D4] text-[#3F3027] flex flex-col justify-between">
        <div>
          {renderSharedHeader()}

          <main className="max-w-[1360px] mx-auto px-4 sm:px-10 lg:px-14 pb-32 lg:pb-12">
            {/* Breadcrumb và Nút quay lại */}
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <button
                onClick={() => setCurrentStep('cart')}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#786B5A] hover:text-[#7D3F32] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại giỏ hàng</span>
              </button>
              <span className="text-[12px] text-[#786B5A] font-medium hidden sm:inline">
                Giỏ hàng &nbsp; / &nbsp; <b className="text-[#7D3F32]">Xác nhận đơn</b> &nbsp; / &nbsp; Thanh toán
              </span>
            </div>

            {/* Tiêu đề trang Checkout (Frame 05) */}
            <div className="mt-3 sm:mt-5">
              <h1 className="font-serif text-[26px] lg:text-[36px] font-bold text-[#3F3027]">
                Kiểm tra và đặt hàng
              </h1>
              <p className="text-[13px] text-[#786B5A] mt-0.5">
                Chỉ còn một bước để món ngon đến tay bạn.
              </p>
            </div>

            {/* Layout 2 cột Checkout */}
            <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-12 lg:gap-8 items-start">
              {/* CỘT TRÁI: THÔNG TIN NHẬN MÓN (8 Cột) */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                {/* 1. Hình thức nhận món */}
                <div className="bg-[#FFFAF0] rounded-[20px] p-5 sm:p-6 border border-[#DDCCAE] shadow-xs">
                  <h2 className="font-serif text-[18px] sm:text-[20px] font-bold text-[#3F3027] mb-4">
                    Bạn muốn nhận món thế nào?
                  </h2>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <button
                      onClick={() => setDeliveryMethod('PICKUP')}
                      className={`h-[48px] rounded-[12px] font-bold text-[13px] sm:text-[14px] transition-all flex items-center justify-center gap-2 border ${
                        deliveryMethod === 'PICKUP'
                          ? 'bg-[#7D3F32] text-[#FFFAF0] border-[#7D3F32] shadow-sm'
                          : 'bg-[#F3E8D4] text-[#786B5A] border-[#DDCCAE] hover:text-[#3F3027]'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>Nhận tại quầy</span>
                    </button>

                    <button
                      onClick={() => setDeliveryMethod('DELIVERY')}
                      className={`h-[48px] rounded-[12px] font-bold text-[13px] sm:text-[14px] transition-all flex items-center justify-center gap-2 border ${
                        deliveryMethod === 'DELIVERY'
                          ? 'bg-[#7D3F32] text-[#FFFAF0] border-[#7D3F32] shadow-sm'
                          : 'bg-[#F3E8D4] text-[#786B5A] border-[#DDCCAE] hover:text-[#3F3027]'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Giao tận nơi</span>
                    </button>
                  </div>

                  {/* Chi tiết chi nhánh nhận */}
                  <div className="bg-[#F3E8D4] rounded-[14px] p-4 border border-[#DDCCAE]">
                    <p className="text-[14px] font-bold text-[#3F3027]">
                      BrewLite · Chi nhánh Quận 1
                    </p>
                    <p className="text-[12px] text-[#786B5A] mt-0.5">
                      123 Đường Cà Phê, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
                    </p>
                    <p className="text-[11px] font-semibold text-[#A95619] mt-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Chuẩn bị trong khoảng 10–15 phút sau khi đặt</span>
                    </p>
                  </div>
                </div>

                {/* 2. Thông tin người nhận */}
                <div className="bg-[#FFFAF0] rounded-[20px] p-5 sm:p-6 border border-[#DDCCAE] shadow-xs">
                  <h2 className="font-serif text-[18px] sm:text-[20px] font-bold text-[#3F3027] mb-4">
                    Thông tin người nhận
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#786B5A] uppercase tracking-wider mb-1.5">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full h-[48px] bg-[#F3E8D4] rounded-[12px] px-4 text-[14px] font-semibold text-[#3F3027] border border-[#DDCCAE] focus:outline-none focus:border-[#7D3F32]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#786B5A] uppercase tracking-wider mb-1.5">
                        Số điện thoại
                      </label>
                      <input
                        type="text"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="w-full h-[48px] bg-[#F3E8D4] rounded-[12px] px-4 text-[14px] font-semibold text-[#3F3027] border border-[#DDCCAE] focus:outline-none focus:border-[#7D3F32]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Thời gian nhận món */}
                <div className="bg-[#FFFAF0] rounded-[20px] p-5 sm:p-6 border border-[#DDCCAE] shadow-xs">
                  <h2 className="font-serif text-[18px] sm:text-[20px] font-bold text-[#3F3027] mb-4">
                    Thời gian nhận món
                  </h2>

                  <div className="space-y-3">
                    <label
                      onClick={() => setPickupTimeMode('NOW')}
                      className={`flex items-center gap-3 p-3.5 rounded-[12px] border cursor-pointer transition-all ${
                        pickupTimeMode === 'NOW'
                          ? 'bg-[#F3E8D4] border-[#7D3F32] shadow-xs'
                          : 'bg-[#FFFAF0] border-[#DDCCAE]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        pickupTimeMode === 'NOW' ? 'border-[#7D3F32]' : 'border-[#786B5A]'
                      }`}>
                        {pickupTimeMode === 'NOW' && <div className="w-2 h-2 rounded-full bg-[#7D3F32]" />}
                      </div>
                      <span className="text-[13px] font-semibold text-[#3F3027]">
                        Lấy ngay · Sau khoảng 10 phút
                      </span>
                    </label>

                    <label
                      onClick={() => setPickupTimeMode('SCHEDULE')}
                      className={`flex items-center gap-3 p-3.5 rounded-[12px] border cursor-pointer transition-all ${
                        pickupTimeMode === 'SCHEDULE'
                          ? 'bg-[#F3E8D4] border-[#7D3F32] shadow-xs'
                          : 'bg-[#FFFAF0] border-[#DDCCAE]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        pickupTimeMode === 'SCHEDULE' ? 'border-[#7D3F32]' : 'border-[#786B5A]'
                      }`}>
                        {pickupTimeMode === 'SCHEDULE' && <div className="w-2 h-2 rounded-full bg-[#7D3F32]" />}
                      </div>
                      <span className="text-[13px] font-semibold text-[#3F3027]">
                        Hẹn giờ nhận món
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG TRƯỚC KHI TẠO (5 Cột) */}
              <div className="lg:col-span-5 xl:col-span-4 mt-6 lg:mt-0">
                <div className="bg-[#FFFAF0] rounded-[20px] p-5 sm:p-6 border border-[#DDCCAE] shadow-sm sticky top-6">
                  <h2 className="font-serif text-[18px] sm:text-[20px] font-bold text-[#3F3027] mb-4">
                    Đơn hàng của bạn
                  </h2>

                  {/* Danh sách món rút gọn */}
                  <div className="space-y-3.5 border-b border-[#DDCCAE] pb-4 mb-4 max-h-[260px] overflow-y-auto">
                    {items.map((item) => (
                      <div key={`${item.productId}-${item.size}`} className="flex justify-between items-start text-[13px]">
                        <div className="flex-1 pr-3">
                          <p className="font-serif font-bold text-[#3F3027]">
                            {item.quantity} × {item.name}
                          </p>
                          <p className="text-[11px] text-[#786B5A] mt-0.5 line-clamp-1">
                            {item.optionsDesc || `Size ${item.size}`}
                          </p>
                        </div>
                        <span className="font-bold text-[#7D3F32]">
                          {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Chi tiết tiền */}
                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-[#786B5A]">Tiền món</span>
                      <span className="font-semibold text-[#3F3027]">
                        {subtotal.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#786B5A]">Ưu đãi {appliedVoucher?.code}</span>
                        <span className="font-semibold text-[#246344]">
                          −{discount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-[#786B5A]">Phí đóng gói</span>
                      <span className="font-semibold text-[#3F3027]">0 đ</span>
                    </div>

                    <div className="border-t border-[#DDCCAE] pt-3 flex justify-between items-baseline">
                      <span className="text-[15px] font-bold text-[#3F3027]">Tổng thanh toán</span>
                      <span className="font-serif text-[24px] font-bold text-[#7D3F32]">
                        {finalTotal.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <p className="text-[11px] text-[#786B5A]">
                      Giá đã bao gồm thuế VAT
                    </p>
                  </div>

                  {/* Nút hành động Tạo đơn (Chỉ hiện trên Desktop, Mobile dùng thanh cố định bên dưới) */}
                  <div className="mt-6 hidden lg:block">
                    <button
                      onClick={handleCreateOrder}
                      disabled={isSubmitting}
                      className="w-full h-[48px] bg-[#7D3F32] hover:bg-[#6A3328] disabled:bg-[#786B5A] text-[#FFFAF0] rounded-[12px] font-bold text-[14px] flex items-center justify-center transition-colors shadow-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Đang tạo đơn...
                        </>
                      ) : (
                        'Tạo đơn và chọn thanh toán'
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-[#786B5A] text-center mt-3 leading-relaxed">
                    Thông tin nguyên liệu và giá được kiểm tra lại trước khi tạo đơn.
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Fixed Bottom Bar (Frame 05) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#FFFAF0] border-t border-[#DDCCAE] rounded-t-[16px] p-4 shadow-xl z-40">
              <div className="max-w-md mx-auto">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-[12px] text-[#786B5A]">Tổng thanh toán</span>
                  <span className="font-serif text-[20px] font-bold text-[#7D3F32]">
                    {finalTotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <button
                  onClick={handleCreateOrder}
                  disabled={isSubmitting}
                  className="w-full h-[48px] bg-[#7D3F32] hover:bg-[#6A3328] disabled:bg-[#786B5A] text-[#FFFAF0] rounded-[12px] font-bold text-[14px] flex items-center justify-center transition-colors shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Đang tạo đơn...
                    </>
                  ) : (
                    'Tạo đơn và chọn thanh toán'
                  )}
                </button>
              </div>
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="w-full bg-[#7D3F32] text-[#FFFAF0] py-4 px-4 sm:px-10 lg:px-14 mb-24 lg:mb-0">
          <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
            <span className="font-medium text-[#FFFAF0] text-[11px] sm:text-xs">
              BrewLite · Chậm một nhịp, đậm một gu.
            </span>
            <span className="text-[#D9C19B] text-[11px] sm:text-xs">
              Cà phê nguyên bản · Pha theo lựa chọn của bạn
            </span>
          </div>
        </footer>
      </div>
    );
  }

  // ==========================================================================
  // 3. TRƯỜNG HỢP: BƯỚC 1 - GIỎ HÀNG CÓ MÓN (FRAME 03 FIGMA)
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#F3E8D4] text-[#3F3027] flex flex-col justify-between">
      <div>
        {renderSharedHeader()}

        <main className="max-w-[1360px] mx-auto px-4 sm:px-10 lg:px-14 pb-28 lg:pb-12">
          {/* Nút quay lại thực đơn */}
          <div className="mt-4 sm:mt-6">
            <Link
              href="/menu"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#786B5A] hover:text-[#7D3F32] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tiếp tục chọn món</span>
            </Link>
          </div>

          {/* Tiêu đề giỏ hàng */}
          <div className="mt-2.5">
            <h1 className="font-serif text-[26px] lg:text-[36px] font-bold text-[#3F3027]">
              Giỏ hàng của bạn
            </h1>
            <p className="text-[13px] text-[#786B5A] mt-0.5">
              {items.length === 1
                ? 'Một món ngon, một khoảng thảnh thơi.'
                : items.length === 2
                ? 'Hai món ngon, một khoảng thảnh thơi.'
                : `${items.length} món ngon, một khoảng thảnh thơi.`}
            </p>
          </div>

          {/* Layout chính giỏ hàng: 2 Cột Desktop / 1 Cột Mobile */}
          <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-12 lg:gap-8 items-start">
            {/* CỘT TRÁI: DANH SÁCH MÓN & VOUCHER BOX (8 Cột) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              {/* Danh sách thẻ món (Frame 03) */}
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="bg-[#FFFAF0] rounded-[18px] p-4 sm:p-5 border border-[#DDCCAE] shadow-xs flex flex-col justify-between"
                >
                  <div className="flex gap-3.5 sm:gap-4 items-start">
                    {/* Ảnh món */}
                    <div className="relative w-[76px] h-[86px] sm:w-[128px] sm:h-[128px] rounded-[14px] sm:rounded-[16px] overflow-hidden bg-[#F3E8D4] flex-shrink-0">
                      <Image
                        src={item.imageUrl || '/images/drinks/ca-phe-muoi-con-dao.jpg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Thông tin món */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif text-[15px] sm:text-[20px] font-bold text-[#3F3027] truncate">
                          {item.name}
                        </h3>
                        <span className="hidden sm:block font-serif text-[18px] font-bold text-[#7D3F32]">
                          {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      <p className="text-[12px] text-[#786B5A] mt-1 whitespace-pre-line leading-relaxed">
                        {item.optionsDesc ||
                          `Size ${item.size} · ${item.sugarLevel || '50%'} đường · ${item.iceLevel || '100%'} đá`}
                      </p>

                      <Link
                        href="/menu"
                        className="inline-block text-[11px] font-semibold text-[#A95619] hover:underline mt-2"
                      >
                        Sửa tùy chọn
                      </Link>
                    </div>
                  </div>

                  {/* Thanh điều khiển số lượng, giá và xóa */}
                  <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-[#F3E8D4]">
                    {/* Giá hiển thị trên Mobile */}
                    <span className="sm:hidden font-serif text-[16px] font-bold text-[#7D3F32]">
                      {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                    </span>

                    <div className="flex items-center gap-3 ml-auto">
                      {/* Stepper Tăng/Giảm (116x36px nền #EADBC2 chuẩn Figma) */}
                      <div className="flex items-center bg-[#EADBC2] rounded-[10px] h-[36px] w-[116px] justify-between px-3">
                        <button
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                          className="text-[#3F3027] font-bold text-[16px] px-1 hover:opacity-70 transition-opacity"
                          aria-label="Giảm số lượng"
                        >
                          −
                        </button>
                        <span className="text-[#3F3027] font-bold text-[13px]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                          className="text-[#3F3027] font-bold text-[16px] px-1 hover:opacity-70 transition-opacity"
                          aria-label="Tăng số lượng"
                        >
                          +
                        </button>
                      </div>

                      {/* Nút Xóa món thùng rác */}
                      <button
                        onClick={() => removeItem(item.productId, item.size)}
                        className="w-[36px] h-[36px] flex items-center justify-center text-[#786B5A] hover:text-[#B42318] transition-colors rounded-full hover:bg-[#F3E8D4]"
                        title="Xóa món"
                      >
                        <Trash2 className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* HỘP MÃ ƯU ĐÃI (VOUCHER BOX - Frame 03) */}
              <div className="bg-[#FFFAF0] rounded-[18px] p-4 sm:p-5 border border-[#DDCCAE] shadow-xs">
                <h2 className="font-serif text-[16px] font-bold text-[#3F3027] mb-3">
                  Ưu đãi cho một ngày vui
                </h2>

                {!appliedVoucher ? (
                  <div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                          placeholder="Nhập mã ưu đãi (ví dụ: BANMOI10)"
                          className="w-full h-[44px] bg-[#F3E8D4] rounded-[10px] px-3.5 text-[13px] font-medium text-[#3F3027] border border-[#DDCCAE] focus:outline-none focus:border-[#7D3F32] transition-colors"
                        />
                      </div>
                      <button
                        onClick={handleApplyPromo}
                        className="h-[44px] px-5 bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[10px] font-bold text-[12px] transition-colors flex items-center justify-center flex-shrink-0 shadow-xs"
                      >
                        Áp dụng
                      </button>
                    </div>

                    {promoError && (
                      <p className="text-[12px] text-[#B42318] font-medium mt-2">
                        {promoError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="bg-[#E7F0E9] border border-[#A7CEB5] rounded-[10px] px-3.5 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#246344] stroke-[2.5]" />
                        <span className="text-[13px] font-bold text-[#246344]">
                          {appliedVoucher.code} · {appliedVoucher.description}
                        </span>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="text-[#786B5A] hover:text-[#B42318] text-[18px] font-bold px-1 transition-colors"
                        title="Gỡ mã ưu đãi"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-[11px] text-[#786B5A]">
                      Đã áp dụng cho đơn hàng này.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CỘT PHẢI: TỔNG KẾT ĐƠN (4 Cột Desktop, trên Mobile hiển thị qua thanh cố định bên dưới) */}
            <div className="hidden lg:block lg:col-span-5 xl:col-span-4 mt-6 lg:mt-0">
              <div className="bg-[#FFFAF0] rounded-[20px] p-5 sm:p-6 border border-[#DDCCAE] shadow-xs sticky top-6">
                <h2 className="font-serif text-[18px] sm:text-[20px] font-bold text-[#3F3027] mb-4">
                  Tóm tắt đơn hàng
                </h2>

                <div className="space-y-3.5 text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-[#786B5A]">Tiền món</span>
                    <span className="font-semibold text-[#3F3027]">
                      {subtotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#786B5A]">Ưu đãi</span>
                    <span className={`font-semibold ${discount > 0 ? 'text-[#246344]' : 'text-[#3F3027]'}`}>
                      {discount > 0 ? `−${discount.toLocaleString('vi-VN')} đ` : '0 đ'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#786B5A]">Phí đóng gói</span>
                    <span className="font-semibold text-[#3F3027]">0 đ</span>
                  </div>

                  <div className="border-t border-[#DDCCAE] pt-3.5 flex justify-between items-baseline">
                    <span className="text-[16px] font-bold text-[#3F3027]">Tổng thanh toán</span>
                    <span className="font-serif text-[26px] font-bold text-[#7D3F32]">
                      {finalTotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <p className="text-[12px] text-[#786B5A]">
                    Giá đã bao gồm VAT
                  </p>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setCurrentStep('checkout')}
                    className="w-full h-[48px] bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[14px] flex items-center justify-center transition-colors shadow-sm"
                  >
                    Tiến hành đặt hàng
                  </button>
                </div>

                <p className="text-[12px] text-[#786B5A] text-center mt-3 leading-relaxed">
                  Món được pha mới khi đơn được xác nhận.
                </p>
              </div>
            </div>
          </div>

          {/* THANH ĐẶT HÀNG CỐ ĐỊNH PHÍA DƯỚI (BOTTOM BAR MOBILE FRAME 03b) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#FFFAF0] border-t border-[#DDCCAE] rounded-t-[16px] p-4 shadow-xl z-40">
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[12px] text-[#786B5A]">
                  {discount > 0
                    ? `${subtotal.toLocaleString('vi-VN')} đ − ${discount.toLocaleString('vi-VN')} đ`
                    : 'Tổng tiền tạm tính'}
                </span>
                <span className="font-serif text-[19px] font-bold text-[#7D3F32]">
                  {finalTotal.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <p className="text-[10px] text-[#786B5A] mb-3">
                Đã gồm VAT · Đóng gói miễn phí
              </p>

              <button
                onClick={() => setCurrentStep('checkout')}
                className="w-full h-[48px] bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[14px] flex items-center justify-center transition-colors shadow-sm"
              >
                Tiến hành đặt hàng · {finalTotal.toLocaleString('vi-VN')} đ
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ======================================================================
          4. POPUP THANH TOÁN QR (FRAME 06 FIGMA - 880x760 ĐỒNG BỘ 2 CỘT DESKTOP)
          ====================================================================== */}
      {activePaymentOrder && !isPaidSuccess && (
        <div className="fixed inset-0 bg-[#2E211B]/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#FFFAF0] rounded-[24px] max-w-md lg:max-w-3xl w-full p-5 sm:p-7 border border-[#C8AF87] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header Popup */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-serif text-[18px] font-bold text-[#7D3F32]">BrewLite</span>
              <button
                onClick={() => setActivePaymentOrder(null)}
                className="w-8 h-8 rounded-[10px] bg-[#EADBC2] text-[#3F3027] font-bold text-[16px] flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                ×
              </button>
            </div>

            <h3 className="font-serif text-[22px] sm:text-[26px] font-bold text-[#3F3027] mb-0.5">
              Thanh toán đơn hàng
            </h3>
            <p className="text-[12px] text-[#786B5A] mb-5">
              {activePaymentOrder.orderCode} · Nhận tại quầy · Chi nhánh Quận 1
            </p>

            {/* Layout 2 Cột trên Desktop (Frame 06 chuẩn 880x760) */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start">
              {/* Cột trái: 4 Phương thức thanh toán (5 Cột) */}
              <div className="lg:col-span-5 space-y-2.5 mb-5 lg:mb-0">
                <p className="text-[11px] font-bold text-[#786B5A] uppercase tracking-wider mb-2">
                  CHỌN PHƯƠNG THỨC
                </p>

                {/* 1. Quét mã QR */}
                <button
                  onClick={() => setPaymentMethod('QR')}
                  className={`w-full p-3 rounded-[12px] text-left transition-all border flex items-center gap-2.5 ${
                    paymentMethod === 'QR'
                      ? 'bg-[#EADBC2] border-[#7D3F32] shadow-xs'
                      : 'bg-[#F3E8D4] border-[#DDCCAE] hover:bg-[#EADBC2]/50'
                  }`}
                >
                  <span className="text-[13px] text-[#7D3F32]">
                    {paymentMethod === 'QR' ? '●' : '○'}
                  </span>
                  <div>
                    <p className="text-[12px] sm:text-[13px] font-bold text-[#3F3027]">
                      Quét mã QR
                    </p>
                    <p className="text-[10px] text-[#786B5A]">Không dùng tiền thật</p>
                  </div>
                </button>

                {/* 2. Ví điện tử mô phỏng */}
                <button
                  onClick={() => setPaymentMethod('WALLET')}
                  className={`w-full p-3 rounded-[12px] text-left transition-all border flex items-center gap-2.5 ${
                    paymentMethod === 'WALLET'
                      ? 'bg-[#EADBC2] border-[#7D3F32] shadow-xs'
                      : 'bg-[#F3E8D4] border-[#DDCCAE] hover:bg-[#EADBC2]/50'
                  }`}
                >
                  <span className="text-[13px] text-[#7D3F32]">
                    {paymentMethod === 'WALLET' ? '●' : '○'}
                  </span>
                  <div>
                    <p className="text-[12px] sm:text-[13px] font-bold text-[#3F3027]">
                      Ví điện tử mô phỏng
                    </p>
                    <p className="text-[10px] text-[#786B5A]">Không dùng tiền thật</p>
                  </div>
                </button>

                {/* 3. Thẻ thử nghiệm */}
                <button
                  onClick={() => setPaymentMethod('CARD')}
                  className={`w-full p-3 rounded-[12px] text-left transition-all border flex items-center gap-2.5 ${
                    paymentMethod === 'CARD'
                      ? 'bg-[#EADBC2] border-[#7D3F32] shadow-xs'
                      : 'bg-[#F3E8D4] border-[#DDCCAE] hover:bg-[#EADBC2]/50'
                  }`}
                >
                  <span className="text-[13px] text-[#7D3F32]">
                    {paymentMethod === 'CARD' ? '●' : '○'}
                  </span>
                  <div>
                    <p className="text-[12px] sm:text-[13px] font-bold text-[#3F3027]">
                      Thẻ thử nghiệm
                    </p>
                    <p className="text-[10px] text-[#786B5A]">Không dùng tiền thật</p>
                  </div>
                </button>



                {/* Chú thích môi trường thử nghiệm */}
                <div className="pt-2 text-[11px] text-[#786B5A] leading-relaxed hidden lg:block">
                  <p className="font-bold text-[#7D3F32] mb-0.5">Môi trường thử nghiệm</p>
                  <p>Không dùng tài khoản hoặc tiền thật. Chỉ ghi nhận thanh toán giả lập.</p>
                </div>
              </div>

              {/* Cột phải: Khung QR thanh toán (7 Cột) */}
              <div className="lg:col-span-7">
                <div className="bg-[#F3E8D4] rounded-[16px] p-5 text-center border border-[#DDCCAE]">
                  <p className="text-[10px] font-bold text-[#786B5A] uppercase tracking-wider mb-1">
                    TỔNG THANH TOÁN
                  </p>
                  <p className="font-serif text-[28px] sm:text-[32px] font-bold text-[#7D3F32] mb-3">
                    {activePaymentOrder.finalAmount?.toLocaleString('vi-VN')} đ
                  </p>

                  {/* Graphic QR */}
                  <div className="w-[170px] h-[170px] bg-white rounded-[14px] p-3 mx-auto mb-3 shadow-inner flex items-center justify-center border border-[#DDCCAE]">
                    <QrCode className="w-full h-full text-[#3F3027]" />
                  </div>

                  <p className="text-[9px] text-[#786B5A] font-semibold uppercase tracking-wider">
                    QR MINH HỌA · KHÔNG CHUYỂN TIỀN
                  </p>
                  <p className="text-[11px] font-bold text-[#3F3027] mt-1">
                    CÔNG TY TNHH BREWLITE VIETNAM
                  </p>
                  <p className="text-[11px] text-[#786B5A] mt-0.5">
                    Nội dung: {activePaymentOrder.orderCode}
                  </p>
                  <p className="text-[12px] font-bold text-[#7D3F32] mt-2 flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Mã hết hiệu lực sau {formatCountdown(timeLeft)}</span>
                  </p>
                </div>

                {/* Nút hành động */}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isCheckingPayment}
                    className="w-full h-[48px] bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[14px] flex items-center justify-center transition-colors shadow-sm"
                  >
                    {isCheckingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Đang kiểm tra cổng thanh toán...
                      </>
                    ) : (
                      'Kiểm tra trạng thái'
                    )}
                  </button>

                  <button
                    onClick={() => setActivePaymentOrder(null)}
                    className="w-full text-center text-[12px] text-[#786B5A] hover:text-[#B42318] py-1 font-medium transition-colors"
                  >
                    Hủy đơn đang chờ thanh toán
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          5. POPUP THANH TOÁN THÀNH CÔNG (FRAME 06h FIGMA)
          ====================================================================== */}
      {activePaymentOrder && isPaidSuccess && (
        <div className="fixed inset-0 bg-[#2E211B]/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#FFFAF0] rounded-[24px] max-w-sm sm:max-w-md w-full p-6 sm:p-8 border border-[#C8AF87] shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#E7F0E9] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#A7CEB5]">
              <Check className="w-8 h-8 text-[#246344] stroke-[3]" />
            </div>

            <h3 className="font-serif text-[24px] sm:text-[28px] font-bold text-[#3F3027] mb-1">
              Thanh toán thành công
            </h3>
            <p className="text-[12px] font-bold text-[#246344] uppercase tracking-wider mb-2">
              ĐÃ THANH TOÁN · QR THỬ NGHIỆM
            </p>
            <p className="text-[13px] text-[#786B5A] mb-6 leading-relaxed">
              Mã đơn hàng <b className="text-[#3F3027]">{activePaymentOrder.orderCode}</b> đã được gửi đến quầy pha chế.
            </p>

            <div className="bg-[#F3E8D4] rounded-[14px] p-4 text-left mb-6 border border-[#DDCCAE] space-y-1 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#786B5A]">Chi nhánh nhận</span>
                <span className="font-bold text-[#3F3027]">BrewLite · Quận 1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#786B5A]">Tổng tiền đã trả</span>
                <span className="font-serif font-bold text-[#7D3F32]">
                  {activePaymentOrder.finalAmount?.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <Link
              href="/orders"
              className="w-full h-[48px] bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[14px] flex items-center justify-center transition-colors shadow-sm"
            >
              Theo dõi đơn hàng
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full bg-[#7D3F32] text-[#FFFAF0] py-4 px-4 sm:px-10 lg:px-14 mb-24 lg:mb-0">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          <span className="font-medium text-[#FFFAF0] text-[11px] sm:text-xs">
            BrewLite · Chậm một nhịp, đậm một gu.
          </span>
          <span className="text-[#D9C19B] text-[11px] sm:text-xs">
            Cà phê nguyên bản · Pha theo lựa chọn của bạn
          </span>
        </div>
      </footer>
    </div>
  );
}
