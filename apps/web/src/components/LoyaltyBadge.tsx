'use client';

import React from 'react';
import { Award, Sparkles, QrCode } from 'lucide-react';

export interface LoyaltyTierSummary {
  tierName: string;
  nextTierName: string | null;
  targetPoints: number;
  remainingPoints: number;
  progressPercent: number;
}

/**
 * Quy đổi tiền thanh toán -> Hạt thưởng theo BR-06.3: floor(amount / 10.000đ)
 */
export function calculateEarnedPoints(finalAmount: number): number {
  const safe = Number(finalAmount);
  if (!Number.isFinite(safe) || safe <= 0) return 0;
  return Math.floor(safe / 10000);
}

/**
 * Tính hạng thành viên & thanh tiến độ (khớp Figma 08: 420 / 500 Hạt -> Kim Cương)
 */
export function calculateLoyaltyTier(points: number): LoyaltyTierSummary {
  const safePoints = Math.max(0, Math.floor(Number(points) || 0));
  if (safePoints >= 500) {
    return {
      tierName: 'THÀNH VIÊN KIM CƯƠNG',
      nextTierName: null,
      targetPoints: 500,
      remainingPoints: 0,
      progressPercent: 100,
    };
  }
  if (safePoints >= 200) {
    return {
      tierName: 'THÀNH VIÊN VÀNG',
      nextTierName: 'Kim Cương',
      targetPoints: 500,
      remainingPoints: 500 - safePoints,
      progressPercent: Math.min(100, Math.round((safePoints / 500) * 100)),
    };
  }
  return {
    tierName: 'THÀNH VIÊN BẠC',
    nextTierName: 'Vàng',
    targetPoints: 200,
    remainingPoints: 200 - safePoints,
    progressPercent: Math.min(100, Math.round((safePoints / 200) * 100)),
  };
}

export interface LoyaltyBadgeProps {
  points: number;
  memberName?: string;
  memberCode?: string;
  compact?: boolean;
}

/**
 * Component hiển thị Thẻ thành viên & Thanh tiến độ nâng hạng (Figma Frame 08 · Thành viên)
 */
export function LoyaltyBadge({
  points,
  memberName = 'Hàn Minh Hiếu',
  memberCode = 'BL · 000 024',
  compact = false,
}: LoyaltyBadgeProps) {
  const safePoints = Math.max(0, Math.floor(Number(points) || 0));
  const tier = calculateLoyaltyTier(safePoints);

  if (compact) {
    return (
      <span
        data-testid="loyalty-badge-compact"
        className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFAF0] border border-[#E8D7B8] px-3 py-1 text-xs font-semibold text-[#7D3F32] shadow-2xs"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#D98236]" />
        <span>{safePoints} Hạt</span>
      </span>
    );
  }

  return (
    <div data-testid="loyalty-member-card" className="space-y-4">
      {/* Thẻ Thành Viên Vàng (Thiết kế ấm BrewLite matching Frame 08) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7D3F32] via-[#683227] to-[#3F3027] p-6 text-[#FFFAF0] shadow-lg border border-[#8E4B3C]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-serif text-xl font-bold tracking-tight text-[#FFFAF0]">BrewLite</p>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#FFFAF0]/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-[#F7DDA8]">
              <Award className="w-3 h-3 text-[#D98236]" />
              <span>{tier.tierName}</span>
            </div>
          </div>

          <div className="rounded-xl bg-[#FFFAF0] p-2 text-[#3F3027] shadow-xs" title="Mã thành viên tại quầy">
            <QrCode className="w-12 h-12" />
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-[#F3E8D4]/90">{memberName}</p>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span className="font-serif text-5xl font-bold tracking-tight text-[#FFFAF0]">
              {safePoints}
            </span>
            <span className="text-xs font-bold tracking-widest uppercase text-[#F7DDA8]">
              HẠT TÍCH LŨY
            </span>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#FFFAF0]/15 flex items-center justify-between text-xs text-[#F3E8D4]/80 font-mono">
          <span>{memberCode}</span>
          <span>1 Hạt = 1.000 đ ưu đãi</span>
        </div>
      </div>

      {/* Thẻ Tiến độ nâng hạng */}
      <div className="rounded-2xl bg-[#FFFAF0] border border-[#E8D7B8] p-4 shadow-2xs">
        <div className="flex items-center justify-between gap-2 text-sm font-semibold text-[#3F3027]">
          <span>
            {tier.nextTierName
              ? `Thêm ${tier.remainingPoints} Hạt để lên ${tier.nextTierName}`
              : 'Bạn đã đạt hạng Thành viên Kim Cương cao nhất!'}
          </span>
          <Sparkles className="w-4 h-4 text-[#D98236] shrink-0" />
        </div>

        <div
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#F3E8D4] border border-[#E8D7B8]"
          role="progressbar"
          aria-valuenow={safePoints}
          aria-valuemin={0}
          aria-valuemax={tier.targetPoints}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#D98236] to-[#7D3F32] transition-all duration-500"
            style={{ width: `${tier.progressPercent}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-[#786B5A] font-medium">
          <span>
            {safePoints} / {tier.targetPoints} Hạt
          </span>
          <span>{tier.progressPercent}%</span>
        </div>
      </div>
    </div>
  );
}
