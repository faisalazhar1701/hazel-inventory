import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { FinanceService } from '../finance/finance.service';
import { OrderStatus } from '@hazel/shared-types';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  channel?: string;
  warehouseId?: string;
}

export interface ExecutiveDashboard {
  totalRevenue: number;
  grossMarginPercent: number;
  totalOrders: number;
  activeCustomers: number;
  inventoryValue: number;
  orderFulfillmentRate: number;
  currency: string;
}

export interface SalesDashboard {
  ordersByChannel: Array<{
    channel: string;
    orders: number;
    revenue: number;
  }>;
  revenueByChannel: Array<{
    channel: string;
    revenue: number;
    percentage: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    companyName: string;
    revenue: number;
    orderCount: number;
  }>;
  orderConversionRate: number;
  totalOrders: number;
  totalRevenue: number;
  currency: string;
}

export interface InventoryDashboard {
  inventoryValue: number;
  lowStockVariantsCount: number;
  stockTurnover: number;
  warehousesWithHighestMovement: Array<{
    warehouseId: string;
    warehouseName: string;
    inventoryMovements: number;
    inventoryValue: number;
  }>;
  currency: string;
}

export interface OperationsDashboard {
  averageFulfillmentTimeHours: number;
  fulfillmentRate: number;
  cancellationRate: number;
  returnRate: number;
  fulfillmentByChannel: Array<{
    channel: string;
    averageFulfillmentTimeHours: number;
    fulfillmentRate: number;
    cancellationRate: number;
    returnRate: number;
  }>;
  warehousePerformance: Array<{
    warehouseId: string;
    warehouseName: string;
    ordersFulfilled: number;
    inventoryMovements: number;
    averageFulfillmentTimeHours: number;
  }>;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
    private financeService: FinanceService,
  ) {}

  /**
   * Build date filter for Prisma queries
   */
  private buildDateFilter(startDate?: string, endDate?: string): any {
    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.lte = new Date(endDate);
      }
    }
    return filter;
  }

  /**
   * Get Executive Dashboard
   * Aggregates high-level KPIs across all modules. Never throws — returns safe defaults on error.
   */
  async getExecutiveDashboard(filters?: DashboardFilters): Promise<ExecutiveDashboard> {
    const safe: ExecutiveDashboard = {
      totalRevenue: 0,
      grossMarginPercent: 0,
      totalOrders: 0,
      activeCustomers: 0,
      inventoryValue: 0,
      orderFulfillmentRate: 0,
      currency: 'USD',
    };
    try {
      const dateFilter = this.buildDateFilter(filters?.startDate, filters?.endDate);
      const orderWhere: any = { ...dateFilter };
      if (filters?.channel) orderWhere.channel = filters.channel;

      const totalOrders = await this.prisma.order.count({ where: orderWhere });
      const orders = await this.prisma.order.findMany({
        where: orderWhere,
        select: { id: true, totalAmount: true, currency: true },
      });

      let totalRevenue = 0;
      if (orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const revenueTransactions = await this.prisma.financialTransaction.findMany({
          where: {
            referenceType: 'ORDER',
            referenceId: { in: orderIds },
            creditAccount: { code: 'REVENUE' },
          },
        });
        totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
        if (totalRevenue === 0) totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      }

      let totalCOGS = 0;
      if (orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const cogsTransactions = await this.prisma.financialTransaction.findMany({
          where: {
            referenceType: 'ORDER',
            referenceId: { in: orderIds },
            debitAccount: { code: 'COGS' },
          },
        });
        totalCOGS = cogsTransactions.reduce((sum, t) => sum + t.amount, 0);
      }
      const grossMarginPercent = totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0;

      const customerWhere: any = { status: 'ACTIVE' };
      if (filters?.startDate || filters?.endDate) customerWhere.createdAt = dateFilter.createdAt;
      const activeCustomers = await this.prisma.customer.count({ where: customerWhere });

      let inventoryValue = 0;
      try {
        const inventoryValuation = await this.financeService.getInventoryValuation({
          warehouseId: filters?.warehouseId,
        });
        inventoryValue = inventoryValuation?.totalValue ?? 0;
      } catch {
        inventoryValue = 0;
      }

      const fulfilledOrders = await this.prisma.order.count({
        where: { ...orderWhere, status: OrderStatus.FULFILLED },
      });
      const orderFulfillmentRate = totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 0;
      const currency = orders.length > 0 ? orders[0].currency : 'USD';

      return {
        totalRevenue,
        grossMarginPercent,
        totalOrders,
        activeCustomers,
        inventoryValue,
        orderFulfillmentRate,
        currency,
      };
    } catch (err) {
      this.logger.warn(`getExecutiveDashboard error: ${err instanceof Error ? err.message : err}`);
      return safe;
    }
  }

  /**
   * Get Sales Dashboard
   * Sales and CRM metrics
   */
  async getSalesDashboard(filters?: DashboardFilters): Promise<SalesDashboard> {
    try {
      const dateFilter = this.buildDateFilter(filters?.startDate, filters?.endDate);
      
      const orderWhere: any = { ...dateFilter };
      if (filters?.channel) {
        orderWhere.channel = filters.channel;
      }

      // Get orders by channel using analytics service - safe default if fails
      let ordersByChannel: Array<{ channel: string; orders: number; revenue: number }> = [];
      try {
        const channelData = await this.analyticsService.getOrdersByChannel({
          channel: filters?.channel,
          startDate: filters?.startDate,
          endDate: filters?.endDate,
        });
        ordersByChannel = channelData.map(item => ({
          channel: item.channel,
          orders: item.orders,
          revenue: item.revenue,
        }));
      } catch (error) {
        this.logger.warn(`Failed to get orders by channel: ${error.message}`);
        ordersByChannel = [];
      }

      // Calculate revenue by channel - safe defaults
      const revenueByChannel = ordersByChannel.map(item => ({
        channel: item.channel,
        revenue: item.revenue || 0,
        percentage: 0, // Will calculate after total
      }));

      const totalRevenue = revenueByChannel.reduce((sum, item) => sum + (item.revenue || 0), 0);
      revenueByChannel.forEach(item => {
        item.percentage = totalRevenue > 0 ? ((item.revenue || 0) / totalRevenue) * 100 : 0;
      });

      // Get top customers by revenue - safe default if fails
      let orders: any[] = [];
      try {
        orders = await this.prisma.order.findMany({
          where: {
            ...orderWhere,
            customerId: { not: null },
          },
          include: {
            customer: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        });
      } catch (error) {
        this.logger.warn(`Failed to get orders: ${error.message}`);
        orders = [];
      }

      // Calculate customer revenue - safe defaults
      const customerRevenueMap = new Map<string, { companyName: string; revenue: number; orderCount: number }>();
      
      for (const order of orders) {
        if (order.customerId && order.customer) {
          const existing = customerRevenueMap.get(order.customerId) || {
            companyName: order.customer.companyName || 'Unknown',
            revenue: 0,
            orderCount: 0,
          };
          existing.revenue += order.totalAmount || 0;
          existing.orderCount += 1;
          customerRevenueMap.set(order.customerId, existing);
        }
      }

      // Try to get revenue from finance transactions - safe default if fails
      let revenueTransactions: any[] = [];
      try {
        const orderIds = orders.map(o => o.id).filter(Boolean);
        if (orderIds.length > 0) {
          revenueTransactions = await this.prisma.financialTransaction.findMany({
            where: {
              referenceType: 'ORDER',
              referenceId: { in: orderIds },
              creditAccount: {
                code: 'REVENUE',
              },
            },
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to get finance transactions: ${error.message}`);
        revenueTransactions = [];
      }

      const revenueByOrder = new Map<string, number>();
      for (const transaction of revenueTransactions) {
        if (transaction.referenceId && transaction.amount) {
          const existing = revenueByOrder.get(transaction.referenceId) || 0;
          revenueByOrder.set(transaction.referenceId, existing + transaction.amount);
        }
      }

      // Update customer revenue with transaction data if available
      for (const order of orders) {
        if (order.customerId) {
          const transactionRevenue = revenueByOrder.get(order.id);
          if (transactionRevenue) {
            const customerData = customerRevenueMap.get(order.customerId);
            if (customerData) {
              customerData.revenue = (customerData.revenue - (order.totalAmount || 0)) + transactionRevenue;
            }
          }
        }
      }

      const topCustomers = Array.from(customerRevenueMap.entries())
        .map(([customerId, data]) => ({
          customerId,
          companyName: data.companyName || 'Unknown',
          revenue: data.revenue || 0,
          orderCount: data.orderCount || 0,
        }))
        .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
        .slice(0, 10); // Top 10

      // Calculate order conversion rate (confirmed / total) - safe defaults
      let totalOrders = 0;
      let confirmedOrders = 0;
      try {
        totalOrders = await this.prisma.order.count({
          where: orderWhere,
        });
        confirmedOrders = await this.prisma.order.count({
          where: {
            ...orderWhere,
            status: { in: [OrderStatus.CONFIRMED, OrderStatus.ALLOCATED, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.FULFILLED] },
          },
        });
      } catch (error) {
        this.logger.warn(`Failed to count orders: ${error.message}`);
        totalOrders = 0;
        confirmedOrders = 0;
      }
      const orderConversionRate = totalOrders > 0 ? (confirmedOrders / totalOrders) * 100 : 0;

      // Safe currency default
      const currency = orders.length > 0 && orders[0].currency ? orders[0].currency : 'USD';

      return {
        ordersByChannel,
        revenueByChannel,
        topCustomers,
        orderConversionRate,
        totalOrders,
        totalRevenue: totalRevenue || 0,
        currency,
      };
    } catch (error) {
      this.logger.error(`Error in getSalesDashboard: ${error.message}`);
      // Return safe defaults on any error
      return {
        ordersByChannel: [],
        revenueByChannel: [],
        topCustomers: [],
        orderConversionRate: 0,
        totalOrders: 0,
        totalRevenue: 0,
        currency: 'USD',
      };
    }
  }

  /**
   * Get Inventory Dashboard
   * Inventory and warehouse metrics. Never throws — returns safe defaults on error.
   */
  async getInventoryDashboard(filters?: DashboardFilters): Promise<InventoryDashboard> {
    const safe: InventoryDashboard = {
      inventoryValue: 0,
      lowStockVariantsCount: 0,
      stockTurnover: 0,
      warehousesWithHighestMovement: [],
      currency: 'USD',
    };
    try {
      // Get inventory valuation
      const inventoryValuation = await this.financeService.getInventoryValuation({
        warehouseId: filters?.warehouseId,
      });
      const inventoryValue = inventoryValuation?.totalValue ?? 0;

    // Get low stock variants (quantity < 10)
    const lowStockCount = await this.prisma.inventoryItem.count({
      where: {
        quantity: { lt: 10 },
        warehouseId: filters?.warehouseId || undefined,
      },
    });

    // Calculate stock turnover (based on fulfilled orders)
    const dateFilter = this.buildDateFilter(filters?.startDate, filters?.endDate);
    const fulfilledOrders = await this.prisma.order.findMany({
      where: {
        ...dateFilter,
        status: OrderStatus.FULFILLED,
      },
      include: {
        orderItems: true,
      },
    });

    let totalUnitsSold = 0;
    for (const order of fulfilledOrders) {
      totalUnitsSold += order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Get average inventory (simplified: current inventory value / average unit cost)
    // For stock turnover, we'll use a simple ratio
    const stockTurnover = inventoryValue > 0 ? (totalUnitsSold / inventoryValue) * 100 : 0;

    // Get warehouses with highest movement
    const ledgerWhere: any = {};
    if (filters?.warehouseId) {
      ledgerWhere.inventoryItem = {
        warehouseId: filters.warehouseId,
      };
    }
    if (dateFilter.createdAt) {
      ledgerWhere.createdAt = dateFilter.createdAt;
    }

    const allLedgerEntries = await this.prisma.inventoryLedger.findMany({
      where: ledgerWhere,
      include: {
        inventoryItem: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    // Group by warehouse
    const warehouseMap = new Map<string, { name: string; movements: number; value: number }>();
    
    for (const entry of allLedgerEntries) {
      const warehouseId = entry.inventoryItem.warehouseId;
      const existing = warehouseMap.get(warehouseId) || {
        name: entry.inventoryItem.warehouse.name,
        movements: 0,
        value: 0,
      };
      existing.movements += 1;
      warehouseMap.set(warehouseId, existing);
    }

    // Get inventory values per warehouse
    const warehouseValuations = inventoryValuation?.byWarehouse ?? [];
    for (const valuation of warehouseValuations) {
      const existing = warehouseMap.get(valuation.warehouseId);
      if (existing) {
        existing.value = valuation.estimatedValue;
      }
    }

    const warehousesWithHighestMovement = Array.from(warehouseMap.entries())
      .map(([warehouseId, data]) => ({
        warehouseId,
        warehouseName: data.name,
        inventoryMovements: data.movements,
        inventoryValue: data.value,
      }))
      .sort((a, b) => b.inventoryMovements - a.inventoryMovements)
      .slice(0, 10); // Top 10

      return {
        inventoryValue,
        lowStockVariantsCount: lowStockCount,
        stockTurnover,
        warehousesWithHighestMovement,
        currency: inventoryValuation?.currency ?? 'USD',
      };
    } catch (err) {
      this.logger.warn(`getInventoryDashboard error: ${err instanceof Error ? err.message : err}`);
      return safe;
    }
  }

  /**
   * Get Operations Dashboard
   * Fulfillment and operations metrics. Never throws — returns safe defaults on error.
   */
  async getOperationsDashboard(filters?: DashboardFilters): Promise<OperationsDashboard> {
    const safe: OperationsDashboard = {
      averageFulfillmentTimeHours: 0,
      fulfillmentRate: 0,
      cancellationRate: 0,
      returnRate: 0,
      fulfillmentByChannel: [],
      warehousePerformance: [],
    };
    try {
      const fulfillmentPerformance = await this.analyticsService.getFulfillmentPerformance({
        channel: filters?.channel,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      });
      const warehousePerformance = await this.analyticsService.getWarehouseFulfillment({
        warehouseId: filters?.warehouseId,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      });
      return {
        averageFulfillmentTimeHours: fulfillmentPerformance?.averageFulfillmentTimeHours ?? 0,
        fulfillmentRate: fulfillmentPerformance?.fulfillmentRate ?? 0,
        cancellationRate: fulfillmentPerformance?.cancellationRate ?? 0,
        returnRate: fulfillmentPerformance?.returnRate ?? 0,
        fulfillmentByChannel: fulfillmentPerformance?.byChannel ?? [],
        warehousePerformance: (warehousePerformance ?? []).map(item => ({
          warehouseId: item.warehouseId,
          warehouseName: item.warehouseName,
          ordersFulfilled: item.ordersFulfilled,
          inventoryMovements: item.inventoryMovements,
          averageFulfillmentTimeHours: item.averageFulfillmentTimeHours,
        })),
      };
    } catch (err) {
      this.logger.warn(`getOperationsDashboard error: ${err instanceof Error ? err.message : err}`);
      return safe;
    }
  }
}
