'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ErrorState } from '@/components/UIStates';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ghi log chi tiết lỗi trong console để phục vụ debug an toàn
    console.error('[BrewLite ErrorBoundary]', error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 py-10 sm:px-8">
      <ErrorState onRetry={reset} />
      <Link
        href="/menu"
        className="mt-4 inline-flex items-center text-sm font-semibold text-[#7D3F32] hover:underline"
      >
        ← Quay lại trang Thực đơn
      </Link>
    </main>
  );
}
