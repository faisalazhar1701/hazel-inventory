import { apiClient } from './client';

export interface Brand {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  collections?: Collection[];
  products?: Product[];
  _count?: {
    products: number;
    collections: number;
  };
}

export interface Collection {
  id: string;
  name: string;
  season?: string;
  year?: number;
  brandId?: string;
  _count?: {
    products: number;
    drops: number;
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
}

export interface CreateBrandDto {
  name: string;
  description?: string;
}

export interface UpdateBrandDto {
  name?: string;
  description?: string;
}

class BrandsAPI {
  private basePath = '/brands';

  async listBrands(): Promise<Brand[]> {
    return apiClient.get<Brand[]>(this.basePath);
  }

  async getBrandById(id: string): Promise<Brand> {
    return apiClient.get<Brand>(`${this.basePath}/${id}`);
  }

  async createBrand(data: CreateBrandDto): Promise<Brand> {
    return apiClient.post<Brand>(this.basePath, data);
  }

  async updateBrand(id: string, data: UpdateBrandDto): Promise<Brand> {
    return apiClient.put<Brand>(`${this.basePath}/${id}`, data);
  }

  async deleteBrand(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

export const brandsAPI = new BrandsAPI();

