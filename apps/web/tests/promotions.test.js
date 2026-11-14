const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { PromotionCard, validatePromotion, loadPromotions } = require('../src/components/VoucherInput');
const offer = { promoId: 'p1', code: 'BREWNEW', description: 'Khách mới', discountType: 'PERCENTAGE', discountValue: 20, minOrderValue: 50000, maxDiscountAmount: 30000, expiresAt: '2026-12-31T00:00:00.000Z' };
afterEach(() => { delete global.fetch; });

test('visible promotion shows conditions and disables apply below minimum', () => {
  const html = renderToStaticMarkup(React.createElement(PromotionCard, { promotion: offer, subtotal: 40000, busy: false, onApply: () => {} }));
  expect(html).toContain('BREWNEW');
  expect(html).toContain('20%');
  expect(html).toContain('30.000');
  expect(html).toContain('50.000');
  expect(html).toContain('10.000');
  expect(html).toContain('31/12/2026');
  expect(html).toContain('disabled');
});

test('voucher with no source expiry displays unlimited validity', () => {
  const html = renderToStaticMarkup(React.createElement(PromotionCard, { promotion: { ...offer, expiresAt: null }, subtotal: 50000, busy: false, onApply: () => {} }));
  expect(html).toContain('Không giới hạn');
});

test('selected promotion offers removal on its own card even below minimum', () => {
  let removed = false;
  const card = PromotionCard({ promotion: { ...offer, remainingUses: 500 }, subtotal: 0, busy: false, selected: true, onRemove: () => { removed = true; }, onApply: () => {} });
  const button = React.Children.toArray(card.props.children).find(child => child.type === 'button');
  expect(button.props.children).toBe('Bỏ áp dụng');
  expect(button.props.disabled).toBe(false);
  button.props.onClick();
  expect(removed).toBe(true);
  expect(renderToStaticMarkup(card)).toContain('500 lượt');
});

test('welcome and delivery-only offers show restrictions before applying', () => {
  for (const change of [{ firstOrderOnly: true }, { deliveryOnly: true }]) {
    const card = PromotionCard({ promotion: { ...offer, ...change }, subtotal: 100000, busy: false, onApply: () => {} });
    expect(React.Children.toArray(card.props.children).find(child => child.type === 'button').props.disabled).toBe(true);
  }
});

test('delivery-only offer is disabled for PICKUP but enabled for DELIVERY', () => {
  const deliveryOnlyOffer = { ...offer, code: 'DELIVERYONLY', deliveryOnly: true };
  const pickupCard = PromotionCard({ promotion: deliveryOnlyOffer, subtotal: 100000, busy: false, deliveryMethod: 'PICKUP', onApply: () => {} });
  expect(React.Children.toArray(pickupCard.props.children).find(child => child.type === 'button').props.disabled).toBe(true);

  const deliveryCard = PromotionCard({ promotion: deliveryOnlyOffer, subtotal: 100000, busy: false, deliveryMethod: 'DELIVERY', onApply: () => {} });
  expect(React.Children.toArray(deliveryCard.props.children).find(child => child.type === 'button').props.disabled).toBe(false);
});

test('eligible promotion applies selected code', () => {
  let selected;
  const card = PromotionCard({ promotion: offer, subtotal: 50000, busy: false, onApply: code => { selected = code; } });
  const button = React.Children.toArray(card.props.children).find(child => child.type === 'button');
  expect(button.props.disabled).toBe(false);
  button.props.onClick();
  expect(selected).toBe('BREWNEW');
});

test('validation sends normalized code and actual subtotal to API', async () => {
  let request;
  global.fetch = async (url, init) => {
    request = { url, ...init };
    return { ok: true, json: async () => ({ promoId: 'p1', code: 'BREWNEW', discountAmount: 10000, minOrderValue: 50000 }) };
  };
  expect((await validatePromotion(' brewnew ', 50000)).discountAmount).toBe(10000);
  expect(request.url).toContain('/api/v1/promotions/validate');
  expect(JSON.parse(request.body)).toEqual({ code: 'BREWNEW', cartSubtotal: 50000 });
});

test('API rejection and invalid amounts cannot apply a discount', async () => {
  global.fetch = async () => ({ ok: false, json: async () => ({ message: 'Mã đã hết hạn' }) });
  await expect(validatePromotion('BREWNEW', 50000)).rejects.toThrow('Mã đã hết hạn');
  global.fetch = async () => ({ ok: true, json: async () => ({ promoId: 'p1', code: 'X', discountAmount: 60000, minOrderValue: 0 }) });
  await expect(validatePromotion('X', 50000)).rejects.toThrow();
});

test('active list uses API data and rejects malformed responses', async () => {
  global.fetch = async () => ({ ok: true, json: async () => [offer] });
  expect(await loadPromotions()).toEqual([offer]);
  global.fetch = async () => ({ ok: true, json: async () => [{ ...offer, discountValue: -1 }] });
  await expect(loadPromotions()).rejects.toThrow();
});
