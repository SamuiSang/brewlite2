'use client';

import React from 'react';
import { CheckCircle2, X, Download } from 'lucide-react';

export interface OrderRecordItem {
  id: string;
  productId: string;
  productName: string;
  size: string;
  sugarLevel: string;
  iceLevel: string;
  toppings?: any;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderRecord {
  id: string;
  orderCode: string;
  userId?: string;
  status: string;
  subtotalAmount: number;
  discountAmount: number;
  loyaltyPointsUsed?: number;
  finalAmount: number;
  note: string | null;
  expiresAt?: string | Date | null;
  createdAt: string | Date;
  customerName?: string | null;
  promotionCode?: string | null;
  items: OrderRecordItem[];
  payment?: {
    id: string;
    method: string;
    status: string;
    amount: number;
    transactionRef?: string | null;
    paidAt?: string | Date | null;
  } | null;
  statusLogs?: Array<{
    id: string;
    previousStatus: string | null;
    newStatus: string;
    changedBy?: string | null;
    reason?: string | null;
    createdAt: string | Date;
  }>;
}

/**
 * Định dạng ngày giờ Việt Nam gọn gàng theo chuẩn Figma (VD: 11/11/2026 · 09:42)
 */
export function formatOrderDateTime(input: string | Date | null | undefined): string {
  if (!input) return 'Vừa xong';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return String(input);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} · ${hh}:${min}`;
}

/**
 * QR minh họa nhận món / tra cứu biên nhận tạo bằng SVG nội bộ (không dùng link ảnh tạm)
 */
export function PickupQrSvg({ code, size = 180 }: { code: string; size?: number }) {
  const seed = (code || 'BL-8924')
    .split('')
    .reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 3), 0);

  const cells: Array<{ x: number; y: number }> = [];
  const grid = 9;
  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
      const inCorner =
        (row < 3 && col < 3) ||
        (row < 3 && col >= grid - 3) ||
        (row >= grid - 3 && col < 3);
      if (inCorner) continue;
      if ((seed + row * 7 + col * 13) % 3 !== 0) {
        cells.push({ x: col * 10 + 15, y: row * 10 + 15 });
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Mã QR nhận món ${code}`}
      className="rounded-xl border border-[#E8D7B8] bg-[#FFFAF0] p-2"
    >
      <rect x="8" y="8" width="26" height="26" rx="4" fill="none" stroke="#3F3027" strokeWidth="4" />
      <rect x="16" y="16" width="10" height="10" rx="1.5" fill="#7D3F32" />
      <rect x="86" y="8" width="26" height="26" rx="4" fill="none" stroke="#3F3027" strokeWidth="4" />
      <rect x="94" y="16" width="10" height="10" rx="1.5" fill="#7D3F32" />
      <rect x="8" y="86" width="26" height="26" rx="4" fill="none" stroke="#3F3027" strokeWidth="4" />
      <rect x="16" y="94" width="10" height="10" rx="1.5" fill="#7D3F32" />
      {cells.map((cell, idx) => (
        <rect key={idx} x={cell.x} y={cell.y} width="7" height="7" rx="1.5" fill="#3F3027" />
      ))}
    </svg>
  );
}

export interface ElectronicReceiptModalProps {
  order: OrderRecord | null;
  onClose: () => void;
}

/**
 * Modal Phiếu Biên Nhận Điện Tử khớp Figma Frame 07c · Biên nhận điện tử BL-8924
 */
export function ElectronicReceiptModal({ order, onClose }: ElectronicReceiptModalProps) {
  if (!order) return null;

  const isPaid = ['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(order.status.toUpperCase());
  const isRefunded = order.payment?.status === 'REFUNDED';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="electronic-receipt-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F3027]/65 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-[#FFFAF0] border border-[#E8D7B8] shadow-2xl overflow-hidden">
        <div className="overflow-y-auto p-6 space-y-5">
          {/* Header biên nhận */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-serif text-2xl font-bold text-[#7D3F32]">BrewLite</p>
              <h3 id="electronic-receipt-title" className="font-serif text-xl font-bold text-[#3F3027] mt-1">
                Biên nhận điện tử
              </h3>
              <span
                className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                  isRefunded
                    ? 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
                    : isPaid
                      ? 'bg-[#E7F0E9] text-[#246344] border-[#A7CEB5]'
                      : order.status === 'CANCELLED'
                        ? 'bg-[#FDECEC] text-[#B42318] border-[#F5C2C0]'
                        : 'bg-[#F5E9D8] text-[#754416] border-[#DDCCAE]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isRefunded
                  ? 'Đã hoàn tiền'
                  : isPaid
                    ? 'Đã thanh toán'
                    : order.status === 'CANCELLED'
                      ? 'Đã hủy'
                      : 'Chưa thanh toán'}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="w-9 h-9 rounded-full bg-[#F3E8D4] text-[#3F3027] flex items-center justify-center hover:bg-[#E8D7B8] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Metadata đơn hàng */}
          <div className="space-y-2 text-sm border-y border-[#E8D7B8] py-4">
            <div className="flex justify-between gap-4">
              <span className="text-[#786B5A]">Mã đơn</span>
              <span className="font-mono font-bold text-[#3F3027]">{order.orderCode}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#786B5A]">Ngày giờ</span>
              <span className="font-medium text-[#3F3027]">{formatOrderDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#786B5A]">Chi nhánh</span>
              <span className="font-medium text-[#3F3027]">BrewLite · Quận 1</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#786B5A]">Khách hàng</span>
              <span className="font-medium text-[#3F3027]">{order.customerName || 'Thành viên BrewLite'}</span>
            </div>
          </div>

          {/* Danh sách món */}
          <div className="space-y-4">
            {order.items.map((item) => {
              const toppingsList = Array.isArray(item.toppings) ? item.toppings.join(', ') : '';
              return (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#3F3027]">
                      {item.quantity} × {item.productName}
                    </p>
                    <p className="text-xs text-[#786B5A] mt-0.5">
                      Cỡ {item.size} · {item.sugarLevel} đường · {item.iceLevel} đá
                      {toppingsList ? ` · ${toppingsList}` : ''}
                    </p>
                  </div>
                  <p className="font-semibold text-[#3F3027] shrink-0">
                    {Number(item.lineTotal).toLocaleString('vi-VN')} đ
                  </p>
                </div>
              );
            })}
          </div>

          {/* Tổng kết tiền */}
          <div className="border-t border-[#E8D7B8] pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-[#786B5A]">
              <span>Tạm tính</span>
              <span>{Number(order.subtotalAmount).toLocaleString('vi-VN')} đ</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-[#246344] font-medium">
                <span>
                  Ưu đãi {order.promotionCode ? `(${order.promotionCode})` : ''}
                  {order.loyaltyPointsUsed ? ` + ${order.loyaltyPointsUsed} Hạt` : ''}
                </span>
                <span>−{Number(order.discountAmount).toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="flex justify-between text-[#786B5A]">
              <span>Phí đóng gói</span>
              <span>0 đ</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-[#DDCCAE]">
              <span className="font-bold text-[#3F3027]">
                {isPaid ? 'Tổng đã thanh toán' : 'Tổng giá trị đơn'}
              </span>
              <span className="font-serif text-2xl font-bold text-[#7D3F32]">
                {Number(order.finalAmount).toLocaleString('vi-VN')} đ
              </span>
            </div>
            <p className="text-xs text-[#786B5A]">
              Giá đã gồm VAT · {order.payment?.method || 'VNPay Sandbox / QR thử nghiệm'}
            </p>
          </div>

          {/* QR tra cứu */}
          <div className="flex items-center gap-4 rounded-2xl bg-[#F3E8D4]/75 border border-[#E8D7B8] p-4">
            <PickupQrSvg code={order.orderCode} size={84} />
            <div className="text-xs space-y-1">
              <p className="font-bold text-[#3F3027]">Tra cứu biên nhận {order.orderCode}</p>
              <p className="text-[#786B5A] leading-relaxed">
                Biên nhận điện tử xác nhận giao dịch trong hệ thống BrewLite 2.
              </p>
            </div>
          </div>
        </div>

        {/* Footer action */}
        <div className="border-t border-[#E8D7B8] bg-[#FFFAF0] px-6 py-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => typeof window !== 'undefined' && window.print()}
            className="sm:w-44 min-h-12 rounded-xl border border-[#7D3F32] text-[#7D3F32] hover:bg-[#F3E8D4] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>In / Lưu PDF</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-12 rounded-xl bg-[#7D3F32] hover:bg-[#693327] text-[#FFFAF0] font-bold text-sm cursor-pointer transition-colors"
          >
            Đóng biên nhận
          </button>
        </div>
      </div>
    </div>
  );
}
