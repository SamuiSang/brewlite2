'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';
import { UserNav } from '@/components/UserNav';
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
  QrCode,
  X,
  Check,
  Copy,
  Plus,
  ShieldCheck,
  Lock,
  Phone,
  User as UserIcon,
  CreditCard,
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
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Các Modal trạng thái tương tác
  const [showMemberCardModal, setShowMemberCardModal] = useState(false);
  const [showVouchersModal, setShowVouchersModal] = useState(false);
  const [showAddressesModal, setShowAddressesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  // Toast thông báo
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State cho Sổ địa chỉ
  const [addresses, setAddresses] = useState([
    {
      id: 'addr-1',
      label: 'Nhà riêng',
      receiver: 'Hàn Minh Hiếu',
      phone: '0901234567',
      address: '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      isDefault: true,
    },
    {
      id: 'addr-2',
      label: 'Văn phòng',
      receiver: 'Hàn Minh Hiếu',
      phone: '0901234567',
      address: 'Tòa nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      isDefault: false,
    },
  ]);
  const [newAddress, setNewAddress] = useState({ label: '', address: '', phone: '' });
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  // Form State cho Cài đặt & Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifyOrder, setNotifyOrder] = useState(true);
  const [notifyPromo, setNotifyPromo] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = ApiClient.getToken();
        if (!token) {
          router.push('/login?redirect=/profile');
          return;
        }

        // Tải từ API GET /api/v1/auth/me
        const data = await ApiClient.get('/auth/me');
        setProfile(data);
        localStorage.setItem('brewlite_user_profile', JSON.stringify(data));
      } catch (err) {
        const cached = localStorage.getItem('brewlite_user_profile');
        if (cached) {
          try {
            setProfile(JSON.parse(cached));
          } catch {}
        } else {
          router.push('/login?redirect=/profile');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // Hỗ trợ mở Modal thông qua URL Query (ví dụ: /profile?tab=vouchers)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'vouchers') setShowVouchersModal(true);
    if (tab === 'addresses') setShowAddressesModal(true);
    if (tab === 'settings') setShowSettingsModal(true);
    if (tab === 'card') setShowMemberCardModal(true);
  }, [searchParams]);

  const handleLogout = () => {
    ApiClient.removeToken();
    localStorage.removeItem('brewlite_user_profile');
    router.push('/login');
  };

  const loyaltyPoints = profile?.loyaltyPoints ?? 420;
  const nextTierPoints = 500;
  const neededPoints = Math.max(0, nextTierPoints - loyaltyPoints);
  const progressPercent = Math.min(100, Math.round((loyaltyPoints / nextTierPoints) * 100));

  const formatPhone = (phone?: string | null) => {
    if (!phone) return profile?.email || '090 ••• ••67';
    if (phone.length >= 10) {
      return `${phone.slice(0, 3)} ••• ••${phone.slice(-2)}`;
    }
    return phone;
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.address.trim()) return;
    const added = {
      id: `addr-${Date.now()}`,
      label: newAddress.label || 'Địa chỉ mới',
      receiver: profile?.fullName || 'Hàn Minh Hiếu',
      phone: newAddress.phone || profile?.phone || '0901234567',
      address: newAddress.address,
      isDefault: false,
    };
    setAddresses([...addresses, added]);
    setNewAddress({ label: '', address: '', phone: '' });
    setShowAddAddressForm(false);
    showToast('Đã thêm địa chỉ giao hàng mới!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải từ 6 ký tự trở lên!');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Xác nhận mật khẩu mới không khớp!');
      return;
    }
    showToast('Đổi mật khẩu thành công!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowSettingsModal(false);
  };

  return (
    <div className="min-h-screen bg-[#F3E8D4] text-[#3F3027] pb-16">
      {/* Toast thông báo nổi */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#3F3027] text-[#FFFAF0] px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-[#D98236]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 1. TOP HEADER (Chuẩn Figma 04c & 07b với logo BrewLite và cụm Nav)      */}
      {/* ====================================================================== */}
      <header className="px-5 sm:px-12 lg:px-20 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <Link
            href="/menu"
            className="font-serif text-[24px] lg:text-[30px] font-bold text-[#7D3F32] tracking-tight hover:opacity-90 transition"
          >
            BrewLite
          </Link>

          {/* Menu điều hướng Desktop */}
          <nav className="hidden lg:flex items-center gap-7 text-[14px] text-[#786B5A] font-medium">
            <Link href="/menu" className="hover:text-[#7D3F32] transition-colors">
              Thực đơn
            </Link>
            <Link href="/orders" className="hover:text-[#7D3F32] transition-colors">
              Đơn hàng
            </Link>
            <button
              onClick={() => setShowVouchersModal(true)}
              className="hover:text-[#7D3F32] transition-colors cursor-pointer"
            >
              Ưu đãi
            </button>
            <Link href="/profile" className="font-semibold text-[#7D3F32]">
              Tài khoản
            </Link>
            <UserNav />
          </nav>

          {/* Mobile Right: UserNav Avatar */}
          <div className="lg:hidden flex items-center gap-3">
            <UserNav />
          </div>
        </div>
      </header>

      {/* ====================================================================== */}
      {/* 2. NỘI DUNG CHÍNH (FRAME 04c · HỒ SƠ CHUẨN FIGMA)                     */}
      {/* Desktop: 2 Cột (Thẻ thành viên bên trái, Danh mục tiện ích bên phải)    */}
      {/* Mobile: 1 Cột xếp chồng                                                */}
      {/* ====================================================================== */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 mt-6 sm:mt-10">
        {/* Tiêu đề trang chuẩn Figma */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-serif text-[26px] sm:text-[34px] font-bold text-[#3F3027] tracking-tight">
            Tài khoản của bạn
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* CỘT TRÁI: THẺ THÀNH VIÊN VÀNG (Col 1-5 Desktop) */}
          <div className="md:col-span-5">
            <div className="relative overflow-hidden rounded-3xl bg-[#6B2D24] text-white p-6 sm:p-7 shadow-md border border-[#7D3F32]">
              {/* Avatar + Họ tên + SĐT */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#EADDC7] text-[#593E2B] flex items-center justify-center font-bold text-xl shadow-xs select-none">
                  {profile?.fullName ? profile.fullName.trim().charAt(0).toUpperCase() : 'H'}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-lg text-[#FFFAF0] truncate">
                    {profile?.fullName || 'Hàn Minh Hiếu'}
                  </h2>
                  <p className="text-xs text-[#EADDC7]/80 font-mono mt-0.5">
                    {formatPhone(profile?.phone)}
                  </p>
                </div>
              </div>

              {/* Thông tin Hạng thành viên */}
              <div className="mt-8 pt-5 border-t border-white/10">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#D9C19B]">
                  THÀNH VIÊN VÀNG
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
                    {loyaltyPoints}
                  </span>
                  <span className="text-base font-medium text-[#EADDC7]">Hạt</span>
                </div>
                <p className="text-xs text-[#EADDC7]/75 mt-1.5">
                  {neededPoints > 0
                    ? `Thêm ${neededPoints} Hạt để đạt hạng Kim Cương`
                    : 'Bạn đã đạt hạng Kim Cương cao nhất!'}
                </p>
              </div>

              {/* Nút Xem thẻ thành viên chuẩn Figma */}
              <button
                type="button"
                onClick={() => setShowMemberCardModal(true)}
                className="w-full mt-6 py-3 px-4 rounded-xl bg-[#EADDC7] hover:bg-[#dfd0b6] text-[#593E2B] font-semibold text-sm transition text-center shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Xem thẻ thành viên</span>
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: DANH MỤC TIỆN ÍCH TÀI KHOẢN (Col 6-12 Desktop) */}
          <div className="md:col-span-7">
            <div className="bg-[#FFFFFF] rounded-3xl border border-[#E8D7B8] shadow-sm divide-y divide-[#F4EFEA] overflow-hidden">
              {/* 1. Lịch sử đơn hàng */}
              <Link
                href="/orders"
                className="flex items-center justify-between p-4.5 sm:p-5 hover:bg-[#FBF8F5] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F3E8D4]/60 text-[#7D3F32] flex items-center justify-center group-hover:bg-[#E8D7B8]/40 transition">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#3F3027] group-hover:text-[#7D3F32] transition">
                      Lịch sử đơn hàng
                    </p>
                    <p className="text-xs text-[#786B5A]">Xem lại các đơn đã đặt và hóa đơn điện tử</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#A08F87] group-hover:translate-x-0.5 transition" />
              </Link>

              {/* 2. Thẻ quà tặng & ưu đãi */}
              <button
                type="button"
                onClick={() => setShowVouchersModal(true)}
                className="w-full text-left flex items-center justify-between p-4.5 sm:p-5 hover:bg-[#FBF8F5] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F3E8D4]/60 text-[#7D3F32] flex items-center justify-center group-hover:bg-[#E8D7B8]/40 transition">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#3F3027] group-hover:text-[#7D3F32] transition">
                        Thẻ quà tặng &amp; ưu đãi
                      </p>
                      <span className="px-2 py-0.5 rounded-full bg-[#EADDC7] text-[#593E2B] text-[10px] font-bold">
                        2 voucher
                      </span>
                    </div>
                    <p className="text-xs text-[#786B5A]">Mã giảm giá và quyền lợi dành riêng cho bạn</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#A08F87] group-hover:translate-x-0.5 transition" />
              </button>

              {/* 3. Địa chỉ đã lưu */}
              <button
                type="button"
                onClick={() => setShowAddressesModal(true)}
                className="w-full text-left flex items-center justify-between p-4.5 sm:p-5 hover:bg-[#FBF8F5] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F3E8D4]/60 text-[#7D3F32] flex items-center justify-center group-hover:bg-[#E8D7B8]/40 transition">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#3F3027] group-hover:text-[#7D3F32] transition">
                      Địa chỉ đã lưu
                    </p>
                    <p className="text-xs text-[#786B5A]">Quản lý địa chỉ nhận cà phê thường dùng</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#A08F87] group-hover:translate-x-0.5 transition" />
              </button>

              {/* 4. Cài đặt tài khoản */}
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="w-full text-left flex items-center justify-between p-4.5 sm:p-5 hover:bg-[#FBF8F5] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F3E8D4]/60 text-[#7D3F32] flex items-center justify-center group-hover:bg-[#E8D7B8]/40 transition">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#3F3027] group-hover:text-[#7D3F32] transition">
                      Cài đặt tài khoản
                    </p>
                    <p className="text-xs text-[#786B5A]">Đổi mật khẩu, thông báo &amp; bảo mật</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#A08F87] group-hover:translate-x-0.5 transition" />
              </button>

              {/* 5. Đăng xuất (Màu đỏ chuẩn Figma) */}
              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(true)}
                className="w-full text-left flex items-center justify-between p-4.5 sm:p-5 hover:bg-red-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-100/60 text-[#B42318] flex items-center justify-center group-hover:bg-red-200/50 transition">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#B42318]">
                      Đăng xuất
                    </p>
                    <p className="text-xs text-red-700/70">Đăng xuất phiên làm việc khỏi thiết bị này</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400 group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer ghi nhận bản quyền */}
        <div className="mt-14 text-center">
          <p className="text-xs text-[#8C7A6B]">BrewLite · Cà phê nguyên bản.</p>
        </div>
      </main>

      {/* ====================================================================== */}
      {/* 3. MODAL: THẺ HỘI VIÊN ĐIỆN TỬ BREWLITE GOLD (Xem thẻ thành viên)       */}
      {/* ====================================================================== */}
      {showMemberCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFAF0] rounded-3xl max-w-sm w-full p-6 border border-[#E8D7B8] shadow-2xl relative">
            <button
              onClick={() => setShowMemberCardModal(false)}
              className="absolute top-4 right-4 text-[#786B5A] hover:text-[#3F3027] p-1 rounded-full hover:bg-[#E8D7B8]/40"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#D98236]">
                THẺ HỘI VIÊN ĐIỆN TỬ
              </span>
              <h3 className="font-serif text-xl font-bold text-[#3F3027] mt-1">
                BrewLite Gold Membership
              </h3>
            </div>

            {/* Mã QR / Barcode mô phỏng */}
            <div className="my-5 p-4 rounded-2xl bg-white border border-[#E8D7B8] flex flex-col items-center">
              <div className="w-40 h-40 bg-[#F3E8D4]/40 rounded-xl flex items-center justify-center p-2 border border-[#E8D7B8]/60">
                <QrCode className="w-32 h-32 text-[#6B2D24]" />
              </div>
              <p className="font-mono text-xs font-bold text-[#6B2D24] tracking-widest mt-3">
                BL-GOLD-2026-8924
              </p>
              <p className="text-[11px] text-[#786B5A] mt-0.5">
                Đưa mã này cho thu ngân để quét tích Hạt
              </p>
            </div>

            {/* Quyền lợi Hạng Vàng */}
            <div className="space-y-2 text-xs text-[#3F3027] bg-[#F4EFE6]/60 p-3.5 rounded-xl border border-[#E8D7B8]/70">
              <div className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Giảm trực tiếp 10% trên mọi hóa đơn đồ uống</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Quy đổi 100 Hạt = 10.000đ khi thanh toán đơn</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tặng 01 phần bánh ngọt cao cấp vào tháng sinh nhật</span>
              </div>
            </div>

            <button
              onClick={() => setShowMemberCardModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-[#7D3F32] hover:bg-[#693327] text-white font-medium text-sm transition"
            >
              Đóng thẻ
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 4. MODAL: KHO VOUCHER & THẺ QUÀ TẶNG                                   */}
      {/* ====================================================================== */}
      {showVouchersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFAF0] rounded-3xl max-w-md w-full p-6 border border-[#E8D7B8] shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowVouchersModal(false)}
              className="absolute top-4 right-4 text-[#786B5A] hover:text-[#3F3027] p-1 rounded-full hover:bg-[#E8D7B8]/40"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-bold text-[#3F3027]">
              Kho Ưu Đãi &amp; Voucher Của Bạn
            </h3>
            <p className="text-xs text-[#786B5A] mt-1">
              Bạn đang có 2 mã giảm giá sẵn sàng áp dụng
            </p>

            <div className="mt-4 space-y-3">
              {/* Voucher 1 */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8D7B8] flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-[#7D3F32] bg-[#F3E8D4] px-2 py-0.5 rounded">
                    BREW20K
                  </span>
                  <h4 className="font-semibold text-sm text-[#3F3027] mt-1">Giảm 20.000đ</h4>
                  <p className="text-xs text-[#786B5A]">Đơn từ 65.000đ • HSD: 30/11/2026</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('BREW20K');
                    showToast('Đã sao chép mã BREW20K!');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#7D3F32] hover:bg-[#693327] text-white text-xs font-medium flex items-center gap-1 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép</span>
                </button>
              </div>

              {/* Voucher 2 */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8D7B8] flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-[#7D3F32] bg-[#F3E8D4] px-2 py-0.5 rounded">
                    FREESHIP
                  </span>
                  <h4 className="font-semibold text-sm text-[#3F3027] mt-1">Miễn phí giao hàng</h4>
                  <p className="text-xs text-[#786B5A]">Bán kính 5km • HSD: 15/12/2026</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('FREESHIP');
                    showToast('Đã sao chép mã FREESHIP!');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#7D3F32] hover:bg-[#693327] text-white text-xs font-medium flex items-center gap-1 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép</span>
                </button>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Link
                href="/menu"
                onClick={() => setShowVouchersModal(false)}
                className="flex-1 text-center py-2.5 rounded-xl bg-[#EADDC7] hover:bg-[#dfd0b6] text-[#593E2B] font-semibold text-sm transition"
              >
                Dùng ngay tại Thực đơn
              </Link>
              <button
                onClick={() => setShowVouchersModal(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 5. MODAL: SỔ ĐỊA CHỈ GIAO HÀNG                                         */}
      {/* ====================================================================== */}
      {showAddressesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFAF0] rounded-3xl max-w-lg w-full p-6 border border-[#E8D7B8] shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowAddressesModal(false)}
              className="absolute top-4 right-4 text-[#786B5A] hover:text-[#3F3027] p-1 rounded-full hover:bg-[#E8D7B8]/40"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-bold text-[#3F3027]">
              Sổ Địa Chỉ Giao Hàng
            </h3>
            <p className="text-xs text-[#786B5A] mt-1">
              Địa chỉ dùng để nhận đồ uống khi đặt hàng online
            </p>

            {/* Danh sách địa chỉ */}
            <div className="mt-4 space-y-3">
              {addresses.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-[#E8D7B8] relative flex items-start gap-3"
                >
                  <MapPin className="w-5 h-5 text-[#7D3F32] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#3F3027]">{item.label}</span>
                      {item.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-[#786B5A] mt-1">
                      {item.receiver} • {item.phone}
                    </p>
                    <p className="text-xs text-[#3F3027] mt-0.5">{item.address}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Form thêm địa chỉ mới */}
            {showAddAddressForm ? (
              <form onSubmit={handleAddAddress} className="mt-4 p-4 rounded-2xl bg-white border border-[#E8D7B8] space-y-3">
                <h4 className="font-semibold text-sm text-[#3F3027]">Thêm địa chỉ mới</h4>
                <div>
                  <input
                    type="text"
                    placeholder="Tên gợi nhớ (ví dụ: Nhà bố mẹ, Công ty...)"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#7D3F32]"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Số điện thoại người nhận"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#7D3F32]"
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Địa chỉ chi tiết (Số nhà, tên đường, phường, quận...)"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#7D3F32]"
                    rows={2}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#7D3F32] hover:bg-[#693327] text-white text-xs font-semibold transition"
                  >
                    Lưu địa chỉ
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddAddressForm(false)}
                    className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddAddressForm(true)}
                className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-[#7D3F32] text-[#7D3F32] hover:bg-[#E8D7B8]/20 font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm địa chỉ mới</span>
              </button>
            )}

            <button
              onClick={() => setShowAddressesModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 6. MODAL: CÀI ĐẶT TÀI KHOẢN & ĐỔI MẬT KHẨU                             */}
      {/* ====================================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFAF0] rounded-3xl max-w-md w-full p-6 border border-[#E8D7B8] shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-[#786B5A] hover:text-[#3F3027] p-1 rounded-full hover:bg-[#E8D7B8]/40"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-bold text-[#3F3027]">
              Cài Đặt Tài Khoản
            </h3>
            <p className="text-xs text-[#786B5A] mt-1">
              Bảo mật tài khoản và tùy chọn thông báo
            </p>

            {/* Đổi mật khẩu */}
            <form onSubmit={handleChangePassword} className="mt-4 p-4 rounded-2xl bg-white border border-[#E8D7B8] space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#3F3027]">
                <Lock className="w-4 h-4 text-[#7D3F32]" />
                <span>Đổi mật khẩu</span>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#7D3F32]"
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#7D3F32]"
                  placeholder="Nhập mật khẩu mới"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#7D3F32]"
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#7D3F32] hover:bg-[#693327] text-white text-xs font-semibold transition"
              >
                Cập nhật mật khẩu
              </button>
            </form>

            {/* Tùy chọn thông báo */}
            <div className="mt-4 p-4 rounded-2xl bg-white border border-[#E8D7B8] space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#3F3027]">
                <ShieldCheck className="w-4 h-4 text-[#7D3F32]" />
                <span>Thông báo &amp; Quyền riêng tư</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3F3027]">Cập nhật trạng thái đơn hàng (SMS/Email)</span>
                <input
                  type="checkbox"
                  checked={notifyOrder}
                  onChange={(e) => setNotifyOrder(e.target.checked)}
                  className="w-4 h-4 accent-[#7D3F32] cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3F3027]">Nhận tin khuyến mãi &amp; quà tặng độc quyền</span>
                <input
                  type="checkbox"
                  checked={notifyPromo}
                  onChange={(e) => setNotifyPromo(e.target.checked)}
                  className="w-4 h-4 accent-[#7D3F32] cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 7. MODAL: XÁC NHẬN ĐĂNG XUẤT (Chuẩn an toàn UX)                         */}
      {/* ====================================================================== */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFAF0] rounded-3xl max-w-sm w-full p-6 border border-[#E8D7B8] shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#B42318] flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-lg font-bold text-[#3F3027]">
              Xác Nhận Đăng Xuất
            </h3>
            <p className="text-xs text-[#786B5A] mt-2 leading-relaxed">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không? Phiên làm việc của bạn sẽ kết thúc.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#EADDC7] hover:bg-[#dfd0b6] text-[#593E2B] font-semibold text-sm transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-[#B42318] hover:bg-red-700 text-white font-semibold text-sm transition shadow-xs"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
