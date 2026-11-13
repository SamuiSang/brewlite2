'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Product } from '../types/product';

export type Topping = { id: string; name: string; price: number };
export type CartOptions = { size: 'S' | 'M' | 'L'; sugar: string; ice: string; toppings: Topping[] };
export type CartItem = CartOptions & { itemKey: string; product: Product; quantity: number; unitPrice: number };
export type PromotionPreview = { promoId: string; code: string; discountAmount: number; minOrderValue: number };
const sizePrices = { S: 0, M: 6000, L: 10000 };
export const previewUnitPrice = (product: Product, options: CartOptions) =>
  product.basePrice + sizePrices[options.size] + options.toppings.reduce((sum, t) => sum + t.price, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

interface CartStore {
  items: CartItem[];
  promotion: PromotionPreview | null;
  notice: string;
  revision: number;
  addItem: (product: Product, options: CartOptions, quantity: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  setPromotion: (promotion: PromotionPreview | null) => void;
}

// ponytail: prices here are previews only; Orders must reload authoritative prices and stock.
export const useCartStore = create<CartStore>()(persist((set) => ({
  items: [], promotion: null, notice: '', revision: 0,
  addItem: (product, options, quantity) => set(state => {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || !product.isActive || product.isSoldOut ||
      !Number.isSafeInteger(product.basePrice) || product.basePrice < 0 ||
      !Number.isSafeInteger(product.availableStock) || product.availableStock < 0 ||
      !Object.prototype.hasOwnProperty.call(sizePrices, options.size) ||
      !['0%', '30%', '50%', '70%', '100%'].includes(options.sugar) ||
      !['0%', '30%', '50%', '70%', '100%'].includes(options.ice) ||
      options.toppings.some(t => !t.id || !Number.isSafeInteger(t.price) || t.price < 0) ||
      new Set(options.toppings.map(t => t.id)).size !== options.toppings.length) throw new Error('Tùy chọn món không hợp lệ');
    if (state.items.reduce((sum, i) => sum + i.quantity, 0) + quantity > 100) throw new Error('Giỏ hàng tối đa 100 ly');
    const count = state.items.filter(i => i.product.id === product.id).reduce((n, i) => n + i.quantity, 0);
    if (count + quantity > product.availableStock) throw new Error(`Chỉ còn ${product.availableStock} sản phẩm trong kho`);
    const itemKey = JSON.stringify([product.id, options.size, options.toppings.map(t => t.id).sort(), options.sugar, options.ice]);
    const item = { ...options, itemKey, product, quantity, unitPrice: previewUnitPrice(product, options) };
    return { items: state.items.some(i => i.itemKey === itemKey)
      ? state.items.map(i => i.itemKey === itemKey ? { ...item, quantity: i.quantity + quantity } : i)
      : [...state.items, item], promotion: null, notice: state.promotion ? 'Giỏ hàng đã thay đổi. Vui lòng áp dụng lại mã khuyến mãi.' : '', revision: state.revision + 1 };
  }),
  setQuantity: (key, quantity) => set(state => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Số lượng phải là số nguyên dương');
    const item = state.items.find(i => i.itemKey === key);
    if (!item) return state;
    if (state.items.reduce((sum, i) => sum + i.quantity, 0) - item.quantity + quantity > 100) throw new Error('Giỏ hàng tối đa 100 ly');
    const others = state.items.filter(i => i.product.id === item.product.id && i.itemKey !== key).reduce((n, i) => n + i.quantity, 0);
    if (others + quantity > item.product.availableStock) throw new Error(`Chỉ còn ${item.product.availableStock} sản phẩm trong kho`);
    return { items: state.items.map(i => i.itemKey === key ? { ...i, quantity } : i), promotion: null,
      notice: state.promotion ? 'Mã khuyến mãi đã bị hủy do giỏ hàng thay đổi. Vui lòng áp dụng lại.' : '', revision: state.revision + 1 };
  }),
  removeItem: key => set(state => ({ items: state.items.filter(i => i.itemKey !== key), promotion: null,
    notice: state.promotion ? 'Mã khuyến mãi đã bị hủy do giỏ hàng thay đổi.' : '', revision: state.revision + 1 })),
  clearCart: () => set(state => ({ items: [], promotion: null, notice: '', revision: state.revision + 1 })),
  setPromotion: promotion => set({ promotion, notice: '' }),
}), {
  name: 'brewlite-quynh-cart',
  storage: createJSONStorage(() => ({
    getItem: key => { try { return localStorage.getItem(key); } catch { return null; } },
    setItem: (key, value) => { try { localStorage.setItem(key, value); } catch { /* Keep in-memory cart usable. */ } },
    removeItem: key => { try { localStorage.removeItem(key); } catch { /* Storage may be blocked. */ } },
  })),
  partialize: state => ({ items: state.items }),
  merge: (saved, current) => {
    const items = (saved as { items?: CartItem[] })?.items;
    if (!Array.isArray(items)) return current;
    try {
      const valid = items.every(i => i && typeof i.itemKey === 'string' && i.product && typeof i.product.id === 'string' &&
        Number.isFinite(i.product.basePrice) && Number.isFinite(i.product.availableStock) &&
        Number.isSafeInteger(i.quantity) && i.quantity > 0 && Array.isArray(i.toppings) &&
        i.toppings.every(t => t && typeof t.id === 'string' && Number.isSafeInteger(t.price) && t.price >= 0) &&
        ['S', 'M', 'L'].includes(i.size) && ['0%', '30%', '50%', '70%', '100%'].includes(i.sugar) &&
        ['0%', '30%', '50%', '70%', '100%'].includes(i.ice) && i.unitPrice === previewUnitPrice(i.product, i));
      return valid && items.reduce((sum, i) => sum + i.quantity, 0) <= 100 ? { ...current, items } : current;
    } catch { return current; }
  },
}));
