'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiClient } from '@/lib/api-client';
import { UserNav } from '@/components/UserNav';
import { LoyaltyBadge } from '@/components/LoyaltyBadge';
import { RedeemPointsInput } from '@/components/RedeemPointsInput';
import { loadPromotions } from '@/components/VoucherInput';
import { ErrorState, SkeletonLoading } from '@/components/UIStates';
import { formatOrderDateTime } from '@/components/ElectronicReceiptModal';
import { CheckCircle2, Copy, Gift, LogIn, Sparkles, Tag, X } from 'lucide-react';

interface PromotionItem {
  promoId: string;
  code: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number | null;
  expiresAt: string | null;
  remainingUses?: number | null;
}

interface LoyaltyTxRecord {
  id: string;
  orderCode?: string | null;
  type: 'EARN' | 'REDEEM' | 'REFUND';
  points: number;
  description?: string | null;
  createdAt: string;
}

/**
 * Trang Ưu đãi & Đổi điểm thành viên (Route chính thức /rewards)
 * Kết nối trực tiếp GET /api/v1/promotions/active, GET /api/v1/loyalty/balance và POST /api/v1/loyalty/redeem
 */
export default function RewardsPage() {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [promoLoading, setPromoLoading] = useState(true);
  const [promoError, setPromoError] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);
  const [loyaltyError, setLoyaltyError] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [memberName, setMemberName] = useState('Thành viên BrewLite');
  const [memberCode, setMemberCode] = useState('BL · MEMBER');
  const [loyaltyTxs, setLoyaltyTxs] = useState<LoyaltyTxRecord[]>([]);

  const [isRedeeming, setIsRedeeming] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchPromotions = useCallback(async () => {
    setPromoLoading(true);
    setPromoError('');
    try {
      const data = await loadPromotions();
      setPromotions(data);
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : 'Không tải được danh sách ưu đãi.');
    } finally {
      setPromoLoading(false);
    }
  }, []);

  const fetchLoyalty = useCallback(async () => {
    const token = ApiClient.getToken();
    if (!token) {
      setIsLoggedIn(false);
      setLoyaltyPoints(0);
      setLoyaltyTxs([]);
      setLoyaltyLoading(false);
      return;
    }

    setIsLoggedIn(true);
    setLoyaltyLoading(true);
    setLoyaltyError('');

    try {
      const cached = localStorage.getItem('brewlite_user_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.fullName) setMemberName(parsed.fullName);
      }
    } catch {
      // Bỏ qua cache lỗi định dạng
    }

    try {
      const res = await ApiClient.get<{
        loyaltyPoints: number;
        fullName?: string;
        memberCode?: string;
        transactions: LoyaltyTxRecord[];
      }>('/loyalty/balance');
      setLoyaltyPoints(res?.loyaltyPoints ?? 0);
      if (res?.fullName) setMemberName(res.fullName);
      if (res?.memberCode) setMemberCode(res.memberCode);
      setLoyaltyTxs(res?.transactions || []);
    } catch (err) {
      setLoyaltyError(err instanceof Error ? err.message : 'Không tải được thông tin điểm thưởng.');
    } finally {
      setLoyaltyLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPromotions();
    void fetchLoyalty();
  }, [fetchPromotions, fetchLoyalty]);

  const handleConfirmRedeem = async (payload: {
    pointsToRedeem: number;
    rewardId?: string;
    description?: string;
  }) => {
    setIsRedeeming(true);
    try {
      const res = await ApiClient.post<{ remainingPoints: number; message?: string }>(
        '/loyalty/redeem',
        payload,
      );
      setLoyaltyPoints(res.remainingPoints);
      await fetchLoyalty();
      showToast(res.message || `Đổi thành công ${payload.pointsToRedeem} Hạt!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể đổi Hạt lúc này.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Đã sao chép mã ${code}.`);
    } catch {
      showToast(`Mã ưu đãi: ${code}`);
    }
  };

  const money = (v: number) => `${v.toLocaleString('vi-VN')} đ`;

  return (
    <div className="min-h-screen bg-[#F3E8D4] text-[#3F3027] flex flex-col justify-between">
      <div>
        {/* Thanh điều hướng đồng bộ toàn hệ thống */}
        <header className="w-full bg-[#FFFAF0] border-b border-[#E8D7B8] py-3.5 sm:py-4 px-4 sm:px-10 lg:px-14 sticky top-0 z-30">
          <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-4">
            <Link href="/menu" className="flex flex-col group">
              <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-[#3F3027] leading-none">
                BrewLite
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-widest text-[#786B5A] font-semibold mt-1">
                CÀ PHÊ NGUYÊN BẢN
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-10 text-sm font-medium">
              <Link href="/menu" className="text-[#786B5A] hover:text-[#3F3027] transition-colors">
                Thực đơn
              </Link>
              <Link href="/orders" className="text-[#786B5A] hover:text-[#3F3027] transition-colors">
                Đơn hàng
              </Link>
              <Link
                href="/rewards"
                className="text-[#7D3F32] font-bold border-b-2 border-[#7D3F32] pb-0.5"
              >
                Ưu đãi
              </Link>
              <Link href="/profile" className="text-[#786B5A] hover:text-[#3F3027] transition-colors">
                Tài khoản
              </Link>
            </nav>

            <UserNav />
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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

          {/* Tiêu đề trang */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3F3027] tracking-tight">
                Ưu đãi &amp; Đổi Hạt thành viên
              </h1>
              <p className="text-sm text-[#786B5A] mt-1">
                Săn mã khuyến mãi đang mở và quy đổi Hạt tích lũy từ các đơn hàng của bạn.
              </p>
            </div>
            {isLoggedIn && <LoyaltyBadge points={loyaltyPoints} compact />}
          </div>

          {/* PHẦN 1: MÃ KHUYẾN MÃI TỪ HỆ THỐNG */}
          <section className="rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#7D3F32]" />
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3F3027]">
                  Mã khuyến mãi khả dụng
                </h2>
              </div>
              <Link
                href="/cart"
                className="text-xs sm:text-sm font-bold text-[#7D3F32] hover:underline"
              >
                Đến giỏ hàng áp mã →
              </Link>
            </div>

            {promoLoading ? (
              <SkeletonLoading count={2} />
            ) : promoError ? (
              <ErrorState message={promoError} onRetry={() => void fetchPromotions()} />
            ) : promotions.length === 0 ? (
              <p className="text-sm text-[#786B5A]">
                Hiện chưa có mã khuyến mãi nào đang mở.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {promotions.map((p) => (
                  <article
                    key={p.promoId}
                    className="rounded-2xl border border-[#DDCCAE] bg-white p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#7D3F32] bg-[#F3E8D4] px-2.5 py-1 rounded-lg">
                          {p.code}
                        </span>
                        {p.remainingUses != null && (
                          <span className="text-[11px] font-medium text-[#786B5A]">
                            Còn {p.remainingUses} lượt
                          </span>
                        )}
                      </div>
                      <p className="mt-2 font-bold text-base text-[#3F3027]">
                        Giảm{' '}
                        {p.discountType === 'PERCENTAGE'
                          ? `${p.discountValue}%`
                          : money(p.discountValue)}
                        {p.discountType === 'PERCENTAGE' && p.maxDiscountAmount !== null
                          ? ` · tối đa ${money(p.maxDiscountAmount)}`
                          : ''}
                      </p>
                      {p.description && (
                        <p className="mt-1 text-xs text-[#786B5A]">{p.description}</p>
                      )}
                      <p className="mt-2 text-xs text-[#786B5A]">
                        Đơn tối thiểu {money(p.minOrderValue)} · HSD{' '}
                        {p.expiresAt === null
                          ? 'Không giới hạn'
                          : new Date(p.expiresAt).toLocaleDateString('vi-VN', {
                              timeZone: 'Asia/Ho_Chi_Minh',
                            })}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleCopyCode(p.code)}
                      className="min-h-10 w-full rounded-xl bg-[#7D3F32] hover:bg-[#693327] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép mã {p.code}</span>
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* PHẦN 2: THẺ THÀNH VIÊN & ĐỔI HẠT THƯỞNG */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#7D3F32]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3F3027]">
                Tích lũy &amp; Đổi Hạt thưởng
              </h2>
            </div>

            {!isLoggedIn ? (
              <div className="rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-6 sm:p-8 text-center space-y-3">
                <p className="text-sm text-[#786B5A]">
                  Đăng nhập tài khoản BrewLite để xem số dư Hạt thực tế của bạn và đổi ưu đãi.
                </p>
                <Link
                  href="/login?redirect=/rewards"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#7D3F32] hover:bg-[#693327] px-5 text-sm font-bold text-[#FFFAF0]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập ngay</span>
                </Link>
              </div>
            ) : loyaltyLoading ? (
              <SkeletonLoading count={2} />
            ) : loyaltyError ? (
              <ErrorState message={loyaltyError} onRetry={() => void fetchLoyalty()} />
            ) : (
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
                      isRedeeming={isRedeeming}
                      onConfirmRedeem={handleConfirmRedeem}
                    />
                  </div>
                </div>

                {/* Lịch sử biến động Hạt thực tế */}
                <div className="rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D98236]" />
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#3F3027]">
                      Lịch sử tích &amp; đổi Hạt
                    </h3>
                  </div>

                  {loyaltyTxs.length === 0 ? (
                    <p className="text-sm text-[#786B5A]">
                      Tài khoản này chưa có giao dịch Hạt nào. Hoàn tất đơn hàng đầu tiên để tích Hạt!
                    </p>
                  ) : (
                    <div className="divide-y divide-[#E8D7B8]">
                      {loyaltyTxs.map((tx) => {
                        const isNegative = tx.type === 'REDEEM' || tx.points < 0;
                        const displayPts = isNegative
                          ? `−${Math.abs(tx.points)} Hạt`
                          : `+${tx.points} Hạt`;
                        return (
                          <div
                            key={tx.id}
                            className="py-3.5 flex items-center justify-between gap-4"
                          >
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
                                  {tx.description ||
                                    (tx.orderCode ? `Đơn ${tx.orderCode}` : 'Biến động Hạt')}
                                </p>
                                <p className="text-xs text-[#786B5A]">
                                  {formatOrderDateTime(tx.createdAt)}
                                </p>
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
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      <footer className="py-5 border-t border-[#E8D7B8] text-center text-xs text-[#786B5A]">
        BrewLite · Cà phê nguyên bản © 2026
      </footer>
    </div>
  );
}
