'use client';

const buttonClass = 'mt-6 min-h-11 rounded-full bg-[#183c2e] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#28513f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183c2e]';

function DrinkIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 96 96" className="mx-auto mb-6 h-24 w-24 text-[#183c2e]" fill="none">
      <circle cx="48" cy="48" r="46" fill="#edf2ec" />
      <path d="M27 37h35v20a17.5 17.5 0 0 1-35 0V37Zm35 3h5a9 9 0 0 1 0 18h-5M23 77h46M38 19v9m12-13v13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SkeletonLoading() {
  return (
    <section role="status" aria-busy="true" aria-label="Đang tải thực đơn">
      <span className="sr-only">Đang tải menu</span>
      <div aria-hidden="true" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-[#e6e9e2] bg-white p-3">
            <div className="skeleton-shimmer aspect-[4/3] rounded-xl bg-[#e6e9e2]" />
            <div className="space-y-3 py-4 motion-safe:animate-pulse">
              <div className="h-3 w-1/3 rounded bg-[#e6e9e2]" />
              <div className="h-5 w-3/4 rounded bg-[#e6e9e2]" />
              <div className="h-4 w-1/2 rounded bg-[#e6e9e2]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function EmptyState({ onReset }: { onReset?: () => void } = {}) {
  return (
    <section role="status" className="rounded-2xl border border-[#e6e9e2] bg-white px-6 py-16 text-center">
      <DrinkIllustration />
      <h2 className="text-xl font-semibold text-[#183c2e]">
        {onReset ? 'Không tìm thấy món đồ uống phù hợp' : 'Chưa có đồ uống'}
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#657269]">
        {onReset ? 'Thử từ khóa khác hoặc xóa bộ lọc để khám phá thực đơn BrewLite.' : 'Menu đang được cập nhật. Vui lòng quay lại sau.'}
      </p>
      {onReset && <button type="button" onClick={onReset} className={buttonClass}>Xóa bộ lọc</button>}
    </section>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="rounded-2xl border border-[#e6e9e2] bg-white px-6 py-16 text-center">
      <DrinkIllustration />
      <div role="alert">
        <h2 className="text-xl font-semibold text-[#183c2e]">Không thể tải thực đơn</h2>
        <p className="mt-3 text-sm leading-6 text-[#657269]">Vui lòng kiểm tra lại kết nối mạng và thử lại.</p>
      </div>
      <button type="button" onClick={onRetry} className={buttonClass}>Thử lại</button>
    </section>
  );
}
