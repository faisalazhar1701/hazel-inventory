import { apiClient } from './client';

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  referenceType: string;
  referenceId: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  currency: string;
  createdAt: string;
  debitAccount?: ChartOfAccount;
  creditAccount?: ChartOfAccount;
}

export interface GetTransactionsParams {
  orderId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderSummary {
  orderId: string;
  orderNumber: string;
  revenue: number;
  cost: number;
  margin: number;
  marginPercent: number;
  currency: string;
}

export interface InventoryValuationParams {
  warehouseId?: string;
  productVariantId?: string;
}

export interface WarehouseValuation {
  warehouseId: string;
  warehouseName: string;
  totalQuantity: number;
  estimatedValue: number;
  currency: string;
}

export interface ProductVariantValuation {
  productVariantId: string;
  productVariantSku: string;
  totalQuantity: number;
  estimatedValue: number;
  currency: string;
}

export interface InventoryValuation {
  byWarehouse: WarehouseValuation[];
  byProductVariant: ProductVariantValuation[];
  totalValue: number;
  currency: string;
}

class FinanceAPI {
  private basePath = '/finance';

  async getTransactions(params?: GetTransactionsParams): Promise<FinancialTransaction[]> {
    const queryParams = new URLSearchParams();
    if (params?.orderId) queryParams.append('orderId', params.orderId);
    if (params?.customerId) queryParams.append('customerId', params.customerId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}/transactions?${queryString}` : `${this.basePath}/transactions`;
    return apiClient.get<FinancialTransaction[]>(url);
  }

  async getOrderSummary(orderId: string): Promise<OrderSummary> {
    return apiClient.get<OrderSummary>(`${this.basePath}/orders/${orderId}/summary`);
  }

  async getInventoryValuation(params?: InventoryValuationParams): Promise<InventoryValuation> {
    const queryParams = new URLSearchParams();
    if (params?.warehouseId) queryParams.append('warehouseId', params.warehouseId);
    if (params?.productVariantId) queryParams.append('productVariantId', params.productVariantId);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}/inventory-valuation?${queryString}` : `${this.basePath}/inventory-valuation`;
    return apiClient.get<InventoryValuation>(url);
  }
}

export const financeAPI = new FinanceAPI();
export const financeApi = financeAPI; // Backward compatibility
