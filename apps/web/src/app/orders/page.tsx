'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Check, Clock, QrCode, Store, ChevronRight, RotateCcw } from 'lucide-react';
import { useCartStore } from '../../lib/store';
import { UserNav } from '../../components/UserNav';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('IN_PROGRESS');
  const [viewDetailModal, setViewDetailModal] = useState<boolean>(false);
  const addItem = useCartStore((state) => state.addItem);

  // Món mẫu đơn BL-8924 theo đúng chuẩn Figma 07 & 07b
  const sampleOrder = {
    orderCode: 'BL-8924',
    createdAt: '11/11/2026 · 09:42',
    branch: 'BrewLite · Chi nhánh Quận 1',
    statusText: 'Đang pha chế',
    statusColor: 'bg-[#F5E9D8] text-[#754416]',
    items: [
      {
        name: 'Cà phê Muối Côn Đảo',
        options: 'Vừa · Sữa yến mạch · 50% đường · Thêm Macchiato',
        quantity: 1,
        price: 73000,
        imageUrl: '/images/drinks/ca-phe-muoi-con-dao.jpg',
        productId: 'prod-001',
      },
      {
        name: 'Trà Lài Vải Thiều',
        options: 'Tiêu chuẩn · 70% đường · 100% đá',
        quantity: 1,
        price: 42000,
        imageUrl: '/images/drinks/tra-lai-vai-thieu.jpg',
        productId: 'prod-002',
      },
    ],
    voucherCode: 'BANMOI10',
    discountAmount: 20000,
    packingFee: 0,
    totalPaid: 95000,
    estimatedMinutes: 8,
  };

  const handleReorder = () => {
    sampleOrder.items.forEach((item) => {
      addItem({
        productId: item.productId,
        name: item.name,
        category: 'COFFEE',
        imageUrl: item.imageUrl,
        size: 'M',
        unitPrice: item.price,
        quantity: item.quantity,
        optionsDesc: item.options,
      });
    });
  };

  return (
    <main className="min-h-screen bg-[#F3E8D4] text-[#3F3027] pb-24">
      {/* Top Header */}
      <header className="px-5 sm:px-12 lg:px-20 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <Link href="/menu" className="font-serif text-[24px] lg:text-[30px] font-bold text-[#7D3F32] tracking-tight">
            BrewLite
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-[14px] text-[#786B5A] font-medium">
            <Link href="/menu" className="hover:text-[#7D3F32] transition-colors">Thực đơn</Link>
            <Link href="/orders" className="font-semibold text-[#7D3F32]">Đơn hàng</Link>
            <Link href="/profile?tab=vouchers" className="hover:text-[#7D3F32] transition-colors">Ưu đãi</Link>
            <Link href="/profile" className="hover:text-[#7D3F32] transition-colors">Tài khoản</Link>
            <UserNav />
          </nav>
        </div>

        {/* Tiêu đề trang Lịch sử đơn hàng (Frame 07b) */}
        <div className="mt-6">
          <h1 className="font-serif text-[26px] lg:text-[36px] font-semibold text-[#3F3027]">
            Lịch sử đơn hàng
          </h1>
          <p className="text-[13px] text-[#786B5A] mt-0.5">
            Mỗi lần ghé lại, một gu quen.
          </p>
        </div>

        {/* Bộ lọc trạng thái đơn (Frame 07b) */}
        <div className="flex gap-2 sm:gap-3 mt-5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('IN_PROGRESS')}
            className={`h-[40px] px-5 sm:px-7 rounded-[12px] text-[11px] sm:text-[13px] font-semibold transition-all whitespace-nowrap ${
              activeTab === 'IN_PROGRESS'
                ? 'bg-[#7D3F32] text-[#FFFAF0] shadow-sm'
                : 'bg-[#FFFAF0] text-[#786B5A] hover:text-[#3F3027]'
            }`}
          >
            Đang thực hiện
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`h-[40px] px-5 sm:px-7 rounded-[12px] text-[11px] sm:text-[13px] font-semibold transition-all whitespace-nowrap ${
              activeTab === 'COMPLETED'
                ? 'bg-[#7D3F32] text-[#FFFAF0] shadow-sm'
                : 'bg-[#FFFAF0] text-[#786B5A] hover:text-[#3F3027]'
            }`}
          >
            Đã hoàn thành
          </button>
          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`h-[40px] px-5 sm:px-7 rounded-[12px] text-[11px] sm:text-[13px] font-semibold transition-all whitespace-nowrap ${
              activeTab === 'CANCELLED'
                ? 'bg-[#7D3F32] text-[#FFFAF0] shadow-sm'
                : 'bg-[#FFFAF0] text-[#786B5A] hover:text-[#3F3027]'
            }`}
          >
            Đã hủy
          </button>
        </div>
      </header>

      {/* Nội dung danh sách đơn */}
      <div className="px-5 sm:px-12 lg:px-20 mt-4 sm:mt-6 max-w-6xl">
        <p className="text-[12px] font-medium text-[#786B5A] mb-3">
          {activeTab === 'IN_PROGRESS' ? '1 đơn hàng' : '0 đơn hàng'}
        </p>

        {activeTab === 'IN_PROGRESS' ? (
          <div className="bg-[#FFFAF0] border border-[#DDCCAE] rounded-[16px] sm:rounded-[20px] p-4 sm:p-7 shadow-sm">
            {/* Header thẻ đơn: Mã + Ngày + Trạng thái */}
            <div className="flex justify-between items-start mb-1">
              <div>
                <h2 className="text-[20px] sm:text-[24px] font-bold text-[#3F3027]">
                  {sampleOrder.orderCode}
                </h2>
                <p className="text-[11px] sm:text-[13px] text-[#786B5A]">
                  {sampleOrder.createdAt}
                </p>
              </div>

              {/* Huy hiệu trạng thái */}
              <div className="bg-[#F5E9D8] px-3.5 py-1.5 rounded-full text-[10px] sm:text-[12px] font-semibold text-[#754416]">
                {sampleOrder.statusText}
              </div>
            </div>

            <p className="text-[11px] sm:text-[14px] font-bold text-[#3F3027] mt-3 mb-5">
              {sampleOrder.branch}
            </p>

            {/* DANH SÁCH MÓN: HÌNH SẢN PHẨM NẰM KẾ BÊN TÊN MÓN THEO GÓP Ý FIGMA MỚI */}
            <div className="space-y-4 border-t border-b border-[#F3E8D4] py-4">
              {sampleOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 sm:gap-5">
                  {/* Thumbnail kèm badge x1 ở góc dưới phải */}
                  <div className="relative w-[76px] h-[88px] sm:w-[96px] sm:h-[96px] rounded-[12px] sm:rounded-[14px] overflow-hidden bg-[#F3E8D4] flex-shrink-0 shadow-inner">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-[#FFFAF0] rounded-[4px] px-1.5 py-0.5 shadow-sm">
                      <span className="text-[10px] font-bold text-[#3F3027]">
                        x{item.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Thông tin món nằm kế bên hình ảnh */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-[13px] sm:text-[18px] font-bold text-[#3F3027] leading-snug">
                        {item.quantity} × {item.name}
                      </h3>
                      <span className="text-[14px] sm:text-[20px] font-bold text-[#7D3F32] ml-2 flex-shrink-0">
                        {item.price.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <p className="text-[10px] sm:text-[13px] text-[#786B5A] mt-1 leading-relaxed">
                      {item.options}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Thông tin thanh toán & thời gian */}
            <div className="mt-4 space-y-1 text-[10px] sm:text-[12px]">
              <p className="text-[#786B5A]">
                {sampleOrder.voucherCode}: −{sampleOrder.discountAmount.toLocaleString('vi-VN')} đ · Đóng gói: 0 đ
              </p>
              <p className="font-semibold text-[#246344]">
                Đã thanh toán · QR thử nghiệm
              </p>
              <p className="text-[#786B5A]">
                Dự kiến sẵn sàng trong khoảng {sampleOrder.estimatedMinutes} phút.
              </p>

              <div className="pt-2 flex justify-between items-baseline">
                <span className="text-[11px] sm:text-[12px] text-[#786B5A]">Tổng đã thanh toán</span>
                <span className="text-[20px] sm:text-[28px] font-bold text-[#7D3F32]">
                  {sampleOrder.totalPaid.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* 2 Nút hành động chuẩn Figma 07b */}
            <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => setViewDetailModal(true)}
                className="h-[44px] sm:h-[48px] px-6 bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[13px] sm:text-[14px] transition-colors flex items-center justify-center shadow-sm"
              >
                Xem chi tiết đơn
              </button>
              <Link
                href="/cart"
                onClick={handleReorder}
                className="h-[44px] sm:h-[48px] px-6 bg-[#EADBC2] hover:bg-[#DFCFB4] text-[#3F3027] rounded-[12px] font-bold text-[13px] sm:text-[14px] transition-colors flex items-center justify-center"
              >
                Đặt lại đơn này
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#FFFAF0] rounded-[20px] p-10 border border-[#DDCCAE] text-center">
            <p className="text-[14px] text-[#786B5A]">
              Không có đơn hàng nào trong mục này.
            </p>
          </div>
        )}
      </div>

      {/* ======================================================================
          MODAL CHI TIẾT THEO DÕI ĐƠN HÀNG (FRAME 07 FIGMA)
          ====================================================================== */}
      {viewDetailModal && (
        <div className="fixed inset-0 bg-[#2E211B]/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#FFFAF0] rounded-[20px] max-w-md w-full p-5 sm:p-6 border border-[#C8AF87] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="font-serif text-[16px] font-semibold text-[#7D3F32]">BrewLite</span>
              <button
                onClick={() => setViewDetailModal(false)}
                className="w-8 h-8 rounded-[10px] bg-[#EADBC2] text-[#3F3027] font-bold text-[15px] flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                ×
              </button>
            </div>

            <h3 className="font-serif text-[24px] font-semibold text-[#3F3027] mb-0.5">
              Đặt đơn thành công!
            </h3>
            <p className="text-[13px] font-semibold text-[#246344] mb-4">
              BL-8924 · Đã thanh toán 95.000 đ
            </p>

            {/* Mã nhận món tại quầy (Frame 07) */}
            <div className="bg-[#F3E8D4] rounded-[16px] p-4 text-center mb-4 border border-[#DDCCAE]">
              <p className="text-[12px] font-bold text-[#3F3027] mb-2">
                Mã nhận món tại quầy
              </p>
              <div className="w-[140px] h-[140px] bg-white rounded-[12px] p-2.5 mx-auto mb-2 shadow-inner flex items-center justify-center">
                <QrCode className="w-full h-full text-[#3F3027]" />
              </div>
              <p className="text-[18px] font-bold text-[#3F3027]">
                BL-8924
              </p>
              <p className="text-[10px] text-[#786B5A] mt-0.5">
                Đưa mã này cho nhân viên tại quầy.
              </p>
            </div>

            {/* Tiến trình 4 bước pha chế (Frame 07) */}
            <div className="bg-[#F3E8D4] rounded-[16px] p-4 mb-4 border border-[#DDCCAE] space-y-3">
              <p className="text-[13px] font-bold text-[#3F3027] mb-2">
                Món ngon đang được chuẩn bị
              </p>

              {/* Bước 1: Đã tiếp nhận */}
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#7D3F32] text-[#FFFAF0] flex items-center justify-center text-[11px] font-bold">
                  ✓
                </div>
                <span className="text-[12px] font-medium text-[#3F3027]">Đã tiếp nhận đơn</span>
              </div>

              {/* Bước 2: Đang pha chế (Active) */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#A8763F] text-[#3F3027] flex items-center justify-center text-[11px] font-bold">
                  2
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#3F3027]">Nhân viên đang pha chế</p>
                  <p className="text-[11px] text-[#A95619]">Dự kiến còn khoảng 8 phút</p>
                </div>
              </div>

              {/* Bước 3: Sẵn sàng nhận */}
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#EADBC2] text-[#786B5A] flex items-center justify-center text-[11px] font-bold">
                  3
                </div>
                <span className="text-[12px] font-medium text-[#786B5A]">Sẵn sàng nhận tại quầy</span>
              </div>

              {/* Bước 4: Hoàn thành */}
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#EADBC2] text-[#786B5A] flex items-center justify-center text-[11px] font-bold">
                  4
                </div>
                <span className="text-[12px] font-medium text-[#786B5A]">Đã hoàn thành</span>
              </div>
            </div>

            <button
              onClick={() => setViewDetailModal(false)}
              className="w-full h-[46px] bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[13px] transition-colors"
            >
              Đóng chi tiết
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

