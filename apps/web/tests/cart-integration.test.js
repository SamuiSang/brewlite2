const saved = new Map();
global.localStorage = {
  getItem: key => saved.get(key) ?? null,
  setItem: (key, value) => saved.set(key, value),
  removeItem: key => saved.delete(key),
};
const { useCartStore, cartItemKey, getMaxQuantity } = require('../src/lib/store');
afterAll(() => { delete global.localStorage; });

const item = { productId: 'coffee', name: 'Coffee', category: 'COFFEE', imageUrl: null,
  size: 'M', unitPrice: 51000, quantity: 1, sugarLevel: '100%', iceLevel: '100%', toppings: [], availableStock: 100 };
beforeEach(() => { useCartStore.getState().clearCart(); useCartStore.setState({ notice: null, storageError: null }); });

test('quantity ceiling accounts for stock across variants and 100 cups across cart', () => {
  const first = { ...item, quantity: 2, availableStock: 5 };
  const second = { ...item, sugarLevel: '0%', quantity: 3, availableStock: 5 };
  expect(getMaxQuantity([first, second], first)).toBe(2);
  expect(getMaxQuantity([item, { ...item, productId: 'other', quantity: 99 }], item)).toBe(1);
});

test('cart mutation explains voucher removal', () => {
  const cart = useCartStore.getState();
  cart.addItem(item);
  cart.setAppliedVoucher({ code: 'TEST', discountAmount: 5000 });
  cart.updateQuantity(item.productId, 'M', 2);
  expect(useCartStore.getState().notice).toMatch(/hủy.*giỏ hàng/i);
  cart.clearNotice();
  expect(useCartStore.getState().notice).toBeNull();
});

test('blocked storage keeps in-memory cart and shows warning', () => {
  const original = localStorage.setItem;
  localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  try {
    useCartStore.getState().addItem(item);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().storageError).toMatch(/không.*lưu/i);
  } finally { localStorage.setItem = original; }
});

test('broken saved JSON reports recovery failure without crashing', async () => {
  saved.set('brewlite-cart', '{broken');
  await useCartStore.persist.rehydrate();
  expect(useCartStore.getState().storageError).toMatch(/khôi phục/i);
});

test('invalid product snapshot cannot enter persisted cart', async () => {
  saved.set('brewlite-cart', JSON.stringify({ state: { items: [{ ...item, product: { id: 'coffee' }, toppingOptions: [null] }] }, version: 0 }));
  await useCartStore.persist.rehydrate();
  expect(useCartStore.getState().items).toHaveLength(0);
  expect(useCartStore.getState().storageError).toMatch(/không hợp lệ/);
});

test('customizations remain separate and quantity changes target only selected configuration', () => {
  const cart = useCartStore.getState();
  cart.addItem(item);
  cart.addItem({ ...item, sugarLevel: '0%' });
  expect(useCartStore.getState().items).toHaveLength(2);
  const key = cartItemKey({ ...item, sugarLevel: '0%' });
  cart.updateQuantity(item.productId, item.size, 3, key);
  expect(useCartStore.getState().items.map(i => i.quantity)).toEqual([1, 3]);
  cart.removeItem(item.productId, item.size, key);
  expect(useCartStore.getState().items).toHaveLength(1);
  expect(useCartStore.getState().items[0].sugarLevel).toBe('100%');
});

test('shared cart enforces 100 cups and stock across configurations', () => {
  const cart = useCartStore.getState();
  cart.addItem({ ...item, quantity: 98 });
  expect(() => cart.addItem({ ...item, productId: 'other', quantity: 3 })).toThrow('100');
  expect(() => cart.updateQuantity(item.productId, 'M', 101)).toThrow('100');
  cart.clearCart();
  cart.addItem({ ...item, quantity: 2, availableStock: 3 });
  expect(() => cart.addItem({ ...item, sugarLevel: '0%', quantity: 2, availableStock: 3 })).toThrow();
  expect(() => cart.updateQuantity(item.productId, 'M', 1.5)).toThrow();
});

test('editing replaces selected configuration and merges matching destination without losing cups', () => {
  const cart = useCartStore.getState();
  cart.addItem({ ...item, quantity: 2 });
  cart.addItem({ ...item, sugarLevel: '0%', quantity: 3 });
  cart.setAppliedVoucher({ code: 'TEST', discountAmount: 5000 });
  cart.replaceItem(cartItemKey(item), { ...item, sugarLevel: '0%', quantity: 2 });
  expect(useCartStore.getState().items).toHaveLength(1);
  expect(useCartStore.getState().items[0].quantity).toBe(5);
  expect(useCartStore.getState().appliedVoucher).toBeNull();
  expect(() => cart.replaceItem(cartItemKey({ ...item, sugarLevel: '0%' }), { ...item, quantity: 101 })).toThrow();
  expect(useCartStore.getState().items[0].quantity).toBe(5);
});

test('cart changes invalidate voucher and persist items for refresh', () => {
  const cart = useCartStore.getState();
  cart.addItem(item);
  cart.setAppliedVoucher({ code: 'TEST', discountAmount: 5000 });
  cart.updateQuantity(item.productId, 'M', 2);
  expect(useCartStore.getState().appliedVoucher).toBeNull();
  const persisted = localStorage.getItem('brewlite-cart');
  expect(JSON.parse(persisted).state.items[0].quantity).toBe(2);
  useCartStore.setState({ items: [] });
  localStorage.setItem('brewlite-cart', persisted);
  useCartStore.persist.rehydrate();
  expect(useCartStore.getState().items[0].quantity).toBe(2);
});
