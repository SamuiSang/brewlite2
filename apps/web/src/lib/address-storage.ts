// Quản lý sổ địa chỉ giao hàng cục bộ tách biệt theo từng tài khoản người dùng

export interface SavedAddress {
  id: string;
  label: string;
  receiver: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

/**
 * Xác định key lưu sổ địa chỉ riêng theo tài khoản đang đăng nhập
 */
export function getAddressStorageKey(user?: { id?: string; email?: string } | null): string {
  if (user?.id || user?.email) {
    return `brewlite-addresses-${user.id || user.email}`;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('brewlite_user_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        const uid = parsed?.id || parsed?.email;
        if (uid) return `brewlite-addresses-${uid}`;
      }
    } catch {
      // Bỏ qua nếu dữ liệu profile lưu trữ không hợp lệ
    }
  }
  return 'brewlite-addresses-guest';
}

/**
 * Tải danh sách địa chỉ của tài khoản hiện tại (mặc định rỗng với tài khoản mới)
 */
export function loadUserAddresses(user?: { id?: string; email?: string } | null): SavedAddress[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getAddressStorageKey(user));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedAddress =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.label === 'string' &&
        typeof item.address === 'string',
    );
  } catch {
    return [];
  }
}

/**
 * Lưu danh sách địa chỉ gắn riêng cho tài khoản hiện tại
 */
export function saveUserAddresses(
  addresses: SavedAddress[],
  user?: { id?: string; email?: string } | null,
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getAddressStorageKey(user), JSON.stringify(addresses));
  } catch {
    // Bỏ qua khi trình duyệt chặn localStorage
  }
}
