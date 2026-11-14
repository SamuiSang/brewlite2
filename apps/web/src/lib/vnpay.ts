// apps/web/src/lib/vnpay.ts

export const VNPAY_CONFIG = {
  tmnCode: '8VXIB1MM',
  hashSecret: 'GJZGJZTKHBYBESRSLCLSPZXGFPEXVPGF',
  vnpUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl: 'http://localhost:3000/checkout/vnpay-return',
};

/**
 * Hàm sắp xếp các tham số của VNPay theo thứ tự alphabet A-Z
 * và mã hóa URI theo chuẩn VNPay (thay %20 thành +).
 */
export function sortObject(obj: Record<string, any>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const str: string[] = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }

  str.sort();

  for (let i = 0; i < str.length; i++) {
    const rawKey = decodeURIComponent(str[i]);
    const val = obj[rawKey];
    if (val !== undefined && val !== null && val !== '') {
      sorted[str[i]] = encodeURIComponent(String(val)).replace(/%20/g, '+');
    }
  }

  return sorted;
}

/**
 * Định dạng ngày theo chuẩn YYYYMMDDHHmmss (GMT+7)
 */
export function formatVnpayDate(date: Date = new Date()): string {
  const tzOffset = 7 * 60; // phút
  const localDate = new Date(date.getTime() + (tzOffset + date.getTimezoneOffset()) * 60000);

  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  const seconds = String(localDate.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export interface ClientVnpayParams {
  orderCode: string;
  amount: number; // VNĐ
  orderInfo?: string;
  bankCode?: string;
  returnUrl?: string;
}

/**
 * Tính toán HMAC SHA-512 tương thích cả Client Browser (Web Crypto API) và Server Node.js
 */
export async function calculateHmacSha512(data: string, secret: string): Promise<string> {
  if (typeof window === 'undefined') {
    // Môi trường Node.js
    const nodeCrypto = await import('crypto');
    return nodeCrypto.createHmac('sha512', secret).update(data, 'utf-8').digest('hex');
  }

  // Môi trường Browser Web Crypto API
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Tạo URL thanh toán VNPay Sandbox có chữ ký HMAC SHA512 hợp lệ 100%
 */
export async function createVnpayPaymentUrl(params: ClientVnpayParams): Promise<string> {
  const {
    orderCode,
    amount,
    orderInfo,
    bankCode,
    returnUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/checkout/vnpay-return`
      : VNPAY_CONFIG.returnUrl,
  } = params;

  const vnp_Amount = Math.round(amount * 100);
  const vnp_CreateDate = formatVnpayDate(new Date());
  const vnp_OrderInfo = orderInfo || `Thanh toan don hang ${orderCode}`;
  const vnp_TxnRef = orderCode;

  const rawParams: Record<string, any> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: VNPAY_CONFIG.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: vnp_TxnRef,
    vnp_OrderInfo: vnp_OrderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: vnp_Amount,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: vnp_CreateDate,
  };

  if (bankCode) {
    rawParams['vnp_BankCode'] = bankCode;
  }

  const sortedParams = sortObject(rawParams);

  // Tạo chuỗi signData: key1=val1&key2=val2...
  const signData = Object.entries(sortedParams)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');

  const secureHash = await calculateHmacSha512(signData, VNPAY_CONFIG.hashSecret);

  return `${VNPAY_CONFIG.vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;
}
