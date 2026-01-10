import { apiClient } from './client';

export interface Collection {
  id: string;
  name: string;
  season?: string;
  year?: number;
  drops?: Drop[];
  products?: Product[];
  _count?: {
    products: number;
    drops: number;
  };
}

export interface Drop {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
}

export interface CreateCollectionDto {
  name: string;
  season?: string;
  year?: number;
}

export interface UpdateCollectionDto {
  name?: string;
  season?: string;
  year?: number;
}

class CollectionsAPI {
  private basePath = '/collections';

  async listCollections(): Promise<Collection[]> {
    return apiClient.get<Collection[]>(this.basePath);
  }

  async getCollectionById(id: string): Promise<Collection> {
    return apiClient.get<Collection>(`${this.basePath}/${id}`);
  }

  async createCollection(data: CreateCollectionDto): Promise<Collection> {
    return apiClient.post<Collection>(this.basePath, data);
  }

  async updateCollection(id: string, data: UpdateCollectionDto): Promise<Collection> {
    return apiClient.put<Collection>(`${this.basePath}/${id}`, data);
  }

  async deleteCollection(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

export const collectionsAPI = new CollectionsAPI();

