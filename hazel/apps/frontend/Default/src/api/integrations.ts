import { apiClient } from './client';

export interface Webhook {
  id: string;
  event: string;
  targetUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateWebhookDto {
  event: string;
  targetUrl: string;
  isActive?: boolean;
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  status: string;
  payload: string | null;
  response: string | null;
  createdAt: string;
}

export interface TestWebhookResponse {
  success: boolean;
  message: string;
}

export interface ImportProductsResponse {
  success: number;
  failed: number;
  errors: string[];
}

class IntegrationsAPI {
  private basePath = '/integrations';

  async createWebhook(dto: CreateWebhookDto): Promise<Webhook> {
    return apiClient.post<Webhook>(`${this.basePath}/webhooks`, dto);
  }

  async listWebhooks(): Promise<Webhook[]> {
    return apiClient.get<Webhook[]>(`${this.basePath}/webhooks`);
  }

  async testWebhook(webhookId: string): Promise<TestWebhookResponse> {
    return apiClient.post<TestWebhookResponse>(`${this.basePath}/test`, { webhookId });
  }

  async getIntegrationLogs(integrationId?: string, limit: number = 100): Promise<IntegrationLog[]> {
    const queryParams = new URLSearchParams();
    if (integrationId) queryParams.append('integrationId', integrationId);
    if (limit) queryParams.append('limit', limit.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}/logs?${queryString}` : `${this.basePath}/logs`;
    return apiClient.get<IntegrationLog[]>(url);
  }

  async exportProducts(): Promise<Blob> {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}${this.basePath}/export/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.blob();
  }

  async exportInventory(): Promise<Blob> {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}${this.basePath}/export/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.blob();
  }

  async exportOrders(): Promise<Blob> {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}${this.basePath}/export/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.blob();
  }

  async importProducts(csvContent: string): Promise<ImportProductsResponse> {
    return apiClient.post<ImportProductsResponse>(`${this.basePath}/import/products`, { csvContent });
  }
}

export const integrationsAPI = new IntegrationsAPI();
export const integrationsApi = integrationsAPI; // Backward compatibility
