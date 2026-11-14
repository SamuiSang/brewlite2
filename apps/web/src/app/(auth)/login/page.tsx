'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/menu';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier || !password) {
      setErrorMsg('Vui lòng điền đầy đủ số điện thoại hoặc email và mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    try {
      setIsLoading(true);
      // Hỗ trợ đăng nhập bằng email hoặc số điện thoại
      const email = identifier.includes('@') ? identifier : `${identifier}@customer.brewlite.vn`;
      const res = await ApiClient.post('/auth/login', { email, password });

      if (res.accessToken) {
        ApiClient.setToken(res.accessToken);
        if (res.user) {
          localStorage.setItem('brewlite_user_profile', JSON.stringify(res.user));
        }
        router.push(redirectTarget);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Số điện thoại/email hoặc mật khẩu không chính xác.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E8D4] text-[#3F3027] px-4 py-6 sm:px-10 sm:py-8 lg:px-14 flex flex-col justify-between">
      {/* 1. TOP HEADER: LOGO BREWLITE CHUẨN FIGMA */}
      <header className="max-w-[1120px] w-full mx-auto">
        <Link
          href="/menu"
          className="font-serif text-[24px] sm:text-[28px] font-bold text-[#7D3F32] tracking-tight hover:opacity-90 transition inline-block"
        >
          BrewLite
        </Link>
      </header>

      {/* 2. KHỐI NỘI DUNG CHÍNH (FRAME 04a · ĐĂNG NHẬP CHUẨN 100% FIGMA) */}
      {/* Desktop: 2 Cột cân xứng (Cột trái: Card ảnh cà phê, Cột phải: Form card) */}
      {/* Mobile: 1 Cột tập trung form */}
      <main className="max-w-[1040px] w-full mx-auto my-auto py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* CỘT TRÁI: CARD BANNER ẢNH CÀ PHÊ (Ẩn trên Mobile, hiện từ md:flex) */}
          <div className="hidden md:flex flex-col justify-between relative rounded-3xl overflow-hidden p-8 lg:p-10 shadow-sm min-h-[500px] border border-[#DDCCAE] bg-[#4A1E17]">
            {/* Ảnh nền rót cà phê chuẩn Figma */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/drinks/banner-khong-gian-brewlite.jpg"
              alt="Khoảnh khắc cà phê BrewLite"
              className="absolute inset-0 w-full h-full object-cover opacity-85"
            />
            {/* Gradient phủ tối nhẹ để chữ nổi bật sắc nét */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/30 pointer-events-none" />

            {/* Quote thông điệp tiêu đề trên ảnh */}
            <div className="relative z-10 pt-4">
              <h2 className="font-serif text-2xl lg:text-3xl font-bold text-[#FFFAF0] leading-snug drop-shadow-sm">
                Gu cà phê của bạn.<br />
                Khoảnh khắc của riêng bạn.
              </h2>
            </div>

            {/* Dòng chú thích chân ảnh */}
            <div className="relative z-10">
              <p className="text-xs lg:text-sm text-[#FFFAF0]/90 drop-shadow-xs font-medium">
                Chăm chút từng ly để bạn tận hưởng điều nguyên bản.
              </p>
            </div>
          </div>

          {/* CỘT PHẢI: FORM ĐĂNG NHẬP CHUẨN BẢN VẼ FIGMA */}
          <div className="bg-white rounded-3xl p-7 sm:p-10 border border-[#E8D7B8] shadow-sm flex flex-col justify-center">
            <div>
              <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#3F3027] tracking-tight leading-tight">
                Chào mừng bạn<br className="hidden sm:inline" /> đến với BrewLite
              </h1>
              <p className="text-xs sm:text-sm text-[#786B5A] mt-2 mb-6">
                Một ly cho gu cà phê quen thuộc của bạn.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-[#B42318] text-xs sm:text-sm rounded-xl flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Trường Số điện thoại hoặc email */}
              <div>
                <label className="block text-xs font-semibold text-[#593E2B] mb-1.5">
                  Số điện thoại hoặc email
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Nhập số điện thoại hoặc email"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E0D8] bg-[#FBF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6B2D24] text-sm text-[#3F3027] placeholder-[#A08F87] transition-all"
                />
              </div>

              {/* Trường Mật khẩu */}
              <div>
                <label className="block text-xs font-semibold text-[#593E2B] mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-[#E5E0D8] bg-[#FBF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6B2D24] text-sm text-[#3F3027] placeholder-[#A08F87] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#786B5A] hover:text-[#3F3027] cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nút 1: Đăng nhập (Primary Button: Nâu đỏ gạch #6B2D24 chuẩn Figma) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 rounded-xl bg-[#6B2D24] hover:bg-[#58251E] text-white font-semibold text-sm transition shadow-xs hover:shadow-sm disabled:opacity-60 flex justify-center items-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>

              {/* Nút 2: Đăng ký tài khoản mới (Secondary Button: Màu be #EADDC7 chuẩn Figma) */}
              <Link
                href={`/register?redirect=${encodeURIComponent(redirectTarget)}`}
                className="w-full h-12 rounded-xl bg-[#EADDC7] hover:bg-[#dfd0b6] text-[#593E2B] font-semibold text-sm transition flex justify-center items-center cursor-pointer"
              >
                Đăng ký tài khoản mới
              </Link>
            </form>

            {/* Dòng ghi chú điều khoản chuẩn Figma */}
            <p className="mt-6 text-center text-[11px] text-[#A08F87]">
              Bằng việc tiếp tục, bạn đồng ý với Điều khoản &amp; Chính sách của BrewLite.
            </p>
          </div>
        </div>
      </main>

      {/* 3. FOOTER CHUẨN FIGMA */}
      <footer className="text-center text-xs text-[#8C7A6B] py-3">
        BrewLite · Cà phê nguyên bản.
      </footer>
    </div>
  );
}
