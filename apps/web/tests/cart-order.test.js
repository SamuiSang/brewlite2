const { useCartStore } = require('../src/lib/store');

describe('useCartStore tests for BrewLite Cart & Order Flow', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  test('should start with an empty cart and zero totals', () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.appliedVoucher).toBeNull();
    expect(state.getTotalItems()).toBe(0);
    expect(state.getSubtotal()).toBe(0);
    expect(state.getFinalTotal()).toBe(0);
  });

  test('should add new item and accumulate quantity for same product + size', () => {
    const item1 = {
      productId: 'prod-001',
      name: 'Cà phê Muối Côn Đảo',
      category: 'COFFEE',
      imageUrl: '/images/drinks/ca-phe-muoi-con-dao.jpg',
      size: 'M',
      unitPrice: 45000,
      quantity: 1,
    };

    useCartStore.getState().addItem(item1);
    expect(useCartStore.getState().getTotalItems()).toBe(1);
    expect(useCartStore.getState().getSubtotal()).toBe(45000);

    // Add same product and same size -> quantity becomes 2
    useCartStore.getState().addItem(item1);
    expect(useCartStore.getState().getTotalItems()).toBe(2);
    expect(useCartStore.getState().getSubtotal()).toBe(90000);
    expect(useCartStore.getState().items.length).toBe(1);
  });

  test('should distinguish items by size (e.g. size M vs size L)', () => {
    useCartStore.getState().addItem({
      productId: 'prod-001',
      name: 'Cà phê Muối Côn Đảo',
      category: 'COFFEE',
      imageUrl: '/images/drinks/ca-phe-muoi-con-dao.jpg',
      size: 'M',
      unitPrice: 45000,
      quantity: 1,
    });

    useCartStore.getState().addItem({
      productId: 'prod-001',
      name: 'Cà phê Muối Côn Đảo',
      category: 'COFFEE',
      imageUrl: '/images/drinks/ca-phe-muoi-con-dao.jpg',
      size: 'L',
      unitPrice: 55000,
      quantity: 1,
    });

    expect(useCartStore.getState().items.length).toBe(2);
    expect(useCartStore.getState().getTotalItems()).toBe(2);
    expect(useCartStore.getState().getSubtotal()).toBe(100000);
  });

  test('should update quantity and auto-remove when quantity <= 0', () => {
    useCartStore.getState().addItem({
      productId: 'prod-002',
      name: 'Trà Lài Vải Thiều',
      category: 'TEA',
      imageUrl: '/images/drinks/tra-lai-vai-thieu.jpg',
      size: 'M',
      unitPrice: 42000,
      quantity: 2,
    });

    useCartStore.getState().updateQuantity('prod-002', 'M', 3);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
    expect(useCartStore.getState().getSubtotal()).toBe(126000);

    // Reduce to 0 -> should remove item
    useCartStore.getState().updateQuantity('prod-002', 'M', 0);
    expect(useCartStore.getState().items.length).toBe(0);
    expect(useCartStore.getState().getTotalItems()).toBe(0);
  });

  test('should remove item explicitly', () => {
    useCartStore.getState().addItem({
      productId: 'prod-001',
      name: 'Cà phê Muối Côn Đảo',
      category: 'COFFEE',
      imageUrl: null,
      size: 'M',
      unitPrice: 45000,
      quantity: 1,
    });

    useCartStore.getState().removeItem('prod-001', 'M');
    expect(useCartStore.getState().items.length).toBe(0);
  });

  test('should calculate finalTotal with discount and prevent negative amounts', () => {
    useCartStore.getState().addItem({
      productId: 'prod-001',
      name: 'Cà phê Muối Côn Đảo',
      category: 'COFFEE',
      imageUrl: null,
      size: 'M',
      unitPrice: 45000,
      quantity: 2, // Subtotal: 90,000 đ
    });

    expect(useCartStore.getState().getSubtotal()).toBe(90000);

    // Apply BANMOI10 discount 20,000 đ
    useCartStore.getState().setAppliedVoucher({
      code: 'BANMOI10',
      discountAmount: 20000,
      description: 'Giảm 20.000 đ',
    });

    expect(useCartStore.getState().getFinalTotal()).toBe(70000);

    // Voucher exceeding subtotal cannot make total negative
    useCartStore.getState().setAppliedVoucher({
      code: 'SUPERVIP',
      discountAmount: 150000,
    });

    expect(useCartStore.getState().getFinalTotal()).toBe(0);
  });

  test('clearCart should reset all items and applied vouchers', () => {
    useCartStore.getState().addItem({
      productId: 'prod-001',
      name: 'Cà phê Muối Côn Đảo',
      category: 'COFFEE',
      imageUrl: null,
      size: 'M',
      unitPrice: 45000,
      quantity: 2,
    });

    useCartStore.getState().setAppliedVoucher({
      code: 'BANMOI10',
      discountAmount: 20000,
    });

    useCartStore.getState().clearCart();

    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().appliedVoucher).toBeNull();
    expect(useCartStore.getState().getTotalItems()).toBe(0);
    expect(useCartStore.getState().getFinalTotal()).toBe(0);
  });
});

