'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductCustomizationModal from '../../../components/ProductCustomizationModal';
import { useCartStore } from '../../../lib/store';

const product = { id: 'task5-preview-coffee', name: 'Cà phê Muối Côn Đảo', slug: 'ca-phe-muoi-con-dao', category: 'COFFEE' as const, basePrice: 45000, description: 'Dữ liệu mô phỏng chỉ dùng kiểm tra Task 5, không dùng đặt đơn.', imageUrl: '/images/drinks/ca-phe-muoi-con-dao.jpg', isActive: true, isSoldOut: false, availableStock: 5 };
const toppings = [{ id: 'preview-jelly', name: 'Thạch cà phê (mô phỏng)', price: 6000 }, { id: 'preview-cream', name: 'Kem cheese (mô phỏng)', price: 10000 }];
export default function Task5Preview() {
  const [open, setOpen] = useState(false);
  useEffect(() => { void useCartStore.persist.rehydrate(); }, []);
  const count = useCartStore(s => s.items.reduce((n, i) => n + i.quantity, 0));
  return <main className="min-h-screen bg-[#F3E9D2] p-6 text-[#3F3027]">
    <div className="mx-auto max-w-3xl space-y-6"><h1 className="text-2xl font-bold">BrewLite · Kiểm tra Task 5 của Quỳnh</h1>
      <p>Dữ liệu mô phỏng, không phải món/topping lấy từ DB. Không thay đổi Menu của Duy.</p>
      <button type="button" onClick={() => setOpen(true)} className="min-h-11 rounded-lg bg-[#7D4435] px-5 text-white">Tùy biến món mẫu</button>
      <Link href="/cart" className="ml-4 inline-flex min-h-11 items-center underline">Xem giỏ hàng ({count})</Link>
      <button type="button" onClick={() => useCartStore.getState().clearCart()} className="block min-h-11 underline">Xóa giỏ thử nghiệm</button>
      {open && <ProductCustomizationModal product={product} toppings={toppings} onClose={() => setOpen(false)} />}
    </div>
  </main>;
}
