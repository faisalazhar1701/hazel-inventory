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
   * Aggregates high-level KPIs across all modules
   */
  async getExecutiveDashboard(filters?: DashboardFilters): Promise<ExecutiveDashboard> {
    const dateFilter = this.buildDateFilter(filters?.startDate, filters?.endDate);
    
    const orderWhere: any = { ...dateFilter };
    if (filters?.channel) {
      orderWhere.channel = filters.channel;
    }

    // Get total orders
    const totalOrders = await this.prisma.order.count({
      where: orderWhere,
    });

    // Get total revenue from finance transactions or orders
    let totalRevenue = 0;
    const orders = await this.prisma.order.findMany({
      where: orderWhere,
      select: { id: true, totalAmount: true, currency: true },
    });

    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const revenueTransactions = await this.prisma.financialTransaction.findMany({
        where: {
          referenceType: 'ORDER',
          referenceId: { in: orderIds },
          creditAccount: {
            code: 'REVENUE',
          },
        },
      });

      totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Fallback to order totals if no finance transactions
      if (totalRevenue === 0) {
        totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      }
    }

    // Get gross margin from finance transactions
    let totalCOGS = 0;
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const cogsTransactions = await this.prisma.financialTransaction.findMany({
        where: {
          referenceType: 'ORDER',
          referenceId: { in: orderIds },
          debitAccount: {
            code: 'COGS',
          },
        },
      });
      totalCOGS = cogsTransactions.reduce((sum, t) => sum + t.amount, 0);
    }

    const grossMargin = totalRevenue - totalCOGS;
    const grossMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

    // Get active customers
    const customerWhere: any = { status: 'ACTIVE' };
    if (filters?.startDate || filters?.endDate) {
      customerWhere.createdAt = dateFilter.createdAt;
    }
    const activeCustomers = await this.prisma.customer.count({
      where: customerWhere,
    });

    // Get inventory value
    const inventoryValuation = await this.financeService.getInventoryValuation({
      warehouseId: filters?.warehouseId,
    });
    const inventoryValue = inventoryValuation.totalValue;

    // Get fulfillment rate
    const fulfilledOrders = await this.prisma.order.count({
      where: {
        ...orderWhere,
        status: OrderStatus.FULFILLED,
      },
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
  }

  /**
   * Get Sales Dashboard
   * Sales and CRM metrics
   */
  async getSalesDashboard(filters?: DashboardFilters): Promise<SalesDashboard> {
    const dateFilter = this.buildDateFilter(filters?.startDate, filters?.endDate);
    
    const orderWhere: any = { ...dateFilter };
    if (filters?.channel) {
      orderWhere.channel = filters.channel;
    }

    // Get orders by channel using analytics service
    const ordersByChannel = await this.analyticsService.getOrdersByChannel({
      channel: filters?.channel,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    });

    // Calculate revenue by channel
    const revenueByChannel = ordersByChannel.map(item => ({
      channel: item.channel,
      revenue: item.revenue,
      percentage: 0, // Will calculate after total
    }));

    const totalRevenue = revenueByChannel.reduce((sum, item) => sum + item.revenue, 0);
    revenueByChannel.forEach(item => {
      item.percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
    });

    // Get top customers by revenue
    const orders = await this.prisma.order.findMany({
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

    // Calculate customer revenue
    const customerRevenueMap = new Map<string, { companyName: string; revenue: number; orderCount: number }>();
    
    for (const order of orders) {
      if (order.customerId && order.customer) {
        const existing = customerRevenueMap.get(order.customerId) || {
          companyName: order.customer.companyName,
          revenue: 0,
          orderCount: 0,
        };
        existing.revenue += order.totalAmount;
        existing.orderCount += 1;
        customerRevenueMap.set(order.customerId, existing);
      }
    }

    // Try to get revenue from finance transactions
    const orderIds = orders.map(o => o.id);
    const revenueTransactions = await this.prisma.financialTransaction.findMany({
      where: {
        referenceType: 'ORDER',
        referenceId: { in: orderIds },
        creditAccount: {
          code: 'REVENUE',
        },
      },
    });

    const revenueByOrder = new Map<string, number>();
    for (const transaction of revenueTransactions) {
      const existing = revenueByOrder.get(transaction.referenceId) || 0;
      revenueByOrder.set(transaction.referenceId, existing + transaction.amount);
    }

    // Update customer revenue with transaction data if available
    for (const order of orders) {
      if (order.customerId) {
        const transactionRevenue = revenueByOrder.get(order.id);
        if (transactionRevenue) {
          const customerData = customerRevenueMap.get(order.customerId);
          if (customerData) {
            customerData.revenue = (customerData.revenue - order.totalAmount) + transactionRevenue;
          }
        }
      }
    }

    const topCustomers = Array.from(customerRevenueMap.entries())
      .map(([customerId, data]) => ({
        customerId,
        companyName: data.companyName,
        revenue: data.revenue,
        orderCount: data.orderCount,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10

    // Calculate order conversion rate (confirmed / total)
    const totalOrders = await this.prisma.order.count({
      where: orderWhere,
    });
    const confirmedOrders = await this.prisma.order.count({
      where: {
        ...orderWhere,
        status: { in: [OrderStatus.CONFIRMED, OrderStatus.ALLOCATED, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.FULFILLED] },
      },
    });
    const orderConversionRate = totalOrders > 0 ? (confirmedOrders / totalOrders) * 100 : 0;

    const currency = orders.length > 0 ? orders[0].currency : 'USD';

    return {
      ordersByChannel: ordersByChannel.map(item => ({
        channel: item.channel,
        orders: item.orders,
        revenue: item.revenue,
      })),
      revenueByChannel,
      topCustomers,
      orderConversionRate,
      totalOrders,
      totalRevenue,
      currency,
    };
  }

  /**
   * Get Inventory Dashboard
   * Inventory and warehouse metrics
   */
  async getInventoryDashboard(filters?: DashboardFilters): Promise<InventoryDashboard> {
    // Get inventory valuation
    const inventoryValuation = await this.financeService.getInventoryValuation({
      warehouseId: filters?.warehouseId,
    });
    const inventoryValue = inventoryValuation.totalValue;

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
    const warehouseValuations = inventoryValuation.byWarehouse;
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
      currency: inventoryValuation.currency,
    };
  }

  /**
   * Get Operations Dashboard
   * Fulfillment and operations metrics
   */
  async getOperationsDashboard(filters?: DashboardFilters): Promise<OperationsDashboard> {
    // Use analytics service for fulfillment performance
    const fulfillmentPerformance = await this.analyticsService.getFulfillmentPerformance({
      channel: filters?.channel,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    });

    // Get warehouse performance
    const warehousePerformance = await this.analyticsService.getWarehouseFulfillment({
      warehouseId: filters?.warehouseId,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    });

    return {
      averageFulfillmentTimeHours: fulfillmentPerformance.averageFulfillmentTimeHours,
      fulfillmentRate: fulfillmentPerformance.fulfillmentRate,
      cancellationRate: fulfillmentPerformance.cancellationRate,
      returnRate: fulfillmentPerformance.returnRate,
      fulfillmentByChannel: fulfillmentPerformance.byChannel,
      warehousePerformance: warehousePerformance.map(item => ({
        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName,
        ordersFulfilled: item.ordersFulfilled,
        inventoryMovements: item.inventoryMovements,
        averageFulfillmentTimeHours: item.averageFulfillmentTimeHours,
      })),
    };
  }
}
