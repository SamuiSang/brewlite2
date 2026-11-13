// apps/api/src/payments/vnpay.util.ts
import * as crypto from 'crypto';

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
  // Chuyển sang múi giờ GMT+7 (Việt Nam)
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

export interface VnpayPaymentParams {
  tmnCode: string;
  hashSecret: string;
  vnpUrl: string;
  returnUrl: string;
  orderId: string;
  orderCode: string;
  amount: number; // Đơn vị: VNĐ
  orderInfo?: string;
  ipAddr?: string;
  bankCode?: string;
  locale?: string;
  createDate?: Date;
}

/**
 * Tạo URL thanh toán VNPay Sandbox có chữ ký HMAC SHA512 hợp lệ 100%
 */
export function buildVnpayPaymentUrl(params: VnpayPaymentParams): string {
  const {
    tmnCode,
    hashSecret,
    vnpUrl,
    returnUrl,
    orderCode,
    amount,
    orderInfo,
    ipAddr = '127.0.0.1',
    bankCode,
    locale = 'vn',
    createDate = new Date(),
  } = params;

  const vnp_Amount = Math.round(amount * 100); // VNPay yêu cầu nhân 100
  const vnp_CreateDate = formatVnpayDate(createDate);
  const vnp_OrderInfo = orderInfo || `Thanh toan don hang ${orderCode}`;
  const vnp_TxnRef = orderCode;

  const rawParams: Record<string, any> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: vnp_TxnRef,
    vnp_OrderInfo: vnp_OrderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: vnp_Amount,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: vnp_CreateDate,
  };

  if (bankCode) {
    rawParams['vnp_BankCode'] = bankCode;
  }

  // Sắp xếp params theo thứ tự alphabet
  const sortedParams = sortObject(rawParams);

  // Tạo chuỗi signData
  const signData = Object.entries(sortedParams)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  // Tính chữ ký HMAC SHA512
  const hmac = crypto.createHmac('sha512', hashSecret);
  const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  // Nối hash vào URL
  return `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;
}

/**
 * Xác thực chữ ký số HMAC SHA512 từ gói tin phản hồi của VNPay (IPN / Webhook / Return)
 */
export function verifyVnpaySignature(
  queryParams: Record<string, any>,
  hashSecret: string,
): { isValid: boolean; secureHash: string; calculatedHash: string } {
  const secureHash = String(queryParams['vnp_SecureHash'] || '');
  if (!secureHash) {
    return { isValid: false, secureHash: '', calculatedHash: '' };
  }

  // Sao chép và xóa các trường chữ ký trước khi hash
  const cloneParams = { ...queryParams };
  delete cloneParams['vnp_SecureHash'];
  delete cloneParams['vnp_SecureHashType'];

  const sortedParams = sortObject(cloneParams);
  const signData = Object.entries(sortedParams)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', hashSecret);
  const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return {
    isValid: secureHash.toLowerCase() === calculatedHash.toLowerCase(),
    secureHash,
    calculatedHash,
  };
}
