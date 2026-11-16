'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';
import { useCartStore } from '@/lib/store';
import { UserNav } from '@/components/UserNav';
import { OrderStatusStepper, RefundProgressStepper } from '@/components/OrderStatusStepper';
import { LoyaltyBadge, calculateEarnedPoints } from '@/components/LoyaltyBadge';
import { RedeemPointsInput } from '@/components/RedeemPointsInput';
import {
  ElectronicReceiptModal,
  OrderRecord,
  PickupQrSvg,
  formatOrderDateTime,
} from '@/components/ElectronicReceiptModal';
import { EmptyState, ErrorState, SkeletonLoading } from '@/components/UIStates';
import {
  Sparkles,
  Receipt,
  RotateCcw,
  FileText,
  XCircle,
  AlertTriangle,
  Store,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
} from 'lucide-react';

interface LoyaltyTxRecord {
  id: string;
  orderCode?: string | null;
  type: 'EARN' | 'REDEEM' | 'REFUND';
  points: number;
  description?: string | null;
  createdAt: string;
}

type PageTab = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'LOYALTY';

function statusBadgeMeta(order: OrderRecord) {
  const s = order.status.toUpperCase();
  if (s === 'PENDING') {
    return { label: 'Chờ thanh toán', cls: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]' };
  }
  if (s === 'PAID') {
    return { label: 'Đã tiếp nhận', cls: 'bg-[#E7F0E9] text-[#246344] border-[#A7CEB5]' };
  }
  if (s === 'PREPARING') {
    return { label: 'Đang pha chế', cls: 'bg-[#F5E9D8] text-[#754416] border-[#DDCCAE]' };
  }
  if (s === 'COMPLETED') {
    return { label: 'Đã nhận tại quầy', cls: 'bg-[#E7F0E9] text-[#246344] border-[#A7CEB5]' };
  }
  if (order.payment?.status === 'REFUNDED') {
    return { label: 'Đã hủy · Đã hoàn tiền', cls: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]' };
  }
  return { label: 'Đã hủy', cls: 'bg-[#FDECEC] text-[#B42318] border-[#F5C2C0]' };
}

function MyOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addItem = useCartStore((s) => s.addItem);

  const initialTab = searchParams.get('tab') === 'loyalty' ? 'LOYALTY' : 'IN_PROGRESS';
  const [activeTab, setActiveTab] = useState<PageTab>(initialTab);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [memberName, setMemberName] = useState<string>('Khách hàng BrewLite');
  const [memberCode, setMemberCode] = useState<string>('BL · MEMBER');
  const [userRole, setUserRole] = useState<string>('CUSTOMER');
  const [loyaltyTxs, setLoyaltyTxs] = useState<LoyaltyTxRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState<boolean>(false);

  const [receiptOrder, setReceiptOrder] = useState<OrderRecord | null>(null);
  const [cancelTargetOrder, setCancelTargetOrder] = useState<OrderRecord | null>(null);
  const [refundStatusOrder, setRefundStatusOrder] = useState<OrderRecord | null>(null);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const token = ApiClient.getToken();

    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('brewlite_user_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.role) setUserRole(parsed.role);
          if (parsed?.fullName) setMemberName(parsed.fullName);
        }
      } catch {
        // Bỏ qua cache lỗi định dạng
      }
    }

    if (!token) {
      setNeedsLogin(true);
      setOrders([]);
      setLoyaltyPoints(0);
      setLoyaltyTxs([]);
      setIsLoading(false);
      return;
    }

    setNeedsLogin(false);

    try {
      const [ordersRes, loyaltyRes] = await Promise.all([
        ApiClient.get<{ orders: OrderRecord[] }>('/orders/my-orders'),
        ApiClient.get<{
          loyaltyPoints: number;
          fullName?: string;
          memberCode?: string;
          transactions: LoyaltyTxRecord[];
        }>('/loyalty/balance'),
      ]);

      setOrders(ordersRes?.orders || []);
      setLoyaltyPoints(loyaltyRes?.loyaltyPoints ?? 0);
      if (loyaltyRes?.fullName) setMemberName(loyaltyRes.fullName);
      if (loyaltyRes?.memberCode) setMemberCode(loyaltyRes.memberCode);
      setLoyaltyTxs(loyaltyRes?.transactions || []);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Không thể tải lịch sử đơn hàng từ máy chủ. Vui lòng thử lại.',
      );
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'IN_PROGRESS') {
      return orders.filter((o) => ['PENDING', 'PAID', 'PREPARING'].includes(o.status.toUpperCase()));
    }
    if (activeTab === 'COMPLETED') {
      return orders.filter((o) => o.status.toUpperCase() === 'COMPLETED');
    }
    if (activeTab === 'CANCELLED') {
      return orders.filter((o) => o.status.toUpperCase() === 'CANCELLED');
    }
    return orders;
  }, [orders, activeTab]);

  const readyHighlightOrder = useMemo(
    () => orders.find((o) => ['PAID', 'PREPARING'].includes(o.status.toUpperCase())) || null,
    [orders],
  );

  const pendingEstimatedTotal = useMemo(
    () =>
      orders
        .filter((o) => ['PENDING', 'PAID', 'PREPARING'].includes(o.status.toUpperCase()))
        .reduce((sum, o) => sum + calculateEarnedPoints(o.finalAmount), 0),
    [orders],
  );

  const handleReorder = (order: OrderRecord) => {
    const validLevels = ['0%', '30%', '50%', '70%', '100%'];
    const normalizeLevel = (raw?: string) => {
      const match = validLevels.find((lv) => String(raw || '').includes(lv));
      return match || '100%';
    };
    try {
      for (const item of order.items) {
        const sizeVal = ['S', 'M', 'L'].includes(item.size) ? (item.size as 'S' | 'M' | 'L') : 'M';
        const toppingsList = Array.isArray(item.toppings)
          ? item.toppings.map((t: unknown) =>
              typeof t === 'string' ? t : String((t as { name?: string })?.name || ''),
            ).filter(Boolean)
          : [];
        addItem({
          productId: item.productId,
          name: item.productName,
          category: 'Đồ uống',
          imageUrl: '/images/drinks/ca-phe-muoi-con-dao.jpg',
          size: sizeVal,
          unitPrice: Math.max(0, Math.round(Number(item.unitPrice) || 0)),
          quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
          sugarLevel: normalizeLevel(item.sugarLevel),
          iceLevel: normalizeLevel(item.iceLevel),
          toppings: toppingsList,
        });
      }
      showToast(`Đã thêm lại món từ đơn ${order.orderCode} vào giỏ hàng.`);
      router.push('/cart');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể đặt lại đơn hàng này.');
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancelTargetOrder) return;
    setIsMutating(true);
    try {
      await ApiClient.post(`/orders/${cancelTargetOrder.id}/cancel`, {
        scenario: 'ONLINE_CUSTOMER_CANCEL',
        reason: 'Khách hàng hủy đơn trực tuyến trước khi thanh toán.',
      });
      await fetchData();
      showToast(`Đã hủy đơn ${cancelTargetOrder.orderCode} và hoàn nguyên liệu về kho.`);
      setCancelTargetOrder(null);
      setActiveTab('CANCELLED');
    } catch (err: any) {
      showToast(err?.message || 'Không thể hủy đơn hàng này.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleAdvanceStatus = async (order: OrderRecord, nextStatus: 'PREPARING' | 'COMPLETED') => {
    setIsMutating(true);
    try {
      await ApiClient.patch(`/orders/${order.id}/status`, {
        status: nextStatus,
        reason: `Cập nhật trạng thái quầy pha chế sang ${nextStatus}`,
      });
      await fetchData();
      showToast(`Đơn ${order.orderCode} đã chuyển sang ${nextStatus === 'PREPARING' ? 'Đang pha chế' : 'Đã hoàn thành'}.`);
    } catch (err: any) {
      showToast(err?.message || 'Cập nhật trạng thái yêu cầu quyền Nhân viên (STAFF/ADMIN).');
    } finally {
      setIsMutating(false);
    }
  };

  const handleOutOfStockRefund = async (order: OrderRecord) => {
    setIsMutating(true);
    try {
      const res = await ApiClient.post<{ order: OrderRecord }>(`/orders/${order.id}/cancel`, {
        scenario: 'OUT_OF_STOCK_REFUND',
        reason: 'Món trong đơn hiện TẠM HẾT tại quầy. Đã hoàn tiền và hoàn kho nguyên liệu còn lại.',
      });
      await fetchData();
      setRefundStatusOrder(res.order);
      showToast(`Đã khởi tạo hoàn tiền cho đơn ${order.orderCode}.`);
    } catch (err: any) {
      showToast(err?.message || 'Thao tác hoàn tiền hết món yêu cầu quyền Nhân viên (STAFF/ADMIN).');
    } finally {
      setIsMutating(false);
    }
  };

  const handleRedeemPoints = async (payload: {
    pointsToRedeem: number;
    rewardId?: string;
    description?: string;
  }) => {
    setIsMutating(true);
    try {
      const res = await ApiClient.post<{
        remainingPoints: number;
        message?: string;
      }>('/loyalty/redeem', payload);
      setLoyaltyPoints(res.remainingPoints);
      await fetchData();
      showToast(res.message || `Đổi thành công ${payload.pointsToRedeem} Hạt!`);
    } catch (err: any) {
      showToast(err?.message || 'Không thể đổi Hạt lúc này.');
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E8D4] text-[#3F3027] font-sans flex flex-col justify-between selection:bg-[#7D3F32] selection:text-[#FFFAF0]">
      {/* Header BrewLite */}
      <header className="bg-[#FFFAF0] border-b border-[#E8D7B8] px-4 sm:px-8 py-3.5 shadow-2xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/menu" className="font-serif text-2xl sm:text-3xl font-bold text-[#7D3F32] tracking-tight">
            BrewLite
          </Link>

          <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#786B5A]">
            <Link href="/menu" className="hover:text-[#7D3F32] transition-colors">
              Thực đơn
            </Link>
            <Link href="/orders" className="text-[#7D3F32] font-bold transition-colors">
              Đơn hàng
            </Link>
            <Link href="/rewards" className="hover:text-[#7D3F32] transition-colors">
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
        {/* Toast feedback */}
        {toastMsg && (
          <div
            role="status"
            className="rounded-2xl bg-[#246344] text-[#FFFAF0] px-4 py-3 text-sm font-semibold flex items-center justify-between shadow-md"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {toastMsg}
            </span>
            <button type="button" onClick={() => setToastMsg(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Yêu cầu đăng nhập nếu chưa có phiên */}
        {needsLogin ? (
          <div className="rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-8 text-center space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3F3027]">
              Đăng nhập để xem đơn hàng của riêng bạn
            </h2>
            <p className="text-sm text-[#786B5A]">
              Lịch sử đơn hàng, trạng thái pha chế và điểm thưởng được tách biệt cho từng tài khoản.
            </p>
            <Link
              href="/login?redirect=/orders"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#7D3F32] hover:bg-[#693327] px-5 text-sm font-bold text-[#FFFAF0]"
            >
              Đăng nhập ngay →
            </Link>
          </div>
        ) : null}

        {/* Tiêu đề trang (Figma 07b hoặc 08) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3F3027] tracking-tight">
              {activeTab === 'LOYALTY' ? 'Mỗi lần ghé, thêm một Hạt.' : 'Lịch sử đơn hàng'}
            </h1>
            <p className="text-sm text-[#786B5A] mt-1">
              {activeTab === 'LOYALTY'
                ? 'Tích những điều nhỏ, nhận những niềm vui.'
                : 'Mỗi lần ghé lại, một gu quen.'}
            </p>
          </div>

          <LoyaltyBadge points={loyaltyPoints} compact />
        </div>

        {/* Bộ lọc Tabs khớp Figma 07b + 08 */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1" role="tablist">
          {(
            [
              { key: 'IN_PROGRESS', label: 'Đang thực hiện' },
              { key: 'COMPLETED', label: 'Đã hoàn thành' },
              { key: 'CANCELLED', label: 'Đã hủy' },
              { key: 'LOYALTY', label: 'Thành viên & Đổi Hạt' },
            ] as Array<{ key: PageTab; label: string }>
          ).map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`min-h-10 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#7D3F32] text-[#FFFAF0] shadow-2xs'
                    : 'bg-[#FFFAF0] border border-[#E8D7B8] text-[#786B5A] hover:text-[#3F3027]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {needsLogin ? null : isLoading ? (
          <SkeletonLoading count={4} />
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={() => void fetchData()} />
        ) : activeTab === 'LOYALTY' ? (
          /* TAB 08 · THÀNH VIÊN & ĐỔI HẠT */
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5">
                <LoyaltyBadge
                  points={loyaltyPoints}
                  memberName={memberName}
                  memberCode={memberCode}
                />
              </div>

              <div className="lg:col-span-7">
                <RedeemPointsInput
                  currentPoints={loyaltyPoints}
                  isRedeeming={isMutating}
                  onConfirmRedeem={handleRedeemPoints}
                />
              </div>
            </div>

            {/* Lịch sử Hạt (Figma Frame 08) */}
            <section className="rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-5 sm:p-6 shadow-xs space-y-4">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3F3027]">
                Lịch sử Hạt
              </h2>

              {loyaltyTxs.length === 0 ? (
                <p className="text-sm text-[#786B5A]">
                  Chưa có giao dịch tích điểm nào. Đặt đồ uống đầu tiên để nhận Hạt thưởng!
                </p>
              ) : (
                <div className="divide-y divide-[#E8D7B8]">
                  {loyaltyTxs.map((tx) => {
                    const isNegative = tx.type === 'REDEEM' || tx.points < 0;
                    const displayPts = isNegative
                      ? `−${Math.abs(tx.points)} Hạt`
                      : `+${tx.points} Hạt`;
                    return (
                      <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span
                            className={`font-serif text-lg font-bold min-w-[96px] ${
                              isNegative ? 'text-[#B42318]' : 'text-[#246344]'
                            }`}
                          >
                            {displayPts}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[#3F3027]">
                              {tx.description || (tx.orderCode ? `Đơn ${tx.orderCode}` : 'Biến động Hạt')}
                            </p>
                            <p className="text-xs text-[#786B5A]">{formatOrderDateTime(tx.createdAt)}</p>
                          </div>
                        </div>

                        <span className="text-xs font-semibold rounded-full bg-[#F3E8D4] px-2.5 py-1 text-[#786B5A]">
                          {tx.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {pendingEstimatedTotal > 0 && (
                <div className="rounded-xl bg-[#F3E8D4]/75 border border-[#E8D7B8] px-4 py-2.5 text-xs font-medium text-[#3F3027] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D98236]" />
                  <span>
                    Đơn đang thực hiện: dự kiến <strong>+{pendingEstimatedTotal} Hạt</strong> sau khi hoàn tất.
                  </span>
                </div>
              )}
            </section>
          </div>
        ) : (
          /* TAB 07b · LỊCH SỬ ĐƠN HÀNG (Đang thực hiện / Đã hoàn thành / Đã hủy) */
          <div className="space-y-6">
            {/* Banner Sẵn sàng nhận món (Frame 07d) khi đang ở tab Đang thực hiện */}
            {activeTab === 'IN_PROGRESS' && readyHighlightOrder && (
              <section
                aria-label="Đơn sẵn sàng tại quầy"
                className="rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-5 sm:p-6 shadow-xs space-y-5"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                  <div className="lg:col-span-8 space-y-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F0E9] border border-[#A7CEB5] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#246344]">
                      <Store className="w-3.5 h-3.5" />
                      Theo dõi món trực tiếp · Quầy Quận 1
                    </span>
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <span className="font-serif text-3xl sm:text-4xl font-bold text-[#7D3F32]">
                        {readyHighlightOrder.orderCode}
                      </span>
                      <span className="text-sm font-semibold text-[#786B5A]">
                        {Number(readyHighlightOrder.finalAmount).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <OrderStatusStepper status={readyHighlightOrder.status} orientation="horizontal" />
                  </div>

                  <div className="lg:col-span-4 flex flex-col items-center rounded-2xl bg-[#F3E8D4]/75 border border-[#E8D7B8] p-4 text-center">
                    <PickupQrSvg code={readyHighlightOrder.orderCode} size={130} />
                    <p className="mt-2 font-mono text-sm font-bold text-[#7D3F32]">
                      {readyHighlightOrder.orderCode}
                    </p>
                    <p className="text-[11px] text-[#786B5A]">
                      QR minh họa · Chỉ dùng xác nhận nhận món
                    </p>
                  </div>
                </div>
              </section>
            )}

            <p className="text-xs font-semibold text-[#786B5A]">
              {filteredOrders.length} đơn hàng
            </p>

            {filteredOrders.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const badge = statusBadgeMeta(order);
                  const canCustomerCancel = order.status.toUpperCase() === 'PENDING';
                  const isOutOfStockRefund = order.payment?.status === 'REFUNDED';

                  return (
                    <article
                      key={order.id}
                      data-testid={`order-card-${order.orderCode}`}
                      className="rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-5 sm:p-6 shadow-xs space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3F3027]">
                              {order.orderCode}
                            </h2>
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-bold ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-xs text-[#786B5A] mt-1">
                            {formatOrderDateTime(order.createdAt)} · BrewLite · Chi nhánh Quận 1
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-xs text-[#786B5A]">
                            {order.status === 'CANCELLED' ? 'Giá trị đơn hàng' : 'Tổng đã thanh toán'}
                          </p>
                          <p className="font-serif text-2xl font-bold text-[#7D3F32]">
                            {Number(order.finalAmount).toLocaleString('vi-VN')} đ
                          </p>
                        </div>
                      </div>

                      {/* Danh sách món */}
                      <div className="space-y-3 border-y border-[#E8D7B8] py-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-xl bg-[#F3E8D4] border border-[#E8D7B8] overflow-hidden shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src="/images/drinks/ca-phe-muoi-con-dao.jpg"
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-sm sm:text-base text-[#3F3027]">
                                  {item.quantity} × {item.productName}
                                </p>
                                <p className="text-xs text-[#786B5A]">
                                  Cỡ {item.size} · {item.sugarLevel} đường · {item.iceLevel} đá
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold text-sm text-[#3F3027] shrink-0">
                              {Number(item.lineTotal).toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Ghi chú trạng thái / Lý do hủy / TTL */}
                      {order.note && (
                        <p className="text-xs text-[#786B5A] flex items-center gap-1.5">
                          {order.status === 'CANCELLED' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#B42318] shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-[#D98236] shrink-0" />
                          )}
                          <span>{order.note}</span>
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Link
                            href={`/checkout/success?orderCode=${encodeURIComponent(order.orderCode)}`}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#7D3F32] px-4 text-xs sm:text-sm font-bold text-[#7D3F32] hover:bg-[#F3E8D4] transition-colors"
                          >
                            <Receipt className="w-4 h-4" />
                            <span>Xem chi tiết đơn</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setReceiptOrder(order)}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#F3E8D4] hover:bg-[#E8D7B8] px-4 text-xs sm:text-sm font-bold text-[#3F3027] cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-[#7D3F32]" />
                            <span>Biên nhận</span>
                          </button>

                          {canCustomerCancel && (
                            <button
                              type="button"
                              onClick={() => setCancelTargetOrder(order)}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#B42318]/40 bg-[#FDECEC] hover:bg-[#fad8d6] px-4 text-xs sm:text-sm font-bold text-[#B42318] cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Hủy đơn</span>
                            </button>
                          )}

                          {['PAID', 'PREPARING'].includes(order.status.toUpperCase()) && (
                            <span className="text-[11px] text-[#786B5A] italic">
                              Đơn đã thanh toán đang xử lý · liên hệ quầy nếu cần hỗ trợ hủy/hoàn tiền
                            </span>
                          )}

                          {isOutOfStockRefund && (
                            <button
                              type="button"
                              onClick={() => setRefundStatusOrder(order)}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#FEF3C7] px-4 text-xs font-bold text-[#92400E] cursor-pointer"
                            >
                              <span>Tiến trình hoàn tiền</span>
                            </button>
                          )}

                          {(userRole === 'STAFF' || userRole === 'ADMIN') &&
                            (order.status === 'PAID' || order.status === 'PREPARING') && (
                              <>
                                <button
                                  type="button"
                                  disabled={isMutating}
                                  onClick={() =>
                                    void handleAdvanceStatus(
                                      order,
                                      order.status === 'PAID' ? 'PREPARING' : 'COMPLETED',
                                    )
                                  }
                                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#246344]/40 bg-[#E7F0E9] hover:bg-[#d7e8db] px-3.5 text-xs font-bold text-[#246344] cursor-pointer"
                                >
                                  <span>
                                    {order.status === 'PAID'
                                      ? 'Quầy: Bắt đầu pha chế'
                                      : 'Quầy: Hoàn tất giao món'}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isMutating}
                                  onClick={() => void handleOutOfStockRefund(order)}
                                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#B42318]/40 bg-[#FDECEC] hover:bg-[#fad8d6] px-3.5 text-xs font-bold text-[#B42318] cursor-pointer"
                                >
                                  <span>Quầy: Hết món &amp; Hoàn tiền</span>
                                </button>
                              </>
                            )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleReorder(order)}
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#7D3F32] hover:bg-[#693327] px-5 text-xs sm:text-sm font-bold text-[#FFFAF0] cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Đặt lại đơn này</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-5 border-t border-[#E8D7B8] text-center text-xs text-[#786B5A]">
        BrewLite · Cà phê nguyên bản © 2026
      </footer>

      {/* Modal Biên nhận điện tử (Frame 07c) */}
      <ElectronicReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />

      {/* Modal Xác nhận hủy đơn (Frame 06f) */}
      {cancelTargetOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-order-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F3027]/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 id="cancel-order-title" className="font-serif text-2xl font-bold text-[#3F3027]">
                  Bạn muốn hủy đơn?
                </h3>
                <p className="text-xs sm:text-sm text-[#786B5A] mt-1">
                  Đơn hàng {cancelTargetOrder.orderCode} chưa được thanh toán. Nguyên liệu giữ chỗ sẽ được trả lại kho.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCancelTargetOrder(null)}
                className="w-9 h-9 rounded-full bg-[#F3E8D4] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-[#F3E8D4]/75 border border-[#E8D7B8] p-4 space-y-2 text-sm">
              <div className="flex justify-between font-bold text-[#3F3027]">
                <span>
                  {cancelTargetOrder.orderCode} · {cancelTargetOrder.items.length} món
                </span>
                <span className="text-[#7D3F32]">
                  {Number(cancelTargetOrder.finalAmount).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <p className="text-xs text-[#786B5A]">
                Chưa thu tiền nên không phát sinh giao dịch hoàn tiền ngân hàng.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCancelTargetOrder(null)}
                disabled={isMutating}
                className="flex-1 min-h-12 rounded-xl bg-[#E8D7B8] hover:bg-[#DDCCAE] font-bold text-sm text-[#3F3027] cursor-pointer"
              >
                Giữ lại đơn hàng
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmCancelOrder()}
                disabled={isMutating}
                className="flex-1 min-h-12 rounded-xl bg-[#B42318] hover:bg-[#991b1b] font-bold text-sm text-[#FFFAF0] cursor-pointer"
              >
                Xác nhận hủy đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tiến trình hoàn tiền (Frame 06e) */}
      {refundStatusOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="refund-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F3027]/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 id="refund-modal-title" className="font-serif text-2xl font-bold text-[#3F3027]">
                  Tiến trình hoàn tiền
                </h3>
                <p className="text-xs sm:text-sm text-[#786B5A] mt-1">
                  Đơn {refundStatusOrder.orderCode} ·{' '}
                  {Number(refundStatusOrder.finalAmount).toLocaleString('vi-VN')} đ đang trở về đúng nơi của bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefundStatusOrder(null)}
                className="w-9 h-9 rounded-full bg-[#F3E8D4] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <RefundProgressStepper
              amount={Number(refundStatusOrder.finalAmount)}
              paymentRefunded={refundStatusOrder.payment?.status === 'REFUNDED'}
            />

            <button
              type="button"
              onClick={() => setRefundStatusOrder(null)}
              className="w-full min-h-12 rounded-xl bg-[#7D3F32] hover:bg-[#693327] text-[#FFFAF0] font-bold text-sm cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F3E8D4] flex items-center justify-center text-sm text-[#786B5A]">
          Đang tải lịch sử đơn hàng &amp; thành viên...
        </div>
      }
    >
      <MyOrdersContent />
    </Suspense>
  );
}
