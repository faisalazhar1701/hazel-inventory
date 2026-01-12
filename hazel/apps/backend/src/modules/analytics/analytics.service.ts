import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderChannel, OrderStatus } from '@hazel/shared-types';

export interface AnalyticsFilters {
  channel?: string;
  warehouseId?: string;
  startDate?: string;
  endDate?: string;
}

export interface OmnichannelSummary {
  totalOrders: number;
  totalRevenue: number;
  ordersByChannel: Array<{
    channel: string;
    count: number;
    revenue: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
}

export interface OrdersByChannel {
  channel: string;
  orders: number;
  revenue: number;
  cancellationRate: number;
  returnRate: number;
}

export interface FulfillmentPerformance {
  averageFulfillmentTimeHours: number;
  fulfillmentRate: number;
  cancellationRate: number;
  returnRate: number;
  byChannel: Array<{
    channel: string;
    averageFulfillmentTimeHours: number;
    fulfillmentRate: number;
    cancellationRate: number;
    returnRate: number;
  }>;
}

export interface WarehouseFulfillment {
  warehouseId: string;
  warehouseName: string;
  ordersFulfilled: number;
  inventoryMovements: number;
  averageFulfillmentTimeHours: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

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
   * Get omnichannel summary
   * Aggregates orders by channel, status, and calculates revenue
   */
  async getOmnichannelSummary(filters?: AnalyticsFilters): Promise<OmnichannelSummary> {
    const where: any = this.buildDateFilter(filters?.startDate, filters?.endDate);
    
    if (filters?.channel) {
      where.channel = filters.channel;
    }

    // Get all orders matching filters
    const orders = await this.prisma.order.findMany({
      where,
      include: {
        orderItems: true,
      },
    });

    // Calculate total orders and revenue
    const totalOrders = orders.length;
    let totalRevenue = 0;

    // Try to get revenue from finance transactions first
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
    }

    // Fallback to order totals if no finance transactions
    if (totalRevenue === 0) {
      totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    }

    // Group by channel
    const channelMap = new Map<string, { count: number; revenue: number }>();
    const statusMap = new Map<string, number>();

    for (const order of orders) {
      // By channel
      const channelData = channelMap.get(order.channel) || { count: 0, revenue: 0 };
      channelData.count += 1;
      channelData.revenue += order.totalAmount;
      channelMap.set(order.channel, channelData);

      // By status
      const statusCount = statusMap.get(order.status) || 0;
      statusMap.set(order.status, statusCount + 1);
    }

    const ordersByChannel = Array.from(channelMap.entries()).map(([channel, data]) => ({
      channel,
      count: data.count,
      revenue: data.revenue,
    }));

    const ordersByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    return {
      totalOrders,
      totalRevenue,
      ordersByChannel,
      ordersByStatus,
    };
  }

  /**
   * Get orders by channel with cancellation and return rates
   */
  async getOrdersByChannel(filters?: AnalyticsFilters): Promise<OrdersByChannel[]> {
    const where: any = this.buildDateFilter(filters?.startDate, filters?.endDate);
    
    if (filters?.channel) {
      where.channel = filters.channel;
    }

    const orders = await this.prisma.order.findMany({
      where,
    });

    // Group by channel
    const channelMap = new Map<string, {
      orders: number;
      cancelled: number;
      returned: number;
      revenue: number;
    }>();

    for (const order of orders) {
      const channel = order.channel;
      const data = channelMap.get(channel) || {
        orders: 0,
        cancelled: 0,
        returned: 0,
        revenue: 0,
      };

      data.orders += 1;
      data.revenue += order.totalAmount;

      if (order.status === OrderStatus.CANCELLED) {
        data.cancelled += 1;
      }
      if (order.status === OrderStatus.RETURNED) {
        data.returned += 1;
      }

      channelMap.set(channel, data);
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

    // Map revenue from transactions
    const revenueByOrder = new Map<string, number>();
    for (const transaction of revenueTransactions) {
      const existing = revenueByOrder.get(transaction.referenceId) || 0;
      revenueByOrder.set(transaction.referenceId, existing + transaction.amount);
    }

    // Update revenue from transactions if available
    for (const order of orders) {
      const transactionRevenue = revenueByOrder.get(order.id);
      if (transactionRevenue) {
        const channelData = channelMap.get(order.channel);
        if (channelData) {
          // Replace with transaction revenue (more accurate)
          channelData.revenue = (channelData.revenue - order.totalAmount) + transactionRevenue;
        }
      }
    }

    return Array.from(channelMap.entries()).map(([channel, data]) => ({
      channel,
      orders: data.orders,
      revenue: data.revenue,
      cancellationRate: data.orders > 0 ? (data.cancelled / data.orders) * 100 : 0,
      returnRate: data.orders > 0 ? (data.returned / data.orders) * 100 : 0,
    }));
  }

  /**
   * Get fulfillment performance metrics
   */
  async getFulfillmentPerformance(filters?: AnalyticsFilters): Promise<FulfillmentPerformance> {
    const where: any = this.buildDateFilter(filters?.startDate, filters?.endDate);
    
    if (filters?.channel) {
      where.channel = filters.channel;
    }

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true,
        channel: true,
        status: true,
        confirmedAt: true,
        fulfilledAt: true,
      },
    });

    // Calculate fulfillment times
    const fulfilledOrders = orders.filter(
      o => o.status === OrderStatus.FULFILLED && o.confirmedAt && o.fulfilledAt
    );

    let totalFulfillmentTimeMs = 0;
    const fulfillmentTimesByChannel = new Map<string, number[]>();

    for (const order of fulfilledOrders) {
      if (order.confirmedAt && order.fulfilledAt) {
        const timeMs = new Date(order.fulfilledAt).getTime() - new Date(order.confirmedAt).getTime();
        totalFulfillmentTimeMs += timeMs;

        const channelTimes = fulfillmentTimesByChannel.get(order.channel) || [];
        channelTimes.push(timeMs);
        fulfillmentTimesByChannel.set(order.channel, channelTimes);
      }
    }

    const averageFulfillmentTimeHours = fulfilledOrders.length > 0
      ? (totalFulfillmentTimeMs / fulfilledOrders.length) / (1000 * 60 * 60)
      : 0;

    // Calculate rates
    const totalOrders = orders.length;
    const fulfilledCount = orders.filter(o => o.status === OrderStatus.FULFILLED).length;
    const cancelledCount = orders.filter(o => o.status === OrderStatus.CANCELLED).length;
    const returnedCount = orders.filter(o => o.status === OrderStatus.RETURNED).length;

    const fulfillmentRate = totalOrders > 0 ? (fulfilledCount / totalOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledCount / totalOrders) * 100 : 0;
    const returnRate = totalOrders > 0 ? (returnedCount / totalOrders) * 100 : 0;

    // By channel
    const byChannel: Array<{
      channel: string;
      averageFulfillmentTimeHours: number;
      fulfillmentRate: number;
      cancellationRate: number;
      returnRate: number;
    }> = [];

    const channels = Array.from(new Set(orders.map(o => o.channel)));
    for (const channel of channels) {
      const channelOrders = orders.filter(o => o.channel === channel);
      const channelFulfilled = channelOrders.filter(
        o => o.status === OrderStatus.FULFILLED && o.confirmedAt && o.fulfilledAt
      );
      const channelCancelled = channelOrders.filter(o => o.status === OrderStatus.CANCELLED);
      const channelReturned = channelOrders.filter(o => o.status === OrderStatus.RETURNED);

      let channelFulfillmentTimeMs = 0;
      for (const order of channelFulfilled) {
        if (order.confirmedAt && order.fulfilledAt) {
          channelFulfillmentTimeMs += new Date(order.fulfilledAt).getTime() - new Date(order.confirmedAt).getTime();
        }
      }

      const channelAvgTime = channelFulfilled.length > 0
        ? (channelFulfillmentTimeMs / channelFulfilled.length) / (1000 * 60 * 60)
        : 0;

      byChannel.push({
        channel,
        averageFulfillmentTimeHours: channelAvgTime,
        fulfillmentRate: channelOrders.length > 0 ? (channelFulfilled.length / channelOrders.length) * 100 : 0,
        cancellationRate: channelOrders.length > 0 ? (channelCancelled.length / channelOrders.length) * 100 : 0,
        returnRate: channelOrders.length > 0 ? (channelReturned.length / channelOrders.length) * 100 : 0,
      });
    }

    return {
      averageFulfillmentTimeHours,
      fulfillmentRate,
      cancellationRate,
      returnRate,
      byChannel,
    };
  }

  /**
   * Get warehouse fulfillment metrics
   */
  async getWarehouseFulfillment(filters?: AnalyticsFilters): Promise<WarehouseFulfillment[]> {
    const orderDateFilter = this.buildDateFilter(filters?.startDate, filters?.endDate);
    
    // Get all warehouses
    const warehouseWhere: any = {};
    if (filters?.warehouseId) {
      warehouseWhere.id = filters.warehouseId;
    }
    const warehouses = await this.prisma.warehouse.findMany({
      where: Object.keys(warehouseWhere).length > 0 ? warehouseWhere : undefined,
    });

    const results: WarehouseFulfillment[] = [];

    for (const warehouse of warehouses) {
      // Get fulfillments for this warehouse
      const fulfillmentWhere: any = {
        warehouseId: warehouse.id,
      };
      
      if (Object.keys(orderDateFilter).length > 0) {
        fulfillmentWhere.order = orderDateFilter;
      }

      const fulfillments = await this.prisma.fulfillment.findMany({
        where: fulfillmentWhere,
        include: {
          order: {
            select: {
              id: true,
              confirmedAt: true,
              fulfilledAt: true,
              status: true,
            },
          },
        },
      });

      const ordersFulfilled = fulfillments.filter(
        f => f.order.status === OrderStatus.FULFILLED
      ).length;

      // Get inventory movements for this warehouse
      const ledgerWhere: any = {
        inventoryItem: {
          warehouseId: warehouse.id,
        },
      };
      
      if (orderDateFilter.createdAt) {
        ledgerWhere.createdAt = orderDateFilter.createdAt;
      }

      const inventoryMovements = await this.prisma.inventoryLedger.count({
        where: ledgerWhere,
      });

      // Calculate average fulfillment time
      const fulfilledWithTimes = fulfillments.filter(
        f => f.order.status === OrderStatus.FULFILLED && f.order.confirmedAt && f.order.fulfilledAt
      );

      let totalTimeMs = 0;
      for (const fulfillment of fulfilledWithTimes) {
        if (fulfillment.order.confirmedAt && fulfillment.order.fulfilledAt) {
          totalTimeMs += new Date(fulfillment.order.fulfilledAt).getTime() - 
                         new Date(fulfillment.order.confirmedAt).getTime();
        }
      }

      const averageFulfillmentTimeHours = fulfilledWithTimes.length > 0
        ? (totalTimeMs / fulfilledWithTimes.length) / (1000 * 60 * 60)
        : 0;

      results.push({
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        ordersFulfilled,
        inventoryMovements,
        averageFulfillmentTimeHours,
      });
    }

    return results;
  }
}
