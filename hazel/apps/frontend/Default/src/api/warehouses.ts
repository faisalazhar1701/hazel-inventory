import { apiClient } from './client';

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  _count?: {
    inventoryItems: number;
    fulfillments: number;
  };
}

export interface CreateWarehouseDto {
  name: string;
  location: string;
}

export interface UpdateWarehouseDto {
  name?: string;
  location?: string;
}

class WarehousesAPI {
  private basePath = '/warehouses';

  async listWarehouses(): Promise<Warehouse[]> {
    return apiClient.get<Warehouse[]>(this.basePath);
  }

  async getWarehouseById(id: string): Promise<Warehouse> {
    return apiClient.get<Warehouse>(`${this.basePath}/${id}`);
  }

  async createWarehouse(data: CreateWarehouseDto): Promise<Warehouse> {
    return apiClient.post<Warehouse>(this.basePath, data);
  }

  async updateWarehouse(id: string, data: UpdateWarehouseDto): Promise<Warehouse> {
    return apiClient.put<Warehouse>(`${this.basePath}/${id}`, data);
  }

  async deleteWarehouse(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

export const warehousesAPI = new WarehousesAPI();

