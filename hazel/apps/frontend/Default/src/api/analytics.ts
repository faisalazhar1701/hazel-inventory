import { apiClient } from './client';

export interface AnalyticsFilters {
  channel?: string;
  warehouseId?: string;
  startDate?: string;
  endDate?: string;
}

export interface OmnichannelSummary {
  totalOrders: number;
  totalRevenue: number;
  ordersByChannel: Array<{
    channel: string;
    count: number;
    revenue: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
}

export interface OrdersByChannel {
  channel: string;
  orders: number;
  revenue: number;
  cancellationRate: number;
  returnRate: number;
}

export interface FulfillmentPerformance {
  averageFulfillmentTimeHours: number;
  fulfillmentRate: number;
  cancellationRate: number;
  returnRate: number;
  byChannel: Array<{
    channel: string;
    averageFulfillmentTimeHours: number;
    fulfillmentRate: number;
    cancellationRate: number;
    returnRate: number;
  }>;
}

export interface WarehouseFulfillment {
  warehouseId: string;
  warehouseName: string;
  ordersFulfilled: number;
  inventoryMovements: number;
  averageFulfillmentTimeHours: number;
}

class AnalyticsAPI {
  private basePath = '/analytics';

  async getOmnichannelSummary(filters?: AnalyticsFilters): Promise<OmnichannelSummary> {
    const queryParams = new URLSearchParams();
    if (filters?.channel) queryParams.append('channel', filters.channel);
    if (filters?.warehouseId) queryParams.append('warehouseId', filters.warehouseId);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}/omnichannel/summary?${queryString}` : `${this.basePath}/omnichannel/summary`;
    return apiClient.get<OmnichannelSummary>(url);
  }

  async getOrdersByChannel(filters?: AnalyticsFilters): Promise<OrdersByChannel[]> {
    const queryParams = new URLSearchParams();
    if (filters?.channel) queryParams.append('channel', filters.channel);
    if (filters?.warehouseId) queryParams.append('warehouseId', filters.warehouseId);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}/omnichannel/orders-by-channel?${queryString}` : `${this.basePath}/omnichannel/orders-by-channel`;
    return apiClient.get<OrdersByChannel[]>(url);
  }

  async getFulfillmentPerformance(filters?: AnalyticsFilters): Promise<FulfillmentPerformance> {
    const queryParams = new URLSearchParams();
    if (filters?.channel) queryParams.append('channel', filters.channel);
    if (filters?.warehouseId) queryParams.append('warehouseId', filters.warehouseId);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}/fulfillment/performance?${queryString}` : `${this.basePath}/fulfillment/performance`;
    return apiClient.get<FulfillmentPerformance>(url);
  }

  async getWarehouseFulfillment(filters?: AnalyticsFilters): Promise<WarehouseFulfillment[]> {
    const queryParams = new URLSearchParams();
    if (filters?.channel) queryParams.append('channel', filters.channel);
    if (filters?.warehouseId) queryParams.append('warehouseId', filters.warehouseId);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}/fulfillment/warehouses?${queryString}` : `${this.basePath}/fulfillment/warehouses`;
    return apiClient.get<WarehouseFulfillment[]>(url);
  }
}

export const analyticsAPI = new AnalyticsAPI();
export const analyticsApi = analyticsAPI; // Backward compatibility
