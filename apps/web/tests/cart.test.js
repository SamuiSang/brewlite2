const { useCartStore, previewUnitPrice } = require('../src/store/useCartStore');
const product = { id: 'coffee', name: 'Cà phê', basePrice: 29000, availableStock: 5, isActive: true, isSoldOut: false, imageUrl: null };
const options = { size: 'M', sugar: '100%', ice: '100%', toppings: [{ id: 'jelly', name: 'Thạch', price: 6000 }] };
beforeEach(() => useCartStore.getState().clearCart());
test('preview adds size and topping prices', () => {
  expect(previewUnitPrice(product, options)).toBe(41000);
});
test('merges equal options regardless of topping order and separates sugar', () => {
  const store = useCartStore.getState();
  const toppings = [...options.toppings, { id: 'cream', name: 'Kem', price: 10000 }];
  store.addItem(product, { ...options, toppings }, 1);
  store.addItem(product, { ...options, toppings: [...toppings].reverse() }, 1);
  store.addItem(product, { ...options, sugar: '50%' }, 1);
  expect(useCartStore.getState().items.map(i => i.quantity)).toEqual([2, 1]);
});
test('stock is limited across all variants and invalid quantities rejected', () => {
  const store = useCartStore.getState();
  store.addItem(product, options, 4);
  expect(() => store.addItem(product, { ...options, size: 'L' }, 2)).toThrow('Chỉ còn 5');
  expect(() => store.addItem(product, options, -1)).toThrow();
  expect(useCartStore.getState().items[0].quantity).toBe(4);
});
test('cart accepts 100 cups but rejects overflow across products and updates', () => {
  const store = useCartStore.getState();
  const stocked = { ...product, availableStock: 200 };
  store.addItem(stocked, options, 99);
  store.addItem({ ...stocked, id: 'tea' }, options, 1);
  const key = useCartStore.getState().items[0].itemKey;
  expect(() => store.setQuantity(key, 100)).toThrow('100 ly');
  expect(() => store.addItem(stocked, options, 1)).toThrow('100 ly');
  store.removeItem(useCartStore.getState().items[1].itemKey);
  store.setQuantity(key, 100);
  expect(useCartStore.getState().items[0].quantity).toBe(100);
  for (const invalid of [0, -1, 1.5, 101, NaN]) {
    expect(() => store.setQuantity(key, invalid)).toThrow();
  }
  expect(useCartStore.getState().items[0].quantity).toBe(100);
});

test('changing cart clears previously validated discount', () => {
  const store = useCartStore.getState();
  store.addItem(product, options, 3);
  store.setPromotion({ promoId: 'promo', code: 'BREWLITE20', discountAmount: 24600, minOrderValue: 100000 });
  store.setQuantity(useCartStore.getState().items[0].itemKey, 1);
  expect(useCartStore.getState().promotion).toBeNull();
});
