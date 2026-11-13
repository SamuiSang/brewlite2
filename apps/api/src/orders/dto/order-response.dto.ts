export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  size: string;
  sugarLevel: string;
  iceLevel: string;
  toppings: any;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderResponseDto {
  success: boolean;
  message: string;
  order: {
    id: string;
    orderCode: string;
    userId: string;
    status: string;
    subtotalAmount: number;
    discountAmount: number;
    finalAmount: number;
    note: string | null;
    expiresAt: Date | null;
    createdAt: Date;
    items: OrderItemResponse[];
    promotionCode?: string | null;
  };
}

