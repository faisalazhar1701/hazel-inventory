import { apiClient } from './client';

export interface UploadProductImageResponse {
  imageUrl: string;
}

class UploadAPI {
  /**
   * Upload a product image
   * Uses the assets API and returns a URL
   */
  async uploadProductImage(file: File, productId?: string): Promise<UploadProductImageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Use a temporary ID if product doesn't exist yet
    const entityId = productId || 'temp-' + Date.now();
    
    // Upload to assets API
    // Note: apiClient will handle FormData correctly (no Content-Type header)
    const response = await apiClient.post<any>(
      `/assets/upload?category=IMAGE&entityType=PRODUCT&entityId=${entityId}`,
      formData
    );

    // Construct the image URL
    // In production, this would be the actual URL to serve the image
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hazel-inventory.onrender.com';
    const imageUrl = `${API_BASE_URL}/assets/${response.id}/download`;

    return { imageUrl };
  }
}

export const uploadAPI = new UploadAPI();
