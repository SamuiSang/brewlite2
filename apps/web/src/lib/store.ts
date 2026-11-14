// apps/web/src/lib/store.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  category: string;
  imageUrl: string | null;
  size: 'S' | 'M' | 'L';
  unitPrice: number;
  quantity: number;
  optionsDesc?: string;
  sugarLevel?: string;
  iceLevel?: string;
  toppings?: string[];
  availableStock?: number;
  product?: import('../types/product').Product;
  toppingOptions?: import('../store/useCartStore').Topping[];
}

export const cartItemKey = (item: CartItem) => JSON.stringify([
  item.productId, item.size, [...(item.toppings || [])].sort(),
  item.sugarLevel || '100%', item.iceLevel || '100%',
]);

export function getMaxQuantity(items: CartItem[], item: CartItem) {
  const others = items.filter(i => cartItemKey(i) !== cartItemKey(item));
  const stock = Math.min(item.availableStock ?? 100, ...items.filter(i => i.productId === item.productId).map(i => i.availableStock ?? 100));
  return Math.max(0, Math.min(100 - others.reduce((n, i) => n + i.quantity, 0),
    stock - others.filter(i => i.productId === item.productId).reduce((n, i) => n + i.quantity, 0)));
}

const voucherNotice = (state: { appliedVoucher: AppliedVoucher | null; notice: string | null }) =>
  state.appliedVoucher ? 'Mã khuyến mãi đã bị hủy vì giỏ hàng thay đổi. Vui lòng áp dụng lại để kiểm tra điều kiện.' : state.notice;

function reportStorageError(message: string) {
  // ponytail: keep warning for this session; retry persistence on the next cart change.
  if (useCartStore.getState().storageError !== message) useCartStore.setState({ storageError: message });
}

export interface AppliedVoucher {
  code: string;
  discountAmount: number;
  description?: string;
}

interface CartStore {
  items: CartItem[];
  appliedVoucher: AppliedVoucher | null;
  notice: string | null;
  storageError: string | null;
  clearNotice: () => void;
  addItem: (item: CartItem) => void;
  replaceItem: (key: string, item: CartItem) => void;
  removeItem: (productId: string, size: CartItem['size'], key?: string) => void;
  updateQuantity: (productId: string, size: CartItem['size'], newQty: number, key?: string) => void;
  setAppliedVoucher: (voucher: AppliedVoucher | null) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getFinalTotal: () => number;
}

function validateItems(items: CartItem[]) {
  if (items.some(i => !i || typeof i.productId !== 'string' || !i.productId ||
    typeof i.name !== 'string' || !['S', 'M', 'L'].includes(i.size) ||
    !Number.isSafeInteger(i.quantity) || i.quantity < 1 ||
    !Number.isSafeInteger(i.unitPrice) || i.unitPrice < 0 ||
    (i.availableStock !== undefined && (!Number.isSafeInteger(i.availableStock) || i.availableStock < 0)) ||
    (i.product !== undefined && (!i.product || i.product.id !== i.productId || typeof i.product.name !== 'string' ||
      !Number.isSafeInteger(i.product.basePrice) || i.product.basePrice < 0 ||
      !Number.isSafeInteger(i.product.availableStock) || i.product.availableStock < 0 ||
      typeof i.product.isActive !== 'boolean' || typeof i.product.isSoldOut !== 'boolean')) ||
    (i.toppingOptions !== undefined && (!Array.isArray(i.toppingOptions) || i.toppingOptions.some(t => !t ||
      typeof t.id !== 'string' || typeof t.name !== 'string' || !Number.isSafeInteger(t.price) || t.price < 0))) ||
    (i.toppings !== undefined && (!Array.isArray(i.toppings) || i.toppings.some(t => typeof t !== 'string'))) ||
    [i.sugarLevel, i.iceLevel].some(level => level !== undefined && !['0%', '30%', '50%', '70%', '100%'].includes(level)))) {
    throw new Error('Thông tin món hoặc số lượng không hợp lệ');
  }
  if (items.reduce((sum, i) => sum + i.quantity, 0) > 100) throw new Error('Giỏ hàng tối đa 100 ly');
  for (const item of items) {
    if (item.availableStock !== undefined && items.filter(i => i.productId === item.productId)
      .reduce((sum, i) => sum + i.quantity, 0) > item.availableStock) {
      throw new Error(`Chỉ còn ${item.availableStock} sản phẩm trong kho`);
    }
  }
}

export const useCartStore = create<CartStore>()(persist((set, get) => ({
  items: [],
  appliedVoucher: null,
  notice: null,
  storageError: null,
  clearNotice: () => set({ notice: null }),
  addItem: newItem => set(state => {
    validateItems([newItem]);
    const key = cartItemKey(newItem);
    const items = state.items.some(i => cartItemKey(i) === key)
      ? state.items.map(i => cartItemKey(i) === key ? { ...newItem, quantity: i.quantity + newItem.quantity } : i)
      : [...state.items, { ...newItem }];
    validateItems(items);
    return { items, appliedVoucher: null, notice: voucherNotice(state) };
  }),
  replaceItem: (key, replacement) => set(state => {
    const original = state.items.find(i => cartItemKey(i) === key);
    if (!original || original.productId !== replacement.productId) throw new Error('Món trong giỏ đã thay đổi. Vui lòng mở lại tùy chọn.');
    validateItems([replacement]);
    const destination = cartItemKey(replacement);
    const others = state.items.filter(i => cartItemKey(i) !== key);
    const items = others.some(i => cartItemKey(i) === destination)
      ? others.map(i => cartItemKey(i) === destination ? { ...replacement, quantity: i.quantity + replacement.quantity } : i)
      : [...others, replacement];
    validateItems(items);
    return { items, appliedVoucher: null, notice: voucherNotice(state) };
  }),
  removeItem: (productId, size, key) => set(state => ({
    items: state.items.filter(i => key ? cartItemKey(i) !== key : !(i.productId === productId && i.size === size)),
    appliedVoucher: null,
    notice: voucherNotice(state),
  })),
  updateQuantity: (productId, size, quantity, key) => {
    if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error('Số lượng phải là số nguyên không âm');
    if (quantity === 0) { get().removeItem(productId, size, key); return; }
    set(state => {
      const items = state.items.map(i => (key ? cartItemKey(i) === key : i.productId === productId && i.size === size)
        ? { ...i, quantity } : i);
      validateItems(items);
      return { items, appliedVoucher: null, notice: voucherNotice(state) };
    });
  },
  setAppliedVoucher: appliedVoucher => set({ appliedVoucher, notice: null }),
  clearCart: () => set(state => ({ items: [], appliedVoucher: null, notice: voucherNotice(state) })),
  getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  getSubtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
  getFinalTotal: () => Math.max(0, get().getSubtotal() - (get().appliedVoucher?.discountAmount || 0)),
}), {
  name: 'brewlite-cart',
  skipHydration: true,
  storage: createJSONStorage(() => ({
    getItem: key => { try { return localStorage.getItem(key); } catch { reportStorageError('Không thể khôi phục giỏ hàng vì trình duyệt chặn lưu trữ.'); return null; } },
    setItem: (key, value) => { try { localStorage.setItem(key, value); } catch { reportStorageError('Không thể lưu giỏ hàng. Các thay đổi có thể mất khi tải lại trang.'); } },
    removeItem: key => { try { localStorage.removeItem(key); } catch { reportStorageError('Không thể cập nhật dữ liệu giỏ hàng đã lưu.'); } },
  })),
  onRehydrateStorage: () => (_state, error) => {
    if (error) reportStorageError('Không thể khôi phục giỏ hàng đã lưu. Dữ liệu có thể bị hỏng.');
  },
  partialize: state => ({ items: state.items }),
  merge: (saved, current) => {
    try {
      const items = (saved as { items?: CartItem[] })?.items;
      if (!Array.isArray(items)) return current;
      validateItems(items);
      return { ...current, items };
    } catch { return { ...current, storageError: 'Không thể khôi phục giỏ hàng: dữ liệu món đã lưu không hợp lệ.' }; }
  },
}));
