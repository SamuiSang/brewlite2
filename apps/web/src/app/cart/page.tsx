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
import { useCartStore, CartItem, cartItemKey, getMaxQuantity } from '../../lib/store';
import VoucherInput from '../../components/VoucherInput';
import ProductCustomizationModal from '../../components/ProductCustomizationModal';
import type { Product } from '../../types/product';
import { UserNav } from '../../components/UserNav';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    appliedVoucher,
    notice,
    storageError,
    clearNotice,
    removeItem,
    updateQuantity,
    setAppliedVoucher,
    clearCart,
    getSubtotal,
    getFinalTotal,
    addItem,
  } = useCartStore();

  const subtotal = getSubtotal();
  const discount = appliedVoucher?.discountAmount || 0;
  const finalTotal = getFinalTotal();

  // Tránh hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    setMounted(true);
  }, []);

  // Bước hiển thị: 'cart' (Frame 03) hoặc 'checkout' (Frame 05)
  const [currentStep, setCurrentStep] = useState<'cart' | 'checkout'>('cart');

  const [quantityError, setQuantityError] = useState('');
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const editOptions = (item: CartItem) => {
    if (!item.product && item.toppings?.length) {
      setQuantityError('Món cũ thiếu dữ liệu topping. Vui lòng chọn lại món từ thực đơn.');
      return;
    }
    // ponytail: legacy cart lacks product snapshot; infer base price only for items without toppings.
    setEditingProduct(item.product || {
      id: item.productId, name: item.name, slug: '', description: null,
      category: item.category as Product['category'], imageUrl: item.imageUrl,
      basePrice: item.unitPrice - ({ S: 0, M: 6000, L: 10000 }[item.size]),
      availableStock: item.availableStock ?? 100, isActive: true, isSoldOut: false,
    });
    setEditingItem(item);
  };
  const changeQuantity = (item: CartItem, quantity: number) => {
    if (quantity === 0 && !window.confirm('Xóa món này khỏi giỏ hàng?')) return;
    try {
      updateQuantity(item.productId, item.size, quantity, cartItemKey(item));
      setQuantityError('');
    } catch (error) {
      setQuantityError(error instanceof Error ? error.message : 'Số lượng không hợp lệ');
    }
  };

  // Input mã giảm giá

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

  // Chuyển hướng sang cổng thanh toán VNPay Sandbox chính thức
  const handleProceedToVNPay = () => {
    if (items.length === 0) return;
    router.push('/checkout');
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
      sugarLevel: '70%',
      iceLevel: '100%',
      toppings: [],
    });
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
  if (items.length === 0) {
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

          {storageError && <p role="alert" className="mb-4 text-sm text-red-800">{storageError}</p>}
          {notice && <div role="status" className="mb-4 text-sm">{notice} <button type="button" onClick={clearNotice} className="min-h-11 underline">Đóng thông báo</button></div>}
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
  if (currentStep === 'checkout') {
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
                    onClick={() => { setDeliveryMethod('PICKUP'); setAppliedVoucher(null); }}
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
                    onClick={() => { setDeliveryMethod('DELIVERY'); setAppliedVoucher(null); }}
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
                    <div key={cartItemKey(item)} className="flex justify-between items-start text-[12px]">
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
                    onClick={handleProceedToVNPay}
                    className="w-full h-[48px] bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[14px] flex items-center justify-center transition-colors shadow-sm"
                  >
                    Tiến hành thanh toán qua VNPay Sandbox
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
              onClick={handleProceedToVNPay}
              className="w-full h-[48px] bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[14px] flex items-center justify-center transition-colors shadow-sm"
            >
              Thanh toán VNPay Sandbox · {finalTotal.toLocaleString('vi-VN')} đ
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
      {editingItem && editingProduct && <ProductCustomizationModal
        product={editingProduct} toppings={editingItem.toppingOptions || []} editingItem={editingItem}
        onClose={() => { setEditingItem(null); setEditingProduct(null); }} />}
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
                key={cartItemKey(item)}
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

                    <button
                      type="button" onClick={() => editOptions(item)}
                      className="inline-block min-h-11 text-[11px] font-semibold text-[#A95619] hover:underline mt-1.5"
                    >
                      Sửa tùy chọn
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-xs text-[#786B5A]">Tối đa {getMaxQuantity(items, item)} ly cho dòng này (theo tồn kho và giới hạn giỏ 100 ly).</p>
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
                          changeQuantity(item, item.quantity - 1)
                        }
                        className="text-[#3F3027] font-bold text-[16px] px-1 hover:opacity-70 transition-opacity"
                        aria-label="Giảm số lượng"
                      >
                        −
                      </button>
                      <input
                        key={`${cartItemKey(item)}-${item.quantity}`}
                        type="number" min={1} max={getMaxQuantity(items, item)} step={1}
                        aria-label={`Số lượng ${item.name}`}
                        defaultValue={item.quantity}
                        onBlur={event => {
                          changeQuantity(item, event.currentTarget.value === '' ? NaN : Number(event.currentTarget.value));
                          event.currentTarget.value = String(useCartStore.getState().items.find(i => cartItemKey(i) === cartItemKey(item))?.quantity ?? item.quantity);
                        }}
                        onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}
                        className="w-12 bg-transparent text-center text-[#3F3027] font-bold text-[13px]"
                      />
                      <button
                        onClick={() =>
                          changeQuantity(item, item.quantity + 1)
                        }
                        className="text-[#3F3027] font-bold text-[16px] px-1 hover:opacity-70 transition-opacity"
                        disabled={item.quantity >= getMaxQuantity(items, item)}
                        title={`Tối đa ${getMaxQuantity(items, item)} ly cho dòng này`}
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>

                    {/* Nút Xóa món */}
                    <button
                      onClick={() => { if (window.confirm('Xóa món này khỏi giỏ hàng?')) removeItem(item.productId, item.size, cartItemKey(item)); }}
                      className="w-[36px] h-[36px] flex items-center justify-center text-[#786B5A] hover:text-[#B42318] transition-colors"
                      title="Xóa món"
                    >
                      <Trash2 className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {storageError && <p role="alert" className="text-sm text-red-800">{storageError}</p>}
            {notice && <div role="status" className="text-sm text-[#7D3F32]">{notice} <button type="button" onClick={clearNotice} className="min-h-11 underline">Đóng thông báo</button></div>}
            {quantityError && <p role="alert" className="text-sm text-red-800">{quantityError}</p>}
            {/* HỘP MÃ ƯU ĐÃI (VOUCHER BOX - Frame 03) */}
            <div className="bg-[#FFFAF0] rounded-[16px] p-4 lg:p-5 border border-[#DDCCAE] shadow-sm">
              <h2 className="text-[16px] font-bold text-[#3F3027] mb-3">
                Ưu đãi cho một ngày vui
              </h2>

              <VoucherInput />
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
                  onClick={handleProceedToVNPay}
                  className="w-full h-[48px] bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[14px] flex items-center justify-center transition-colors shadow-sm"
                >
                  Tiến hành thanh toán VNPay Sandbox
                </button>
              </div>

              <p className="text-[12px] text-[#786B5A] text-center mt-3 leading-relaxed">
                Chuyển thẳng sang cổng thanh toán VNPay Sandbox chính thức.
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
            onClick={handleProceedToVNPay}
            className="w-full h-[48px] bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[14px] flex items-center justify-center transition-colors shadow-sm"
          >
            Thanh toán VNPay Sandbox · {finalTotal.toLocaleString('vi-VN')} đ
          </button>
        </div>
      </div>

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
