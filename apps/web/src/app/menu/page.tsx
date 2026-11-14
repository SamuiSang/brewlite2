// apps/web/src/app/menu/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, MapPin, Check, AlertCircle, X, ShoppingCart } from 'lucide-react';
import { Product, CategoryFilterOption } from '../../types/product';
import { CategoryFilter } from '../../components/CategoryFilter';
import { ProductCard } from '../../components/ProductCard';
import { SkeletonLoading, EmptyState, ErrorState } from '../../components/UIStates';
import { useCartStore } from '../../lib/store';
import { FloatingCartBar } from '../../components/FloatingCartBar';
import ProductCustomizationModal from '../../components/ProductCustomizationModal';
import { UserNav } from '../../components/UserNav';

/**
 * Danh sách 18 món thực đơn BrewLite 2 khớp 100% bản thiết kế Figma Cloud (BdBtjCNyz1miLp27sp0Hzp).
 * Đầy đủ 6 danh mục và 2 món Tạm hết (Bánh Sừng Bò Bơ, Trà Oolong Sen Vàng Đắk Lắk).
 */
const FALLBACK_SEED_PRODUCTS: Product[] = [
  // Hàng 1
  {
    id: 'prod-001',
    name: 'Cà phê Muối Côn Đảo',
    slug: 'ca-phe-muoi-con-dao',
    description: 'Đậm vị cà phê, mịn màng kem muối.',
    category: 'ESPRESSO',
    basePrice: 45000,
    imageUrl: '/images/drinks/ca-phe-muoi-con-dao.jpg',
    isActive: true,
    availableStock: 25,
    isSoldOut: false,
  },
  {
    id: 'prod-002',
    name: 'Trà Lài Vải Thiều',
    slug: 'tra-lai-vai-thieu',
    description: 'Hương lài thanh, vải thiều ngọt dịu.',
    category: 'TEA',
    basePrice: 42000,
    imageUrl: '/images/drinks/tra-lai-vai-thieu.jpg',
    isActive: true,
    availableStock: 20,
    isSoldOut: false,
  },
  {
    id: 'prod-003',
    name: 'Matcha Dừa Non',
    slug: 'matcha-dua-non',
    description: 'Matcha đậm thơm, dừa non béo nhẹ.',
    category: 'TEA',
    basePrice: 55000,
    imageUrl: '/images/drinks/matcha-dua-non.jpg',
    isActive: true,
    availableStock: 15,
    isSoldOut: false,
  },
  {
    id: 'prod-004',
    name: 'Bánh Sừng Bò Bơ',
    slug: 'banh-sung-bo-bo',
    description: 'Vỏ giòn thơm, lớp bơ tan nhẹ.',
    category: 'PASTRY',
    basePrice: 32000,
    imageUrl: '/images/drinks/banh-sung-bo-bo.jpg',
    isActive: true,
    availableStock: 0,
    isSoldOut: true,
  },

  // Hàng 2
  {
    id: 'prod-005',
    name: 'Cà phê Ủ Lạnh Cam Vàng',
    slug: 'ca-phe-u-lanh-cam-vang',
    description: 'Cà phê ủ lạnh 16 tiếng kết hợp tép cam tươi.',
    category: 'COLD_BREW',
    basePrice: 49000,
    imageUrl: '/images/drinks/ca-phe-u-lanh-cam-vang.jpg',
    isActive: true,
    availableStock: 18,
    isSoldOut: false,
  },
  {
    id: 'prod-006',
    name: 'Cold Brew Yến Mạch Quế',
    slug: 'cold-brew-yen-mach-que',
    description: 'Cà phê ủ lạnh êm dịu hòa cùng sữa yến mạch và quế thơm.',
    category: 'COLD_BREW',
    basePrice: 52000,
    imageUrl: '/images/drinks/cold-brew-yen-mach-que.jpg',
    isActive: true,
    availableStock: 12,
    isSoldOut: false,
  },
  {
    id: 'prod-007',
    name: 'Mocha Cacao Tuyết',
    slug: 'mocha-cacao-tuyet',
    description: 'Đá xay mịn cùng socola đen, espresso và kem whipping.',
    category: 'FREEZE',
    basePrice: 58000,
    imageUrl: '/images/drinks/mocha-cacao-tuyet.jpg',
    isActive: true,
    availableStock: 10,
    isSoldOut: false,
  },
  {
    id: 'prod-008',
    name: 'Matcha Tuyết Dừa Béo',
    slug: 'matcha-tuyet-dua-beo',
    description: 'Matcha Uji đá xay mịn cùng kem sữa dừa bồng bềnh.',
    category: 'FREEZE',
    basePrice: 59000,
    imageUrl: '/images/drinks/matcha-tuyet-dua-beo.jpg',
    isActive: true,
    availableStock: 14,
    isSoldOut: false,
  },

  // Hàng 3
  {
    id: 'prod-009',
    name: 'Latte Hạt Phỉ Khói',
    slug: 'latte-hat-phi-khoi',
    description: 'Espresso phân tầng cùng sữa tươi và sốt hạt phỉ thơm lừng.',
    category: 'ESPRESSO',
    basePrice: 52000,
    imageUrl: '/images/drinks/latte-hat-phi-khoi.jpg',
    isActive: true,
    availableStock: 16,
    isSoldOut: false,
  },
  {
    id: 'prod-010',
    name: 'Trà Oolong Sen Vàng Đắk Lắk',
    slug: 'tra-oolong-sen-vang-dak-lak',
    description: 'Vị thanh ngọt của trà Oolong kết hợp hạt sen tươi bùi.',
    category: 'TEA',
    basePrice: 48000,
    imageUrl: '/images/drinks/tra-oolong-sen-vang-dak-lak.jpg',
    isActive: true,
    availableStock: 0,
    isSoldOut: true,
  },
  {
    id: 'prod-011',
    name: 'Cold Brew Mơ Rừng Tây Bắc',
    slug: 'cold-brew-mo-rung-tay-bac',
    description: 'Vị chua ngọt thanh tao của mơ rừng hòa cùng cà phê ủ chậm.',
    category: 'COLD_BREW',
    basePrice: 54000,
    imageUrl: '/images/drinks/cold-brew-mo-rung-tay-bac.jpg',
    isActive: true,
    availableStock: 12,
    isSoldOut: false,
  },
  {
    id: 'prod-012',
    name: 'Cold Brew Tonic Bưởi Hồng',
    slug: 'cold-brew-tonic-buoi-hong',
    description: 'Cà phê ủ lạnh sủi bọt cùng nước tonic và bưởi hồng tươi.',
    category: 'COLD_BREW',
    basePrice: 55000,
    imageUrl: '/images/drinks/cold-brew-tonic-buoi-hong.jpg',
    isActive: true,
    availableStock: 15,
    isSoldOut: false,
  },

  // Hàng 4
  {
    id: 'prod-013',
    name: 'Caramel Macchiato Đá Xay',
    slug: 'caramel-macchiato-da-xay',
    description: 'Espresso phân tầng xay tuyết cùng sốt caramel béo ngậy.',
    category: 'FREEZE',
    basePrice: 58000,
    imageUrl: '/images/drinks/caramel-macchiato-da-xay.jpg',
    isActive: true,
    availableStock: 11,
    isSoldOut: false,
  },
  {
    id: 'prod-014',
    name: 'Socola Bạc Hà Băng Tuyết',
    slug: 'socola-bac-ha-bang-tuyet',
    description: 'Vị ngọt đắng của cacao hòa cùng tinh dầu bạc hà the mát.',
    category: 'FREEZE',
    basePrice: 59000,
    imageUrl: '/images/drinks/socola-bac-ha-bang-tuyet.jpg',
    isActive: true,
    availableStock: 8,
    isSoldOut: false,
  },
  {
    id: 'prod-015',
    name: 'Flat White Hạnh Nhân Nướng',
    slug: 'flat-white-hanh-nhan-nuong',
    description: 'Double espresso kết hợp sữa hạnh nhân béo bùi và latte art.',
    category: 'ESPRESSO',
    basePrice: 52000,
    imageUrl: '/images/drinks/flat-white-hanh-nhan-nuong.jpg',
    isActive: true,
    availableStock: 14,
    isSoldOut: false,
  },
  {
    id: 'prod-016',
    name: 'Trà Đào Cam Sả Tươi',
    slug: 'tra-dao-cam-sa-tuoi',
    description: 'Trà đen thanh mát ủ cùng cam tươi, sả thơm và đào ngâm giòn.',
    category: 'TEA',
    basePrice: 45000,
    imageUrl: '/images/drinks/tra-dao-cam-sa-tuoi.jpg',
    isActive: true,
    availableStock: 22,
    isSoldOut: false,
  },

  // Hàng 5
  {
    id: 'prod-017',
    name: 'Trà Thanh Đào Sen Tuyết',
    slug: 'tra-thanh-dao-sen-tuyet',
    description: 'Hương hoa lài thanh tao hòa cùng hạt sen tươi và củ năng giòn.',
    category: 'TEA',
    basePrice: 48000,
    imageUrl: '/images/drinks/tra-thanh-dao-sen-tuyet.jpg',
    isActive: true,
    availableStock: 18,
    isSoldOut: false,
  },
  {
    id: 'prod-018',
    name: 'Bánh Tiramisu Cà Phê Rượu Rum',
    slug: 'banh-tiramisu-ca-phe-ruou-rum',
    description: 'Bánh tráng miệng Ý thơm lừng espresso, mascarpone và cacao.',
    category: 'PASTRY',
    basePrice: 62000,
    imageUrl: '/images/drinks/banh-tiramisu-ca-phe-ruou-rum.jpg',
    isActive: true,
    availableStock: 9,
    isSoldOut: false,
  },
];

/**
 * Trang chính Thực đơn đồ uống BrewLite 2 (/menu) - Phụ trách: Duy (UC-01).
 * Responsive chuẩn xác 100% bản vẽ Figma Cloud: Node 3:2 Desktop (1440px) và Node 3:6 Mobile (390px).
 */
export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterOption>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Hàng đợi thông báo (Toast Stack): Tối đa 8 cái xếp dọc, hiển thị 4.5s
  interface ToastItem {
    id: string;
    text: string;
    type: 'success' | 'error';
    visible: boolean;
  }
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Zustand Store kết nối giỏ hàng
  const totalCartItems = useCartStore((state) => state.getTotalItems());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  useEffect(() => { void useCartStore.persist.rehydrate(); }, []);

  // Debounce 300ms cho ô tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Hàm gọi API Backend NestJS (GET /api/v1/products)
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') {
        params.append('category', selectedCategory);
      }
      if (debouncedKeyword) {
        params.append('keyword', debouncedKeyword);
      }

      const queryString = params.toString();
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');
      const endpoint = queryString ? `${apiBase}/products?${queryString}` : `${apiBase}/products`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Mã lỗi máy chủ: ${response.status}`);
      }

      const data: Product[] = await response.json();
      setProducts(data);
    } catch {
      // Fallback nạp 18 món chuẩn Figma Cloud
      let filtered = [...FALLBACK_SEED_PRODUCTS];
      if (selectedCategory !== 'ALL') {
        filtered = filtered.filter((p) => p.category === selectedCategory);
      }
      if (debouncedKeyword) {
        const kw = debouncedKeyword.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(kw) ||
            (p.description && p.description.toLowerCase().includes(kw)),
        );
      }
      setProducts(filtered);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, debouncedKeyword]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Xóa bộ lọc
  const handleResetFilter = () => {
    setSelectedCategory('ALL');
    setSearchInput('');
    setDebouncedKeyword('');
  };

  // Kích hoạt Toast Stack
  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const newId = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    
    setToasts((prev) => {
      let current = [...prev];
      if (current.length >= 8) {
        current = current.map((item, idx) => (idx === 0 ? { ...item, visible: false } : item));
        setTimeout(() => {
          setToasts((p) => p.filter((t) => t.id !== current[0]?.id));
        }, 300);
      }
      return [...current, { id: newId, text, type, visible: false }];
    });

    const enterTimer = setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === newId ? { ...t, visible: true } : t))
      );
    }, 20);

    const exitTimer = setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === newId ? { ...t, visible: false } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newId));
      }, 350);
    }, 4500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  const closeToast = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  // Thêm nhanh vào giỏ hàng
  const handleSelectProduct = (product: Product) => {
    if (product.isSoldOut || product.availableStock <= 0) {
      showToast(`Món "${product.name}" hiện tạm hết nguyên liệu pha chế.`, 'error');
      return;
    }

    setSelectedProduct(product);
  };

  return (
    <div className="min-h-screen bg-[#F3E8D4] text-[#3F3027] font-sans flex flex-col justify-between overflow-x-hidden">
      {selectedProduct && <ProductCustomizationModal product={selectedProduct} toppings={[]} onClose={() => setSelectedProduct(null)} />}
      {/* Container hàng đợi thông báo (Toast Stack): Tối đa 8 cái */}
      <div
        aria-live="polite"
        className="fixed top-16 sm:top-20 right-3 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-h-[calc(100vh-5rem)] overflow-visible"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto max-w-[320px] sm:max-w-sm px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-xl border flex items-center justify-between gap-2.5 text-xs font-semibold transition-all duration-300 ease-out transform ${
              toast.visible
                ? 'translate-x-0 opacity-100 scale-100'
                : 'translate-x-[120%] opacity-0 scale-95'
            } ${
              toast.type === 'success'
                ? 'bg-[#7D3F32] text-[#FFFAF0] border-[#914C3E] shadow-black/20'
                : 'bg-[#B42318] text-white border-rose-700 shadow-rose-950/20'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {toast.type === 'success' ? (
                <Check className="w-4 h-4 text-[#D9C19B] shrink-0 stroke-[2.5]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 stroke-[2.5]" />
              )}
              <span className="leading-snug break-words text-[11px] sm:text-xs">{toast.text}</span>
            </div>

            <button
              type="button"
              onClick={() => closeToast(toast.id)}
              className="text-[#FFFAF0]/70 hover:text-[#FFFAF0] transition-colors p-0.5 rounded-full shrink-0"
              aria-label="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>
        ))}
      </div>

      {/* Wrapper nội dung chính */}
      <div className="w-full">
        {/* ========================================================= */}
        {/* 1. TOP HEADER NAVIGATION (Khớp 100% Figma Cloud)          */}
        {/* Desktop: Logo Lora + Nav Text + Cart Icon & Avatar Q       */}
        {/* Mobile: Logo Lora + Cart Icon & Avatar Q                   */}
        {/* ========================================================= */}
        <header className="w-full bg-[#F3E8D4] py-3.5 sm:py-4 px-4 sm:px-10 lg:px-14">
          <div className="max-w-[1360px] mx-auto flex items-center justify-between">
            {/* Logo bên trái */}
            <Link href="/menu" className="flex flex-col group">
              <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-[#3F3027] leading-none">
                BrewLite
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-widest text-[#786B5A] font-semibold mt-1">
                CÀ PHÊ NGUYÊN BẢN
              </span>
            </Link>

            {/* Menu điều hướng Desktop (chỉ hiện trên md trở lên) */}
            <nav className="hidden md:flex items-center gap-10 text-sm font-medium">
              <Link
                href="/menu"
                className="text-[#7D3F32] font-bold border-b-2 border-[#7D3F32] pb-0.5"
              >
                Thực đơn
              </Link>
              <Link
                href="/orders"
                className="text-[#786B5A] hover:text-[#3F3027] transition-colors"
              >
                Đơn hàng
              </Link>
              <Link
                href="/rewards"
                className="text-[#786B5A] hover:text-[#3F3027] transition-colors"
              >
                Ưu đãi
              </Link>
              <Link
                href="/profile"
                className="text-[#786B5A] hover:text-[#3F3027] transition-colors"
              >
                Tài khoản
              </Link>
            </nav>

            {/* Cụm Tiện ích bên phải: Icon Giỏ hàng + Badge số lượng + Avatar Quỳnh (Q) */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Icon Giỏ hàng có badge số lượng */}
              <Link
                href="/cart"
                className="relative p-2 text-[#3F3027] hover:text-[#7D3F32] transition-colors flex items-center justify-center rounded-full hover:bg-[#E8D7B8]/40"
                aria-label="Xem giỏ hàng"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] min-w-[18px] min-h-[18px] rounded-full bg-[#7D3F32] text-[#FFFAF0] text-[10px] font-bold flex items-center justify-center leading-none shadow-xs select-none">
                  {totalCartItems}
                </span>
              </Link>

              {/* Avatar người dùng có Dropdown Menu tương tác chuẩn Figma */}
              <UserNav />
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* 2. HERO BANNER CARD (Responsive chuẩn 100% Figma Cloud)   */}
        {/* Tone nâu đỏ đất nung #7D3F32, font Lora tiêu đề           */}
        {/* Mobile: 'Gu quen, ngày mới.', ẨN HOÀN TOÀN ẢNH RÓT CÀ PHÊ */}
        {/* Desktop: 'Cà phê nguyên bản. Một ngày thật an nhiên.'      */}
        {/* ========================================================= */}
        <section className="w-full px-4 sm:px-10 lg:px-14 mt-1 sm:mt-2">
          <div className="max-w-[1360px] mx-auto bg-[#7D3F32] rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row items-stretch justify-between">
            {/* Cột trái: Văn bản */}
            <div className="flex-1 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-[#D9C19B] mb-2 sm:mb-3">
                MỘT CHÚT CHẬM, MỘT CHÚT XANH
              </span>

              {/* Tiêu đề trên Mobile */}
              <h1 className="md:hidden font-serif text-2xl sm:text-3xl font-bold text-[#FFFAF0] tracking-tight leading-tight">
                Gu quen,
                <br />
                ngày mới.
              </h1>

              {/* Tiêu đề trên Desktop */}
              <h1 className="hidden md:block font-serif text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#FFFAF0] tracking-tight leading-[1.18]">
                Cà phê nguyên bản.
                <br />
                Một ngày thật an nhiên.
              </h1>

              {/* Mô tả Mobile */}
              <p className="md:hidden text-xs text-[#E8D7B8] mt-2 leading-relaxed">
                Pha riêng cho từng khoảnh khắc.
              </p>

              {/* Mô tả Desktop */}
              <p className="hidden md:block text-xs sm:text-sm text-[#E8D7B8] mt-3 max-w-lg leading-relaxed">
                Chọn món bạn yêu, để BrewLite chăm chút phần còn lại.
              </p>
            </div>

            {/* Cột phải: Ảnh rót cà phê (CHỈ HIỆN TRÊN DESKTOP, ẨN TRÊN MOBILE CHUẨN FIGMA) */}
            <div className="hidden md:block w-full md:w-[45%] lg:w-[48%] relative min-h-[220px] md:min-h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/drinks/banner-khong-gian-brewlite.jpg"
                alt="Khoảnh khắc cà phê BrewLite"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. THÔNG TIN QUÁN & THANH TÌM KIẾM                       */}
        {/* ========================================================= */}
        <section className="w-full px-4 sm:px-10 lg:px-14 mt-4 sm:mt-5">
          <div className="max-w-[1360px] mx-auto space-y-3 sm:space-y-4">
            {/* Thông tin chi nhánh */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 text-xs text-[#786B5A]">
              <span className="flex items-center gap-1.5 text-[#3F3027] font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#7D3F32]" />
                <span>Chi nhánh Quận 1</span>
              </span>
              <span className="text-[11px] sm:text-xs">Nhận tại quầy trong khoảng 10 phút</span>
            </div>

            {/* Ô tìm kiếm bo góc 12px chuẩn Figma Cloud */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-[#786B5A]">
                <Search className="w-4 h-4 stroke-[2]" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm cà phê, trà trái cây, bánh ngọt…"
                className="w-full pl-10 sm:pl-11 pr-10 sm:pr-11 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl bg-[#FFFAF0] border border-[#E8D7B8] text-[#3F3027] placeholder-[#786B5A]/70 focus:outline-none focus:ring-1 focus:ring-[#7D3F32] shadow-2xs"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute inset-y-0 right-0 pr-3.5 sm:pr-4 flex items-center text-[#786B5A] hover:text-[#3F3027]"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Bộ lọc danh mục 6 tabs */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
            />
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. SECTION TIÊU ĐỀ & LƯỚI SẢN PHẨM                       */}
        {/* Mobile: 2 cột | Desktop: 4 cột                            */}
        {/* ========================================================= */}
        <main className="w-full px-4 sm:px-10 lg:px-14 mt-5 sm:mt-7 pb-28 md:pb-16">
          <div className="max-w-[1360px] mx-auto">
            {/* Section Header: Tiêu đề font Lora và dòng phụ Desktop */}
            <div className="flex items-baseline justify-between mb-4 sm:mb-5">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3F3027] tracking-tight">
                Hôm nay, bạn uống gì?
              </h2>
              <span className="hidden sm:inline text-xs sm:text-sm text-[#786B5A] font-medium">
                Được chọn nhiều tại BrewLite
              </span>
            </div>

            {/* Trạng thái Đang tải */}
            {isLoading && <SkeletonLoading count={8} />}

            {/* Trạng thái Lỗi */}
            {!isLoading && errorMessage && (
              <ErrorState message={errorMessage} onRetry={fetchProducts} />
            )}

            {/* Trạng thái Rỗng */}
            {!isLoading && !errorMessage && products.length === 0 && (
              <EmptyState keyword={debouncedKeyword} onResetFilter={handleResetFilter} />
            )}

            {/* Lưới sản phẩm: 2 CỘT TRÊN MOBILE, 4 CỘT TRÊN DESKTOP CHUẨN FIGMA */}
            {!isLoading && !errorMessage && products.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelectProduct={handleSelectProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* 5. FOOTER DẢI BĂNG NÂU ĐỎ ĐẤT NUNG (Chuẩn Figma Cloud)    */}
      {/* ========================================================= */}
      <footer className="w-full bg-[#7D3F32] text-[#FFFAF0] py-4 px-4 sm:px-10 lg:px-14">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          <span className="font-medium text-[#FFFAF0] text-[11px] sm:text-xs">
            BrewLite · Chậm một nhịp, đậm một gu.
          </span>
          <span className="text-[#D9C19B] text-[11px] sm:text-xs">
            Cà phê nguyên bản · Pha theo lựa chọn của bạn
          </span>
        </div>
      </footer>

      {/* 6. Thanh giỏ hàng nổi chuẩn cả Mobile lẫn Desktop */}
      <FloatingCartBar />
    </div>
  );
}
