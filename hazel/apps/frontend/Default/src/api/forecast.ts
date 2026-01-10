import { apiClient } from './client';

export interface DemandForecastResult {
  productVariantId: string;
  productVariantSku?: string;
  periodStart: string;
  periodEnd: string;
  forecastQuantity: number;
  channel?: string;
  historicalData: {
    totalQuantity: number;
    orderCount: number;
    averageDailyQuantity: number;
    periodDays: number;
  };
}

export interface DemandForecast {
  id: string;
  productVariantId: string;
  periodStart: string;
  periodEnd: string;
  forecastQuantity: number;
  channel?: string;
  createdAt: string;
  updatedAt: string;
  productVariant?: {
    id: string;
    sku: string;
    product?: {
      id: string;
      name: string;
      sku: string;
    };
  };
}

export interface GetForecastsParams {
  productVariantId?: string;
  channel?: string;
  days?: 30 | 60 | 90;
  generate?: 'true' | 'false';
}

class ForecastAPI {
  private basePath = '/forecast';

  async getForecasts(params?: GetForecastsParams): Promise<DemandForecastResult[] | DemandForecast[]> {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params?.productVariantId) {
      queryParams.productVariantId = params.productVariantId;
    }
    if (params?.channel) {
      queryParams.channel = params.channel;
    }
    if (params?.days) {
      queryParams.days = params.days;
    }
    if (params?.generate) {
      queryParams.generate = params.generate;
    }

    return apiClient.get<DemandForecastResult[] | DemandForecast[]>(this.basePath, {
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    });
  }
}

export const forecastAPI = new ForecastAPI();

