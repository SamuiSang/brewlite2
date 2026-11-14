'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';
import {
  ArrowLeft,
  Receipt,
  Gift,
  MapPin,
  Settings,
  LogOut,
  ChevronRight,
  Award,
  Sparkles,
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: string;
  loyaltyPoints?: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = ApiClient.getToken();
        if (!token) {
          router.push('/login?redirect=/profile');
          return;
        }

        // Ưu tiên tải thông tin từ API GET /api/v1/auth/me
        const data = await ApiClient.get('/auth/me');
        setProfile(data);
        localStorage.setItem('brewlite_user_profile', JSON.stringify(data));
      } catch (err) {
        // Fallback đọc từ LocalStorage nếu mạng offline
        const cached = localStorage.getItem('brewlite_user_profile');
        if (cached) {
          setProfile(JSON.parse(cached));
        } else {
          router.push('/login?redirect=/profile');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    ApiClient.removeToken();
    localStorage.removeItem('brewlite_user_profile');
    router.push('/login');
  };

  const loyaltyPoints = profile?.loyaltyPoints ?? 420;
  const nextTierPoints = 500;
  const neededPoints = Math.max(0, nextTierPoints - loyaltyPoints);
  const progressPercent = Math.min(100, Math.round((loyaltyPoints / nextTierPoints) * 100));

  // Định dạng số điện thoại ẩn các chữ số giữa theo chuẩn bảo mật
  const formatPhone = (phone?: string | null) => {
    if (!phone) return profile?.email || 'Chưa cập nhật';
    if (phone.length >= 10) {
      return `${phone.slice(0, 3)} ••• ••${phone.slice(-2)}`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-[#FBF8F5] text-[#2B1111] pb-12">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 bg-[#FBF8F5]/90 backdrop-blur-md border-b border-[#EFE8DE] px-4 py-3.5 sm:px-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#735A56] hover:text-[#6B2D24] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Thực đơn</span>
          </Link>
          <h1 className="font-serif font-bold text-base text-[#2B1111]">Tài khoản của bạn</h1>
          <div className="w-7" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-5 space-y-5">
        {/* 1. THẺ THÀNH VIÊN BREWLITE GOLD (Frame 04c · Hồ sơ) */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4A1E17] via-[#5C231B] to-[#36140F] text-white p-6 shadow-lg shadow-[#4A1E17]/25 border border-[#6B2D24]">
          {/* Họa tiết trang trí nền cà phê */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#D98236]/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[#EADDC7]/10 blur-xl pointer-events-none" />

          {/* Dòng trên: Thông tin cá nhân & Hạng */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-[#EADDC7] text-[#593E2B] flex items-center justify-center font-bold text-lg shadow-inner">
                {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'H'}
              </div>
              <div>
                <h2 className="font-semibold text-base sm:text-lg text-[#FFFAFO]">
                  {profile?.fullName || 'Hàn Minh Hiếu'}
                </h2>
                <p className="text-xs text-[#EADDC7]/80 font-mono mt-0.5">
                  {formatPhone(profile?.phone)}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D98236] text-white text-[11px] font-semibold tracking-wider uppercase shadow-xs">
              <Award className="w-3.5 h-3.5" />
              <span>Thành viên Vàng</span>
            </span>
          </div>

          {/* Điểm tích lũy (Hạt BrewLite) */}
          <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex items-baseline justify-between">
            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-[#EADDC7]/80">
                Điểm tích lũy
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-bold font-serif tracking-tight text-white">
                  {loyaltyPoints}
                </span>
                <span className="text-sm font-medium text-[#EADDC7]">Hạt</span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs text-[#EADDC7]/90 bg-white/10 px-2.5 py-1 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-[#D98236]" />
                <span>Quy đổi: {(loyaltyPoints * 100).toLocaleString('vi-VN')} đ</span>
              </span>
            </div>
          </div>

          {/* Thanh tiến độ thăng hạng */}
          <div className="relative z-10 mt-4 space-y-1.5">
            <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D98236] to-[#F3C089] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-[#EADDC7]/85 text-right">
              {neededPoints > 0
                ? `Thêm ${neededPoints} Hạt để đạt hạng Kim Cương`
                : 'Bạn đã đạt hạng Kim Cương cao nhất!'}
            </p>
          </div>
        </section>

        {/* 2. DANH MỤC TIỆN ÍCH TÀI KHOẢN (Menu Card) */}
        <section className="bg-white rounded-3xl border border-[#EFE8DE] shadow-xs overflow-hidden divide-y divide-[#F4EFEA]">
          {/* Lịch sử đơn hàng */}
          <Link
            href="/orders"
            className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-[#FBF8F5] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F3E8D4]/60 text-[#6B2D24] flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#2B1111]">Lịch sử đơn hàng</p>
                <p className="text-xs text-[#735A56]">Xem lại các đơn đã đặt và hóa đơn điện tử</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#A08F87]" />
          </Link>

          {/* Thẻ quà tặng & ưu đãi */}
          <div className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-[#FBF8F5] transition-colors cursor-pointer">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F3E8D4]/60 text-[#6B2D24] flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#2B1111]">Thẻ quà tặng &amp; ưu đãi</p>
                  <span className="px-2 py-0.5 rounded-full bg-[#EADDC7] text-[#593E2B] text-[10px] font-semibold">
                    2 voucher
                  </span>
                </div>
                <p className="text-xs text-[#735A56]">Mã giảm giá và quyền lợi dành riêng cho bạn</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#A08F87]" />
          </div>

          {/* Địa chỉ đã lưu */}
          <div className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-[#FBF8F5] transition-colors cursor-pointer">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F3E8D4]/60 text-[#6B2D24] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#2B1111]">Địa chỉ đã lưu</p>
                <p className="text-xs text-[#735A56]">Quản lý địa chỉ giao cà phê thường dùng</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#A08F87]" />
          </div>

          {/* Cài đặt tài khoản */}
          <div className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-[#FBF8F5] transition-colors cursor-pointer">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F3E8D4]/60 text-[#6B2D24] flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#2B1111]">Cài đặt tài khoản</p>
                <p className="text-xs text-[#735A56]">Đổi mật khẩu, thông báo &amp; bảo mật</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#A08F87]" />
          </div>
        </section>

        {/* 3. NÚT ĐĂNG XUẤT */}
        <section>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white hover:bg-red-50 border border-[#EFE8DE] hover:border-red-200 text-[#B42318] font-medium text-sm transition shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất khỏi tài khoản</span>
          </button>
        </section>

        <p className="text-center text-xs text-[#A08F87]">
          BrewLite phiên bản 2.0 • Bản quyền thuộc về Nhóm Đồ án KTCN
        </p>
      </main>
    </div>
  );
}
