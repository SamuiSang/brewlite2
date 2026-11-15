// apps/web/tests/loyalty-orders.test.js
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const {
  OrderStatusStepper,
  RefundProgressStepper,
  getStepperSteps,
} = require('../src/components/OrderStatusStepper');
const {
  LoyaltyBadge,
  calculateEarnedPoints,
  calculateLoyaltyTier,
} = require('../src/components/LoyaltyBadge');
const {
  RedeemPointsInput,
  validatePointsRedemption,
} = require('../src/components/RedeemPointsInput');
const {
  ElectronicReceiptModal,
} = require('../src/components/ElectronicReceiptModal');

describe('Module 6 - Loyalty & Order History Frontend Logic + Components (Sang)', () => {
  test('1. calculateEarnedPoints quy đổi chính xác 10.000đ = 1 Hạt (làm tròn xuống)', () => {
    expect(calculateEarnedPoints(95000)).toBe(9);
    expect(calculateEarnedPoints(39000)).toBe(3);
    expect(calculateEarnedPoints(9999)).toBe(0);
    expect(calculateEarnedPoints(0)).toBe(0);
  });

  test('2. calculateLoyaltyTier xác định đúng hạng Thành viên Bạc / Vàng / Kim Cương khớp Figma 08', () => {
    expect(calculateLoyaltyTier(120).tierName).toBe('THÀNH VIÊN BẠC');
    const gold = calculateLoyaltyTier(420);
    expect(gold.tierName).toBe('THÀNH VIÊN VÀNG');
    expect(gold.remainingPoints).toBe(80);
    expect(gold.progressPercent).toBe(84);
    expect(calculateLoyaltyTier(500).tierName).toBe('THÀNH VIÊN KIM CƯƠNG');
  });

  test('3. validatePointsRedemption chặn âm điểm, mức dưới 10 Hạt và vượt trần 50% đơn hàng (UI-T02)', () => {
    const tooSmall = validatePointsRedemption(420, 5, 100000);
    expect(tooSmall.valid).toBe(false);

    const overdraft = validatePointsRedemption(30, 50, 100000);
    expect(overdraft.valid).toBe(false);
    expect(overdraft.reason).toContain('âm điểm');

    const overCap = validatePointsRedemption(420, 60, 100000);
    expect(overCap.valid).toBe(false);
    expect(overCap.reason).toContain('50%');

    const valid = validatePointsRedemption(420, 50, 120000);
    expect(valid.valid).toBe(true);
    expect(valid.discountAmount).toBe(50000);
    expect(valid.remainingPoints).toBe(370);
  });

  test('4. getStepperSteps ánh xạ đúng các trạng thái PAID, PREPARING, READY, COMPLETED, CANCELLED', () => {
    const preparing = getStepperSteps('PREPARING', { estimatedMinutes: 8 });
    expect(preparing[0].state).toBe('done');
    expect(preparing[1].state).toBe('active');
    expect(preparing[1].sublabel).toContain('8 phút');

    const ready = getStepperSteps('PAID', { isReadyAtCounter: true });
    expect(ready[2].state).toBe('active');

    const completed = getStepperSteps('COMPLETED');
    expect(completed.every((s) => s.state === 'done')).toBe(true);

    const cancelled = getStepperSteps('CANCELLED');
    expect(cancelled).toHaveLength(2);
    expect(cancelled[1].state).toBe('cancelled');
  });

  test('5. OrderStatusStepper và RefundProgressStepper render đầy đủ nội dung Figma 07 & 06e', () => {
    const verticalHtml = renderToStaticMarkup(
      React.createElement(OrderStatusStepper, { status: 'PREPARING', orientation: 'vertical' }),
    );
    expect(verticalHtml).toContain('Đã tiếp nhận đơn');
    expect(verticalHtml).toContain('Nhân viên đang pha chế');
    expect(verticalHtml).toContain('Sẵn sàng nhận tại quầy');

    const refundHtml = renderToStaticMarkup(
      React.createElement(RefundProgressStepper, { amount: 95000, paymentRefunded: true }),
    );
    expect(refundHtml).toContain('TẠM HẾT');
    expect(refundHtml).toContain('REFUNDED');
  });

  test('6. LoyaltyBadge, RedeemPointsInput và ElectronicReceiptModal render chính xác thẻ Thành viên & Hóa đơn 07c', () => {
    const badgeHtml = renderToStaticMarkup(
      React.createElement(LoyaltyBadge, {
        points: 420,
        memberName: 'Hàn Minh Hiếu',
        memberCode: 'BL · 000 024',
      }),
    );
    expect(badgeHtml).toContain('THÀNH VIÊN VÀNG');
    expect(badgeHtml).toContain('420');
    expect(badgeHtml).toContain('Thêm 80 Hạt để lên Kim Cương');

    const redeemHtml = renderToStaticMarkup(
      React.createElement(RedeemPointsInput, {
        currentPoints: 420,
        onConfirmRedeem: async () => {},
      }),
    );
    expect(redeemHtml).toContain('Nâng cấp sữa yến mạch');
    expect(redeemHtml).toContain('50 Hạt');
    expect(redeemHtml).toContain('Bánh sừng bò trong ngày');

    const receiptHtml = renderToStaticMarkup(
      React.createElement(ElectronicReceiptModal, {
        order: {
          id: 'ord-1',
          orderCode: 'BL-8924',
          status: 'PAID',
          subtotalAmount: 115000,
          discountAmount: 20000,
          finalAmount: 95000,
          note: 'Quận 1',
          createdAt: '2026-11-11T09:42:00.000Z',
          customerName: 'Hàn Minh Hiếu',
          promotionCode: 'BANMOI10',
          items: [
            {
              id: 'i-1',
              productId: 'p-1',
              productName: 'Cà phê Muối Côn Đảo',
              size: 'M',
              sugarLevel: '50%',
              iceLevel: '100%',
              quantity: 1,
              unitPrice: 73000,
              lineTotal: 73000,
            },
          ],
        },
        onClose: () => {},
      }),
    );
    expect(receiptHtml).toContain('Biên nhận điện tử');
    expect(receiptHtml).toContain('BL-8924');
    expect(receiptHtml).toContain('Cà phê Muối Côn Đảo');
  });
});
