'use client';

import { useState } from 'react';
import { EmptyState, ErrorState, SkeletonLoading } from '@/components/UIStates';

type State = 'loading' | 'empty' | 'error' | 'success';

export default function UIStatesPreview() {
  const [state, setState] = useState<State>('loading');
  const [search, setSearch] = useState('Matcha');

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold">BrewLite · Task 4.3 · Chỉ dùng khi phát triển</p>
        <h1 className="mt-2 text-3xl font-bold">Kiểm tra trạng thái giao diện</h1>
        <p className="mt-3 text-sm text-[#657269]">Dữ liệu mô phỏng để kiểm tra component, không phải thực đơn thật.</p>
      </header>
      <nav aria-label="Chọn trạng thái kiểm tra" className="mb-6 flex flex-wrap gap-3">
        {([['loading', 'Đang tải'], ['empty', 'Không có kết quả'], ['error', 'Lỗi kết nối']] as const).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={state === value}
            onClick={() => { setState(value); setSearch('Matcha'); }}
            className="min-h-11 rounded-full border border-[#183c2e] px-5 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 aria-pressed:bg-[#183c2e] aria-pressed:text-white">
            {label}
          </button>
        ))}
      </nav>
      {state === 'loading' && <SkeletonLoading />}
      {state === 'empty' && (
        <>
          <label className="mb-4 block text-sm">Từ khóa tìm kiếm
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="mt-2 block min-h-11 w-full rounded-xl border border-[#e6e9e2] bg-white px-4" />
          </label>
          <EmptyState onReset={() => { setSearch(''); setState('success'); }} />
        </>
      )}
      {state === 'error' && <ErrorState onRetry={() => setState('success')} />}
      {state === 'success' && <p role="status" className="rounded-2xl bg-white p-8">Callback đã chạy. Từ khóa: {search || '(trống)'}. Menu thật sẽ được tải lại khi tích hợp.</p>}
    </main>
  );
}
