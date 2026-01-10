import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@hazel/shared-types';

export interface ForecastOptions {
  productVariantId?: string;
  channel?: string;
  days?: 30 | 60 | 90;
  periodStart?: Date;
  periodEnd?: Date;
}

export interface DemandForecastResult {
  productVariantId: string;
  productVariantSku?: string;
  periodStart: Date;
  periodEnd: Date;
  forecastQuantity: number;
  channel?: string;
  historicalData: {
    totalQuantity: number;
    orderCount: number;
    averageDailyQuantity: number;
    periodDays: number;
  };
}

@Injectable()
export class ForecastService {
  private readonly logger = new Logger(ForecastService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate demand forecasts based on historical order data
   * Uses rule-based approach: average daily demand * forecast period days
   */
  async generateForecasts(options: ForecastOptions = {}): Promise<DemandForecastResult[]> {
    const { productVariantId, channel, days = 30, periodStart, periodEnd } = options;

    // Determine the period for forecasting
    const forecastPeriodStart = periodStart || new Date();
    const forecastPeriodEnd = periodEnd || new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const forecastPeriodDays = Math.ceil(
      (forecastPeriodEnd.getTime() - forecastPeriodStart.getTime()) / (24 * 60 * 60 * 1000),
    );

    this.logger.log(
      `Generating forecasts for period: ${forecastPeriodStart.toISOString()} to ${forecastPeriodEnd.toISOString()} (${forecastPeriodDays} days)`,
    );

    // Calculate historical period start (30, 60, or 90 days ago from forecast period start)
    const historicalStartDate = new Date(forecastPeriodStart);
    historicalStartDate.setDate(historicalStartDate.getDate() - days);

    // Build query to get historical order items
    // Include orders that have been confirmed or fulfilled (exclude DRAFT and CANCELLED)
    const whereClause: any = {
      order: {
        status: {
          notIn: [OrderStatus.CANCELLED, OrderStatus.DRAFT], // Exclude cancelled and draft orders
        },
        createdAt: {
          gte: historicalStartDate,
          lt: forecastPeriodStart,
        },
      },
    };

    if (productVariantId) {
      whereClause.productVariantId = productVariantId;
    }

    if (channel) {
      whereClause.order.channel = channel;
    }

    // Get all order items for historical analysis
    const historicalOrderItems = await this.prisma.orderItem.findMany({
      where: whereClause,
      include: {
        productVariant: {
          select: {
            id: true,
            sku: true,
          },
        },
        order: {
          select: {
            channel: true,
            createdAt: true,
          },
        },
      },
    });

    this.logger.debug(`Found ${historicalOrderItems.length} historical order items for analysis`);

    // Group by product variant (and optionally channel)
    const variantGroups = new Map<string, { items: typeof historicalOrderItems; variant: any }>();

    for (const item of historicalOrderItems) {
      const key = channel
        ? `${item.productVariantId}-${item.order.channel}`
        : item.productVariantId;

      if (!variantGroups.has(key)) {
        variantGroups.set(key, {
          items: [],
          variant: item.productVariant,
        });
      }
      variantGroups.get(key)!.items.push(item);
    }

    // Calculate forecasts for each variant group
    const forecasts: DemandForecastResult[] = [];

    for (const [key, group] of variantGroups.entries()) {
      const totalQuantity = group.items.reduce((sum, item) => sum + item.quantity, 0);
      const orderCount = new Set(group.items.map((item) => item.orderId)).size;
      const historicalPeriodDays = Math.max(
        1,
        Math.ceil(
          (forecastPeriodStart.getTime() - historicalStartDate.getTime()) / (24 * 60 * 60 * 1000),
        ),
      );
      const averageDailyQuantity = totalQuantity / historicalPeriodDays;

      // Forecast = average daily demand * forecast period days
      const forecastQuantity = Math.round(averageDailyQuantity * forecastPeriodDays);

      const result: DemandForecastResult = {
        productVariantId: group.variant.id,
        productVariantSku: group.variant.sku,
        periodStart: forecastPeriodStart,
        periodEnd: forecastPeriodEnd,
        forecastQuantity: Math.max(0, forecastQuantity), // Ensure non-negative
        historicalData: {
          totalQuantity,
          orderCount,
          averageDailyQuantity,
          periodDays: historicalPeriodDays,
        },
      };

      // Add channel if filtering by channel
      if (channel) {
        const channelValue = group.items[0]?.order.channel;
        if (channelValue) {
          result.channel = channelValue;
        }
      }

      forecasts.push(result);
    }

    this.logger.log(`Generated ${forecasts.length} demand forecasts`);

    return forecasts;
  }

  /**
   * Save forecasts to database
   */
  async saveForecasts(forecasts: DemandForecastResult[]): Promise<void> {
    this.logger.log(`Saving ${forecasts.length} forecasts to database`);

    for (const forecast of forecasts) {
      await this.prisma.demandForecast.create({
        data: {
          productVariantId: forecast.productVariantId,
          periodStart: forecast.periodStart,
          periodEnd: forecast.periodEnd,
          forecastQuantity: forecast.forecastQuantity,
          channel: forecast.channel || null,
        },
      });
    }

    this.logger.log(`Successfully saved ${forecasts.length} forecasts`);
  }

  /**
   * Get forecasts from database
   */
  async getForecasts(options: {
    productVariantId?: string;
    channel?: string;
    periodStart?: Date;
    periodEnd?: Date;
  } = {}) {
    const where: any = {};

    if (options.productVariantId) {
      where.productVariantId = options.productVariantId;
    }

    if (options.channel) {
      where.channel = options.channel;
    }

    if (options.periodStart || options.periodEnd) {
      where.OR = [];
      if (options.periodStart) {
        where.OR.push({
          periodEnd: { gte: options.periodStart },
        });
      }
      if (options.periodEnd) {
        where.OR.push({
          periodStart: { lte: options.periodEnd },
        });
      }
    }

    return this.prisma.demandForecast.findMany({
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
      },
      orderBy: {
        periodStart: 'asc',
      },
    });
  }
}

