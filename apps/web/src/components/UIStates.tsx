// apps/web/src/components/UIStates.tsx
'use client';

import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

const buttonClass =
  'mt-6 inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl bg-[#7D3F32] px-6 py-3 text-sm font-semibold text-[#FFFAF0] transition-colors hover:bg-[#693327] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7D3F32] cursor-pointer';

function DrinkIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 96 96" className="mx-auto mb-6 h-24 w-24 text-[#7D3F32]" fill="none">
      <circle cx="48" cy="48" r="46" fill="#F3E8D4" />
      <path
        d="M27 37h35v20a17.5 17.5 0 0 1-35 0V37Zm35 3h5a9 9 0 0 1 0 18h-5M23 77h46M38 19v9m12-13v13"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Component hiển thị khung xương tải dữ liệu (01b · Thực đơn đang tải).
 * Hỗ trợ hiệu ứng Shimmer nhấp nháy mô phỏng chính xác thẻ món ăn BrewLite Figma Cloud.
 */
export function SkeletonLoading({ count = 8 }: { count?: number } = {}) {
  return (
    <section role="status" aria-busy="true" aria-label="Đang tải thực đơn" data-testid="skeleton-loading" className="w-full">
      <span className="sr-only">Đang tải menu</span>
      <div aria-hidden="true" className="grid w-full grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-[#E8D7B8] bg-[#FFFAF0] p-3 sm:p-4">
            <div className="skeleton-shimmer aspect-[4/3] rounded-xl bg-[#E8D7B8] mb-3" />
            <div className="space-y-3 py-2 motion-safe:animate-pulse">
              <div className="h-4 w-3/4 rounded bg-[#E8D7B8]" />
              <div className="h-3 w-full rounded bg-[#E8D7B8]" />
              <div className="h-3 w-1/2 rounded bg-[#E8D7B8]" />
              <div className="mt-3 flex items-center justify-between gap-2 pt-1.5 sm:mt-4 sm:pt-2">
                <div className="h-4 w-1/3 rounded bg-[#E8D7B8]" />
                <div className="h-8 w-8 shrink-0 rounded-full bg-[#E8D7B8] sm:h-9 sm:w-9" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export interface EmptyStateProps {
  keyword?: string;
  onReset?: () => void;
  onResetFilter?: () => void;
}

/**
 * Component hiển thị khi không tìm thấy món đồ uống nào (01c · Không tìm thấy món).
 */
export function EmptyState({ keyword, onReset, onResetFilter }: EmptyStateProps = {}) {
  const handleReset = onResetFilter || onReset;
  const isFiltered = Boolean(handleReset || keyword);

  return (
    <section
      role="status"
      data-testid="empty-state"
      className="my-6 flex min-h-[320px] w-full flex-col items-center justify-center rounded-2xl border border-[#E8D7B8] bg-[#FFFAF0] px-4 py-12 text-center sm:px-6 sm:py-16"
    >
      <DrinkIllustration />
      <h2 className="text-xl font-serif font-bold leading-snug tracking-normal text-[#3F3027] sm:text-2xl">
        {isFiltered ? 'Không tìm thấy món đồ uống phù hợp' : 'Chưa có đồ uống'}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#786B5A]">
        {keyword ? (
          <>
            Không có đồ uống nào khớp với từ khóa{' '}
            <span className="break-words font-semibold text-[#3F3027]">&ldquo;{keyword}&rdquo;</span>.
            <br />
            Thử từ khóa khác hoặc xóa bộ lọc để khám phá thực đơn BrewLite.
          </>
        ) : isFiltered ? (
          'Thử từ khóa khác hoặc xóa bộ lọc để khám phá thực đơn BrewLite.'
        ) : (
          'Menu đang được cập nhật. Vui lòng quay lại sau.'
        )}
      </p>
      {handleReset && (
        <button type="button" onClick={handleReset} className={buttonClass}>
          <X aria-hidden={true} className="h-4 w-4 shrink-0 stroke-[2]" />
          <span>Xóa bộ lọc</span>
        </button>
      )}
    </section>
  );
}

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Component hiển thị khi xảy ra lỗi kết nối mạng (01d · Lỗi kết nối thực đơn).
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <section
      data-testid="error-state"
      className="my-6 flex min-h-[320px] w-full flex-col items-center justify-center rounded-2xl border border-[#E8D7B8] bg-[#FFFAF0] px-4 py-12 text-center sm:px-6 sm:py-16"
    >
      <div aria-hidden="true" className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#F3E8D4] text-[#7D3F32]">
        <AlertCircle className="h-10 w-10 stroke-[1.5]" />
      </div>
      <div role="alert">
        <h2 className="text-xl font-serif font-bold leading-snug tracking-normal text-[#3F3027] sm:text-2xl">Không thể tải thực đơn</h2>
        <p className="mt-3 text-sm leading-6 text-[#786B5A]">
          {message || 'Vui lòng kiểm tra lại kết nối mạng và thử lại.'}
        </p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className={buttonClass}>
          <RefreshCw aria-hidden={true} className="h-4 w-4 shrink-0 stroke-[2]" />
          <span>Thử lại</span>
        </button>
      )}
    </section>
  );
}
