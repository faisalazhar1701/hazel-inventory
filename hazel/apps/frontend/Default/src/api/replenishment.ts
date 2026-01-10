import { apiClient } from './client';

export interface ReplenishmentSuggestionResult {
  productVariantId: string;
  productVariantSku?: string;
  warehouseId: string;
  warehouseName?: string;
  recommendedQuantity: number;
  recommendedDate: string;
  reason: string;
  currentStock: number;
  forecastQuantity: number;
  shortfall: number;
}

export interface ReplenishmentSuggestion {
  id: string;
  productVariantId: string;
  warehouseId: string;
  recommendedQuantity: number;
  recommendedDate: string;
  reason: string;
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
  warehouse?: {
    id: string;
    name: string;
    location: string;
  };
}

export interface GetReplenishmentSuggestionsParams {
  productVariantId?: string;
  warehouseId?: string;
  days?: 30 | 60 | 90;
  minStockThreshold?: number;
  safetyStockMultiplier?: number;
  generate?: 'true' | 'false';
}

class ReplenishmentAPI {
  private basePath = '/replenishment-suggestions';

  async getSuggestions(params?: GetReplenishmentSuggestionsParams): Promise<ReplenishmentSuggestionResult[] | ReplenishmentSuggestion[]> {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params?.productVariantId) {
      queryParams.productVariantId = params.productVariantId;
    }
    if (params?.warehouseId) {
      queryParams.warehouseId = params.warehouseId;
    }
    if (params?.days) {
      queryParams.days = params.days;
    }
    if (params?.minStockThreshold !== undefined) {
      queryParams.minStockThreshold = params.minStockThreshold;
    }
    if (params?.safetyStockMultiplier !== undefined) {
      queryParams.safetyStockMultiplier = params.safetyStockMultiplier;
    }
    if (params?.generate) {
      queryParams.generate = params.generate;
    }

    return apiClient.get<ReplenishmentSuggestionResult[] | ReplenishmentSuggestion[]>(this.basePath, {
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    });
  }
}

export const replenishmentAPI = new ReplenishmentAPI();

