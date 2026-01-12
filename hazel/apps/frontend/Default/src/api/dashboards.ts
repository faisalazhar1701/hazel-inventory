import { apiClient } from './client';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  channel?: string;
  warehouseId?: string;
}

export interface ExecutiveDashboard {
  totalRevenue: number;
  grossMarginPercent: number;
  totalOrders: number;
  activeCustomers: number;
  inventoryValue: number;
  orderFulfillmentRate: number;
  currency: string;
}

export interface SalesDashboard {
  ordersByChannel: Array<{
    channel: string;
    orders: number;
    revenue: number;
  }>;
  revenueByChannel: Array<{
    channel: string;
    revenue: number;
    percentage: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    companyName: string;
    revenue: number;
    orderCount: number;
  }>;
  orderConversionRate: number;
  totalOrders: number;
  totalRevenue: number;
  currency: string;
}

export interface InventoryDashboard {
  inventoryValue: number;
  lowStockVariantsCount: number;
  stockTurnover: number;
  warehousesWithHighestMovement: Array<{
    warehouseId: string;
    warehouseName: string;
    inventoryMovements: number;
    inventoryValue: number;
  }>;
  currency: string;
}

export interface OperationsDashboard {
  averageFulfillmentTimeHours: number;
  fulfillmentRate: number;
  cancellationRate: number;
  returnRate: number;
  fulfillmentByChannel: Array<{
    channel: string;
    averageFulfillmentTimeHours: number;
    fulfillmentRate: number;
    cancellationRate: number;
    returnRate: number;
  }>;
  warehousePerformance: Array<{
    warehouseId: string;
    warehouseName: string;
    ordersFulfilled: number;
    inventoryMovements: number;
    averageFulfillmentTimeHours: number;
  }>;
}

class DashboardsAPI {
  private basePath = '/dashboards';

  async getExecutiveDashboard(filters?: DashboardFilters): Promise<ExecutiveDashboard> {
    const queryParams = new URLSearchParams();
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.channel) queryParams.append('channel', filters.channel);
    if (filters?.warehouseId) queryParams.append('warehouseId', filters.warehouseId);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}/executive?${queryString}` : `${this.basePath}/executive`;
    return apiClient.get<ExecutiveDashboard>(url);
  }

  async getSalesDashboard(filters?: DashboardFilters): Promise<SalesDashboard> {
    const queryParams = new URLSearchParams();
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.channel) queryParams.append('channel', filters.channel);
    if (filters?.warehouseId) queryParams.append('warehouseId', filters.warehouseId);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}/sales?${queryString}` : `${this.basePath}/sales`;
    return apiClient.get<SalesDashboard>(url);
  }

  async getInventoryDashboard(filters?: DashboardFilters): Promise<InventoryDashboard> {
    const queryParams = new URLSearchParams();
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.channel) queryParams.append('channel', filters.channel);
    if (filters?.warehouseId) queryParams.append('warehouseId', filters.warehouseId);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}/inventory?${queryString}` : `${this.basePath}/inventory`;
    return apiClient.get<InventoryDashboard>(url);
  }

  async getOperationsDashboard(filters?: DashboardFilters): Promise<OperationsDashboard> {
    const queryParams = new URLSearchParams();
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.channel) queryParams.append('channel', filters.channel);
    if (filters?.warehouseId) queryParams.append('warehouseId', filters.warehouseId);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}/operations?${queryString}` : `${this.basePath}/operations`;
    return apiClient.get<OperationsDashboard>(url);
  }
}

export const dashboardsAPI = new DashboardsAPI();
export const dashboardsApi = dashboardsAPI; // Backward compatibility
