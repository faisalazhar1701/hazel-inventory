import { apiClient } from './client';
import { OrderChannel, OrderStatus } from '../lib/shared-types';

export interface OrderResponse {
  id: string;
  orderNumber: string;
  channel: OrderChannel;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemResponse {
  id: string;
  orderId: string;
  productVariantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productVariant?: {
    id: string;
    sku: string;
    color: string | null;
    size: string | null;
    product?: {
      id: string;
      name: string;
      sku: string;
    };
  };
}

export interface OrderDetailResponse extends OrderResponse {
  orderItems: OrderItemResponse[];
}

// Map backend order status to UI status
export const mapOrderStatusToUI = (status: OrderStatus): string => {
  switch (status) {
    case 'DRAFT':
      return 'Pending';
    case 'CONFIRMED':
      return 'Inprogress';
    case 'PARTIALLY_FULFILLED':
      return 'Inprogress';
    case 'FULFILLED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Cancelled';
    case 'RETURNED':
      return 'Returns';
    default:
      return 'Pending';
  }
};

// Map backend channel to display format
const mapChannelToDisplay = (channel: OrderChannel): string => {
  return channel;
};

// Map backend order to UI format
const mapOrderToUI = (order: OrderResponse): any => {
  return {
    id: order.id,
    _id: order.id,
    orderId: order.orderNumber,
    customer: 'N/A', // Customer info not in backend yet
    product: 'Multiple', // Will be derived from order items
    orderDate: order.createdAt,
    amount: `${order.currency} ${order.totalAmount.toFixed(2)}`,
    payment: 'N/A', // Payment method not in backend yet
    status: mapOrderStatusToUI(order.status),
    channel: mapChannelToDisplay(order.channel),
    // Backend fields
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    totalAmount: order.totalAmount,
    currency: order.currency,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

export const ordersApi = {
  getOrders: async (): Promise<any[]> => {
    const orders = await apiClient.get<OrderResponse[]>('/orders');
    return orders.map(mapOrderToUI);
  },

  getOrderById: async (orderId: string): Promise<OrderDetailResponse> => {
    return apiClient.get<OrderDetailResponse>(`/orders/${orderId}`);
  },
};

