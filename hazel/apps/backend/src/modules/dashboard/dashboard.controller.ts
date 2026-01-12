import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService, DashboardFilters } from './dashboard.service';
import { IsOptional, IsString } from 'class-validator';

export class DashboardQueryDto implements DashboardFilters {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;
}

@Controller('dashboards')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboards/executive
   * Get executive-level dashboard with high-level KPIs
   */
  @Get('executive')
  async getExecutiveDashboard(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getExecutiveDashboard(query);
  }

  /**
   * GET /dashboards/sales
   * Get sales and CRM dashboard
   */
  @Get('sales')
  async getSalesDashboard(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getSalesDashboard(query);
  }

  /**
   * GET /dashboards/inventory
   * Get inventory dashboard
   */
  @Get('inventory')
  async getInventoryDashboard(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getInventoryDashboard(query);
  }

  /**
   * GET /dashboards/operations
   * Get operations and fulfillment dashboard
   */
  @Get('operations')
  async getOperationsDashboard(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getOperationsDashboard(query);
  }
}
