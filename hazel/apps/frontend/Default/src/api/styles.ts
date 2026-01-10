import { apiClient } from './client';

export interface Style {
  id: string;
  name: string;
  code?: string;
  productId?: string;
  product?: Product;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
}

export interface CreateStyleDto {
  name: string;
  code?: string;
  productId?: string;
}

export interface UpdateStyleDto {
  name?: string;
  code?: string;
  productId?: string;
}

class StylesAPI {
  private basePath = '/styles';

  async listStyles(): Promise<Style[]> {
    return apiClient.get<Style[]>(this.basePath);
  }

  async getStyleById(id: string): Promise<Style> {
    return apiClient.get<Style>(`${this.basePath}/${id}`);
  }

  async createStyle(data: CreateStyleDto): Promise<Style> {
    return apiClient.post<Style>(this.basePath, data);
  }

  async updateStyle(id: string, data: UpdateStyleDto): Promise<Style> {
    return apiClient.put<Style>(`${this.basePath}/${id}`, data);
  }

  async deleteStyle(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

export const stylesAPI = new StylesAPI();

