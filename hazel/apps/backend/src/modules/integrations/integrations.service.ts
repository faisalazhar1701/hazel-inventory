import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

export interface CreateWebhookDto {
  event: string;
  targetUrl: string;
  isActive?: boolean;
}

export interface WebhookResponse {
  id: string;
  event: string;
  targetUrl: string;
  isActive: boolean;
  createdAt: Date;
}

export interface IntegrationLogResponse {
  id: string;
  integrationId: string;
  status: string;
  payload: string | null;
  response: string | null;
  createdAt: Date;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new webhook
   */
  async createWebhook(dto: CreateWebhookDto): Promise<WebhookResponse> {
    // Validate event
    const validEvents = ['order.created', 'order.fulfilled', 'inventory.low_stock'];
    if (!validEvents.includes(dto.event)) {
      throw new BadRequestException(`Invalid event. Must be one of: ${validEvents.join(', ')}`);
    }

    // Validate URL
    try {
      new URL(dto.targetUrl);
    } catch {
      throw new BadRequestException('Invalid target URL');
    }

    const webhook = await this.prisma.webhook.create({
      data: {
        event: dto.event,
        targetUrl: dto.targetUrl,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return {
      id: webhook.id,
      event: webhook.event,
      targetUrl: webhook.targetUrl,
      isActive: webhook.isActive,
      createdAt: webhook.createdAt,
    };
  }

  /**
   * List all webhooks
   */
  async listWebhooks(): Promise<WebhookResponse[]> {
    const webhooks = await this.prisma.webhook.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return webhooks.map(webhook => ({
      id: webhook.id,
      event: webhook.event,
      targetUrl: webhook.targetUrl,
      isActive: webhook.isActive,
      createdAt: webhook.createdAt,
    }));
  }

  /**
   * Test a webhook
   */
  async testWebhook(webhookId: string): Promise<{ success: boolean; message: string }> {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${webhookId} not found`);
    }

    const testPayload = {
      event: webhook.event,
      test: true,
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook' },
    };

    try {
      await this.sendWebhook(webhook.id, webhook.targetUrl, testPayload);
      return { success: true, message: 'Webhook test successful' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Webhook test failed' };
    }
  }

  /**
   * Get integration logs
   */
  async getIntegrationLogs(integrationId?: string, limit: number = 100): Promise<IntegrationLogResponse[]> {
    const where: any = {};
    if (integrationId) {
      where.integrationId = integrationId;
    }

    const logs = await this.prisma.integrationLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return logs.map(log => ({
      id: log.id,
      integrationId: log.integrationId,
      status: log.status,
      payload: log.payload,
      response: log.response,
      createdAt: log.createdAt,
    }));
  }

  /**
   * Trigger webhooks for an event
   */
  async triggerWebhooks(event: string, payload: any): Promise<void> {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        event,
        isActive: true,
      },
    });

    if (webhooks.length === 0) {
      this.logger.debug(`No active webhooks found for event: ${event}`);
      return;
    }

    this.logger.log(`Triggering ${webhooks.length} webhook(s) for event: ${event}`);

    // Send webhooks in parallel (don't await to avoid blocking)
    webhooks.forEach(webhook => {
      this.sendWebhook(webhook.id, webhook.targetUrl, payload).catch(error => {
        this.logger.error(`Failed to send webhook ${webhook.id}: ${error.message}`);
      });
    });
  }

  /**
   * Send webhook with retry logic
   */
  private async sendWebhook(webhookId: string, targetUrl: string, payload: any, isRetry: boolean = false): Promise<void> {
    const payloadString = JSON.stringify(payload);
    const url = new URL(targetUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString),
      },
      timeout: 10000, // 10 seconds
    };

    return new Promise((resolve, reject) => {
      const req = client.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          const status = res.statusCode || 500;
          const success = status >= 200 && status < 300;

          // Log the result
          this.logIntegrationLog(webhookId, success ? 'SUCCESS' : 'FAILED', payloadString, responseData).catch(
            err => this.logger.error(`Failed to log integration: ${err.message}`)
          );

          if (success) {
            this.logger.log(`Webhook ${webhookId} sent successfully (${status})`);
            resolve();
          } else {
            if (!isRetry) {
              // Retry once on failure
              this.logger.warn(`Webhook ${webhookId} failed with status ${status}, retrying...`);
              this.retryWebhook(webhookId, targetUrl, payload)
                .then(() => resolve())
                .catch(reject);
            } else {
              reject(new Error(`Webhook failed with status ${status} after retry`));
            }
          }
        });
      });

      req.on('error', async (error) => {
        this.logger.error(`Webhook ${webhookId} request error: ${error.message}`);
        
        // Log the failure
        await this.logIntegrationLog(webhookId, 'FAILED', payloadString, error.message).catch(
          err => this.logger.error(`Failed to log integration: ${err.message}`)
        );

        if (!isRetry) {
          // Retry once on error
          this.logger.warn(`Webhook ${webhookId} request error, retrying...`);
          try {
            await this.retryWebhook(webhookId, targetUrl, payload);
            resolve();
          } catch (retryError) {
            reject(retryError);
          }
        } else {
          reject(error);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        const error = new Error('Request timeout');
        this.logIntegrationLog(webhookId, 'FAILED', payloadString, error.message).catch(
          err => this.logger.error(`Failed to log integration: ${err.message}`)
        );
        reject(error);
      });

      req.write(payloadString);
      req.end();
    });
  }

  /**
   * Retry webhook once
   */
  private async retryWebhook(webhookId: string, targetUrl: string, payload: any): Promise<void> {
    this.logger.log(`Retrying webhook ${webhookId}...`);
    // Wait 1 second before retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.sendWebhook(webhookId, targetUrl, payload, true);
  }

  /**
   * Log integration result
   */
  private async logIntegrationLog(
    integrationId: string,
    status: string,
    payload: string | null,
    response: string | null,
  ): Promise<void> {
    await this.prisma.integrationLog.create({
      data: {
        integrationId,
        status,
        payload,
        response,
      },
    });
  }

  /**
   * Export products to CSV
   */
  async exportProductsToCSV(): Promise<string> {
    const products = await this.prisma.product.findMany({
      include: {
        collection: true,
        variants: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const headers = ['ID', 'Name', 'SKU', 'Description', 'Lifecycle Status', 'Collection', 'Created At'];
    const rows = products.map(product => [
      product.id,
      product.name,
      product.sku,
      product.description || '',
      product.lifecycleStatus,
      product.collection?.name || '',
      product.createdAt.toISOString(),
    ]);

    return this.generateCSV(headers, rows);
  }

  /**
   * Export inventory to CSV
   */
  async exportInventoryToCSV(): Promise<string> {
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      include: {
        productVariant: {
          include: {
            product: true,
          },
        },
        warehouse: true,
      },
    });

    const headers = ['ID', 'Product', 'Variant SKU', 'Warehouse', 'Quantity', 'Item Type'];
    const rows = inventoryItems.map(item => [
      item.id,
      item.productVariant.product.name,
      item.productVariant.sku,
      item.warehouse.name,
      item.quantity.toString(),
      item.itemType,
    ]);

    return this.generateCSV(headers, rows);
  }

  /**
   * Export orders to CSV
   */
  async exportOrdersToCSV(): Promise<string> {
    const orders = await this.prisma.order.findMany({
      include: {
        customer: true,
        orderItems: {
          include: {
            productVariant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const headers = ['ID', 'Order Number', 'Channel', 'Status', 'Customer', 'Total Amount', 'Currency', 'Created At'];
    const rows = orders.map(order => [
      order.id,
      order.orderNumber,
      order.channel,
      order.status,
      order.customer?.companyName || '',
      order.totalAmount.toString(),
      order.currency,
      order.createdAt.toISOString(),
    ]);

    return this.generateCSV(headers, rows);
  }

  /**
   * Import products from CSV
   */
  async importProductsFromCSV(csvContent: string): Promise<{ success: number; failed: number; errors: string[] }> {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new BadRequestException('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'sku'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new BadRequestException(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        failed++;
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });

      try {
        await this.prisma.product.create({
          data: {
            name: row.name,
            sku: row.sku,
            description: row.description || null,
            lifecycleStatus: row['lifecycle status'] || row.lifecyclestatus || 'DRAFT',
            collectionId: row.collectionid || null,
          },
        });
        success++;
      } catch (error) {
        failed++;
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { success, failed, errors };
  }

  /**
   * Generate CSV string
   */
  private generateCSV(headers: string[], rows: string[][]): string {
    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ];

    return csvLines.join('\n');
  }

  /**
   * Parse CSV line (handles quoted values)
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    return values;
  }
}
