import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { IntegrationsService, CreateWebhookDto } from './integrations.service';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CreateWebhookDtoValidation implements CreateWebhookDto {
  @IsString()
  @IsNotEmpty()
  event: string;

  @IsString()
  @IsNotEmpty()
  targetUrl: string;

  @IsOptional()
  isActive?: boolean;
}

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  /**
   * POST /integrations/webhooks
   * Create a new webhook
   */
  @Post('webhooks')
  @HttpCode(HttpStatus.CREATED)
  async createWebhook(@Body() dto: CreateWebhookDtoValidation) {
    return this.integrationsService.createWebhook(dto);
  }

  /**
   * GET /integrations/webhooks
   * List all webhooks
   */
  @Get('webhooks')
  async listWebhooks() {
    return this.integrationsService.listWebhooks();
  }

  /**
   * POST /integrations/test
   * Test a webhook
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testWebhook(@Body() body: { webhookId: string }) {
    return this.integrationsService.testWebhook(body.webhookId);
  }

  /**
   * GET /integrations/logs
   * Get integration logs
   */
  @Get('logs')
  async getIntegrationLogs(
    @Query('integrationId') integrationId?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.integrationsService.getIntegrationLogs(integrationId, limitNum);
  }

  /**
   * POST /integrations/export/products
   * Export products to CSV
   */
  @Post('export/products')
  @HttpCode(HttpStatus.OK)
  async exportProducts(@Res() res: Response) {
    const csv = await this.integrationsService.exportProductsToCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csv);
  }

  /**
   * POST /integrations/export/inventory
   * Export inventory to CSV
   */
  @Post('export/inventory')
  @HttpCode(HttpStatus.OK)
  async exportInventory(@Res() res: Response) {
    const csv = await this.integrationsService.exportInventoryToCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory.csv"');
    res.send(csv);
  }

  /**
   * POST /integrations/export/orders
   * Export orders to CSV
   */
  @Post('export/orders')
  @HttpCode(HttpStatus.OK)
  async exportOrders(@Res() res: Response) {
    const csv = await this.integrationsService.exportOrdersToCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(csv);
  }

  /**
   * POST /integrations/import/products
   * Import products from CSV
   */
  @Post('import/products')
  @HttpCode(HttpStatus.OK)
  async importProducts(@Body() body: { csvContent: string }) {
    return this.integrationsService.importProductsFromCSV(body.csvContent);
  }
}
