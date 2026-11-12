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
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: 'S' | 'M' | 'L') => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
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
  clearCart: () => set({ items: [] }),
  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
  getSubtotal: () => {
    return get().items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
  },
}));
