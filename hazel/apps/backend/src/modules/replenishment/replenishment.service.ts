import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ForecastService } from '../forecast/forecast.service';

export interface ReplenishmentOptions {
  productVariantId?: string;
  warehouseId?: string;
  days?: 30 | 60 | 90;
  minStockThreshold?: number; // Minimum stock level to trigger replenishment (default: 0)
  safetyStockMultiplier?: number; // Multiplier for safety stock (default: 1.2)
}

export interface ReplenishmentSuggestionResult {
  productVariantId: string;
  productVariantSku?: string;
  warehouseId: string;
  warehouseName?: string;
  recommendedQuantity: number;
  recommendedDate: Date;
  reason: string;
  currentStock: number;
  forecastQuantity: number;
  shortfall: number;
}

@Injectable()
export class ReplenishmentService {
  private readonly logger = new Logger(ReplenishmentService.name);

  constructor(
    private prisma: PrismaService,
    private forecastService: ForecastService,
  ) {}

  /**
   * Generate replenishment suggestions by comparing forecast vs current inventory
   */
  async generateSuggestions(
    options: ReplenishmentOptions = {},
  ): Promise<ReplenishmentSuggestionResult[]> {
    const {
      productVariantId,
      warehouseId,
      days = 30,
      minStockThreshold = 0,
      safetyStockMultiplier = 1.2,
    } = options;

    this.logger.log(`Generating replenishment suggestions with options: ${JSON.stringify(options)}`);

    // Generate forecasts first
    const forecasts = await this.forecastService.generateForecasts({
      productVariantId,
      days,
    });

    if (forecasts.length === 0) {
      this.logger.warn('No forecasts available for replenishment analysis');
      return [];
    }

    // Get all warehouses (or specific warehouse)
    let warehouses;
    if (warehouseId) {
      const warehouse = await this.prisma.warehouse.findUnique({ where: { id: warehouseId } });
      warehouses = warehouse ? [warehouse] : [];
    } else {
      warehouses = await this.prisma.warehouse.findMany();
    }

    if (warehouses.length === 0) {
      this.logger.warn('No warehouses found for replenishment analysis');
      return [];
    }

    const suggestions: ReplenishmentSuggestionResult[] = [];

    // For each forecast, check inventory at each warehouse
    for (const forecast of forecasts) {
      for (const warehouse of warehouses) {
        if (!warehouse) continue;

        // Get current inventory for this variant at this warehouse
        const inventoryItem = await this.prisma.inventoryItem.findUnique({
          where: {
            productVariantId_warehouseId: {
              productVariantId: forecast.productVariantId,
              warehouseId: warehouse.id,
            },
          },
        });

        const currentStock = inventoryItem?.quantity || 0;

        // Calculate forecasted demand with safety stock
        const forecastWithSafetyStock = Math.ceil(
          forecast.forecastQuantity * safetyStockMultiplier,
        );

        // Calculate shortfall (how much we need to order)
        const shortfall = forecastWithSafetyStock - currentStock;

        // Only suggest replenishment if:
        // 1. Current stock is below minimum threshold, OR
        // 2. Stock is less than forecasted demand (with safety stock)
        if (currentStock < minStockThreshold || shortfall > 0) {
          // Determine reason
          let reason = 'LOW_STOCK';
          if (currentStock < minStockThreshold) {
            reason = 'BELOW_MINIMUM_THRESHOLD';
          } else if (shortfall > 0) {
            reason = 'FORECAST_DEMAND';
          }

          // Recommended quantity is the shortfall, but at least 1
          const recommendedQuantity = Math.max(1, shortfall);

          // Recommended date is the start of the forecast period (immediate need)
          const recommendedDate = forecast.periodStart;

          suggestions.push({
            productVariantId: forecast.productVariantId,
            productVariantSku: forecast.productVariantSku,
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            recommendedQuantity,
            recommendedDate,
            reason,
            currentStock,
            forecastQuantity: forecast.forecastQuantity,
            shortfall,
          });

          this.logger.debug(
            `Replenishment suggestion: Variant ${forecast.productVariantSku} at ${warehouse.name}: ${recommendedQuantity} units (Current: ${currentStock}, Forecast: ${forecast.forecastQuantity}, Shortfall: ${shortfall})`,
          );
        }
      }
    }

    this.logger.log(`Generated ${suggestions.length} replenishment suggestions`);

    return suggestions;
  }

  /**
   * Save replenishment suggestions to database
   */
  async saveSuggestions(suggestions: ReplenishmentSuggestionResult[]): Promise<void> {
    this.logger.log(`Saving ${suggestions.length} replenishment suggestions to database`);

    for (const suggestion of suggestions) {
      // Check if suggestion already exists to avoid duplicates
      const existing = await this.prisma.replenishmentSuggestion.findFirst({
        where: {
          productVariantId: suggestion.productVariantId,
          warehouseId: suggestion.warehouseId,
          recommendedDate: suggestion.recommendedDate,
        },
      });

      if (!existing) {
        await this.prisma.replenishmentSuggestion.create({
          data: {
            productVariantId: suggestion.productVariantId,
            warehouseId: suggestion.warehouseId,
            recommendedQuantity: suggestion.recommendedQuantity,
            recommendedDate: suggestion.recommendedDate,
            reason: suggestion.reason,
          },
        });
      } else {
        // Update existing suggestion
        await this.prisma.replenishmentSuggestion.update({
          where: { id: existing.id },
          data: {
            recommendedQuantity: suggestion.recommendedQuantity,
            reason: suggestion.reason,
          },
        });
      }
    }

    this.logger.log(`Successfully saved ${suggestions.length} replenishment suggestions`);
  }

  /**
   * Get replenishment suggestions from database
   */
  async getSuggestions(options: {
    productVariantId?: string;
    warehouseId?: string;
    recommendedDateFrom?: Date;
    recommendedDateTo?: Date;
  } = {}) {
    const where: any = {};

    if (options.productVariantId) {
      where.productVariantId = options.productVariantId;
    }

    if (options.warehouseId) {
      where.warehouseId = options.warehouseId;
    }

    if (options.recommendedDateFrom || options.recommendedDateTo) {
      where.recommendedDate = {};
      if (options.recommendedDateFrom) {
        where.recommendedDate.gte = options.recommendedDateFrom;
      }
      if (options.recommendedDateTo) {
        where.recommendedDate.lte = options.recommendedDateTo;
      }
    }

    return this.prisma.replenishmentSuggestion.findMany({
      where,
      include: {
        productVariant: {
          select: {
            id: true,
            sku: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        recommendedDate: 'asc',
      },
    });
  }
}

