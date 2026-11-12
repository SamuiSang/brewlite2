import Link from 'next/link';
import { ShoppingBag, Coffee } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FBF9F5] text-[#182B22] flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-16 h-16 bg-[#EDF2EB] text-[#183B2B] rounded-full flex items-center justify-center mb-6">
        <Coffee className="w-8 h-8 stroke-[2]" />
      </div>
      <h1 className="text-[32px] sm:text-[40px] font-bold tracking-tight text-[#183B2B]">
        BrewLite
      </h1>
      <p className="text-[12px] font-bold tracking-widest text-[#D98236] uppercase mt-1">
        Cà phê nguyên bản · Một ngày thật an nhiên
      </p>
      <p className="mt-3 text-[14px] text-[#647168] max-w-md">
        Hệ thống đặt đồ uống trực tuyến Mobile-first PWA theo chuẩn thiết kế Figma BrewLite 2.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href="/menu"
          className="h-[48px] px-6 bg-[#183B2B] hover:bg-[#234D39] text-white rounded-[12px] font-bold text-[14px] flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Coffee className="w-4 h-4" />
          <span>Khám phá Thực đơn</span>
        </Link>
        <Link
          href="/cart"
          className="h-[48px] px-6 bg-white hover:bg-[#F5F5F0] text-[#183B2B] border border-[#E5E8E1] rounded-[12px] font-bold text-[14px] flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Giỏ hàng</span>
        </Link>
      </div>
    </main>
  );
}
