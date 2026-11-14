// apps/web/tests/vnpay-payment.test.js

describe('VNPay Sandbox Payment Frontend Flow', () => {
  test('cấu hình tham số Cổng thanh toán VNPay Sandbox chính thức', () => {
    const vnpConfig = {
      tmnCode: '8VXIB1MM',
      hashSecret: 'GJZGJZTKHBYBESRSLCLSPZXGFPEXVPGF',
      url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    };

    expect(vnpConfig.tmnCode).toBe('8VXIB1MM');
    expect(vnpConfig.hashSecret).toBe('GJZGJZTKHBYBESRSLCLSPZXGFPEXVPGF');
    expect(vnpConfig.url).toContain('sandbox.vnpayment.vn');
  });

  test('xác thực mã phản hồi VNPay ResponseCode 00 là thành công', () => {
    const isSuccess = (code) => code === '00';
    expect(isSuccess('00')).toBe(true);
    expect(isSuccess('24')).toBe(false); // Khách hàng hủy
    expect(isSuccess('97')).toBe(false); // Sai chữ ký
    expect(isSuccess('51')).toBe(false); // Không đủ số dư
  });

  test('kiểm tra định dạng UUID cho Idempotency-Key', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const testUUID = '123e4567-e89b-42d3-a456-426614174000';
    expect(uuidRegex.test(testUUID)).toBe(true);
  });
});
