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
    loyaltyPointsUsed?: number;
    finalAmount: number;
    note: string | null;
    expiresAt: Date | null;
    createdAt: Date;
    customerName?: string | null;
    items: OrderItemResponse[];
    promotionCode?: string | null;
    payment?: {
      id: string;
      method: string;
      status: string;
      amount: number;
      transactionRef?: string | null;
      paidAt?: Date | null;
    } | null;
    statusLogs?: Array<{
      id: string;
      previousStatus: string | null;
      newStatus: string;
      changedBy?: string | null;
      reason?: string | null;
      createdAt: Date;
    }>;
  };
}

