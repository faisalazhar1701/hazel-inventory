import { apiClient } from './client';

export interface Asset {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  category: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export interface UploadAssetParams {
  file: File;
  category: string;
  entityType: string;
  entityId: string;
}

class AssetsAPI {
  private basePath = '/assets';

  async uploadAsset(params: UploadAssetParams): Promise<Asset> {
    const formData = new FormData();
    formData.append('file', params.file);

    // Note: category, entityType, entityId are sent as query parameters per backend implementation
    return apiClient.post<Asset>(`${this.basePath}/upload?category=${encodeURIComponent(params.category)}&entityType=${encodeURIComponent(params.entityType)}&entityId=${encodeURIComponent(params.entityId)}`, formData, {
      headers: {
        // Don't set Content-Type - browser will set it with boundary for FormData
      },
    });
  }

  async listAssets(entityType?: string, entityId?: string): Promise<Asset[]> {
    const queryParams = new URLSearchParams();
    if (entityType) queryParams.append('entityType', entityType);
    if (entityId) queryParams.append('entityId', entityId);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;
    return apiClient.get<Asset[]>(url);
  }

  getDownloadUrl(assetId: string): string {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    return `${baseUrl}${this.basePath}/${assetId}/download`;
  }

  async deleteAsset(assetId: string): Promise<void> {
    return apiClient.delete(`${this.basePath}/${assetId}`);
  }
}

export const assetsAPI = new AssetsAPI();
export const assetsApi = assetsAPI; // Backward compatibility
