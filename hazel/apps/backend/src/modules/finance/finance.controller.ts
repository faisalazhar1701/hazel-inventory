import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  /**
   * GET /finance/transactions
   * Get financial transactions with optional filters
   * Filters: orderId, customerId, startDate, endDate
   */
  @Get('transactions')
  async getTransactions(
    @Query('orderId') orderId?: string,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    let startDateObj: Date | undefined;
    let endDateObj: Date | undefined;

    if (startDate) {
      startDateObj = new Date(startDate);
      if (isNaN(startDateObj.getTime())) {
        throw new BadRequestException('Invalid startDate format. Use ISO 8601 format.');
      }
    }

    if (endDate) {
      endDateObj = new Date(endDate);
      if (isNaN(endDateObj.getTime())) {
        throw new BadRequestException('Invalid endDate format. Use ISO 8601 format.');
      }
    }

    return this.financeService.getTransactions({
      orderId,
      customerId,
      startDate: startDateObj,
      endDate: endDateObj,
    });
  }

  /**
   * GET /finance/orders/:orderId/summary
   * Get financial summary for a specific order
   * Returns: revenue, cost, margin, marginPercent
   */
  @Get('orders/:orderId/summary')
  async getOrderSummary(@Param('orderId') orderId: string) {
    return this.financeService.getOrderSummary(orderId);
  }

  /**
   * GET /finance/inventory-valuation
   * Get inventory valuation
   * Filters: warehouseId, productVariantId
   * Returns: byWarehouse, byProductVariant, totalValue
   */
  @Get('inventory-valuation')
  async getInventoryValuation(
    @Query('warehouseId') warehouseId?: string,
    @Query('productVariantId') productVariantId?: string,
  ) {
    return this.financeService.getInventoryValuation({
      warehouseId,
      productVariantId,
    });
  }
}