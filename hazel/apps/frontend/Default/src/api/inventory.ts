import { apiClient } from './client';

export interface InventoryItemResponse {
  id: string;
  productVariantId: string;
  warehouseId: string;
  quantity: number;
  itemType: string;
  warehouse: {
    id: string;
    name: string;
    location: string;
  };
  productVariant: {
    id: string;
    sku: string;
    color: string | null;
    size: string | null;
    product: {
      id: string;
      name: string;
      sku: string;
    };
  };
}

export const inventoryApi = {
  getInventoryByProductVariant: async (
    productVariantId: string,
  ): Promise<InventoryItemResponse[]> => {
    return apiClient.get<InventoryItemResponse[]>(
      `/inventory/product-variant/${productVariantId}`,
    );
  },

  getInventoryByWarehouse: async (
    warehouseId: string,
  ): Promise<InventoryItemResponse[]> => {
    return apiClient.get<InventoryItemResponse[]>(
      `/inventory/warehouse/${warehouseId}`,
    );
  },
};

