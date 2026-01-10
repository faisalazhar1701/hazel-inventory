import { apiClient } from './client';

export interface Drop {
  id: string;
  name: string;
  releaseDate?: string;
  collectionId?: string;
  collection?: Collection;
}

export interface Collection {
  id: string;
  name: string;
  season?: string;
  year?: number;
}

export interface CreateDropDto {
  name: string;
  releaseDate?: string;
  collectionId?: string;
}

export interface UpdateDropDto {
  name?: string;
  releaseDate?: string;
  collectionId?: string;
}

class DropsAPI {
  private basePath = '/drops';

  async listDrops(): Promise<Drop[]> {
    return apiClient.get<Drop[]>(this.basePath);
  }

  async getDropById(id: string): Promise<Drop> {
    return apiClient.get<Drop>(`${this.basePath}/${id}`);
  }

  async createDrop(data: CreateDropDto): Promise<Drop> {
    return apiClient.post<Drop>(this.basePath, data);
  }

  async updateDrop(id: string, data: UpdateDropDto): Promise<Drop> {
    return apiClient.put<Drop>(`${this.basePath}/${id}`, data);
  }

  async deleteDrop(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

export const dropsAPI = new DropsAPI();

