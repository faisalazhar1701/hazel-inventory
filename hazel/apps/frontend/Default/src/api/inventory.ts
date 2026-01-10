import { apiClient } from './client';

export enum InventoryItemType {
  RAW_MATERIAL = 'RAW_MATERIAL',
  WIP = 'WIP',
  FINISHED_GOOD = 'FINISHED_GOOD',
}

export interface InventoryItem {
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
    attributes?: string;
    product: {
      id: string;
      name: string;
      sku: string;
    };
  };
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  changeQuantity: number;
  reason: string;
  createdAt: string;
  inventoryItem: InventoryItem;
}

export interface AddInventoryDto {
  productVariantId: string;
  warehouseId: string;
  quantity: number;
  itemType: InventoryItemType;
  reason: string;
}

export interface DeductInventoryDto {
  productVariantId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
}

export interface TransferInventoryDto {
  productVariantId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  reason: string;
}

class InventoryAPI {
  private basePath = '/inventory';

  async getInventoryByVariant(variantId: string): Promise<InventoryItem[]> {
    return apiClient.get<InventoryItem[]>(`${this.basePath}/product-variant/${variantId}`);
  }

  // Backward compatibility alias
  async getInventoryByProductVariant(productVariantId: string): Promise<InventoryItem[]> {
    return this.getInventoryByVariant(productVariantId);
  }

  async getInventoryByWarehouse(warehouseId: string): Promise<InventoryItem[]> {
    return apiClient.get<InventoryItem[]>(`${this.basePath}/warehouse/${warehouseId}`);
  }

  async addInventory(data: AddInventoryDto): Promise<{ inventoryItem: InventoryItem; ledgerEntry: StockMovement }> {
    return apiClient.post<{ inventoryItem: InventoryItem; ledgerEntry: StockMovement }>(`${this.basePath}/add`, data);
  }

  async deductInventory(data: DeductInventoryDto): Promise<{ inventoryItem: InventoryItem; ledgerEntry: StockMovement }> {
    return apiClient.post<{ inventoryItem: InventoryItem; ledgerEntry: StockMovement }>(`${this.basePath}/deduct`, data);
  }

  async transferInventory(data: TransferInventoryDto): Promise<{
    fromInventoryItem: InventoryItem;
    toInventoryItem: InventoryItem;
    fromLedgerEntry: StockMovement;
    toLedgerEntry: StockMovement;
  }> {
    return apiClient.post<{
      fromInventoryItem: InventoryItem;
      toInventoryItem: InventoryItem;
      fromLedgerEntry: StockMovement;
      toLedgerEntry: StockMovement;
    }>(`${this.basePath}/transfer`, data);
  }

  async getStockMovements(productVariantId?: string, warehouseId?: string): Promise<StockMovement[]> {
    const params: Record<string, string> = {};
    if (productVariantId) params.productVariantId = productVariantId;
    if (warehouseId) params.warehouseId = warehouseId;
    
    return apiClient.get<StockMovement[]>(`${this.basePath}/stock-movements`, {
      params: params,
    });
  }

  async getStockMovementsByVariant(productVariantId: string): Promise<StockMovement[]> {
    return apiClient.get<StockMovement[]>(`${this.basePath}/stock-movements/product-variant/${productVariantId}`);
  }

  async getStockMovementsByWarehouse(warehouseId: string): Promise<StockMovement[]> {
    return apiClient.get<StockMovement[]>(`${this.basePath}/stock-movements/warehouse/${warehouseId}`);
  }
}

export const inventoryAPI = new InventoryAPI();

// Backward compatibility
export const inventoryApi = inventoryAPI;

// Backward compatibility type
export interface InventoryItemResponse extends InventoryItem {}
