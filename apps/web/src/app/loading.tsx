import { SkeletonLoading } from '@/components/UIStates';

export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-8">
      <SkeletonLoading />
    </main>
  );
}
