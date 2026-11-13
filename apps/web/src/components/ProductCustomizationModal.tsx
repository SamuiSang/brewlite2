'use client';

import { useEffect, useRef, useState } from 'react';
import type { Product } from '../types/product';
import { CartOptions, Topping, previewUnitPrice } from '../store/useCartStore';
import { CartItem, cartItemKey, useCartStore } from '../lib/store';

export default function ProductCustomizationModal({ product, toppings, onClose, editingItem }: {
  product: Product; toppings: Topping[]; onClose: () => void; editingItem?: CartItem;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [options, setOptions] = useState<CartOptions>({
    size: editingItem?.size || 'S', sugar: editingItem?.sugarLevel || '100%', ice: editingItem?.iceLevel || '100%',
    toppings: toppings.filter(t => editingItem?.toppings?.includes(t.id)),
  });
  const [quantity, setQuantity] = useState(editingItem?.quantity || 1);
  const [error, setError] = useState('');
  const items = useCartStore(s => s.items);
  const otherItems = editingItem ? items.filter(i => cartItemKey(i) !== cartItemKey(editingItem)) : items;
  const availableStock = Math.min(product.availableStock, ...otherItems.filter(i => i.productId === product.id).map(i => i.availableStock ?? product.availableStock));
  const remaining = Math.max(0, Math.min(100 - otherItems.reduce((n, i) => n + i.quantity, 0),
    availableStock - otherItems.filter(i => i.productId === product.id).reduce((n, i) => n + i.quantity, 0)));
  useEffect(() => { dialog.current?.showModal(); }, []);
  const money = (n: number) => `${n.toLocaleString('vi-VN')} đ`;
  return <dialog ref={dialog} onCancel={onClose} onClose={onClose} aria-labelledby="customize-title"
    className="m-auto max-h-[90dvh] w-[calc(100%-32px)] max-w-3xl overflow-auto rounded-2xl bg-[#FFFCF5] p-5 text-[#3F3027] backdrop:bg-black/40 sm:p-8">
    <button type="button" onClick={onClose} aria-label="Đóng tùy biến món" className="float-right min-h-11 min-w-11 rounded-full border">×</button>
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl || '/images/drinks/ca-phe-muoi-con-dao.jpg'} alt={product.name} className="aspect-square w-full rounded-xl object-cover" />
        <h2 id="customize-title" className="mt-4 text-xl font-bold">{product.name}</h2>
        <p className="mt-2 font-semibold text-[#7D4435]">{money(product.basePrice)}</p>
        <p className="mt-3 text-sm">{product.description}</p>
      </div>
      <form onSubmit={event => {
        event.preventDefault();
        try {
          if (!product.isActive || product.isSoldOut) throw new Error('Món đã hết hàng');
          const updated: CartItem = {
            productId: product.id, name: product.name, category: product.category, imageUrl: product.imageUrl,
            size: options.size, sugarLevel: options.sugar, iceLevel: options.ice,
            toppings: options.toppings.map(t => t.id), quantity,
            unitPrice: previewUnitPrice(product, options), availableStock: product.availableStock,
            product, toppingOptions: toppings,
            optionsDesc: `Size ${options.size} · ${options.sugar} đường · ${options.ice} đá${options.toppings.length ? ` · ${options.toppings.map(t => t.name).join(', ')}` : ''}`,
          };
          if (editingItem) useCartStore.getState().replaceItem(cartItemKey(editingItem), updated);
          else useCartStore.getState().addItem(updated);
          onClose();
        }
        catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể thêm món'); }
      }} className="space-y-5">
        <fieldset><legend className="mb-2 font-semibold">Kích cỡ · Bắt buộc</legend>
          {(['S', 'M', 'L'] as const).map((size, index) => <label key={size} className="my-1 flex min-h-11 items-center gap-3 rounded-lg bg-[#F3E9D2] px-3">
            <input type="radio" name="size" checked={options.size === size} onChange={() => setOptions({ ...options, size })} />
            <span className="flex-1">{size === 'S' ? 'Nhỏ' : size === 'M' ? 'Vừa' : 'Lớn'} ({size})</span><span>+{money([0, 6000, 10000][index])}</span>
          </label>)}
        </fieldset>
        {(['sugar', 'ice'] as const).map(key => <fieldset key={key}><legend className="mb-2 font-semibold">Mức {key === 'sugar' ? 'đường' : 'đá'}</legend>
          <div className="flex flex-wrap gap-2">{['0%', '30%', '50%', '70%', '100%'].map(level => <label key={level} className="flex min-h-11 items-center gap-1 rounded-lg bg-[#F3E9D2] px-2">
            <input type="radio" name={key} checked={options[key] === level} onChange={() => setOptions({ ...options, [key]: level })} />{level}
          </label>)}</div>
        </fieldset>)}
        <fieldset><legend className="mb-2 font-semibold">Topping · Tùy chọn</legend>
          {toppings.length === 0 && <p className="text-sm">Chưa có topping khả dụng.</p>}
          {toppings.map(t => <label key={t.id} className="my-1 flex min-h-11 items-center gap-2 rounded-lg bg-[#F3E9D2] px-3">
            <input type="checkbox" checked={options.toppings.some(v => v.id === t.id)} onChange={event => setOptions({ ...options, toppings: event.target.checked ? [...options.toppings, t] : options.toppings.filter(v => v.id !== t.id) })} />
            <span className="flex-1">{t.name}</span>+{money(t.price)}
          </label>)}
        </fieldset>
        <label className="block">Số lượng <input type="number" min={1} max={Math.max(1, remaining)} step={1} value={quantity} onChange={event => setQuantity(Number(event.target.value))} className="ml-3 min-h-11 w-20 rounded border px-2" /></label>
        {remaining <= quantity && <p className="text-sm">Chỉ còn {Math.max(0, remaining)} sản phẩm có thể thêm vào giỏ</p>}
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        <button disabled={remaining < quantity || !product.isActive || product.isSoldOut} className="min-h-11 w-full rounded-lg bg-[#7D4435] px-4 py-3 font-semibold text-white disabled:opacity-50">{editingItem ? 'Lưu thay đổi' : 'Thêm vào giỏ'} · {money(previewUnitPrice(product, options) * quantity)}</button>
      </form>
    </div>
  </dialog>;
}
