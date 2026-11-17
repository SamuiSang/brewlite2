import type { Topping } from '../store/useCartStore';

/**
 * Danh sách topping mặc định khớp với đơn giá phụ thu ở Backend (10.000 đ / topping)
 */
export const DEFAULT_TOPPINGS: Topping[] = [
  { id: 'topping-tran-chau-trang', name: 'Trân châu trắng', price: 10000 },
  { id: 'topping-kem-macchiato', name: 'Kem béo Macchiato', price: 10000 },
  { id: 'topping-thach-ca-phe', name: 'Thạch cà phê', price: 10000 },
  { id: 'topping-thach-cu-nang', name: 'Thạch củ năng', price: 10000 },
  { id: 'topping-sua-yen-mach', name: 'Sữa yến mạch', price: 10000 },
];
