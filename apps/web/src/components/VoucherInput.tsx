'use client';

import { useEffect, useRef, useState } from 'react';
import { useCartStore } from '../lib/store';

type Promotion = {
  promoId: string; code: string; description: string | null; discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number; minOrderValue: number; maxDiscountAmount: number | null; expiresAt: string | null;
  remainingUses?: number | null; firstOrderOnly?: boolean; deliveryOnly?: boolean;
};
const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');
const api = `${apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`}/promotions`;
const money = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

export async function loadPromotions(): Promise<Promotion[]> {
  const response = await fetch(`${api}/active`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Không tải được ưu đãi. Vui lòng thử lại.');
  const data = await response.json();
  if (!Array.isArray(data) || !data.every(p => p && typeof p.promoId === 'string' && typeof p.code === 'string' &&
    (p.description === null || typeof p.description === 'string') && ['PERCENTAGE', 'FIXED_AMOUNT'].includes(p.discountType) &&
    Number.isFinite(p.discountValue) && p.discountValue >= 0 && Number.isFinite(p.minOrderValue) && p.minOrderValue >= 0 &&
    (p.maxDiscountAmount === null || (Number.isFinite(p.maxDiscountAmount) && p.maxDiscountAmount >= 0)) &&
    (p.expiresAt === null || (typeof p.expiresAt === 'string' && Number.isFinite(Date.parse(p.expiresAt)))))) throw new Error('Dữ liệu ưu đãi không hợp lệ');
  return data;
}

export async function validatePromotion(code: string, subtotal: number, deliveryMethod?: string) {
  const response = await fetch(`${api}/validate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.trim().toUpperCase(), cartSubtotal: subtotal, ...(deliveryMethod ? { deliveryMethod } : {}) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result?.message === 'string' ? result.message : 'Không thể áp dụng mã khuyến mãi');
  if (!result || typeof result.promoId !== 'string' || typeof result.code !== 'string' || !Number.isSafeInteger(result.discountAmount) ||
    result.discountAmount < 0 || result.discountAmount > subtotal || !Number.isFinite(result.minOrderValue) ||
    result.minOrderValue < 0 || result.minOrderValue > subtotal) throw new Error('Phản hồi khuyến mãi không hợp lệ');
  return { code: result.code as string, discountAmount: result.discountAmount as number };
}

export function PromotionCard({ promotion: p, subtotal, busy, onApply, selected = false, onRemove, deliveryMethod = 'PICKUP' }: {
  promotion: Promotion; subtotal: number; busy: boolean; onApply: (code: string) => void;
  selected?: boolean; onRemove?: () => void; deliveryMethod?: string;
}) {
  const missing = Math.max(0, p.minOrderValue - subtotal);
  const restriction = p.firstOrderOnly ? 'Chỉ đơn đầu tiên.'
    : p.deliveryOnly && deliveryMethod !== 'DELIVERY' ? 'Chỉ áp dụng giao hàng.' : '';
  const unavailable = missing > 0 || subtotal <= 0 || !!restriction || p.remainingUses === 0 || (p.expiresAt !== null && Date.parse(p.expiresAt) < Date.now());
  return <article className="rounded-xl border border-[#DDCCAE] bg-[#FFFCF5] p-3">
    <h4 className="font-bold text-[#7D3F32]">{p.code}</h4>
    <p className="text-sm font-semibold">Giảm {p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : money(p.discountValue)}{p.discountType === 'PERCENTAGE' && p.maxDiscountAmount !== null ? ` · tối đa ${money(p.maxDiscountAmount)}` : ''}</p>
    {p.description && <p className="mt-1 text-sm">{p.description}</p>}
    <p className="mt-1 text-xs text-[#786B5A]">Đơn tối thiểu {money(p.minOrderValue)} · HSD {p.expiresAt === null ? 'Không giới hạn' : new Date(p.expiresAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
    {missing > 0 && <p className="mt-2 text-xs">Mua thêm {money(missing)} để sử dụng mã</p>}
    {p.remainingUses != null && <p className="mt-1 text-xs">Còn {p.remainingUses} lượt</p>}
    {restriction && <p className="mt-2 text-xs">{restriction}</p>}
    <button type="button" disabled={busy || (!selected && unavailable)} onClick={() => selected ? onRemove?.() : onApply(p.code)}
      aria-pressed={selected} aria-label={`${selected ? 'Bỏ áp dụng' : 'Áp dụng'} mã ${p.code}`} className="mt-2 min-h-11 rounded-lg bg-[#7D3F32] px-4 text-sm font-semibold text-white disabled:opacity-50">{selected ? 'Bỏ áp dụng' : 'Áp dụng'}</button>
  </article>;
}

export default function VoucherInput({ deliveryMethod = 'PICKUP' }: { deliveryMethod?: string }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const [error, setError] = useState('');
  const [offers, setOffers] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const { items, appliedVoucher, setAppliedVoucher, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setListError('');
    loadPromotions().then(data => { if (!cancelled) setOffers(data); })
      .catch(() => { if (!cancelled) setListError('Không tải được ưu đãi. Vui lòng thử lại.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt]);
  const apply = async (selectedCode: string) => {
    if (pending.current || !items.length || !selectedCode.trim()) return;
    pending.current = true; setBusy(true); setError('');
    const snapshot = items;
    let changed = false;
    const unsubscribe = useCartStore.subscribe(state => { if (state.items !== snapshot) changed = true; });
    try {
      const result = await validatePromotion(selectedCode, subtotal, deliveryMethod);
      if (!alive.current) return;
      if (changed) { setError('Giỏ hàng đã thay đổi. Vui lòng áp dụng lại mã.'); return; }
      setAppliedVoucher(result); setCode('');
    } catch (reason) {
      if (!changed && alive.current) { setAppliedVoucher(null); setError(reason instanceof Error ? reason.message : 'Không thể kết nối máy chủ'); }
    } finally { unsubscribe(); pending.current = false; setBusy(false); }
  };
  return <div className="space-y-3">
    <h3 className="font-semibold">Ưu đãi khả dụng</h3>
    {loading ? <p role="status" className="text-sm">Đang tải ưu đãi…</p> : listError ? <div role="alert" className="text-sm"><p>{listError}</p><button type="button" onClick={() => setAttempt(n => n + 1)} className="min-h-11 underline">Thử lại</button></div> : offers.length ?
      <div className="grid gap-3">{offers.map(p => <PromotionCard key={p.promoId} promotion={p} subtotal={subtotal} busy={busy} onApply={apply} deliveryMethod={deliveryMethod} selected={appliedVoucher?.code === p.code} onRemove={() => setAppliedVoucher(null)} />)}</div> : <p className="text-sm">Chưa có ưu đãi khả dụng.</p>}
    <form onSubmit={event => { event.preventDefault(); void apply(code); }} className="space-y-2">
      <label htmlFor="voucher-code" className="block text-sm font-semibold">Nhập mã khác</label>
      <div className="flex gap-2">
        <input id="voucher-code" value={code} onChange={e => setCode(e.target.value)} maxLength={50} disabled={!items.length || busy} placeholder="Nhập mã ưu đãi" className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#DDCCAE] bg-[#F3E8D4] px-3 uppercase" />
        <button disabled={!items.length || !code.trim() || busy} className="min-h-11 rounded-lg bg-[#7D3F32] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang kiểm tra…' : 'Áp dụng'}</button>
      </div>
    </form>
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    {appliedVoucher && <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#EADBC2] px-3 text-sm"><span>Đã áp dụng {appliedVoucher.code} · Giảm {money(appliedVoucher.discountAmount)}</span><button type="button" onClick={() => setAppliedVoucher(null)} className="min-h-11 underline">Hủy mã</button></div>}
    <p className="text-xs text-[#786B5A]">Mỗi đơn dùng một mã. Thay đổi giỏ hàng sẽ hủy mã đã áp dụng.</p>
  </div>;
}
