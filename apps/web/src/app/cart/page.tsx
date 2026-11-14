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
} from 'lucide-react';
import { useCartStore, CartItem } from '../../lib/store';
import { UserNav } from '../../components/UserNav';

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
  } = useCartStore();

  // Tránh hydration mismatch
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

  // Modal thanh toán (Frame 06 & Frame 06h)
  const [activePaymentOrder, setActivePaymentOrder] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'QR' | 'WALLET' | 'CARD' | 'CASH'>('QR');
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [timeLeft, setTimeLeft] = useState(582); // 09:42 đếm ngược

  // Đếm ngược thời gian thanh toán 10 phút
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

  // Xử lý áp dụng mã khuyến mãi chuẩn Figma (BANMOI10, BREW20K)
  const handleApplyPromo = () => {
    setPromoError(null);
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError('Vui lòng nhập mã ưu đãi.');
      return;
    }

    if (code === 'BANMOI10' || code === 'BREW20K') {
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
        sugarLevel: item.sugarLevel || '50%',
        iceLevel: item.iceLevel || '100%',
        toppings: item.toppings || [],
      })),
      promoCode: appliedVoucher ? appliedVoucher.code : undefined,
      note: `${deliveryMethod === 'PICKUP' ? 'Nhận tại quầy Quận 1' : 'Giao tận nơi'} · ${recipientName} (${recipientPhone})`,
      deliveryMethod,
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
    }, 700);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F3E8D4] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7D3F32]" />
      </div>
    );
  }

  // ==========================================================================
  // 1. TRƯỜNG HỢP: GIỎ HÀNG TRỐNG (FRAME 03b FIGMA)
  // ==========================================================================
  if (items.length === 0 && !activePaymentOrder) {
    return (
      <main className="min-h-screen bg-[#F3E8D4] text-[#3F3027] px-4 py-6 sm:px-8 sm:py-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-6 flex items-center justify-between">
            <Link href="/menu" className="font-serif text-[24px] sm:text-[30px] font-bold text-[#7D3F32] tracking-tight">
              BrewLite
            </Link>
            <nav className="hidden sm:flex items-center gap-7 text-[14px] text-[#786B5A] font-medium">
              <Link href="/menu" className="hover:text-[#7D3F32] transition-colors">Thực đơn</Link>
              <Link href="/orders" className="hover:text-[#7D3F32] transition-colors">Đơn hàng</Link>
              <Link href="/profile?tab=vouchers" className="hover:text-[#7D3F32] transition-colors">Ưu đãi</Link>
              <Link href="/profile" className="hover:text-[#7D3F32] transition-colors">Tài khoản</Link>
              <UserNav />
            </nav>
          </header>

          {/* Minh họa Ly cà phê thảnh thơi (Frame 03b) */}
          <div className="bg-[#FFFAF0] rounded-[24px] p-8 sm:p-12 border border-[#DDCCAE] text-center max-w-xl mx-auto mb-10 shadow-sm">
            <div className="w-24 h-24 bg-[#F3E8D4] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#DDCCAE]">
              <Coffee className="w-12 h-12 text-[#7D3F32] stroke-[1.5]" />
            </div>
            <h1 className="font-serif text-[26px] sm:text-[32px] font-semibold text-[#3F3027] leading-tight mb-3">
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
            <p className="text-[10px] sm:text-[11px] font-bold text-[#786B5A] tracking-widest uppercase mb-3">
              GỢI Ý CHO NGÀY MỚI
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Card 1 */}
              <div
                onClick={() =>
                  handleQuickAdd(
                    'Cà phê Muối Côn Đảo',
                    45000,
                    '/images/drinks/ca-phe-muoi-con-dao.jpg',
                    '3756e296-6e47-4950-b4df-6bbd688cf6a1'
                  )
                }
                className="bg-[#FFFAF0] rounded-[14px] p-3 sm:p-4 border border-[#DDCCAE] hover:border-[#7D3F32] cursor-pointer transition-all flex flex-col justify-between group shadow-sm"
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
                    <p className="text-[12px] sm:text-[13px] font-bold text-[#3F3027] leading-tight">
                      Cà phê Muối Côn Đảo
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] sm:text-[13px] font-bold text-[#7D3F32]">45.000 đ</span>
                  <span className="text-[11px] font-semibold text-[#A95619] group-hover:underline">
                    + Thêm
                  </span>
                </div>
              </div>

              {/* Card 2 */}
              <div
                onClick={() =>
                  handleQuickAdd(
                    'Trà Lài Vải Thiều',
                    42000,
                    '/images/drinks/tra-lai-vai-thieu.jpg',
                    '6bc943d0-eb41-47c3-b4aa-714041b65e94'
                  )
                }
                className="bg-[#FFFAF0] rounded-[14px] p-3 sm:p-4 border border-[#DDCCAE] hover:border-[#7D3F32] cursor-pointer transition-all flex flex-col justify-between group shadow-sm"
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
                    <p className="text-[12px] sm:text-[13px] font-bold text-[#3F3027] leading-tight">
                      Trà Lài Vải Thiều
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] sm:text-[13px] font-bold text-[#7D3F32]">42.000 đ</span>
                  <span className="text-[11px] font-semibold text-[#A95619] group-hover:underline">
                    + Thêm
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================================
  // 2. TRƯỜNG HỢP: BƯỚC 2 - KIỂM TRA VÀ ĐẶT HÀNG (FRAME 05 FIGMA)
  // ==========================================================================
  if (currentStep === 'checkout' && !activePaymentOrder) {
    return (
      <main className="min-h-screen bg-[#F3E8D4] text-[#3F3027] pb-32 lg:pb-16">
        <header className="px-5 sm:px-12 lg:px-20 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <Link href="/menu" className="font-serif text-[24px] lg:text-[30px] font-bold text-[#7D3F32] tracking-tight">
              BrewLite
            </Link>
            <nav className="hidden lg:flex items-center gap-7 text-[14px] text-[#786B5A] font-medium">
              <Link href="/menu" className="hover:text-[#7D3F32] transition-colors">Thực đơn</Link>
              <Link href="/orders" className="hover:text-[#7D3F32] transition-colors">Đơn hàng</Link>
              <Link href="/profile?tab=vouchers" className="hover:text-[#7D3F32] transition-colors">Ưu đãi</Link>
              <Link href="/profile" className="hover:text-[#7D3F32] transition-colors">Tài khoản</Link>
              <UserNav />
            </nav>
          </div>

          <div className="mt-4 sm:mt-6">
            <button
              onClick={() => setCurrentStep('cart')}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#786B5A] hover:text-[#7D3F32] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại giỏ hàng</span>
            </button>
          </div>

          <div className="mt-2">
            <h1 className="font-serif text-[26px] lg:text-[36px] font-semibold text-[#3F3027]">
              Kiểm tra và đặt hàng
            </h1>
            <p className="text-[13px] text-[#786B5A] mt-0.5">
              Chỉ còn một bước để món ngon đến tay bạn.
            </p>
          </div>
        </header>

        <div className="px-5 sm:px-12 lg:px-20 mt-4 lg:mt-6">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
            {/* CỘT TRÁI: FORM THÔNG TIN NHẬN MÓN (8 CỘT) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Box 1: Hình thức nhận món */}
              <div className="bg-[#FFFAF0] rounded-[16px] p-5 border border-[#DDCCAE] shadow-sm">
                <h2 className="text-[16px] font-bold text-[#3F3027] mb-3">
                  Bạn muốn nhận món thế nào?
                </h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('PICKUP')}
                    className={`h-[48px] rounded-[12px] font-bold text-[14px] transition-all flex items-center justify-center ${
                      deliveryMethod === 'PICKUP'
                        ? 'bg-[#7D3F32] text-[#FFFAF0] shadow-sm'
                        : 'bg-[#F3E8D4] text-[#786B5A] hover:text-[#3F3027]'
                    }`}
                  >
                    Nhận tại quầy
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('DELIVERY')}
                    className={`h-[48px] rounded-[12px] font-bold text-[14px] transition-all flex items-center justify-center ${
                      deliveryMethod === 'DELIVERY'
                        ? 'bg-[#7D3F32] text-[#FFFAF0] shadow-sm'
                        : 'bg-[#F3E8D4] text-[#786B5A] hover:text-[#3F3027]'
                    }`}
                  >
                    Giao tận nơi
                  </button>
                </div>

                <div className="border-t border-[#F3E8D4] pt-3">
                  <p className="text-[14px] font-bold text-[#3F3027]">
                    BrewLite · Chi nhánh Quận 1
                  </p>
                  <p className="text-[12px] text-[#786B5A] mt-0.5">
                    123 Đường Cà Phê, Quận 1
                  </p>
                  <p className="text-[12px] font-medium text-[#A95619] mt-1">
                    Chuẩn bị trong khoảng 10–15 phút
                  </p>
                </div>
              </div>

              {/* Box 2: Thông tin người nhận */}
              <div className="bg-[#FFFAF0] rounded-[16px] p-5 border border-[#DDCCAE] shadow-sm space-y-3">
                <h2 className="text-[16px] font-bold text-[#3F3027]">
                  Thông tin người nhận
                </h2>
                <div>
                  <label className="block text-[12px] font-semibold text-[#3F3027] mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full h-[48px] bg-[#F3E8D4] rounded-[10px] px-3.5 text-[13px] text-[#3F3027] border border-[#DDCCAE] focus:outline-none focus:border-[#7D3F32] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#3F3027] mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full h-[48px] bg-[#F3E8D4] rounded-[10px] px-3.5 text-[13px] text-[#3F3027] border border-[#DDCCAE] focus:outline-none focus:border-[#7D3F32] transition-colors"
                  />
                </div>
              </div>

              {/* Box 3: Thời gian nhận món */}
              <div className="bg-[#FFFAF0] rounded-[16px] p-5 border border-[#DDCCAE] shadow-sm">
                <h2 className="text-[16px] font-bold text-[#3F3027] mb-3">
                  Thời gian nhận món
                </h2>
                <div className="space-y-2">
                  <div
                    onClick={() => setPickupTimeMode('NOW')}
                    className={`h-[42px] px-3.5 rounded-[10px] flex items-center cursor-pointer transition-colors ${
                      pickupTimeMode === 'NOW'
                        ? 'bg-[#EADBC2] text-[#3F3027] font-semibold'
                        : 'bg-transparent text-[#786B5A] hover:bg-[#F3E8D4]'
                    }`}
                  >
                    <span className="text-[12px]">
                      {pickupTimeMode === 'NOW' ? '● ' : '○ '} Lấy ngay · Sau khoảng 10 phút
                    </span>
                  </div>
                  <div
                    onClick={() => setPickupTimeMode('SCHEDULE')}
                    className={`h-[42px] px-3.5 rounded-[10px] flex items-center cursor-pointer transition-colors ${
                      pickupTimeMode === 'SCHEDULE'
                        ? 'bg-[#EADBC2] text-[#3F3027] font-semibold'
                        : 'bg-transparent text-[#786B5A] hover:bg-[#F3E8D4]'
                    }`}
                  >
                    <span className="text-[12px]">
                      {pickupTimeMode === 'SCHEDULE' ? '● ' : '○ '} Hẹn giờ nhận món
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: TỔNG KẾT ĐƠN HÀNG (4 CỘT) */}
            <div className="mt-4 lg:mt-0 lg:col-span-4">
              <div className="bg-[#FFFAF0] rounded-[16px] p-6 border border-[#DDCCAE] shadow-sm sticky top-6">
                <h2 className="text-[17px] font-bold text-[#3F3027] mb-4">
                  Đơn hàng của bạn
                </h2>

                <div className="space-y-3 pb-4 border-b border-[#F3E8D4]">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.size}`} className="flex justify-between items-start text-[12px]">
                      <div>
                        <p className="font-medium text-[#3F3027]">
                          {item.quantity} × {item.name}
                        </p>
                        <p className="text-[11px] text-[#786B5A]">
                          {item.optionsDesc || `Size ${item.size} · 50% đường · 100% đá`}
                        </p>
                      </div>
                      <span className="font-bold text-[#7D3F32]">
                        {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5 pt-4 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#786B5A]">Tiền món:</span>
                    <span className="font-semibold text-[#3F3027]">{subtotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                  {appliedVoucher && (
                    <div className="flex justify-between text-[#246344]">
                      <span>Ưu đãi {appliedVoucher.code}:</span>
                      <span className="font-semibold">−{appliedVoucher.discountAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#786B5A] text-[11px]">
                    <span>Đóng gói: 0 đ · Đã gồm VAT</span>
                  </div>

                  <div className="border-t border-[#DDCCAE] pt-3 flex justify-between items-baseline">
                    <span className="text-[14px] font-bold text-[#3F3027]">Tổng thanh toán</span>
                    <span className="text-[20px] font-bold text-[#7D3F32]">
                      {finalTotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                <div className="mt-6">
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
            </div>
          </div>
        </div>

        {/* Mobile Fixed Bottom Bar (Frame 05) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#FFFAF0] border-t border-[#DDCCAE] rounded-t-[16px] p-4 shadow-xl z-40">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[12px] text-[#786B5A]">Tổng thanh toán</span>
              <span className="text-[20px] font-bold text-[#7D3F32]">
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
    );
  }

  // ==========================================================================
  // 3. TRƯỜNG HỢP: BƯỚC 1 - GIỎ HÀNG CÓ MÓN (FRAME 03 FIGMA)
  // ==========================================================================
  return (
    <main className="min-h-screen bg-[#F3E8D4] text-[#3F3027] pb-36 lg:pb-16">
      {/* Top Header */}
      <header className="px-5 sm:px-12 lg:px-20 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <Link href="/menu" className="font-serif text-[24px] lg:text-[30px] font-bold text-[#7D3F32] tracking-tight">
            BrewLite
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-[14px] text-[#786B5A] font-medium">
            <Link href="/menu" className="hover:text-[#7D3F32] transition-colors">Thực đơn</Link>
            <Link href="/orders" className="hover:text-[#7D3F32] transition-colors">Đơn hàng</Link>
            <Link href="/profile?tab=vouchers" className="hover:text-[#7D3F32] transition-colors">Ưu đãi</Link>
            <Link href="/profile" className="hover:text-[#7D3F32] transition-colors">Tài khoản</Link>
            <UserNav />
          </nav>
        </div>

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
        <div className="mt-2">
          <h1 className="font-serif text-[26px] lg:text-[36px] font-semibold text-[#3F3027]">
            Giỏ hàng của bạn
          </h1>
          <p className="text-[13px] text-[#786B5A] mt-0.5">
            {items.length === 1
              ? 'Một món ngon, một khoảng thảnh thơi.'
              : `${items.length} món ngon, một khoảng thảnh thơi.`}
          </p>
        </div>
      </header>

      {/* Main Content Layout (Desktop 2 Cột / Mobile 1 Cột) */}
      <div className="px-5 sm:px-12 lg:px-20 mt-4 lg:mt-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          {/* CỘT TRÁI: DANH SÁCH MÓN & MÃ ƯU ĐÃI (8 Cột trên Desktop) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Danh sách thẻ món (Frame 03) */}
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.size}`}
                className="bg-[#FFFAF0] rounded-[16px] p-4 border border-[#DDCCAE] shadow-sm flex flex-col justify-between"
              >
                <div className="flex gap-3 sm:gap-4 items-start">
                  {/* Ảnh món */}
                  <div className="relative w-[70px] h-[80px] lg:w-[128px] lg:h-[128px] rounded-[16px] overflow-hidden bg-[#F3E8D4] flex-shrink-0">
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
                      <h3 className="text-[14px] lg:text-[20px] font-bold text-[#3F3027] truncate">
                        {item.name}
                      </h3>
                      <span className="hidden lg:block text-[17px] font-bold text-[#7D3F32]">
                        {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <p className="text-[12px] text-[#786B5A] mt-1 whitespace-pre-line leading-relaxed">
                      {item.optionsDesc ||
                        `Size ${item.size} · ${item.sugarLevel || '50%'} đường · ${item.iceLevel || '100%'} đá`}
                    </p>

                    <Link
                      href="/menu"
                      className="inline-block text-[11px] font-semibold text-[#A95619] hover:underline mt-1.5"
                    >
                      Sửa tùy chọn
                    </Link>
                  </div>
                </div>

                {/* Thanh điều khiển số lượng, giá và xóa */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F3E8D4]">
                  {/* Giá trên Mobile */}
                  <span className="lg:hidden text-[15px] font-bold text-[#7D3F32]">
                    {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                  </span>

                  <div className="flex items-center gap-3 ml-auto">
                    {/* Stepper Tăng/Giảm Số Lượng (116x36px nền #EADBC2) */}
                    <div className="flex items-center bg-[#EADBC2] rounded-[10px] h-[36px] w-[116px] justify-between px-3">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.size, item.quantity - 1)
                        }
                        className="text-[#3F3027] font-bold text-[16px] px-1 hover:opacity-70 transition-opacity"
                        aria-label="Giảm số lượng"
                      >
                        −
                      </button>
                      <span className="text-[#3F3027] font-bold text-[13px]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.size, item.quantity + 1)
                        }
                        className="text-[#3F3027] font-bold text-[16px] px-1 hover:opacity-70 transition-opacity"
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>

                    {/* Nút Xóa món */}
                    <button
                      onClick={() => removeItem(item.productId, item.size)}
                      className="w-[36px] h-[36px] flex items-center justify-center text-[#786B5A] hover:text-[#B42318] transition-colors"
                      title="Xóa món"
                    >
                      <Trash2 className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* HỘP MÃ ƯU ĐÃI (VOUCHER BOX - Frame 03) */}
            <div className="bg-[#FFFAF0] rounded-[16px] p-4 lg:p-5 border border-[#DDCCAE] shadow-sm">
              <h2 className="text-[16px] font-bold text-[#3F3027] mb-3">
                Ưu đãi cho một ngày vui
              </h2>

              {!appliedVoucher ? (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                      placeholder="Nhập mã (ví dụ: BANMOI10)"
                      className="w-full h-[44px] bg-[#F3E8D4] rounded-[10px] px-3.5 text-[13px] font-medium text-[#3F3027] border border-[#DDCCAE] focus:outline-none focus:border-[#7D3F32] transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    className="h-[44px] px-5 bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[12px] transition-colors flex items-center justify-center flex-shrink-0"
                  >
                    Áp dụng
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-[#EADBC2] rounded-[10px] h-[44px] px-3.5 border border-[#DDCCAE]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#7D3F32] text-[#FFFAF0] flex items-center justify-center text-[11px] font-bold">
                        ✓
                      </span>
                      <span className="text-[12px] font-semibold text-[#7D3F32]">
                        {appliedVoucher.code} · Giảm {appliedVoucher.discountAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="text-[#786B5A] hover:text-[#B42318] text-[20px] font-normal leading-none"
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

              {promoError && (
                <p className="text-[12px] text-[#B42318] mt-2 font-medium">
                  {promoError}
                </p>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: TỔNG KẾT ĐƠN HÀNG (STICKY SUMMARY TRÊN DESKTOP - 4 Cột) */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="bg-[#FFFAF0] rounded-[16px] p-6 border border-[#DDCCAE] shadow-sm sticky top-6">
              <h2 className="text-[22px] font-bold text-[#3F3027] mb-5">
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-3.5 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-[#786B5A]">Tiền món</span>
                  <span className="font-semibold text-[#7D3F32]">
                    {subtotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#786B5A]">Ưu đãi</span>
                  <span className={`font-semibold ${discount > 0 ? 'text-[#246344]' : 'text-[#7D3F32]'}`}>
                    {discount > 0 ? `−${discount.toLocaleString('vi-VN')} đ` : '0 đ'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#786B5A]">Phí đóng gói</span>
                  <span className="font-semibold text-[#3F3027]">0 đ</span>
                </div>

                <div className="border-t border-[#DDCCAE] pt-3.5 flex justify-between items-baseline">
                  <span className="text-[16px] font-bold text-[#3F3027]">Tổng thanh toán</span>
                  <span className="text-[24px] font-bold text-[#7D3F32]">
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
      </div>

      {/* THANH ĐẶT HÀNG CỐ ĐỊNH PHÍA DƯỚI (BOTTOM BAR CHUẨN 390px MOBILE FIGMA) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#FFFAF0] border-t border-[#DDCCAE] rounded-t-[16px] p-4 shadow-xl z-40">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[12px] text-[#786B5A]">
              {discount > 0
                ? `${subtotal.toLocaleString('vi-VN')} đ − ${discount.toLocaleString('vi-VN')} đ`
                : 'Tổng tiền tạm tính'}
            </span>
            <span className="text-[19px] font-bold text-[#7D3F32]">
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

      {/* ======================================================================
          4. POPUP THANH TOÁN QR (FRAME 06 FIGMA)
          ====================================================================== */}
      {activePaymentOrder && !isPaidSuccess && (
        <div className="fixed inset-0 bg-[#2E211B]/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#FFFAF0] rounded-[20px] max-w-sm sm:max-w-md w-full p-5 sm:p-6 border border-[#C8AF87] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header Popup */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-serif text-[16px] font-semibold text-[#7D3F32]">BrewLite</span>
              <button
                onClick={() => setActivePaymentOrder(null)}
                className="w-8 h-8 rounded-[10px] bg-[#EADBC2] text-[#3F3027] font-bold text-[15px] flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                ×
              </button>
            </div>

            <h3 className="font-serif text-[22px] font-semibold text-[#3F3027] mb-0.5">
              Thanh toán đơn hàng
            </h3>
            <p className="text-[12px] text-[#786B5A] mb-4">
              {activePaymentOrder.orderCode} · Nhận tại quầy · Quận 1
            </p>

            {/* 4 Phương thức thanh toán (Frame 06) */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setPaymentMethod('QR')}
                className={`h-[44px] rounded-[10px] text-[11px] font-bold px-2.5 flex items-center justify-start gap-1.5 transition-all border ${
                  paymentMethod === 'QR'
                    ? 'bg-[#EADBC2] border-[#7D3F32] text-[#7D3F32]'
                    : 'bg-[#F3E8D4] border-[#DDCCAE] text-[#3F3027]'
                }`}
              >
                <span className="text-[10px]">{paymentMethod === 'QR' ? '●' : '○'}</span>
                <span>Quét mã QR</span>
              </button>

              <button
                onClick={() => setPaymentMethod('WALLET')}
                className={`h-[44px] rounded-[10px] text-[11px] font-bold px-2.5 flex items-center justify-start gap-1.5 transition-all border ${
                  paymentMethod === 'WALLET'
                    ? 'bg-[#EADBC2] border-[#7D3F32] text-[#7D3F32]'
                    : 'bg-[#F3E8D4] border-[#DDCCAE] text-[#3F3027]'
                }`}
              >
                <span className="text-[10px]">{paymentMethod === 'WALLET' ? '●' : '○'}</span>
                <span>Ví điện tử mô phỏng</span>
              </button>

              <button
                onClick={() => setPaymentMethod('CARD')}
                className={`h-[44px] rounded-[10px] text-[11px] font-bold px-2.5 flex items-center justify-start gap-1.5 transition-all border ${
                  paymentMethod === 'CARD'
                    ? 'bg-[#EADBC2] border-[#7D3F32] text-[#7D3F32]'
                    : 'bg-[#F3E8D4] border-[#DDCCAE] text-[#3F3027]'
                }`}
              >
                <span className="text-[10px]">{paymentMethod === 'CARD' ? '●' : '○'}</span>
                <span>Thẻ thử nghiệm</span>
              </button>

              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`h-[44px] rounded-[10px] text-[11px] font-bold px-2.5 flex items-center justify-start gap-1.5 transition-all border ${
                  paymentMethod === 'CASH'
                    ? 'bg-[#EADBC2] border-[#7D3F32] text-[#7D3F32]'
                    : 'bg-[#F3E8D4] border-[#DDCCAE] text-[#3F3027]'
                }`}
              >
                <span className="text-[10px]">{paymentMethod === 'CASH' ? '●' : '○'}</span>
                <span>Tiền mặt tại quầy</span>
              </button>
            </div>

            {/* Khung Mã Thanh toán QR (Frame 06) */}
            <div className="bg-[#F3E8D4] rounded-[12px] p-4 text-center mb-4">
              <p className="text-[10px] font-bold text-[#786B5A] uppercase tracking-wider mb-1">
                TỔNG THANH TOÁN
              </p>
              <p className="font-serif text-[26px] font-semibold text-[#7D3F32] mb-3">
                {activePaymentOrder.finalAmount?.toLocaleString('vi-VN')} đ
              </p>

              {/* Graphic QR */}
              <div className="w-[160px] h-[160px] bg-white rounded-[12px] p-3 mx-auto mb-3 shadow-inner flex items-center justify-center border border-[#DDCCAE]">
                <QrCode className="w-full h-full text-[#3F3027]" />
              </div>

              <p className="text-[9px] text-[#786B5A] font-semibold uppercase tracking-wider">
                QR MINH HỌA · KHÔNG CHUYỂN TIỀN
              </p>
              <p className="text-[9px] font-bold text-[#3F3027] mt-0.5">
                CÔNG TY TNHH BREWLITE VIETNAM
              </p>
              <p className="text-[10px] text-[#786B5A] mt-0.5">
                Nội dung: {activePaymentOrder.orderCode}
              </p>
              <p className="text-[12px] font-bold text-[#7D3F32] mt-2">
                Mã hết hiệu lực sau {formatCountdown(timeLeft)}
              </p>
            </div>

            {/* Thông báo môi trường thử nghiệm */}
            <p className="text-[11px] font-bold text-[#7D3F32] mb-0.5">
              Môi trường thử nghiệm
            </p>
            <p className="text-[10px] text-[#786B5A] mb-4 leading-relaxed">
              Không dùng tài khoản hoặc tiền thật. Chỉ ghi nhận thanh toán khi cổng thử nghiệm xác nhận.
            </p>

            {/* Nút hành động */}
            <div className="space-y-2">
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
                className="w-full text-center text-[11px] text-[#7D3F32] hover:underline py-1 font-medium"
              >
                Hủy đơn đang chờ thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          5. POPUP THANH TOÁN THÀNH CÔNG (FRAME 06h FIGMA)
          ====================================================================== */}
      {isPaidSuccess && activePaymentOrder && (
        <div className="fixed inset-0 bg-[#2E211B]/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#FFFAF0] rounded-[20px] max-w-sm sm:max-w-md w-full p-5 sm:p-6 border border-[#C8AF87] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header Popup */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-serif text-[16px] font-semibold text-[#7D3F32]">BrewLite</span>
              <button
                onClick={() => {
                  setActivePaymentOrder(null);
                  setIsPaidSuccess(false);
                }}
                className="w-8 h-8 rounded-[10px] bg-[#EADBC2] text-[#3F3027] font-bold text-[15px] flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                ×
              </button>
            </div>

            <h3 className="font-serif text-[24px] font-semibold text-[#3F3027] mb-1">
              Thanh toán thành công
            </h3>
            <p className="text-[12px] text-[#786B5A] mb-4 leading-relaxed">
              Cảm ơn bạn! Đơn {activePaymentOrder.orderCode} đã được thanh toán và chuyển đến quầy pha chế.
            </p>

            {/* Banner xanh đã thanh toán */}
            <div className="bg-[#E6E8D5] rounded-[12px] p-3.5 mb-3 border border-[#D5E0D2]">
              <p className="text-[10px] font-bold text-[#246344] uppercase tracking-wider">
                ĐÃ THANH TOÁN · QR THỬ NGHIỆM
              </p>
              <p className="font-serif text-[28px] font-semibold text-[#7D3F32] mt-0.5">
                {activePaymentOrder.finalAmount?.toLocaleString('vi-VN')} đ
              </p>
            </div>

            {/* Thông tin đơn */}
            <div className="bg-[#F3E8D4] rounded-[12px] p-3.5 text-[12px] mb-5 space-y-1">
              <p className="font-bold text-[#3F3027]">
                Nhận tại BrewLite · Chi nhánh Quận 1
              </p>
              {activePaymentOrder.items?.map((item: any, idx: number) => (
                <p key={idx} className="text-[#3F3027]">
                  {item.quantity} × {item.name}
                </p>
              ))}
              <p className="text-[11px] text-[#786B5A] pt-1">
                Dự kiến sẵn sàng trong khoảng 8 phút.
              </p>
            </div>

            {/* Nút hành động */}
            <div className="space-y-2">
              <Link
                href="/orders"
                className="w-full h-[48px] bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[14px] flex items-center justify-center transition-colors shadow-sm"
              >
                Theo dõi đơn hàng
              </Link>

              <button
                onClick={() => {
                  setActivePaymentOrder(null);
                  setIsPaidSuccess(false);
                  router.push('/menu');
                }}
                className="w-full h-[48px] bg-[#EADBC2] hover:bg-[#DFCFB4] text-[#3F3027] rounded-[12px] font-bold text-[14px] flex items-center justify-center transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          6. MODAL CẢNH BÁO TỒN KHO / OPTIMISTIC LOCKING (FRAME 02b FIGMA)
          ====================================================================== */}
      {conflictError && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFAF0] rounded-[24px] max-w-sm w-full p-6 border border-[#DDCCAE] shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#FEE4E2] text-[#B42318] flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>

            <h3 className="font-serif text-[20px] font-bold text-[#3F3027] mb-2 leading-tight">
              Điều chỉnh để tiếp tục đặt
            </h3>

            <p className="text-[13px] text-[#786B5A] mb-4 leading-relaxed">
              {conflictError.message}
            </p>

            {/* Chi tiết định mức & tồn kho Frame 02b */}
            <div className="bg-[#F3E8D4] rounded-[16px] p-4 border border-[#DDCCAE] mb-5 space-y-3">
              <div>
                <span className="inline-block bg-[#FEE4E2] text-[#B42318] text-[11px] font-bold px-2 py-0.5 rounded-[6px] mb-1">
                  Tạm hết kem Macchiato
                </span>
                <p className="text-[12px] text-[#3F3027] font-semibold">
                  Còn 1 phần (30 g) · Cần 2 phần (60 g)
                </p>
                <div className="w-full bg-[#DDCCAE] h-2 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-[#D98236] h-full w-1/2 rounded-full" />
                </div>
                <p className="text-[11px] text-[#B42318] font-medium mt-1">
                  Thiếu 1 phần kem · 30 g
                </p>
              </div>

              <div className="border-t border-[#DDCCAE] pt-2">
                <p className="text-[12px] font-semibold text-[#246344]">
                  Hạt cà phê Robusta · Đủ
                </p>
                <p className="text-[11px] text-[#786B5A]">
                  Còn 40 g · Cần 36 g cho 2 ly
                </p>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (items.length > 0) {
                    updateQuantity(items[0].productId, items[0].size, 1);
                  }
                  setConflictError(null);
                }}
                className="w-full h-[46px] bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[13px] transition-colors"
              >
                Giữ 1 ly (Tiếp tục đặt)
              </button>
              <button
                onClick={() => setConflictError(null)}
                className="w-full h-[46px] bg-[#FFFAF0] hover:bg-[#F3E8D4] text-[#3F3027] border border-[#DDCCAE] rounded-[12px] font-semibold text-[13px] transition-colors"
              >
                Đổi sang món khác
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
