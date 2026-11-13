'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/menu';

  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName || !identifier || !password) {
      setErrorMsg('Vui lòng điền đầy đủ họ và tên, số điện thoại hoặc email và mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    try {
      setIsLoading(true);
      const isEmail = identifier.includes('@');
      const email = isEmail ? identifier : `${identifier}@customer.brewlite.vn`;
      const phone = isEmail ? undefined : identifier;

      const res = await ApiClient.post('/auth/register', {
        fullName,
        email,
        phone,
        password,
      });

      if (res.accessToken) {
        ApiClient.setToken(res.accessToken);
        if (res.user) {
          localStorage.setItem('brewlite_user_profile', JSON.stringify(res.user));
        }
        router.push(redirectTarget);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F5] flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 text-[#2B1111]">
      {/* Nút quay lại Menu */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#735A56] hover:text-[#6B2D24] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Thực đơn</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#6B2D24] text-white shadow-md shadow-[#6B2D24]/20 mb-3">
            <span className="text-xl">☕</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#2B1111]">
            Bắt đầu một gu quen.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#735A56]">
            Tạo tài khoản để lưu đơn và lựa chọn yêu thích.
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm rounded-3xl border border-[#EFE8DE]">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-[#B42318] text-xs sm:text-sm rounded-xl flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-3.5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#593E2B] uppercase tracking-wider mb-1.5">
                Họ và tên
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Duy"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FBF8F5]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6B2D24] text-sm text-[#2B1111] placeholder-[#A08F87] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#593E2B] uppercase tracking-wider mb-1.5">
                Số điện thoại hoặc email
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Nhập số điện thoại hoặc email"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FBF8F5]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6B2D24] text-sm text-[#2B1111] placeholder-[#A08F87] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#593E2B] uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tạo mật khẩu"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[#E5E0D8] bg-[#FBF8F5]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6B2D24] text-sm text-[#2B1111] placeholder-[#A08F87] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#735A56] hover:text-[#2B1111]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#593E2B] uppercase tracking-wider mb-1.5">
                Nhập lại mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[#E5E0D8] bg-[#FBF8F5]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6B2D24] text-sm text-[#2B1111] placeholder-[#A08F87] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#735A56] hover:text-[#2B1111]"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nút Tạo tài khoản chính (Primary Button: 48px, rounded-xl, #6B2D24) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2 rounded-xl bg-[#6B2D24] hover:bg-[#58251E] text-white font-medium text-sm transition shadow-sm hover:shadow-md disabled:opacity-60 flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  <span>Đang đăng ký...</span>
                </>
              ) : (
                'Tạo tài khoản'
              )}
            </button>

            {/* Nút Đã có tài khoản? Đăng nhập (Secondary Button: 48px, rounded-xl, #EADDC7) */}
            <Link
              href={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
              className="w-full h-12 rounded-xl bg-[#EADDC7] hover:bg-[#DECDB3] text-[#593E2B] font-medium text-sm transition flex justify-center items-center"
            >
              Đã có tài khoản? Đăng nhập
            </Link>
          </form>

          {/* Dòng ghi chú chân form khớp Figma 1.1 */}
          <p className="mt-5 text-center text-xs text-[#735A56] leading-relaxed">
            Bằng việc tạo tài khoản, bạn đồng ý với điều khoản sử dụng và chính sách bảo mật.
          </p>
        </div>
      </div>
    </div>
  );
}
