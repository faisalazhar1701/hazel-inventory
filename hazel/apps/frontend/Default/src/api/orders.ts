import { apiClient } from './client';

export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  ALLOCATED = 'ALLOCATED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum OrderChannel {
  DTC = 'DTC',
  B2B = 'B2B',
  POS = 'POS',
  WHOLESALE = 'WHOLESALE',
  RETAIL = 'RETAIL',
}

export interface OrderItem {
  id: string;
  orderId: string;
  productVariantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productVariant?: {
    id: string;
    sku: string;
    attributes?: string;
    product: {
      id: string;
      name: string;
      sku: string;
    };
  };
}

export interface InventoryReservation {
  id: string;
  orderId: string;
  orderItemId: string;
  inventoryItemId: string;
  productVariantId: string;
  warehouseId: string;
  quantity: number;
  reservedAt: string;
  consumedAt?: string;
  releasedAt?: string;
  inventoryItem?: {
    warehouse?: {
      id: string;
      name: string;
      location: string;
    };
    productVariant?: {
      id: string;
      sku: string;
      product?: {
        id: string;
        name: string;
      };
    };
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  channel: OrderChannel;
  customerId?: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  confirmedAt?: string;
  allocatedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  fulfilledAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    companyName: string;
    type: string;
    status: string;
  };
  orderItems?: OrderItem[];
  inventoryReservations?: InventoryReservation[];
}

export interface InventoryImpact {
  orderId: string;
  orderNumber: string;
  status: string;
  totalItems: number;
  reservations: {
    active: number;
    consumed: number;
    released: number;
  };
  inventoryImpact: Array<{
    productVariantId: string;
    productVariantSku: string;
    warehouseId: string;
    warehouseName: string;
    quantityReserved: number;
    quantityConsumed: number;
    quantityReleased: number;
    netImpact: number;
  }>;
}

export interface CreateOrderItemDto {
  productVariantId: string;
  quantity: number;
  unitPrice: number;
  warehouseId: string;
}

export interface CreateOrderDto {
  channel: OrderChannel;
  customerId?: string;
  currency: string;
  items: CreateOrderItemDto[];
}

export interface ReturnOrderItemDto {
  orderItemId: string;
  quantity: number;
  warehouseId: string;
  reason: string;
}

export interface ReturnOrderDto {
  items: ReturnOrderItemDto[];
}

class OrdersAPI {
  private basePath = '/orders';

  async listOrders(): Promise<Order[]> {
    return apiClient.get<Order[]>(this.basePath);
  }

  // Backward compatibility alias
  async getOrders(): Promise<Order[]> {
    return this.listOrders();
  }

  async getOrderById(id: string): Promise<Order> {
    return apiClient.get<Order>(`${this.basePath}/${id}`);
  }

  async createOrder(data: CreateOrderDto): Promise<Order> {
    return apiClient.post<Order>(this.basePath, data);
  }

  async confirmOrder(id: string): Promise<Order> {
    return apiClient.patch<Order>(`${this.basePath}/${id}/confirm`, {});
  }

  async cancelOrder(id: string): Promise<Order> {
    return apiClient.patch<Order>(`${this.basePath}/${id}/cancel`, {});
  }

  async shipOrder(id: string): Promise<Order> {
    return apiClient.patch<Order>(`${this.basePath}/${id}/ship`, {});
  }

  async fulfillOrder(id: string): Promise<Order> {
    return apiClient.patch<Order>(`${this.basePath}/${id}/fulfill`, {});
  }

  async getInventoryImpact(id: string): Promise<InventoryImpact> {
    return apiClient.get<InventoryImpact>(`${this.basePath}/${id}/inventory-impact`);
  }

  async returnOrder(id: string, data: ReturnOrderDto): Promise<Order> {
    return apiClient.patch<Order>(`${this.basePath}/${id}/return`, data);
  }
}

export const ordersAPI = new OrdersAPI();

// Backward compatibility
export const ordersApi = ordersAPI;
