'use client';

import { ErrorState } from '@/components/UIStates';

export default function ErrorPage({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-8">
      <ErrorState onRetry={reset} />
    </main>
  );
}
