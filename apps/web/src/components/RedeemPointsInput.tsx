'use client';

import React, { useState } from 'react';
import { Gift, Sparkles, X, CheckCircle2, AlertCircle } from 'lucide-react';

export interface RewardOption {
  id: string;
  title: string;
  subtitle: string;
  pointsCost: number;
  discountValue: number;
}

export const LOYALTY_REWARD_CATALOG: RewardOption[] = [
  {
    id: 'OAT_MILK',
    title: 'Nâng cấp sữa yến mạch',
    subtitle: 'Miễn phí một lần nâng cấp loại sữa.',
    pointsCost: 50,
    discountValue: 10000,
  },
  {
    id: 'VOUCHER_15K',
    title: 'Ưu đãi 15.000 đ',
    subtitle: 'Áp dụng cho đơn từ 50.000 đ.',
    pointsCost: 100,
    discountValue: 15000,
  },
  {
    id: 'CROISSANT',
    title: 'Bánh sừng bò trong ngày',
    subtitle: 'Một chiếc bánh bơ thơm, giòn mới.',
    pointsCost: 150,
    discountValue: 32000,
  },
];

export interface RedemptionValidationResult {
  valid: boolean;
  reason?: string;
  discountAmount: number;
  remainingPoints: number;
}

/**
 * Thẩm định quy tắc đổi Hạt tại Client khớp 100% Backend (BR-06.4: >=10 Hạt, 1 Hạt=1.000đ, max 50% đơn)
 */
export function validatePointsRedemption(
  currentPoints: number,
  pointsToRedeem: number,
  orderSubtotal?: number,
): RedemptionValidationResult {
  const safeCurrent = Math.max(0, Math.floor(Number(currentPoints) || 0));
  const safeRedeem = Math.floor(Number(pointsToRedeem) || 0);

  if (!Number.isFinite(pointsToRedeem) || safeRedeem <= 0) {
    return {
      valid: false,
      reason: 'Vui lòng nhập số Hạt muốn quy đổi lớn hơn 0.',
      discountAmount: 0,
      remainingPoints: safeCurrent,
    };
  }

  if (safeRedeem < 10) {
    return {
      valid: false,
      reason: 'Mức quy đổi tối thiểu mỗi lần là 10 Hạt.',
      discountAmount: 0,
      remainingPoints: safeCurrent,
    };
  }

  if (safeRedeem > safeCurrent) {
    return {
      valid: false,
      reason: `Số dư Hạt không đủ (hiện có ${safeCurrent} Hạt, không thể âm điểm).`,
      discountAmount: 0,
      remainingPoints: safeCurrent,
    };
  }

  const discountAmount = safeRedeem * 1000;
  if (typeof orderSubtotal === 'number' && orderSubtotal > 0) {
    const maxDiscount = Math.floor(orderSubtotal * 0.5);
    if (discountAmount > maxDiscount) {
      return {
        valid: false,
        reason: `Mức giảm tối đa 50% giá trị đơn hàng (${maxDiscount.toLocaleString('vi-VN')} đ).`,
        discountAmount: 0,
        remainingPoints: safeCurrent,
      };
    }
  }

  return {
    valid: true,
    discountAmount,
    remainingPoints: safeCurrent - safeRedeem,
  };
}

export interface RedeemPointsInputProps {
  currentPoints: number;
  rewards?: RewardOption[];
  isRedeeming?: boolean;
  onConfirmRedeem: (payload: { pointsToRedeem: number; rewardId?: string; description?: string }) => Promise<void> | void;
}

/**
 * Component Danh mục đổi quà & Modal xác nhận đổi Hạt (Figma Frame 08 & 08b)
 */
export function RedeemPointsInput({
  currentPoints,
  rewards = LOYALTY_REWARD_CATALOG,
  isRedeeming = false,
  onConfirmRedeem,
}: RedeemPointsInputProps) {
  const [selectedReward, setSelectedReward] = useState<RewardOption | null>(null);
  const [customPointsInput, setCustomPointsInput] = useState<string>('10');
  const [customError, setCustomError] = useState<string | null>(null);
  const [pendingCustomRedeem, setPendingCustomRedeem] = useState<number | null>(null);

  const handleOpenRewardModal = (reward: RewardOption) => {
    setCustomError(null);
    setPendingCustomRedeem(null);
    setSelectedReward(reward);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(customPointsInput);
    const check = validatePointsRedemption(currentPoints, numeric);
    if (!check.valid) {
      setCustomError(check.reason || 'Số Hạt không hợp lệ.');
      return;
    }
    setCustomError(null);
    setSelectedReward(null);
    setPendingCustomRedeem(Math.floor(numeric));
  };

  const activeModalPoints = selectedReward
    ? selectedReward.pointsCost
    : pendingCustomRedeem ?? 0;
  const activeModalTitle = selectedReward
    ? `${selectedReward.title} miễn phí`
    : `Quy đổi ${activeModalPoints} Hạt thành ưu đãi ${(activeModalPoints * 1000).toLocaleString('vi-VN')} đ`;
  const activeModalSubtitle = selectedReward
    ? selectedReward.subtitle
    : 'Áp dụng trực tiếp thành mã giảm giá cho đơn đồ uống tiếp theo của bạn.';
  const remainingAfter = Math.max(0, currentPoints - activeModalPoints);

  const handleConfirm = async () => {
    if (activeModalPoints <= 0) return;
    await onConfirmRedeem({
      pointsToRedeem: activeModalPoints,
      rewardId: selectedReward?.id,
      description: selectedReward
        ? `Đổi quà thành viên: ${selectedReward.title}`
        : `Quy đổi ${activeModalPoints} Hạt thưởng (${(activeModalPoints * 1000).toLocaleString('vi-VN')} đ)`,
    });
    setSelectedReward(null);
    setPendingCustomRedeem(null);
  };

  return (
    <div data-testid="redeem-points-section" className="rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#3F3027]">
            Đổi Hạt, nhận quà
          </h3>
          <p className="text-xs sm:text-sm text-[#786B5A] mt-0.5">
            Sử dụng Hạt tích lũy để nâng cấp món hoặc quy đổi ưu đãi trực tiếp.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F5E9D8] px-3 py-1 text-xs font-bold text-[#7D3F32] border border-[#E8D7B8]">
          <Sparkles className="w-3.5 h-3.5 text-[#D98236]" />
          {currentPoints} Hạt
        </span>
      </div>

      {/* 3 Quà tặng mẫu theo Figma Frame 08 */}
      <div className="space-y-3">
        {rewards.map((reward) => {
          const canAfford = currentPoints >= reward.pointsCost;
          return (
            <div
              key={reward.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#F3E8D4]/55 border border-[#E8D7B8] p-4 transition-colors hover:border-[#7D3F32]/40"
            >
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#7D3F32]">
                  <Gift className="w-3.5 h-3.5 text-[#D98236]" />
                  {reward.pointsCost} Hạt
                </span>
                <p className="text-base font-bold text-[#3F3027]">{reward.title}</p>
                <p className="text-xs text-[#786B5A]">{reward.subtitle}</p>
              </div>

              <button
                type="button"
                disabled={!canAfford || isRedeeming}
                onClick={() => handleOpenRewardModal(reward)}
                className={`min-h-11 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shrink-0 ${
                  canAfford
                    ? 'bg-[#7D3F32] hover:bg-[#693327] text-[#FFFAF0] cursor-pointer shadow-2xs'
                    : 'bg-[#E8D7B8] text-[#786B5A] cursor-not-allowed'
                }`}
              >
                {canAfford ? 'Đổi quà' : `Thiếu ${reward.pointsCost - currentPoints} Hạt`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Quy đổi số Hạt tùy chỉnh */}
      <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-[#E8D7B8] space-y-2.5">
        <label htmlFor="custom-points-input" className="block text-xs font-bold text-[#3F3027] uppercase tracking-wider">
          Hoặc nhập số Hạt muốn quy đổi (tối thiểu 10 Hạt · 1 Hạt = 1.000 đ)
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            id="custom-points-input"
            type="number"
            min={10}
            max={Math.max(10, currentPoints)}
            value={customPointsInput}
            onChange={(e) => {
              setCustomPointsInput(e.target.value);
              setCustomError(null);
            }}
            className="flex-1 min-h-11 rounded-xl border border-[#DDCCAE] bg-white px-3.5 text-sm font-semibold text-[#3F3027] focus:border-[#7D3F32] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isRedeeming || currentPoints < 10}
            className="min-h-11 px-5 rounded-xl border border-[#7D3F32] text-[#7D3F32] hover:bg-[#7D3F32] hover:text-[#FFFAF0] disabled:border-[#DDCCAE] disabled:text-[#786B5A] disabled:bg-transparent text-sm font-bold transition-colors cursor-pointer"
          >
            Quy đổi nhanh
          </button>
        </div>
        {customError && (
          <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-[#B42318]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{customError}</span>
          </p>
        )}
      </form>

      {/* Modal Xác nhận đổi Hạt (Figma Frame 08b) */}
      {(selectedReward || pendingCustomRedeem) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="redeem-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F3027]/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F5E9D8] px-3 py-1 text-[11px] font-bold text-[#7D3F32] border border-[#E8D7B8]">
                  <Gift className="w-3.5 h-3.5 text-[#D98236]" />
                  Quà dành cho thành viên
                </span>
                <h4 id="redeem-modal-title" className="mt-3 font-serif text-2xl font-bold text-[#3F3027]">
                  {activeModalTitle}
                </h4>
                <p className="mt-1 text-sm text-[#786B5A]">{activeModalSubtitle}</p>
              </div>
              <button
                type="button"
                aria-label="Đóng hộp thoại đổi quà"
                onClick={() => {
                  setSelectedReward(null);
                  setPendingCustomRedeem(null);
                }}
                className="w-9 h-9 rounded-full bg-[#F3E8D4] text-[#3F3027] flex items-center justify-center hover:bg-[#E8D7B8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 cột Hạt hiện có / Hạt sử dụng / Hạt còn lại khớp Frame 08b */}
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[#F3E8D4]/75 border border-[#E8D7B8] p-4 text-center">
              <div>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-[#3F3027]">
                  {currentPoints}
                </p>
                <p className="text-[11px] text-[#786B5A] font-semibold mt-1">Hạt hiện có</p>
              </div>
              <div>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-[#B42318]">
                  −{activeModalPoints}
                </p>
                <p className="text-[11px] text-[#786B5A] font-semibold mt-1">Hạt sử dụng</p>
              </div>
              <div>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-[#246344]">
                  {remainingAfter}
                </p>
                <p className="text-[11px] text-[#786B5A] font-semibold mt-1">Hạt còn lại</p>
              </div>
            </div>

            <p className="text-xs text-[#786B5A] leading-relaxed">
              Quà tặng hoặc ưu đãi sẽ được trừ trực tiếp từ số dư Hạt thành viên của bạn và ghi nhận vào lịch sử giao dịch.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                disabled={isRedeeming}
                onClick={handleConfirm}
                className="flex-1 min-h-12 rounded-xl bg-[#7D3F32] hover:bg-[#693327] text-[#FFFAF0] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận đổi quà • {activeModalPoints} Hạt</span>
              </button>
              <button
                type="button"
                disabled={isRedeeming}
                onClick={() => {
                  setSelectedReward(null);
                  setPendingCustomRedeem(null);
                }}
                className="sm:w-36 min-h-12 rounded-xl bg-[#E8D7B8] hover:bg-[#DDCCAE] text-[#3F3027] font-bold text-sm cursor-pointer transition-colors"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
