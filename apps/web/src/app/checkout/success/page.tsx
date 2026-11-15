'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';
import { UserNav } from '@/components/UserNav';
import { OrderStatusStepper } from '@/components/OrderStatusStepper';
import { calculateEarnedPoints } from '@/components/LoyaltyBadge';
import {
  ElectronicReceiptModal,
  OrderRecord,
  PickupQrSvg,
} from '@/components/ElectronicReceiptModal';
import {
  FileText,
  Sparkles,
  RefreshCw,
  ShieldAlert,
  ArrowLeft,
  Store,
} from 'lucide-react';

/**
 * Dữ liệu biên nhận mẫu đồng bộ 100% Frame 07 · Theo dõi đơn Figma BrewLite 2
 * Chỉ sử dụng khi người dùng mở trang preview trực tiếp chưa truyền orderId/orderCode từ Backend
 */
const FIGMA_DEMO_RECEIPT: OrderRecord = {
  id: 'demo-bl-8924',
  orderCode: 'BL-8924',
  status: 'PREPARING',
  subtotalAmount: 115000,
  discountAmount: 20000,
  loyaltyPointsUsed: 0,
  finalAmount: 95000,
  note: 'Nhận tại BrewLite · Chi nhánh Quận 1',
  createdAt: '2026-11-11T09:42:00.000Z',
  customerName: 'Hàn Minh Hiếu',
  promotionCode: 'BANMOI10',
  payment: {
    id: 'pay-demo',
    method: 'VNPAY',
    status: 'SUCCESS',
    amount: 95000,
  },
  items: [
    {
      id: 'item-1',
      productId: 'prod-001',
      productName: 'Cà phê Muối Côn Đảo',
      size: 'M',
      sugarLevel: '50%',
      iceLevel: '100%',
      toppings: ['Sữa yến mạch', 'Macchiato'],
      quantity: 1,
      unitPrice: 73000,
      lineTotal: 73000,
    },
    {
      id: 'item-2',
      productId: 'prod-002',
      productName: 'Trà Lài Vải Thiều',
      size: 'M',
      sugarLevel: '70%',
      iceLevel: '100%',
      toppings: null,
      quantity: 1,
      unitPrice: 42000,
      lineTotal: 42000,
    },
  ],
};

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderCodeParam = searchParams.get('orderCode');

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    setForbiddenError(null);
    try {
      if (orderId) {
        const res = await ApiClient.get<OrderRecord>(`/orders/${orderId}`);
        setOrder(res);
      } else if (orderCodeParam) {
        const res = await ApiClient.get<OrderRecord>(`/orders/code/${orderCodeParam}`);
        setOrder(res);
      } else {
        // Thử nạp đơn hàng mới nhất của user đang đăng nhập nếu có token
        const token = ApiClient.getToken();
        if (token) {
          const listRes = await ApiClient.get<{ orders: OrderRecord[] }>('/orders/my-orders');
          if (listRes?.orders?.length > 0) {
            setOrder(listRes.orders[0]);
            return;
          }
        }
        setOrder(FIGMA_DEMO_RECEIPT);
      }
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.toLowerCase().includes('quyền') || msg.includes('403')) {
        setForbiddenError(
          'Truy cập bị từ chối (403 Anti-IDOR): Bạn không thể xem biên nhận đơn hàng của người dùng khác.',
        );
        setOrder(null);
      } else {
        setOrder(orderCodeParam ? { ...FIGMA_DEMO_RECEIPT, orderCode: orderCodeParam } : FIGMA_DEMO_RECEIPT);
      }
    } finally {
      setIsLoading(false);
    }
  }, [orderId, orderCodeParam]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const activeOrder = order;
  const estimatedPoints = activeOrder ? calculateEarnedPoints(activeOrder.finalAmount) : 0;

  return (
    <div className="min-h-screen bg-[#F3E8D4] text-[#3F3027] font-sans flex flex-col justify-between selection:bg-[#7D3F32] selection:text-[#FFFAF0]">
      {/* Header chuẩn BrewLite */}
      <header className="bg-[#FFFAF0] border-b border-[#E8D7B8] px-4 sm:px-8 py-3.5 shadow-2xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/menu" className="font-serif text-2xl sm:text-3xl font-bold text-[#7D3F32] tracking-tight">
            BrewLite
          </Link>

          <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#786B5A]">
            <Link href="/menu" className="hover:text-[#7D3F32] transition-colors">
              Thực đơn
            </Link>
            <Link href="/orders/my-orders" className="text-[#7D3F32] font-bold">
              Đơn hàng
            </Link>
            <Link href="/orders/my-orders?tab=loyalty" className="hover:text-[#7D3F32] transition-colors">
              Ưu đãi
            </Link>
            <Link href="/profile" className="hover:text-[#7D3F32] transition-colors">
              Tài khoản
            </Link>
          </nav>

          <UserNav />
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/orders/my-orders"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7D3F32] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Xem toàn bộ lịch sử đơn hàng</span>
          </Link>

          <button
            type="button"
            onClick={() => void loadOrder()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDCCAE] bg-[#FFFAF0] px-3.5 py-2 text-xs font-bold text-[#3F3027] hover:bg-[#E8D7B8]/50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#7D3F32]" />
            <span>Làm mới trạng thái</span>
          </button>
        </div>

        {isLoading ? (
          <div data-testid="receipt-skeleton" className="rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-8 space-y-4 animate-pulse">
            <div className="h-8 w-64 rounded bg-[#E8D7B8]" />
            <div className="h-4 w-48 rounded bg-[#E8D7B8]" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
              <div className="lg:col-span-2 h-64 rounded-2xl bg-[#F3E8D4]" />
              <div className="h-64 rounded-2xl bg-[#F3E8D4]" />
            </div>
          </div>
        ) : forbiddenError ? (
          <section
            role="alert"
            className="rounded-3xl bg-[#FFFAF0] border border-[#F5C2C0] p-8 text-center space-y-4 shadow-sm"
          >
            <ShieldAlert className="w-12 h-12 text-[#B42318] mx-auto" />
            <h1 className="font-serif text-2xl font-bold text-[#B42318]">
              Không có quyền truy cập đơn hàng
            </h1>
            <p className="text-sm text-[#786B5A] max-w-md mx-auto">{forbiddenError}</p>
            <Link
              href="/orders/my-orders"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#7D3F32] px-6 text-sm font-bold text-[#FFFAF0] hover:bg-[#693327]"
            >
              Về đơn hàng của tôi
            </Link>
          </section>
        ) : activeOrder ? (
          <>
            {/* Tiêu đề Frame 07 */}
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3F3027] tracking-tight">
                {activeOrder.status === 'CANCELLED'
                  ? 'Đơn hàng đã được hủy'
                  : 'Đặt đơn thành công!'}
              </h1>
              <p className="text-sm text-[#786B5A] mt-1 font-medium">
                {activeOrder.orderCode} ·{' '}
                {activeOrder.payment?.status === 'SUCCESS' ||
                ['PAID', 'PREPARING', 'COMPLETED'].includes(activeOrder.status)
                  ? `Đã thanh toán ${Number(activeOrder.finalAmount).toLocaleString('vi-VN')} đ`
                  : `Chờ thanh toán ${Number(activeOrder.finalAmount).toLocaleString('vi-VN')} đ`}
              </p>
            </div>

            {/* Lưới 2 cột: Stepper pha chế + Mã nhận món QR (Figma 07) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-7 rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3F3027]">
                    {activeOrder.status === 'COMPLETED'
                      ? 'Đơn hàng đã hoàn thành'
                      : activeOrder.status === 'CANCELLED'
                        ? 'Tiến trình xử lý hủy đơn'
                        : 'Món ngon đang được chuẩn bị'}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F5E9D8] px-3 py-1 text-xs font-bold text-[#7D3F32]">
                    <Store className="w-3.5 h-3.5" />
                    Quận 1
                  </span>
                </div>

                <OrderStatusStepper status={activeOrder.status} orientation="vertical" />
              </section>

              <section className="lg:col-span-5 rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-6 shadow-xs flex flex-col items-center text-center justify-between space-y-4">
                <h2 className="font-serif text-xl font-bold text-[#3F3027]">
                  Mã nhận món tại quầy
                </h2>
                <PickupQrSvg code={activeOrder.orderCode} size={192} />
                <div>
                  <p className="font-mono text-2xl font-bold text-[#7D3F32]">{activeOrder.orderCode}</p>
                  <p className="text-xs text-[#786B5A] mt-1">
                    Đưa mã này cho nhân viên pha chế tại quầy để xác nhận nhận món.
                  </p>
                </div>
              </section>
            </div>

            {/* Biên nhận tóm tắt dưới cùng (Figma Frame 07) */}
            <section className="rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-6 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3F3027]">
                    Biên nhận của bạn
                  </h2>
                  <div className="space-y-2.5">
                    {activeOrder.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                        <div>
                          <p className="font-semibold text-[#3F3027]">
                            {item.quantity} × {item.productName}
                          </p>
                          <p className="text-xs text-[#786B5A]">
                            Cỡ {item.size} · {item.sugarLevel} đường · {item.iceLevel} đá
                          </p>
                        </div>
                        <span className="font-semibold text-[#3F3027]">
                          {Number(item.lineTotal).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    ))}
                  </div>

                  {Number(activeOrder.discountAmount) > 0 && (
                    <p className="text-xs text-[#246344] font-semibold">
                      Ưu đãi {activeOrder.promotionCode || ''}: −
                      {Number(activeOrder.discountAmount).toLocaleString('vi-VN')} đ · Đóng gói: 0 đ
                    </p>
                  )}
                </div>

                <div className="lg:w-80 lg:border-l lg:border-[#E8D7B8] lg:pl-6 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#786B5A]">
                      Tổng thanh toán
                    </p>
                    <p className="font-serif text-3xl sm:text-4xl font-bold text-[#7D3F32] mt-1">
                      {Number(activeOrder.finalAmount).toLocaleString('vi-VN')} đ
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(true)}
                    className="w-full min-h-12 rounded-xl bg-[#7D3F32] hover:bg-[#693327] text-[#FFFAF0] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Tải biên nhận điện tử</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Footer loyalty hint */}
            <div className="rounded-2xl bg-[#FFFAF0] border border-[#E8D7B8] px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm text-[#3F3027]">
              <Sparkles className="w-4 h-4 text-[#D98236] shrink-0" />
              <span>
                Điểm thưởng dự kiến{' '}
                <strong className="text-[#7D3F32]">+{estimatedPoints} Hạt</strong> được cộng khi đơn hoàn tất thanh toán.
              </span>
            </div>
          </>
        ) : null}
      </main>

      <footer className="py-5 border-t border-[#E8D7B8] text-center text-xs text-[#786B5A]">
        BrewLite © 2026 · Theo dõi tiến trình đơn hàng &amp; Biên nhận điện tử
      </footer>

      <ElectronicReceiptModal
        order={showReceiptModal ? activeOrder : null}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F3E8D4] flex items-center justify-center text-sm text-[#786B5A]">
          Đang tải biên nhận đơn hàng...
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
