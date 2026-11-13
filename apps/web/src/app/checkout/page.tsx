'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';

// Khởi tạo hàm sinh UUID v4 cho Idempotency-Key ở Client
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type PaymentMethodType = 'MOMO_SANDBOX' | 'VNPAY_SANDBOX' | 'VIETQR_MOCK' | 'CREDIT_CARD';

export default function CheckoutPage() {
  const router = useRouter();

  // State giỏ hàng & đơn hàng
  const [items, setItems] = useState<any[]>([]);
  const [cartSubtotal, setCartSubtotal] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number>(0);

  // State thanh toán & Idempotency
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('VIETQR_MOCK');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // State Modal QR Sandbox mô phỏng thanh toán 2 bước (Chuẩn bài giảng 28/10 của Thầy Phiêu)
  const [showQRSandbox, setShowQRSandbox] = useState<boolean>(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>('');
  const [qrPayload, setQrPayload] = useState<string>('');
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState<boolean>(false);

  useEffect(() => {
    // 1. Kiểm tra phiên đăng nhập (Bảo vệ luồng Checkout theo yêu cầu FR-04)
    const token = localStorage.getItem('brewlite_access_token');
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }

    // 2. Tải giỏ hàng từ Zustand / localStorage
    const savedCart = localStorage.getItem('brewlite_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        const cartItems = parsed.state?.items || parsed.items || [];
        setItems(cartItems);

        // Tính tạm tính
        const subtotal = cartItems.reduce(
          (sum: number, it: any) => sum + (it.lineTotal || it.unitPrice * it.quantity || 0),
          0
        );
        setCartSubtotal(subtotal);
        setFinalTotal(Math.max(0, subtotal - discountAmount));
      } catch (e) {
        console.error('Lỗi đọc giỏ hàng:', e);
      }
    } else {
      // Dữ liệu mẫu nếu giỏ hàng rỗng trong quá trình dev
      setCartSubtotal(68000);
      setFinalTotal(68000);
    }

    // 3. Khởi tạo một Idempotency-Key duy nhất cho phiên thanh toán này
    setIdempotencyKey(generateUUID());
  }, [router, discountAmount]);

  // Xử lý gửi yêu cầu đặt đơn và kích hoạt Cổng Thanh Toán Sandbox
  const handleProceedPayment = async () => {
    setErrorMessage('');

    // Khóa nút Submit chống bấm đúp (Task 10.2 - Chống click đúp từ Client)
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Đính kèm Header Idempotency-Key gửi lên Backend
      const orderPayload = {
        paymentMethod,
        items: items.length > 0 ? items : [{ productId: 'mock-p01', quantity: 2, size: 'M' }],
      };

      // 1. Khởi tạo đơn hàng (trạng thái PENDING)
      const res = await ApiClient.post('/orders', orderPayload, {
        'Idempotency-Key': idempotencyKey,
      });

      const orderId = res.orderId || res.id || 'BL-' + Math.floor(1000 + Math.random() * 9000);
      setCreatedOrderId(orderId);

      // 2. Mở màn hình QR Sandbox mô phỏng (Tuân thủ nguyên tắc: Không tự gán PAID 1 chiều trong Backend)
      setQrPayload(`https://sandbox.brewlite.vn/pay?orderId=${orderId}&amount=${finalTotal}&key=${idempotencyKey}`);
      setShowQRSandbox(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.');
      // Sinh Idempotency-Key mới nếu muốn thử lại sau lỗi kết nối
      setIdempotencyKey(generateUUID());
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mô phỏng Webhook Callback từ Cổng Thanh Toán đối tác (Bài giảng 28/10)
  const handleSimulateWebhook = async (isSuccess: boolean) => {
    setIsSimulatingWebhook(true);
    setErrorMessage('');

    try {
      if (isSuccess) {
        // Gửi webhook xác nhận thanh toán thành công
        await ApiClient.post('/payments/webhook', {
          orderId: createdOrderId,
          status: 'SUCCESS',
          idempotencyKey,
          transactionRef: 'TXN-' + Date.now(),
        }).catch(() => {
          // Fallback giả lập nếu BE chưa chạy webhook thực
        });

        // Xóa giỏ hàng sau khi thanh toán thành công
        localStorage.removeItem('brewlite_cart');

        // Chuyển sang màn hình Biên nhận thành công
        router.push(`/checkout/success?orderId=${createdOrderId}`);
      } else {
        // Mô phỏng thanh toán thất bại -> Kích hoạt Restock Rollback
        await ApiClient.post('/payments/webhook', {
          orderId: createdOrderId,
          status: 'FAILED',
          idempotencyKey,
          errorCode: 'INSUFFICIENT_FUNDS',
        }).catch(() => {});

        setShowQRSandbox(false);
        setErrorMessage('Giao dịch thanh toán thất bại hoặc đã bị hủy. Tồn kho nguyên liệu đã được hoàn trả.');
        // Sinh lại UUID mới cho lần thanh toán kế tiếp
        setIdempotencyKey(generateUUID());
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi xử lý xác nhận thanh toán.');
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header điều hướng */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-6">
          <Link href="/cart" className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1">
            ← Quay lại giỏ hàng
          </Link>
          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
            Idempotency-Key: {idempotencyKey.slice(0, 8)}...
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Thanh toán đơn hàng (Checkout)</h1>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Chọn phương thức thanh toán */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Chọn phương thức thanh toán</h2>
          <div className="space-y-3">
            <label
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                paymentMethod === 'VIETQR_MOCK'
                  ? 'border-black bg-gray-50 ring-1 ring-black'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="VIETQR_MOCK"
                  checked={paymentMethod === 'VIETQR_MOCK'}
                  onChange={() => setPaymentMethod('VIETQR_MOCK')}
                  className="h-4 w-4 text-black focus:ring-black"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Quét mã VietQR / Chuyển khoản (Mock Sandbox)</p>
                  <p className="text-xs text-gray-500">Mô phỏng quét mã QR ngân hàng có xác nhận Webhook 2 bước</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200">
                Khuyến nghị
              </span>
            </label>

            <label
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                paymentMethod === 'MOMO_SANDBOX'
                  ? 'border-black bg-gray-50 ring-1 ring-black'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="MOMO_SANDBOX"
                  checked={paymentMethod === 'MOMO_SANDBOX'}
                  onChange={() => setPaymentMethod('MOMO_SANDBOX')}
                  className="h-4 w-4 text-black focus:ring-black"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Ví điện tử MoMo (Sandbox)</p>
                  <p className="text-xs text-gray-500">Tài khoản thử nghiệm nhà phát triển</p>
                </div>
              </div>
            </label>

            <label
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                paymentMethod === 'VNPAY_SANDBOX'
                  ? 'border-black bg-gray-50 ring-1 ring-black'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="VNPAY_SANDBOX"
                  checked={paymentMethod === 'VNPAY_SANDBOX'}
                  onChange={() => setPaymentMethod('VNPAY_SANDBOX')}
                  className="h-4 w-4 text-black focus:ring-black"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Cổng thanh toán VNPAY (Sandbox)</p>
                  <p className="text-xs text-gray-500">Môi trường kiểm thử giả lập ngân hàng</p>
                </div>
              </div>
            </label>

            <label
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                paymentMethod === 'CREDIT_CARD'
                  ? 'border-black bg-gray-50 ring-1 ring-black'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CREDIT_CARD"
                  checked={paymentMethod === 'CREDIT_CARD'}
                  onChange={() => setPaymentMethod('CREDIT_CARD')}
                  className="h-4 w-4 text-black focus:ring-black"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Thẻ thanh toán quốc tế (Visa / Master)</p>
                  <p className="text-xs text-gray-500">Mô phỏng nhập mã thẻ thử nghiệm</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* 2. Tóm tắt chi phí thanh toán */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Tạm tính giỏ hàng:</span>
              <span className="font-medium text-gray-900">{cartSubtotal.toLocaleString('vi-VN')} đ</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Khuyến mãi giảm giá:</span>
                <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="pt-3 border-t border-gray-100 flex justify-between text-base font-bold text-gray-900">
              <span>Tổng thanh toán:</span>
              <span>{finalTotal.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>

        {/* 3. Nút kích hoạt thanh toán chống bấm đúp (Task 10.2) */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleProceedPayment}
          className="w-full py-4 px-6 rounded-2xl bg-black hover:bg-gray-800 text-white font-semibold text-base transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block animate-spin">⏳</span>
              <span>Đang kết nối cổng thanh toán...</span>
            </>
          ) : (
            `Xác nhận thanh toán • ${finalTotal.toLocaleString('vi-VN')} đ`
          )}
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">
          Chống click đúp với Idempotency-Key • Không lưu thông tin thẻ ngân hàng thật
        </p>

        {/* MODAL MÔ PHỎNG QR SANDBOX & WEBHOOK CALLBACK (Bài giảng 28/10 của Thầy Phiêu) */}
        {showQRSandbox && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95">
              <div className="text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Cổng Sandbox VietQR / Ngân hàng
                </span>
                <h3 className="mt-3 text-lg font-bold text-gray-900">Mã QR Thanh Toán Thử Nghiệm</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Đơn hàng <span className="font-mono font-bold text-gray-800">#{createdOrderId}</span> •{' '}
                  {finalTotal.toLocaleString('vi-VN')} đ
                </p>

                {/* Khung hiển thị QR mô phỏng */}
                <div className="my-5 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                  <div className="w-48 h-48 bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center p-3 shadow-inner">
                    {/* SVG mô phỏng mã QR */}
                    <svg className="w-36 h-36 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm10 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-2-2h2v2h-2v-2z" />
                    </svg>
                    <span className="text-[10px] font-mono text-gray-400 mt-1">SCAN ME • SANDBOX</span>
                  </div>
                  <span className="mt-2 text-xs text-gray-500">
                    Trạng thái hiện tại: <span className="font-bold text-amber-600">PENDING</span> (Chờ xác nhận)
                  </span>
                </div>

                {/* Hướng dẫn tuân thủ quy chế Thầy Phiêu */}
                <div className="mb-4 text-left p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  💡 <strong>Quy chế Thầy Phiêu:</strong> Đơn hàng chỉ chuyển sang <code>PAID</code> khi Cổng thanh toán
                  bắn bản tin Webhook xác nhận. Bạn hãy chọn kịch bản mô phỏng bên dưới:
                </div>

                {/* 2 Nút mô phỏng Webhook thành công / thất bại */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isSimulatingWebhook}
                    onClick={() => handleSimulateWebhook(true)}
                    className="py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-xs transition disabled:opacity-50"
                  >
                    {isSimulatingWebhook ? 'Đang gửi Webhook...' : '✓ Quét thành công (PAID)'}
                  </button>
                  <button
                    type="button"
                    disabled={isSimulatingWebhook}
                    onClick={() => handleSimulateWebhook(false)}
                    className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition disabled:opacity-50"
                  >
                    ✕ Hủy / Lỗi thẻ (Hoàn kho)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQRSandbox(false)}
                  className="mt-4 text-xs text-gray-400 hover:text-gray-600"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
