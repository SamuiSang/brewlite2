'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Check,
  Clock,
  QrCode,
  Store,
  ChevronRight,
  RotateCcw,
  ShoppingCart,
  FileText,
  MapPin,
  X,
  AlertCircle,
  Sparkles,
  Coffee,
  CheckCircle2,
} from 'lucide-react';
import { useCartStore } from '../../lib/store';
import { UserNav } from '../../components/UserNav';

/**
 * Định nghĩa cấu trúc từng món trong đơn hàng
 */
interface OrderItem {
  productId: string;
  name: string;
  options: string;
  priceBreakdown: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

/**
 * Định nghĩa cấu trúc đơn hàng chuẩn hệ thống BrewLite 2
 */
interface OrderData {
  orderCode: string;
  createdAt: string;
  status: 'READY' | 'PREPARING' | 'COMPLETED' | 'CANCELLED';
  statusText: string;
  statusBadgeClass: string;
  branch: string;
  address: string;
  customerName: string;
  items: OrderItem[];
  voucherCode?: string;
  discountAmount: number;
  packingFee: number;
  subtotal: number;
  totalPaid: number;
  paymentMethodText: string;
  queueNumber?: number; // Ví dụ: SỐ 12 cho đơn Sẵn sàng nhận (Frame 07d)
  estimatedMinutes?: number;
  cancelReason?: string;
  note?: string;
}

/**
 * Danh sách dữ liệu đơn hàng mẫu chuẩn 100% bản vẽ Figma Cloud BrewLite 2:
 * - Frame 07: Theo dõi tiến trình pha chế (BL-8924)
 * - Frame 07b: Lịch sử đơn hàng đầy đủ 3 trạng thái (Đang thực hiện, Đã hoàn thành, Đã hủy)
 * - Frame 07c: Phiếu biên nhận điện tử chuẩn form hóa đơn
 * - Frame 07d: Sẵn sàng nhận món tại quầy với SỐ 12 và mã QR nhận món (BL-8925)
 */
const MOCK_ORDERS: OrderData[] = [
  // 1. ĐƠN SẴN SÀNG NHẬN MÓN (Frame 07d - Số thứ tự 12)
  {
    orderCode: 'BL-8925',
    createdAt: 'Hôm nay · 11/11/2026 · 10:05',
    status: 'READY',
    statusText: 'Sẵn sàng nhận',
    statusBadgeClass: 'bg-[#E7F0E9] text-[#246344] border-[#A7CEB5]',
    branch: 'BrewLite · Chi nhánh Quận 1',
    address: '123 Đường Cà Phê, Phường Bến Nghé, Quận 1',
    customerName: 'Nguyễn Duy',
    queueNumber: 12,
    items: [
      {
        productId: 'prod-001',
        name: 'Cà phê Muối Côn Đảo',
        options: 'Vừa · Sữa tươi · 50% đường · Thêm Macchiato',
        priceBreakdown: '45.000 đ + cỡ vừa 6.000 đ + sữa yến mạch 10.000 đ + kem béo Macchiato 12.000 đ',
        quantity: 1,
        price: 73000,
        imageUrl: '/images/drinks/ca-phe-muoi-con-dao.jpg',
      },
    ],
    voucherCode: 'BANMOI10',
    discountAmount: 20000,
    packingFee: 0,
    subtotal: 73000,
    totalPaid: 53000,
    paymentMethodText: 'Đã thanh toán · Ví điện tử',
    estimatedMinutes: 0,
    note: 'Đồ uống của bạn đã sẵn sàng tại quầy pha chế Quận 1. Mời bạn đến nhận món!',
  },

  // 2. ĐƠN ĐANG PHA CHẾ (Frame 07 & Frame 07b - BL-8924)
  {
    orderCode: 'BL-8924',
    createdAt: '11/11/2026 · 09:42',
    status: 'PREPARING',
    statusText: 'Đang pha chế',
    statusBadgeClass: 'bg-[#F5E9D8] text-[#754416] border-[#DDCCAE]',
    branch: 'BrewLite · Chi nhánh Quận 1',
    address: '123 Đường Cà Phê, Phường Bến Nghé, Quận 1',
    customerName: 'Nguyễn Duy',
    items: [
      {
        productId: 'prod-001',
        name: 'Cà phê Muối Côn Đảo',
        options: 'Vừa · Sữa yến mạch · 50% đường · Thêm Macchiato',
        priceBreakdown: '45.000 đ + cỡ vừa 6.000 đ + sữa yến mạch 10.000 đ + kem béo Macchiato 12.000 đ',
        quantity: 1,
        price: 73000,
        imageUrl: '/images/drinks/ca-phe-muoi-con-dao.jpg',
      },
      {
        productId: 'prod-002',
        name: 'Trà Lài Vải Thiều',
        options: 'Tiêu chuẩn · 70% đường · 100% đá',
        priceBreakdown: '42.000 đ (Tiêu chuẩn · 70% đường · 100% đá)',
        quantity: 1,
        price: 42000,
        imageUrl: '/images/drinks/tra-lai-vai-thieu.jpg',
      },
    ],
    voucherCode: 'BANMOI10',
    discountAmount: 20000,
    packingFee: 0,
    subtotal: 115000,
    totalPaid: 95000,
    paymentMethodText: 'Đã thanh toán · QR thử nghiệm',
    estimatedMinutes: 8,
    note: 'Dự kiến sẵn sàng trong khoảng 8 phút.',
  },

  // 3. ĐƠN ĐÃ HOÀN THÀNH (Frame 7:755 Desktop & Frame 7:793 Di động - BL-8810)
  {
    orderCode: 'BL-8810',
    createdAt: 'Hôm qua · 10/11/2026 · 08:10',
    status: 'COMPLETED',
    statusText: 'Đã nhận tại quầy',
    statusBadgeClass: 'bg-[#E7F0E9] text-[#246344] border-[#A7CEB5]',
    branch: 'BrewLite · Chi nhánh Quận 1',
    address: '123 Đường Cà Phê, Phường Bến Nghé, Quận 1',
    customerName: 'Nguyễn Duy',
    items: [
      {
        productId: 'prod-001',
        name: 'Cà phê Muối Côn Đảo',
        options: 'Tiêu chuẩn · Sữa tươi · Không topping',
        priceBreakdown: '45.000 đ (Tiêu chuẩn · Sữa tươi · Không topping)',
        quantity: 1,
        price: 45000,
        imageUrl: '/images/drinks/ca-phe-muoi-con-dao.jpg',
      },
    ],
    discountAmount: 0,
    packingFee: 0,
    subtotal: 45000,
    totalPaid: 45000,
    paymentMethodText: 'Đã thanh toán · QR thử nghiệm',
    note: 'Cảm ơn bạn đã ghé BrewLite. Chúc bạn một ngày ngập tràn cảm hứng!',
  },

  // 4. ĐƠN ĐÃ GIAO TẬN NƠI THÀNH CÔNG (BL-8790)
  {
    orderCode: 'BL-8790',
    createdAt: '08/11/2026 · 15:30',
    status: 'COMPLETED',
    statusText: 'Đã giao thành công',
    statusBadgeClass: 'bg-[#E7F0E9] text-[#246344] border-[#A7CEB5]',
    branch: 'BrewLite · Giao tận nơi (45 Lê Duẩn, Quận 1)',
    address: '45 Đường Lê Duẩn, Phường Bến Nghé, Quận 1',
    customerName: 'Nguyễn Duy',
    items: [
      {
        productId: 'prod-005',
        name: 'Cà phê Ủ Lạnh Cam Vàng',
        options: 'Lớn · 50% đường · 50% đá',
        priceBreakdown: '49.000 đ + cỡ lớn 6.000 đ = 55.000 đ',
        quantity: 1,
        price: 55000,
        imageUrl: '/images/drinks/ca-phe-u-lanh-cam-vang.jpg',
      },
      {
        productId: 'prod-004',
        name: 'Bánh Sừng Bò Bơ',
        options: 'Nướng nóng giòn tại quầy',
        priceBreakdown: '32.000 đ',
        quantity: 1,
        price: 32000,
        imageUrl: '/images/drinks/banh-sung-bo-bo.jpg',
      },
    ],
    discountAmount: 0,
    packingFee: 0,
    subtotal: 87000,
    totalPaid: 87000,
    paymentMethodText: 'Đã thanh toán · Thẻ thử nghiệm',
    note: 'Đơn hàng giao tận nơi đã hoàn tất. Cảm ơn quý khách!',
  },

  // 5. ĐƠN ĐÃ HỦY DO HẾT THỜI GIAN THANH TOÁN (Frame 7:832 Desktop & Frame 7:870 Di động - BL-8820)
  {
    orderCode: 'BL-8820',
    createdAt: '07/11/2026 · 14:23',
    status: 'CANCELLED',
    statusText: 'Đã hủy',
    statusBadgeClass: 'bg-[#FBEAE8] text-[#8F3B2C] border-[#F2C0B8]',
    branch: 'BrewLite · Chi nhánh Quận 1',
    address: '123 Đường Cà Phê, Phường Bến Nghé, Quận 1',
    customerName: 'Nguyễn Duy',
    items: [
      {
        productId: 'prod-001',
        name: 'Cà phê Muối Côn Đảo',
        options: 'Tiêu chuẩn · Sữa tươi · Không topping',
        priceBreakdown: '45.000 đ (Tiêu chuẩn · Sữa tươi · Không topping)',
        quantity: 1,
        price: 45000,
        imageUrl: '/images/drinks/ca-phe-muoi-con-dao.jpg',
      },
    ],
    discountAmount: 0,
    packingFee: 0,
    subtotal: 45000,
    totalPaid: 45000,
    paymentMethodText: 'Chưa thanh toán',
    cancelReason: 'Hết thời hạn thanh toán 7 phút. Nguyên liệu giữ chỗ đã được hoàn trả lại quầy.',
    note: 'Không phát sinh giao dịch thu tiền.',
  },

  // 6. ĐƠN ĐÃ HỦY DO KHÁCH HÀNG CHỦ ĐỘNG ĐỔI MÓN (BL-8815)
  {
    orderCode: 'BL-8815',
    createdAt: '05/11/2026 · 11:15',
    status: 'CANCELLED',
    statusText: 'Đã hủy',
    statusBadgeClass: 'bg-[#FBEAE8] text-[#8F3B2C] border-[#F2C0B8]',
    branch: 'BrewLite · Chi nhánh Quận 1',
    address: '123 Đường Cà Phê, Phường Bến Nghé, Quận 1',
    customerName: 'Nguyễn Duy',
    items: [
      {
        productId: 'prod-002',
        name: 'Trà Lài Vải Thiều',
        options: 'Tiêu chuẩn · 70% đường · 100% đá',
        priceBreakdown: '42.000 đ',
        quantity: 1,
        price: 42000,
        imageUrl: '/images/drinks/tra-lai-vai-thieu.jpg',
      },
    ],
    discountAmount: 0,
    packingFee: 0,
    subtotal: 42000,
    totalPaid: 42000,
    paymentMethodText: 'Chưa thanh toán',
    cancelReason: 'Khách hàng chủ động hủy đơn trước khi thanh toán để đổi món.',
    note: 'Không phát sinh giao dịch thu tiền.',
  },
];

/**
 * Trang Lịch sử & Theo dõi Đơn hàng BrewLite 2 (Orders Flow).
 * Khớp 100% bản vẽ Figma Cloud BrewLite 2:
 * - Frame 07: Theo dõi đơn hàng (Tiến trình 4 bước pha chế)
 * - Frame 07b: Lịch sử đơn hàng (Đang thực hiện, Đã hoàn thành, Đã hủy)
 * - Frame 07c: Phiếu biên nhận điện tử BL-8924 chuẩn Desktop & Mobile
 * - Frame 07d: Sẵn sàng nhận món với SỐ 12 và QR nhận món
 */
export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('IN_PROGRESS');
  const [viewDetailModal, setViewDetailModal] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'RECEIPT' | 'TRACKING' | 'READY_PICKUP' | 'CANCEL_INFO'>('RECEIPT');
  const [selectedOrder, setSelectedOrder] = useState<OrderData>(MOCK_ORDERS[0]);

  const addItem = useCartStore((state) => state.addItem);
  const totalCartItems = useCartStore((state) => state.getTotalItems());

  // Lọc danh sách đơn hàng theo Tab đang chọn
  const filteredOrders = MOCK_ORDERS.filter((order) => {
    if (activeTab === 'IN_PROGRESS') {
      return order.status === 'READY' || order.status === 'PREPARING';
    }
    if (activeTab === 'COMPLETED') {
      return order.status === 'COMPLETED';
    }
    if (activeTab === 'CANCELLED') {
      return order.status === 'CANCELLED';
    }
    return false;
  });

  // Đặt lại các món trong đơn hàng vào giỏ
  const handleReorder = (order: OrderData) => {
    order.items.forEach((item) => {
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

  // Mở modal theo từng mục đích (Biên nhận / Tiến trình / Mã nhận món)
  const openOrderModal = (order: OrderData, initialTab: 'RECEIPT' | 'TRACKING' | 'READY_PICKUP' | 'CANCEL_INFO') => {
    setSelectedOrder(order);
    setModalTab(initialTab);
    setViewDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F3E8D4] text-[#3F3027] flex flex-col justify-between">
      <div>
        {/* Top Header đồng bộ với Thực đơn */}
        <header className="w-full bg-[#F3E8D4] py-3.5 sm:py-4 px-4 sm:px-10 lg:px-14 border-b border-[#E8D7B8]/60">
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
              <Link href="/orders" className="text-[#7D3F32] font-bold border-b-2 border-[#7D3F32] pb-0.5">
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
                className="relative p-2 text-[#3F3027] hover:text-[#7D3F32] transition-colors flex items-center justify-center rounded-full hover:bg-[#E8D7B8]/40"
                aria-label="Xem giỏ hàng"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] min-w-[18px] min-h-[18px] rounded-full bg-[#7D3F32] text-[#FFFAF0] text-[10px] font-bold flex items-center justify-center leading-none shadow-xs select-none">
                  {totalCartItems}
                </span>
              </Link>

              <UserNav />
            </div>
          </div>
        </header>

        {/* Nội dung trang Đơn hàng */}
        <main className="max-w-[1360px] mx-auto px-4 sm:px-10 lg:px-14 pb-12">
          {/* Tiêu đề trang Lịch sử đơn hàng (Frame 07b) */}
          <div className="mt-4 sm:mt-6">
            <h1 className="font-serif text-[26px] lg:text-[36px] font-bold text-[#3F3027]">
              Lịch sử đơn hàng
            </h1>
            <p className="text-[13px] text-[#786B5A] mt-0.5">
              Mỗi lần ghé lại, một gu quen.
            </p>
          </div>

          {/* Bộ lọc trạng thái đơn (Frame 07b chuẩn Figma) */}
          <div className="flex gap-2 sm:gap-3 mt-5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('IN_PROGRESS')}
              className={`h-[40px] px-4 sm:px-7 rounded-[12px] text-[12px] sm:text-[13px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'IN_PROGRESS'
                  ? 'bg-[#7D3F32] text-[#FFFAF0] shadow-sm'
                  : 'bg-[#FFFAF0] text-[#786B5A] hover:text-[#3F3027] border border-[#DDCCAE]'
              }`}
            >
              <span>Đang thực hiện</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'IN_PROGRESS' ? 'bg-[#914C3E] text-white' : 'bg-[#EADBC2] text-[#754416]'
              }`}>
                2
              </span>
            </button>
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`h-[40px] px-4 sm:px-7 rounded-[12px] text-[12px] sm:text-[13px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'COMPLETED'
                  ? 'bg-[#7D3F32] text-[#FFFAF0] shadow-sm'
                  : 'bg-[#FFFAF0] text-[#786B5A] hover:text-[#3F3027] border border-[#DDCCAE]'
              }`}
            >
              <span>Đã hoàn thành</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'COMPLETED' ? 'bg-[#914C3E] text-white' : 'bg-[#EADBC2] text-[#754416]'
              }`}>
                2
              </span>
            </button>
            <button
              onClick={() => setActiveTab('CANCELLED')}
              className={`h-[40px] px-4 sm:px-7 rounded-[12px] text-[12px] sm:text-[13px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'CANCELLED'
                  ? 'bg-[#7D3F32] text-[#FFFAF0] shadow-sm'
                  : 'bg-[#FFFAF0] text-[#786B5A] hover:text-[#3F3027] border border-[#DDCCAE]'
              }`}
            >
              <span>Đã hủy</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'CANCELLED' ? 'bg-[#914C3E] text-white' : 'bg-[#EADBC2] text-[#754416]'
              }`}>
                2
              </span>
            </button>
          </div>

          {/* Danh sách thẻ đơn */}
          <div className="mt-5 max-w-5xl space-y-5">
            <p className="text-[12px] font-medium text-[#786B5A] mb-1">
              {filteredOrders.length} đơn hàng
            </p>

            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const isReady = order.status === 'READY';
                const isPreparing = order.status === 'PREPARING';
                const isCompleted = order.status === 'COMPLETED';
                const isCancelled = order.status === 'CANCELLED';

                return (
                  <div
                    key={order.orderCode}
                    className={`bg-[#FFFAF0] border rounded-[20px] p-4 sm:p-7 shadow-xs transition-all ${
                      isReady ? 'border-[#A7CEB5] ring-2 ring-[#246344]/15' : 'border-[#DDCCAE]'
                    }`}
                  >
                    {/* Header thẻ đơn: Mã + Ngày + Trạng thái */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-serif text-[20px] sm:text-[26px] font-bold text-[#3F3027]">
                            {order.orderCode}
                          </h2>
                          {isReady && (
                            <span className="bg-[#E7F0E9] text-[#246344] text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-md border border-[#A7CEB5]">
                              SỐ {order.queueNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-[12px] text-[#786B5A]">
                          {order.createdAt}
                        </p>
                      </div>

                      {/* Huy hiệu trạng thái */}
                      <div className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-[12px] font-bold border ${order.statusBadgeClass}`}>
                        {order.statusText}
                      </div>
                    </div>

                    <p className="text-[12px] sm:text-[14px] font-bold text-[#3F3027] mb-3 sm:mb-4">
                      {order.branch}
                    </p>

                    {/* BANNER NỔI BẬT NẾU ĐƠN SẴN SÀNG NHẬN MÓN (FRAME 07d) */}
                    {isReady && (
                      <div className="mb-4 bg-[#E7F0E9] border border-[#A7CEB5] rounded-[14px] p-3.5 sm:p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#246344] text-[#FFFAF0] flex items-center justify-center font-bold text-[18px] sm:text-[20px] shrink-0 font-serif">
                            12
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wider font-extrabold text-[#246344]">
                              ĐỒ UỐNG ĐÃ SẴN SÀNG · SỐ 12
                            </p>
                            <p className="text-[12px] sm:text-[13px] text-[#3F3027] font-medium leading-snug">
                              Mời bạn đến quầy pha chế Quận 1 để nhận món nhé.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => openOrderModal(order, 'READY_PICKUP')}
                          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#246344] text-[#FFFAF0] rounded-[10px] text-[12px] font-bold hover:bg-[#1D5137] transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Mã nhận món</span>
                        </button>
                      </div>
                    )}

                    {/* DANH SÁCH MÓN: HÌNH SẢN PHẨM 76x88 (MOBILE) / 96x96 (DESKTOP) KẾ BÊN TÊN MÓN CHUẨN FIGMA 07b */}
                    <div className="space-y-3.5 sm:space-y-4 border-t border-b border-[#F3E8D4] py-3.5 sm:py-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 sm:gap-5">
                          {/* Thumbnail kèm badge x1 ở góc dưới phải */}
                          <div className="relative w-[76px] h-[86px] sm:w-[96px] sm:h-[96px] rounded-[14px] overflow-hidden bg-[#F3E8D4] shrink-0 shadow-inner">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute bottom-1 right-1 bg-[#FFFAF0] rounded-[4px] px-1.5 py-0.5 shadow-xs border border-[#DDCCAE]">
                              <span className="text-[10px] font-bold text-[#3F3027]">
                                x{item.quantity}
                              </span>
                            </div>
                          </div>

                          {/* Thông tin món nằm kế bên hình ảnh */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h3 className="font-serif text-[15px] sm:text-[19px] font-bold text-[#3F3027] leading-snug">
                                {item.quantity} × {item.name}
                              </h3>
                              <span className="font-serif text-[14px] sm:text-[20px] font-bold text-[#7D3F32] ml-2 shrink-0">
                                {item.price.toLocaleString('vi-VN')} đ
                              </span>
                            </div>

                            <p className="text-[11px] sm:text-[12px] text-[#786B5A] mt-1 leading-relaxed">
                              {item.options}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Thông tin thanh toán, voucher & trạng thái thời gian */}
                    <div className="mt-3.5 sm:mt-4 space-y-1 text-[11px] sm:text-[12px]">
                      {order.voucherCode && (
                        <p className="text-[#786B5A]">
                          {order.voucherCode}: −{order.discountAmount.toLocaleString('vi-VN')} đ · Đóng gói: 0 đ
                        </p>
                      )}

                      <p className={`font-semibold ${isCancelled ? 'text-[#8F3B2C]' : 'text-[#246344]'}`}>
                        {order.paymentMethodText}
                      </p>

                      {order.note && (
                        <p className={`leading-relaxed ${isCancelled ? 'text-[#8F3B2C]' : 'text-[#786B5A]'}`}>
                          {order.note}
                        </p>
                      )}

                      {isCancelled && order.cancelReason && (
                        <p className="text-[#8F3B2C] bg-[#FBEAE8] p-2.5 rounded-[10px] border border-[#F2C0B8] mt-1 font-medium">
                          Lý do hủy: {order.cancelReason}
                        </p>
                      )}
                    </div>

                    {/* Hàng tổng thanh toán & Nút hành động chuẩn Figma 07b */}
                    <div className="mt-4 pt-4 border-t border-[#F3E8D4] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                      {/* Cụm nút hành động bên trái */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
                        {isReady && (
                          <button
                            onClick={() => openOrderModal(order, 'READY_PICKUP')}
                            className="h-[42px] sm:h-[46px] px-4 sm:px-5 bg-[#246344] hover:bg-[#1D5137] text-[#FFFAF0] rounded-[12px] font-bold text-[13px] sm:text-[14px] transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>Mã nhận món (Số 12)</span>
                          </button>
                        )}

                        {isPreparing && (
                          <button
                            onClick={() => openOrderModal(order, 'TRACKING')}
                            className="h-[42px] sm:h-[46px] px-4 sm:px-5 bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[13px] sm:text-[14px] transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Xem tiến trình pha chế</span>
                          </button>
                        )}

                        <button
                          onClick={() => openOrderModal(order, 'RECEIPT')}
                          className={`h-[42px] sm:h-[46px] px-4 sm:px-5 rounded-[12px] font-bold text-[13px] sm:text-[14px] transition-colors flex items-center justify-center gap-2 shadow-xs ${
                            isReady || isPreparing
                              ? 'bg-[#EADBC2] hover:bg-[#DFCFB4] text-[#3F3027] border border-[#DDCCAE]'
                              : 'bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0]'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          <span>Xem chi tiết đơn</span>
                        </button>
                      </div>

                      {/* Cột tổng tiền và nút đặt lại bên phải chuẩn Figma 07b */}
                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        <div className="flex sm:flex-col justify-between sm:items-end items-baseline">
                          <span className="text-[11px] sm:text-[12px] text-[#786B5A]">
                            {isCancelled ? 'Giá trị đơn chưa thanh toán' : 'Tổng đã thanh toán'}
                          </span>
                          <span className="font-serif text-[22px] sm:text-[28px] font-bold text-[#7D3F32]">
                            {order.totalPaid.toLocaleString('vi-VN')} đ
                          </span>
                        </div>

                        <Link
                          href="/cart"
                          onClick={() => handleReorder(order)}
                          className="h-[42px] sm:h-[46px] px-5 bg-[#EADBC2] hover:bg-[#DFCFB4] text-[#3F3027] rounded-[12px] font-bold text-[13px] sm:text-[14px] transition-colors flex items-center justify-center gap-2 border border-[#DDCCAE]"
                        >
                          <RotateCcw className="w-4 h-4 text-[#7D3F32]" />
                          <span>{isCancelled ? 'Đặt lại món này' : 'Đặt lại đơn này'}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-[#FFFAF0] rounded-[20px] p-8 sm:p-12 border border-[#DDCCAE] text-center">
                <Coffee className="w-10 h-10 text-[#7D3F32] mx-auto mb-3 stroke-[1.5]" />
                <p className="text-[14px] font-medium text-[#786B5A]">
                  Không có đơn hàng nào trong mục này.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ======================================================================
          MODAL CHI TIẾT ĐƠN HÀNG ĐA NĂNG (FRAME 07, FRAME 07c & FRAME 07d FIGMA)
          Thiết kế chuẩn Bottom Sheet trên Di động (390x844) và Popup trên Máy tính (1440x1024)
          ====================================================================== */}
      {viewDetailModal && (
        <div className="fixed inset-0 bg-[#2E211B]/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
          <div className="bg-[#FFFAF0] rounded-t-[24px] sm:rounded-[24px] max-w-lg w-full p-5 sm:p-7 border border-[#C8AF87] shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-none sm:fade-in sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Tay nắm biên nhận (Drag Handle) chuẩn Frame 07c Di động */}
            <div className="w-12 h-1.5 bg-[#DDCCAE] rounded-full mx-auto mb-3 block sm:hidden shrink-0" />

            {/* Header Modal */}
            <div className="flex items-center justify-between mb-3 border-b border-[#F3E8D4] pb-3 shrink-0">
              <span className="font-serif text-[18px] font-bold text-[#7D3F32]">BrewLite</span>

              <div className="flex items-center gap-2">
                {/* Thanh tab chuyển đổi các góc nhìn trong Modal */}
                <div className="flex bg-[#F3E8D4] rounded-[8px] p-0.5 text-[11px] font-bold overflow-x-auto">
                  <button
                    onClick={() => setModalTab('RECEIPT')}
                    className={`px-2.5 py-1 rounded-[6px] transition-all whitespace-nowrap ${
                      modalTab === 'RECEIPT' ? 'bg-[#7D3F32] text-white' : 'text-[#786B5A]'
                    }`}
                  >
                    Biên nhận
                  </button>

                  {selectedOrder.status === 'READY' && (
                    <button
                      onClick={() => setModalTab('READY_PICKUP')}
                      className={`px-2.5 py-1 rounded-[6px] transition-all whitespace-nowrap ${
                        modalTab === 'READY_PICKUP' ? 'bg-[#246344] text-white' : 'text-[#246344]'
                      }`}
                    >
                      Mã nhận (Số 12)
                    </button>
                  )}

                  {selectedOrder.status === 'PREPARING' && (
                    <button
                      onClick={() => setModalTab('TRACKING')}
                      className={`px-2.5 py-1 rounded-[6px] transition-all whitespace-nowrap ${
                        modalTab === 'TRACKING' ? 'bg-[#7D3F32] text-white' : 'text-[#786B5A]'
                      }`}
                    >
                      Tiến trình
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setViewDetailModal(false)}
                  className="w-8 h-8 rounded-[10px] bg-[#EADBC2] text-[#3F3027] font-bold text-[16px] flex items-center justify-center hover:opacity-80 transition-opacity ml-1 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* VÙNG CUỘN NỘI DUNG MODAL */}
            <div className="overflow-y-auto pr-1 flex-1">
              {/* TAB 1: PHIẾU BIÊN NHẬN ĐIỆN TỬ (FRAME 07c FIGMA CHUẨN 640x944 & 390x844) */}
              {modalTab === 'RECEIPT' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-serif text-[22px] font-bold text-[#3F3027]">
                      Biên nhận điện tử
                    </h3>
                    <div className="inline-flex items-center gap-1.5 mt-1 bg-[#E7F0E9] text-[#246344] px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-[#A7CEB5]">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>{selectedOrder.status === 'CANCELLED' ? 'ĐÃ HỦY ĐƠN' : 'ĐÃ THANH TOÁN'}</span>
                    </div>
                  </div>

                  {/* Bảng thông tin hành chính */}
                  <div className="bg-[#F3E8D4] rounded-[14px] p-3.5 space-y-1.5 text-[12px] border border-[#DDCCAE]">
                    <div className="flex justify-between">
                      <span className="text-[#786B5A]">Mã đơn</span>
                      <span className="font-bold text-[#3F3027]">{selectedOrder.orderCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#786B5A]">Ngày giờ</span>
                      <span className="font-medium text-[#3F3027]">{selectedOrder.createdAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#786B5A]">Chi nhánh</span>
                      <span className="font-medium text-[#3F3027]">{selectedOrder.branch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#786B5A]">Khách hàng</span>
                      <span className="font-medium text-[#3F3027]">{selectedOrder.customerName}</span>
                    </div>
                  </div>

                  {/* Chi tiết từng món & Breakdown giá */}
                  <div className="space-y-3 border-t border-b border-[#DDCCAE] py-3 text-[12px]">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between items-start font-bold text-[#3F3027]">
                          <span className="font-serif text-[13px]">{item.quantity} × {item.name}</span>
                          <span className="font-serif text-[13px] text-[#7D3F32]">{item.price.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <p className="text-[11px] text-[#786B5A] leading-tight">
                          {item.priceBreakdown}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Chi tiết tiền thanh toán */}
                  <div className="space-y-1.5 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-[#786B5A]">Tạm tính</span>
                      <span className="font-semibold text-[#3F3027]">{selectedOrder.subtotal.toLocaleString('vi-VN')} đ</span>
                    </div>
                    {selectedOrder.voucherCode && (
                      <div className="flex justify-between">
                        <span className="text-[#786B5A]">Ưu đãi {selectedOrder.voucherCode}</span>
                        <span className="font-semibold text-[#246344]">−{selectedOrder.discountAmount.toLocaleString('vi-VN')} đ</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#786B5A]">Phí đóng gói</span>
                      <span className="font-semibold text-[#3F3027]">0 đ</span>
                    </div>
                    <div className="border-t border-[#DDCCAE] pt-2 flex justify-between items-baseline">
                      <span className="text-[14px] font-bold text-[#3F3027]">
                        {selectedOrder.status === 'CANCELLED' ? 'Giá trị đơn' : 'Tổng đã thanh toán'}
                      </span>
                      <span className="font-serif text-[22px] font-bold text-[#7D3F32]">
                        {selectedOrder.totalPaid.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <p className="text-[10px] text-[#786B5A]">
                      Giá đã gồm VAT · {selectedOrder.paymentMethodText}
                    </p>
                  </div>

                  {/* Mã QR tra cứu biên nhận minh họa (Frame 07c) */}
                  <div className="flex items-center gap-3 bg-[#F3E8D4] p-3 rounded-[12px] border border-[#DDCCAE]">
                    <div className="w-14 h-14 bg-white rounded-[8px] p-1 flex items-center justify-center shrink-0">
                      <QrCode className="w-full h-full text-[#3F3027]" />
                    </div>
                    <div className="text-[11px]">
                      <p className="font-bold text-[#3F3027]">Tra cứu biên nhận {selectedOrder.orderCode}</p>
                      <p className="text-[#786B5A] mt-0.5 leading-snug">
                        QR minh họa trong bản thiết kế. Biên nhận điện tử được lưu trong tài khoản của bạn.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewDetailModal(false)}
                    className="w-full h-[46px] bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[13px] transition-colors shadow-sm"
                  >
                    Đóng biên nhận
                  </button>
                </div>
              )}

              {/* TAB 2: TIẾN TRÌNH PHA CHẾ (FRAME 07 FIGMA) */}
              {modalTab === 'TRACKING' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-serif text-[22px] font-bold text-[#3F3027]">
                      Đặt đơn thành công!
                    </h3>
                    <p className="text-[12px] font-bold text-[#246344] mt-0.5">
                      {selectedOrder.orderCode} · Đã thanh toán {selectedOrder.totalPaid.toLocaleString('vi-VN')} đ
                    </p>
                  </div>

                  {/* Mã nhận món tại quầy (Frame 07) */}
                  <div className="bg-[#F3E8D4] rounded-[16px] p-4 text-center border border-[#DDCCAE]">
                    <p className="text-[12px] font-bold text-[#3F3027] mb-2">
                      Mã nhận món tại quầy
                    </p>
                    <div className="w-[130px] h-[130px] bg-white rounded-[12px] p-2 mx-auto mb-2 shadow-inner flex items-center justify-center border border-[#DDCCAE]">
                      <QrCode className="w-full h-full text-[#3F3027]" />
                    </div>
                    <p className="font-serif text-[18px] font-bold text-[#3F3027]">
                      {selectedOrder.orderCode}
                    </p>
                    <p className="text-[11px] text-[#786B5A] mt-0.5">
                      Đưa mã này cho nhân viên tại quầy khi nhận nước.
                    </p>
                  </div>

                  {/* Tiến trình 4 bước chuẩn Figma Frame 07 */}
                  <div className="bg-[#F3E8D4] rounded-[16px] p-4 border border-[#DDCCAE] space-y-3">
                    <p className="text-[12px] font-bold text-[#3F3027] mb-2 uppercase tracking-wider">
                      MÓN NGON ĐANG ĐƯỢC CHUẨN BỊ
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
                      <div className="w-6 h-6 rounded-full bg-[#A8763F] text-[#FFFAF0] flex items-center justify-center text-[11px] font-bold">
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
                    className="w-full h-[46px] bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[13px] transition-colors shadow-sm"
                  >
                    Đóng theo dõi
                  </button>
                </div>
              )}

              {/* TAB 3: SẴN SÀNG NHẬN MÓN (FRAME 07d MÁY TÍNH & DI ĐỘNG FIGMA) */}
              {modalTab === 'READY_PICKUP' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-serif text-[22px] sm:text-[24px] font-bold text-[#3F3027] leading-tight">
                      Đồ uống của bạn đã sẵn sàng!
                    </h3>
                    <p className="text-[12px] sm:text-[13px] text-[#786B5A] mt-1">
                      Mời bạn đến Quầy pha chế tại BrewLite Quận 1 để nhận món.
                    </p>
                  </div>

                  {/* Box Số thứ tự nhận món (SỐ 12) chuẩn Frame 07d */}
                  <div className="bg-[#E7F0E9] border-2 border-[#246344] rounded-[18px] p-5 text-center shadow-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#246344] mb-1">
                      ĐỒ UỐNG ĐÃ SẴN SÀNG
                    </p>
                    <p className="font-serif text-[48px] sm:text-[56px] font-extrabold text-[#7D3F32] leading-none my-1">
                      SỐ 12
                    </p>
                    <p className="text-[12px] font-bold text-[#3F3027] mt-1">
                      {selectedOrder.orderCode} · Đã thanh toán {selectedOrder.totalPaid.toLocaleString('vi-VN')} đ
                    </p>
                  </div>

                  {/* Mã QR nhận món chuẩn Frame 07d */}
                  <div className="bg-[#F3E8D4] rounded-[16px] p-4 text-center border border-[#DDCCAE]">
                    <p className="text-[12px] font-bold text-[#3F3027] mb-2">
                      Đưa mã này cho nhân viên tại quầy
                    </p>
                    <div className="w-[140px] h-[140px] bg-white rounded-[14px] p-2.5 mx-auto mb-2 shadow-inner flex items-center justify-center border border-[#DDCCAE]">
                      <QrCode className="w-full h-full text-[#3F3027]" />
                    </div>
                    <p className="font-serif text-[20px] font-bold text-[#3F3027]">
                      {selectedOrder.orderCode}
                    </p>
                    <p className="text-[10px] text-[#786B5A] mt-1">
                      QR nhận món · Không dùng thanh toán · Chỉ dùng xác nhận nhận món
                    </p>
                  </div>

                  {/* Tiến trình 4 bước hoàn thiện: Bước 3 Sẵn sàng nhận (Active) */}
                  <div className="bg-[#F3E8D4] rounded-[16px] p-4 border border-[#DDCCAE] space-y-3">
                    <p className="text-[12px] font-bold text-[#246344] uppercase tracking-wider">
                      TIẾN TRÌNH NHẬN MÓN
                    </p>

                    <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                      <div className="space-y-1">
                        <div className="w-7 h-7 mx-auto rounded-full bg-[#246344] text-white flex items-center justify-center font-bold text-[12px]">
                          ✓
                        </div>
                        <span className="text-[#3F3027] font-medium block">Đã tiếp nhận</span>
                      </div>

                      <div className="space-y-1">
                        <div className="w-7 h-7 mx-auto rounded-full bg-[#246344] text-white flex items-center justify-center font-bold text-[12px]">
                          ✓
                        </div>
                        <span className="text-[#3F3027] font-medium block">Đã pha chế</span>
                      </div>

                      <div className="space-y-1">
                        <div className="w-7 h-7 mx-auto rounded-full bg-[#7D3F32] text-white ring-4 ring-[#7D3F32]/20 flex items-center justify-center font-bold text-[12px]">
                          3
                        </div>
                        <span className="text-[#7D3F32] font-bold block">Sẵn sàng nhận</span>
                      </div>

                      <div className="space-y-1">
                        <div className="w-7 h-7 mx-auto rounded-full bg-[#EADBC2] text-[#786B5A] flex items-center justify-center font-bold text-[12px]">
                          4
                        </div>
                        <span className="text-[#786B5A] font-medium block">Hoàn thành</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setModalTab('RECEIPT')}
                      className="flex-1 h-[46px] bg-[#EADBC2] hover:bg-[#DFCFB4] text-[#3F3027] rounded-[12px] font-bold text-[13px] transition-colors border border-[#DDCCAE]"
                    >
                      Xem biên nhận
                    </button>
                    <button
                      onClick={() => setViewDetailModal(false)}
                      className="flex-1 h-[46px] bg-[#7D3F32] hover:bg-[#6A3328] text-[#FFFAF0] rounded-[12px] font-bold text-[13px] transition-colors shadow-sm"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
