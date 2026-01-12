import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService, AnalyticsFilters } from './analytics.service';
import { IsOptional, IsString } from 'class-validator';

export class AnalyticsQueryDto implements AnalyticsFilters {
  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /analytics/omnichannel/summary
   * Get omnichannel summary with total orders, revenue, and breakdowns
   */
  @Get('omnichannel/summary')
  async getOmnichannelSummary(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOmnichannelSummary(query);
  }

  /**
   * GET /analytics/omnichannel/orders-by-channel
   * Get orders grouped by channel with cancellation and return rates
   */
  @Get('omnichannel/orders-by-channel')
  async getOrdersByChannel(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOrdersByChannel(query);
  }

  /**
   * GET /analytics/fulfillment/performance
   * Get fulfillment performance metrics including average fulfillment time
   */
  @Get('fulfillment/performance')
  async getFulfillmentPerformance(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getFulfillmentPerformance(query);
  }

  /**
   * GET /analytics/fulfillment/warehouses
   * Get warehouse fulfillment metrics
   */
  @Get('fulfillment/warehouses')
  async getWarehouseFulfillment(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getWarehouseFulfillment(query);
  }
}
