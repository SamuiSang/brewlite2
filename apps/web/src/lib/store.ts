// apps/web/src/lib/store.ts
import { create } from 'zustand';

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
}

export interface AppliedVoucher {
  code: string;
  discountAmount: number;
  description?: string;
}

interface CartStore {
  items: CartItem[];
  appliedVoucher: AppliedVoucher | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: 'S' | 'M' | 'L') => void;
  updateQuantity: (productId: string, size: 'S' | 'M' | 'L', newQty: number) => void;
  setAppliedVoucher: (voucher: AppliedVoucher | null) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getFinalTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  appliedVoucher: null,

  addItem: (newItem) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) => item.productId === newItem.productId && item.size === newItem.size,
      );

      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex].quantity += newItem.quantity;
        return { items: updated };
      }

      return { items: [...state.items, newItem] };
    });
  },

  removeItem: (productId, size) => {
    set((state) => ({
      items: state.items.filter(
        (item) => !(item.productId === productId && item.size === size),
      ),
    }));
  },

  updateQuantity: (productId, size, newQty) => {
    if (newQty <= 0) {
      get().removeItem(productId, size);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId && item.size === size
          ? { ...item, quantity: newQty }
          : item,
      ),
    }));
  },

  setAppliedVoucher: (voucher) => set({ appliedVoucher: voucher }),

  clearCart: () => set({ items: [], appliedVoucher: null }),

  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
  },

  getFinalTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().appliedVoucher?.discountAmount || 0;
    return Math.max(0, subtotal - discount);
  },
}));
