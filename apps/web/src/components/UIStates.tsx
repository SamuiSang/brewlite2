// apps/web/src/components/UIStates.tsx
'use client';

import React from 'react';
import { Search, AlertCircle, RefreshCw, X } from 'lucide-react';

/**
 * Component hiển thị khung xương tải dữ liệu (01b · Thực đơn đang tải).
 * Sử dụng hiệu ứng Shimmer nhấp nháy mô phỏng chính xác bố cục lưới thẻ món ăn BrewLite 2.
 */
export const SkeletonLoading: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div
      data-testid="skeleton-loading"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col justify-between rounded-2xl bg-white p-4 border border-[#E5E8E1] shadow-xs animate-pulse"
        >
          {/* Skeleton khung ảnh */}
          <div className="aspect-[4/3] w-full rounded-xl bg-[#EFECE6] mb-3" />

          {/* Skeleton tiêu đề & mô tả */}
          <div className="space-y-2">
            <div className="h-4 bg-[#E5E2DC] rounded w-3/4" />
            <div className="h-3 bg-[#EFECE6] rounded w-full" />
            <div className="h-3 bg-[#EFECE6] rounded w-2/3" />
          </div>

          {/* Skeleton giá & nút bấm */}
          <div className="mt-4 pt-3 border-t border-[#E5E8E1] flex items-center justify-between">
            <div className="h-5 bg-[#E5E2DC] rounded w-20" />
            <div className="h-8 bg-[#E5E2DC] rounded-full w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};

interface EmptyStateProps {
  keyword?: string;
  onResetFilter?: () => void;
}

/**
 * Component hiển thị khi không tìm thấy món đồ uống nào (01c · Không tìm thấy món).
 * Chuẩn thông điệp Figma BrewLite 2: "Không tìm thấy món phù hợp" kèm nút "Đặt lại bộ lọc".
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  keyword,
  onResetFilter,
}) => {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-[#E5E8E1] shadow-xs w-full my-6"
    >
      <div className="w-14 h-14 rounded-full bg-[#FBF9F5] border border-[#E5E8E1] flex items-center justify-center mb-4 text-[#183B2B]">
        <Search className="w-6 h-6 stroke-[1.8]" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-[#182B22]">
        Không tìm thấy món phù hợp
      </h3>
      <p className="mt-1.5 text-xs sm:text-sm text-[#59665F] max-w-md leading-relaxed">
        {keyword ? (
          <>
            Không có đồ uống nào khớp với từ khóa{' '}
            <span className="font-semibold text-[#182B22]">&ldquo;{keyword}&rdquo;</span>.
          </>
        ) : (
          'Hiện tại danh mục này chưa có món nào đang mở bán.'
        )}
        <br />
        Vui lòng kiểm tra lại từ khóa hoặc đặt lại bộ lọc để khám phá toàn bộ thực đơn.
      </p>

      {onResetFilter && (
        <button
          type="button"
          onClick={onResetFilter}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#183B2B] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#234D39] transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2]" />
          <span>Đặt lại bộ lọc</span>
        </button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Component hiển thị khi xảy ra lỗi kết nối mạng (01d · Lỗi kết nối thực đơn).
 * Chuẩn thông điệp Figma BrewLite 2: "Chưa thể tải thực đơn. Vui lòng thử lại." kèm nút "Thử lại".
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
}) => {
  return (
    <div
      data-testid="error-state"
      className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-rose-200/80 shadow-xs w-full my-6"
    >
      <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mb-4 text-[#B42318]">
        <AlertCircle className="w-7 h-7 stroke-[2]" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-[#182B22]">
        Chưa thể tải thực đơn
      </h3>
      <p className="mt-1.5 text-xs sm:text-sm text-[#59665F] max-w-md leading-relaxed">
        {message || 'Hệ thống tạm thời không thể kết nối đến máy chủ thực đơn.'}
        <br />
        Vui lòng kiểm tra kết nối mạng và thử lại.
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#183B2B] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#234D39] transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 stroke-[2]" />
          <span>Thử lại</span>
        </button>
      )}
    </div>
  );
};
