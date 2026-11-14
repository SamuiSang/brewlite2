'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';
import {
  User,
  Receipt,
  Gift,
  MapPin,
  Settings,
  LogOut,
  Sparkles,
  Award,
  ChevronRight,
  LogIn,
  UserPlus,
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: string;
  loyaltyPoints?: number;
}

export function UserNav() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Kiểm tra token & nạp thông tin user
    const token = ApiClient.getToken();
    if (token) {
      setIsLoggedIn(true);
      // Đọc cache nhanh
      const cached = localStorage.getItem('brewlite_user_profile');
      if (cached) {
        try {
          setProfile(JSON.parse(cached));
        } catch {}
      }

      // Tải từ API GET /api/v1/auth/me
      ApiClient.get('/auth/me')
        .then((data) => {
          if (data && data.fullName) {
            setProfile(data);
            localStorage.setItem('brewlite_user_profile', JSON.stringify(data));
          }
        })
        .catch(() => {
          // fallback giữ cache
        });
    } else {
      setIsLoggedIn(false);
      setProfile(null);
    }
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    ApiClient.removeToken();
    setIsLoggedIn(false);
    setProfile(null);
    setIsOpen(false);
    router.push('/login');
  };

  // Xác định chữ cái hiển thị Avatar
  const initial = profile?.fullName
    ? profile.fullName.trim().charAt(0).toUpperCase()
    : 'H';

  const loyaltyPoints = profile?.loyaltyPoints ?? 420;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Nút bấm Avatar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={isLoggedIn ? `Tài khoản: ${profile?.fullName || 'Hàn Minh Hiếu'}` : 'Đăng nhập / Tài khoản'}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#7D3F32] hover:bg-[#693327] text-[#FFFAF0] font-bold flex items-center justify-center text-xs sm:text-sm shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7D3F32]/50 focus:ring-offset-1 select-none"
      >
        {isLoggedIn ? initial : <User className="w-4 h-4 text-[#FFFAF0]" />}
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#FFFAF0] border border-[#E8D7B8] shadow-xl shadow-black/10 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {isLoggedIn ? (
            <>
              {/* Header người dùng */}
              <div className="px-4 py-3 bg-[#F4EFE6]/60 border-b border-[#E8D7B8]/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#7D3F32] text-[#FFFAF0] font-bold flex items-center justify-center text-sm shadow-xs">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#3F3027] truncate">
                      {profile?.fullName || 'Hàn Minh Hiếu'}
                    </p>
                    <p className="text-xs text-[#786B5A] truncate">
                      {profile?.email || 'hieu.customer@brewlite.vn'}
                    </p>
                  </div>
                </div>

                {/* Huy hiệu Hạng thành viên & Điểm */}
                <div className="mt-2.5 pt-2 border-t border-[#E8D7B8]/60 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#8C5E28]">
                    <Award className="w-3.5 h-3.5 text-[#D98236]" />
                    <span>Thành viên Vàng</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-[#7D3F32]">
                    <Sparkles className="w-3 h-3 text-[#D98236]" />
                    <span className="font-bold">{loyaltyPoints}</span> Hạt
                  </span>
                </div>
              </div>

              {/* Danh sách hành động */}
              <div className="py-1 text-sm text-[#3F3027]">
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-[#E8D7B8]/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#7D3F32]" />
                    <span>Hồ sơ tài khoản</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#A08F87]" />
                </Link>

                <Link
                  href="/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-[#E8D7B8]/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-4 h-4 text-[#7D3F32]" />
                    <span>Lịch sử đơn hàng</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#A08F87]" />
                </Link>

                <Link
                  href="/profile?tab=vouchers"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-[#E8D7B8]/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Gift className="w-4 h-4 text-[#7D3F32]" />
                    <span>Thẻ quà tặng &amp; ưu đãi</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#EADDC7] text-[#593E2B] text-[10px] font-bold">
                    2 voucher
                  </span>
                </Link>

                <Link
                  href="/profile?tab=addresses"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-[#E8D7B8]/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#7D3F32]" />
                    <span>Địa chỉ đã lưu</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#A08F87]" />
                </Link>

                <Link
                  href="/profile?tab=settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-[#E8D7B8]/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-[#7D3F32]" />
                    <span>Cài đặt tài khoản</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#A08F87]" />
                </Link>
              </div>

              {/* Nút Đăng xuất */}
              <div className="pt-1 border-t border-[#E8D7B8]/70">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#B42318] hover:bg-red-50 transition-colors text-left font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </>
          ) : (
            /* Khi chưa đăng nhập */
            <div className="p-3 space-y-2">
              <div className="px-2 py-1 text-xs text-[#786B5A]">
                Chào mừng bạn đến với BrewLite! Đăng nhập để tích lũy Hạt và nhận ưu đãi riêng.
              </div>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#7D3F32] hover:bg-[#693327] text-white text-sm font-medium transition shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#EADDC7] hover:bg-[#dfd0b6] text-[#593E2B] text-sm font-medium transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tạo tài khoản mới</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
