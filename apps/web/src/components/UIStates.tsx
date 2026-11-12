// apps/web/src/components/UIStates.tsx
'use client';

import React from 'react';
import { Search, AlertCircle, RefreshCw, X } from 'lucide-react';

const buttonClass =
  'mt-6 min-h-11 inline-flex items-center gap-2 rounded-full bg-[#183c2e] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#28513f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183c2e] shadow-xs cursor-pointer';

function DrinkIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 96 96" className="mx-auto mb-6 h-24 w-24 text-[#183c2e]" fill="none">
      <circle cx="48" cy="48" r="46" fill="#edf2ec" />
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
 * Hỗ trợ hiệu ứng Shimmer nhấp nháy mô phỏng chính xác thẻ món ăn BrewLite.
 */
export function SkeletonLoading({ count = 8 }: { count?: number } = {}) {
  return (
    <section role="status" aria-busy="true" aria-label="Đang tải thực đơn" data-testid="skeleton-loading" className="w-full">
      <span className="sr-only">Đang tải menu</span>
      <div aria-hidden="true" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-[#e6e9e2] bg-white p-4 shadow-xs">
            <div className="skeleton-shimmer aspect-[4/3] rounded-xl bg-[#e6e9e2] mb-3" />
            <div className="space-y-3 py-2 motion-safe:animate-pulse">
              <div className="h-4 w-3/4 rounded bg-[#e6e9e2]" />
              <div className="h-3 w-full rounded bg-[#e6e9e2]" />
              <div className="h-3 w-1/2 rounded bg-[#e6e9e2]" />
              <div className="mt-4 pt-3 border-t border-[#e6e9e2] flex items-center justify-between">
                <div className="h-4 w-1/3 rounded bg-[#e6e9e2]" />
                <div className="h-8 w-20 rounded-full bg-[#e6e9e2]" />
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
      className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-3xl border border-[#e6e9e2] shadow-xs w-full my-6"
    >
      <DrinkIllustration />
      <h2 className="text-xl font-semibold text-[#183c2e]">
        {isFiltered ? 'Không tìm thấy món đồ uống phù hợp' : 'Chưa có đồ uống'}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#657269]">
        {keyword ? (
          <>
            Không có đồ uống nào khớp với từ khóa{' '}
            <span className="font-semibold text-[#182B22]">&ldquo;{keyword}&rdquo;</span>.
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
          <X className="w-4 h-4 stroke-[2]" />
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
      className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-3xl border border-rose-200/80 shadow-xs w-full my-6"
    >
      <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mb-4 text-[#B42318]">
        <AlertCircle className="w-7 h-7 stroke-[2]" />
      </div>
      <div role="alert">
        <h2 className="text-xl font-semibold text-[#183c2e]">Không thể tải thực đơn</h2>
        <p className="mt-3 text-sm leading-6 text-[#657269]">
          {message || 'Vui lòng kiểm tra lại kết nối mạng và thử lại.'}
        </p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className={buttonClass}>
          <RefreshCw className="w-4 h-4 stroke-[2]" />
          <span>Thử lại</span>
        </button>
      )}
    </section>
  );
}
