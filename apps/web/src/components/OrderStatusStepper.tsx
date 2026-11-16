'use client';

import React from 'react';
import { Check, Clock, Coffee, AlertTriangle } from 'lucide-react';

export type OrderLifecycleStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface StepperNode {
  key: string;
  stepNumber: number;
  label: string;
  compactLabel: string;
  sublabel?: string;
  state: 'done' | 'active' | 'pending' | 'cancelled';
}

/**
 * Chuẩn hóa 4 mốc tiến trình nhận món khớp Figma Frame 07 & Frame 07d
 */
export function getStepperSteps(
  status: string,
  options?: { isReadyAtCounter?: boolean; estimatedMinutes?: number },
): StepperNode[] {
  const normalized = (status || 'PENDING').toUpperCase() as OrderLifecycleStatus;
  const isReady = Boolean(options?.isReadyAtCounter) || normalized === 'READY';
  const etaText =
    options?.estimatedMinutes && options.estimatedMinutes > 0
      ? `Dự kiến còn khoảng ${options.estimatedMinutes} phút`
      : 'Dự kiến còn khoảng 8 phút';

  if (normalized === 'CANCELLED') {
    return [
      {
        key: 'RECEIVED',
        stepNumber: 1,
        label: 'Đã tiếp nhận đơn',
        compactLabel: 'Tiếp nhận',
        sublabel: 'Đơn hàng đã được khởi tạo',
        state: 'done',
      },
      {
        key: 'CANCELLED',
        stepNumber: 2,
        label: 'Đơn hàng đã hủy',
        compactLabel: 'Đã hủy',
        sublabel: 'Nguyên liệu giữ chỗ đã được hoàn trả kho',
        state: 'cancelled',
      },
    ];
  }

  // Mapping theo máy trạng thái BR-06.1 & UI Frame 07 / 07d
  let currentStep = 1;
  if (normalized === 'COMPLETED') {
    currentStep = 4;
  } else if (isReady) {
    currentStep = 3;
  } else if (normalized === 'PREPARING') {
    currentStep = 2;
  } else if (normalized === 'PAID') {
    currentStep = 2;
  } else {
    currentStep = 1;
  }

  const resolveState = (index: number): 'done' | 'active' | 'pending' => {
    if (normalized === 'COMPLETED') return 'done';
    if (index < currentStep) return 'done';
    if (index === currentStep) return 'active';
    return 'pending';
  };

  return [
    {
      key: 'RECEIVED',
      stepNumber: 1,
      label: normalized === 'PENDING' ? 'Chờ xác nhận thanh toán' : 'Đã tiếp nhận đơn',
      compactLabel: 'Đã tiếp nhận',
      sublabel: normalized === 'PENDING' ? 'Vui lòng hoàn tất thanh toán trước khi hết hạn giữ chỗ' : 'Đơn hàng đã gửi tới quầy pha chế',
      state: normalized === 'PENDING' ? 'active' : 'done',
    },
    {
      key: 'PREPARING',
      stepNumber: 2,
      label: currentStep > 2 ? 'Đã pha chế' : 'Nhân viên đang pha chế',
      compactLabel: 'Pha chế',
      sublabel: currentStep === 2 ? etaText : undefined,
      state: normalized === 'PENDING' ? 'pending' : resolveState(2),
    },
    {
      key: 'READY',
      stepNumber: 3,
      label: 'Sẵn sàng nhận tại quầy',
      compactLabel: 'Sẵn sàng nhận',
      sublabel: currentStep === 3 ? 'Mời bạn đến quầy nhận đồ uống' : undefined,
      state: normalized === 'PENDING' ? 'pending' : resolveState(3),
    },
    {
      key: 'COMPLETED',
      stepNumber: 4,
      label: 'Đã hoàn thành',
      compactLabel: 'Hoàn thành',
      sublabel: normalized === 'COMPLETED' ? 'Cảm ơn bạn đã ghé BrewLite!' : undefined,
      state: normalized === 'COMPLETED' ? 'done' : 'pending',
    },
  ];
}

export interface OrderStatusStepperProps {
  status: string;
  isReadyAtCounter?: boolean;
  estimatedMinutes?: number;
  orientation?: 'vertical' | 'horizontal';
}

/**
 * Component hiển thị thanh tiến trình đơn hàng 4 bước (Figma Frame 07 & Frame 07d)
 */
export function OrderStatusStepper({
  status,
  isReadyAtCounter = false,
  estimatedMinutes = 8,
  orientation = 'vertical',
}: OrderStatusStepperProps) {
  const steps = getStepperSteps(status, { isReadyAtCounter, estimatedMinutes });

  if (orientation === 'horizontal') {
    return (
      <div
        data-testid="order-status-stepper-horizontal"
        className="w-full py-2"
        aria-label="Tiến trình nhận món"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {steps.map((step, idx) => {
            const isDone = step.state === 'done';
            const isActive = step.state === 'active';
            const isCancelled = step.state === 'cancelled';

            return (
              <div key={step.key} className="relative flex flex-col items-center text-center">
                {idx < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className={`hidden sm:block absolute top-4 left-1/2 w-full h-0.5 ${
                      isDone ? 'bg-[#246344]' : 'bg-[#E8D7B8]'
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                    isDone
                      ? 'bg-[#246344] border-[#246344] text-[#FFFAF0]'
                      : isActive
                        ? 'bg-[#7D3F32] border-[#7D3F32] text-[#FFFAF0] ring-4 ring-[#7D3F32]/15'
                        : isCancelled
                          ? 'bg-[#B42318] border-[#B42318] text-[#FFFAF0]'
                          : 'bg-[#FFFAF0] border-[#DDCCAE] text-[#786B5A]'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4" />
                  ) : isCancelled ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <span>{step.stepNumber}</span>
                  )}
                </div>
                <p
                  className={`mt-2 text-xs font-semibold ${
                    isDone || isActive
                      ? 'text-[#3F3027]'
                      : isCancelled
                        ? 'text-[#B42318]'
                        : 'text-[#786B5A]'
                  }`}
                >
                  {step.compactLabel}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="order-status-stepper-vertical"
      className="space-y-0"
      aria-label="Tiến trình pha chế"
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isDone = step.state === 'done';
        const isActive = step.state === 'active';
        const isCancelled = step.state === 'cancelled';

        return (
          <div key={step.key} className="flex gap-3.5 items-stretch">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border transition-all ${
                  isDone
                    ? 'bg-[#246344] border-[#246344] text-[#FFFAF0]'
                    : isActive
                      ? 'bg-[#7D3F32] border-[#7D3F32] text-[#FFFAF0] ring-4 ring-[#7D3F32]/15'
                      : isCancelled
                        ? 'bg-[#B42318] border-[#B42318] text-[#FFFAF0]'
                        : 'bg-[#F3E8D4] border-[#DDCCAE] text-[#786B5A]'
                }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isCancelled ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <span>{step.stepNumber}</span>
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 min-h-[28px] my-1 ${
                    isDone ? 'bg-[#246344]' : 'bg-[#E8D7B8]'
                  }`}
                />
              )}
            </div>

            <div className={isLast ? 'pb-1' : 'pb-5'}>
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-semibold ${
                    isCancelled
                      ? 'text-[#B42318]'
                      : isActive
                        ? 'text-[#7D3F32]'
                        : isDone
                          ? 'text-[#3F3027]'
                          : 'text-[#786B5A]'
                  }`}
                >
                  {step.label}
                </p>
                {isActive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F5E9D8] px-2 py-0.5 text-[10px] font-bold text-[#7D3F32] border border-[#E8D7B8]">
                    {step.key === 'PREPARING' ? (
                      <Coffee className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    Đang xử lý
                  </span>
                )}
              </div>
              {step.sublabel && (
                <p className="text-xs text-[#786B5A] mt-0.5 leading-relaxed">{step.sublabel}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Tiến trình hoàn tiền 3 bước cho Kịch bản hết món bất khả kháng (Figma Frame 06e)
 */
export function RefundProgressStepper({
  amount,
  paymentRefunded = false,
}: {
  amount: number;
  paymentRefunded?: boolean;
}) {
  const formatted = `${Number(amount || 0).toLocaleString('vi-VN')} đ`;
  const steps = [
    {
      num: 1,
      title: 'Món hiện TẠM HẾT',
      desc: 'Đã xác nhận không thể thực hiện đơn và giải phóng nguyên liệu còn lại',
      done: true,
    },
    {
      num: 2,
      title: `Đang gửi lệnh hoàn ${formatted}`,
      desc: paymentRefunded
        ? 'Cổng sandbox đã tiếp nhận lệnh hoàn tiền'
        : 'Chờ cổng thử nghiệm tiếp nhận',
      done: paymentRefunded,
    },
    {
      num: 3,
      title: 'Tiền về tài khoản',
      desc: paymentRefunded
        ? 'Trạng thái hoàn tiền đã ghi nhận REFUNDED'
        : 'Chưa có xác nhận hoàn tiền thành công',
      done: paymentRefunded,
    },
  ];

  return (
    <div data-testid="refund-progress-stepper" className="space-y-4">
      {steps.map((s, idx) => (
        <div key={s.num} className="flex gap-3 items-start">
          <div className="flex flex-col items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                s.done
                  ? 'bg-[#246344] text-[#FFFAF0]'
                  : idx === 1
                    ? 'bg-[#D98236] text-[#FFFAF0]'
                    : 'bg-[#F3E8D4] text-[#786B5A] border border-[#DDCCAE]'
              }`}
            >
              {s.done ? <Check className="w-3.5 h-3.5" /> : s.num}
            </div>
            {idx < steps.length - 1 && <div className="w-0.5 h-6 bg-[#E8D7B8] mt-1" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#3F3027]">{s.title}</p>
            <p className="text-xs text-[#786B5A] mt-0.5">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
