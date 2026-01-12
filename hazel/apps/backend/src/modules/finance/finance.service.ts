import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum ReferenceType {
  ORDER = 'ORDER',
  INVENTORY = 'INVENTORY',
}

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Initialize default chart of accounts if they don't exist
   * Called on module init or first transaction
   */
  async initializeChartOfAccounts(): Promise<void> {
    const accounts = [
      { code: 'REVENUE', name: 'Revenue', type: AccountType.REVENUE },
      { code: 'COGS', name: 'Cost of Goods Sold', type: AccountType.EXPENSE },
      { code: 'INVENTORY', name: 'Inventory Asset', type: AccountType.ASSET },
    ];

    for (const account of accounts) {
      const existing = await this.prisma.chartOfAccount.findUnique({
        where: { code: account.code },
      });

      if (!existing) {
        await this.prisma.chartOfAccount.create({
          data: account,
        });
        this.logger.log(`Created chart of account: ${account.code}`);
      }
    }
  }

  /**
   * Get account by code
   */
  async getAccountByCode(code: string) {
    const account = await this.prisma.chartOfAccount.findUnique({
      where: { code },
    });

    if (!account) {
      throw new NotFoundException(`Chart of account with code ${code} not found`);
    }

    return account;
  }

  /**
   * Create financial transaction
   */
  async createTransaction(data: {
    referenceType: ReferenceType;
    referenceId: string;
    debitAccountCode: string;
    creditAccountCode: string;
    amount: number;
    currency?: string;
  }): Promise<any> {
    const debitAccount = await this.getAccountByCode(data.debitAccountCode);
    const creditAccount = await this.getAccountByCode(data.creditAccountCode);

    if (data.amount <= 0) {
      throw new BadRequestException('Transaction amount must be greater than 0');
    }

    return this.prisma.financialTransaction.create({
      data: {
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        debitAccountId: debitAccount.id,
        creditAccountId: creditAccount.id,
        amount: data.amount,
        currency: data.currency || 'USD',
      },
      include: {
        debitAccount: true,
        creditAccount: true,
      },
    });
  }

  /**
   * Calculate estimated cost for COGS calculation
   * NOTE: This is a placeholder. Proper cost tracking needs to be added to ProductVariant or inventory ledger
   * For foundation phase, using conservative estimate (50% of unit price)
   */
  private estimateUnitCost(unitPrice: number): number {
    // TODO: Replace with actual cost from ProductVariant.cost or inventory ledger
    // Using conservative estimate: 50% of selling price
    return unitPrice * 0.5;
  }

  /**
   * Record financial transactions for order fulfillment
   * Rules:
   * - Credit Revenue (amount = order totalAmount)
   * - Debit COGS (amount = estimated cost of goods sold)
   * - Credit Inventory Asset (amount = cost of inventory reduced)
   */
  async recordOrderFulfillment(orderId: string): Promise<void> {
    try {
      // Initialize accounts if needed
      await this.initializeChartOfAccounts();

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              productVariant: true,
            },
          },
          inventoryReservations: {
            where: {
              consumedAt: { not: null },
            },
            include: {
              orderItem: true,
              inventoryItem: true,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      // Check if transactions already exist for this order
      const existingTransactions = await this.prisma.financialTransaction.findMany({
        where: {
          referenceType: ReferenceType.ORDER,
          referenceId: orderId,
        },
      });

      if (existingTransactions.length > 0) {
        this.logger.warn(
          `Financial transactions already exist for order ${orderId}. Skipping.`,
        );
        return;
      }

      // 1. Credit Revenue (amount = order totalAmount)
      //    Debit Accounts Receivable or Cash (for simplicity, using ASSET placeholder)
      //    Note: In full system, this would be Cash or AR based on payment terms
      await this.createTransaction({
        referenceType: ReferenceType.ORDER,
        referenceId: orderId,
        debitAccountCode: 'INVENTORY', // Placeholder - in full system would be Cash/AR
        creditAccountCode: 'REVENUE',
        amount: order.totalAmount,
        currency: order.currency,
      });

      // 2. Calculate total COGS and Inventory reduction
      let totalCOGS = 0;
      let totalInventoryReduction = 0;

      for (const reservation of order.inventoryReservations) {
        if (reservation.consumedAt) {
          const orderItem = reservation.orderItem;
          const unitCost = this.estimateUnitCost(orderItem.unitPrice);
          const cogsForReservation = unitCost * reservation.quantity;
          totalCOGS += cogsForReservation;
          totalInventoryReduction += cogsForReservation;
        }
      }

      // If no consumed reservations, calculate from order items (fallback)
      if (totalCOGS === 0) {
        for (const orderItem of order.orderItems) {
          const unitCost = this.estimateUnitCost(orderItem.unitPrice);
          totalCOGS += unitCost * orderItem.quantity;
          totalInventoryReduction += unitCost * orderItem.quantity;
        }
      }

      // 3. Debit COGS, Credit Inventory Asset
      if (totalCOGS > 0) {
        await this.createTransaction({
          referenceType: ReferenceType.ORDER,
          referenceId: orderId,
          debitAccountCode: 'COGS',
          creditAccountCode: 'INVENTORY',
          amount: totalCOGS,
          currency: order.currency,
        });
      }

      this.logger.log(
        `Recorded financial transactions for order ${order.orderNumber}: Revenue=${order.totalAmount}, COGS=${totalCOGS}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record financial transactions for order ${orderId}: ${error.message}`,
      );
      // Don't throw - we don't want to break order fulfillment if finance fails
      // In production, might want to use event queue or separate transaction
      // Error is logged but not thrown to allow order fulfillment to complete
    }
  }

  /**
   * Reverse financial transactions for order return
   * Reverses the fulfillment entries
   */
  async reverseOrderFulfillment(orderId: string, returnAmount: number): Promise<void> {
    try {
      await this.initializeChartOfAccounts();

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: true,
        },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      // Find original fulfillment transactions
      const originalTransactions = await this.prisma.financialTransaction.findMany({
        where: {
          referenceType: ReferenceType.ORDER,
          referenceId: orderId,
        },
        include: {
          debitAccount: true,
          creditAccount: true,
        },
      });

      if (originalTransactions.length === 0) {
        this.logger.warn(
          `No original fulfillment transactions found for order ${orderId}. Cannot reverse.`,
        );
        return;
      }

      // Reverse each transaction (swap debit and credit)
      for (const transaction of originalTransactions) {
        // Only reverse revenue and COGS transactions (not inventory adjustments from returns)
        const isRevenueTransaction = transaction.creditAccount.code === 'REVENUE';
        const isCOGSTransaction = transaction.debitAccount.code === 'COGS';

        if (isRevenueTransaction || isCOGSTransaction) {
          // Calculate proportional amount for partial returns
          let reverseAmount = transaction.amount;
          if (returnAmount < order.totalAmount) {
            // Partial return - calculate proportion
            const proportion = returnAmount / order.totalAmount;
            reverseAmount = transaction.amount * proportion;
          }

          if (reverseAmount > 0) {
            // Reverse: swap debit and credit
            await this.createTransaction({
              referenceType: ReferenceType.ORDER,
              referenceId: `${orderId}-RETURN`,
              debitAccountCode: transaction.creditAccount.code,
              creditAccountCode: transaction.debitAccount.code,
              amount: reverseAmount,
              currency: transaction.currency,
            });
          }
        }
      }

      this.logger.log(
        `Reversed financial transactions for order ${order.orderNumber} return (amount: ${returnAmount})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to reverse financial transactions for order ${orderId}: ${error.message}`,
      );
      // Don't throw - allow return to complete even if finance reversal fails
      throw error;
    }
  }

  /**
   * Get financial transactions with filters
   */
  async getTransactions(filters: {
    orderId?: string;
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any[]> {
    const where: any = {};

    if (filters.orderId) {
      where.referenceType = ReferenceType.ORDER;
      where.referenceId = filters.orderId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    let transactions = await this.prisma.financialTransaction.findMany({
      where,
      include: {
        debitAccount: true,
        creditAccount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter by customer if needed
    if (filters.customerId) {
      // Get orders for this customer
      const orders = await this.prisma.order.findMany({
        where: { customerId: filters.customerId },
        select: { id: true },
      });

      const orderIds = orders.map((o) => o.id);
      transactions = transactions.filter(
        (t) =>
          t.referenceType === ReferenceType.ORDER &&
          orderIds.includes(t.referenceId),
      );
    }

    return transactions;
  }

  /**
   * Get order financial summary
   */
  async getOrderSummary(orderId: string): Promise<{
    orderId: string;
    orderNumber: string;
    revenue: number;
    cost: number;
    margin: number;
    marginPercent: number;
    currency: string;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Get COGS transactions
    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        referenceType: ReferenceType.ORDER,
        referenceId: orderId,
        debitAccount: {
          code: 'COGS',
        },
      },
    });

    const revenue = order.totalAmount;
    const cost = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate margin
    const margin = revenue - cost;
    const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      revenue,
      cost,
      margin,
      marginPercent,
      currency: order.currency,
    };
  }

  /**
   * Get inventory valuation
   * Returns valuation by warehouse and by product variant
   */
  async getInventoryValuation(filters: {
    warehouseId?: string;
    productVariantId?: string;
  }): Promise<{
    byWarehouse: Array<{
      warehouseId: string;
      warehouseName: string;
      totalQuantity: number;
      estimatedValue: number;
      currency: string;
    }>;
    byProductVariant: Array<{
      productVariantId: string;
      productVariantSku: string;
      totalQuantity: number;
      estimatedValue: number;
      currency: string;
    }>;
    totalValue: number;
    currency: string;
  }> {
    const where: any = {};
    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }
    if (filters.productVariantId) {
      where.productVariantId = filters.productVariantId;
    }

    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where,
      include: {
        warehouse: true,
        productVariant: {
          include: {
            orderItems: {
              where: {
                order: {
                  status: 'FULFILLED',
                },
              },
              include: {
                order: {
                  select: {
                    createdAt: true,
                  },
                },
              },
              take: 10, // Get multiple and sort in code
            },
          },
        },
      },
    });

    // Group by warehouse
    const warehouseMap = new Map<string, any>();
    // Group by product variant
    const variantMap = new Map<string, any>();

    let totalValue = 0;

    for (const item of inventoryItems) {
      // Estimate unit cost from recent order prices
      let estimatedUnitCost = 0;
      if (item.productVariant.orderItems.length > 0) {
        // Sort by order createdAt descending and take the most recent
        const sortedOrderItems = [...item.productVariant.orderItems].sort(
          (a, b) => 
            new Date(b.order.createdAt).getTime() - 
            new Date(a.order.createdAt).getTime()
        );
        const recentOrderItem = sortedOrderItems[0];
        estimatedUnitCost = this.estimateUnitCost(recentOrderItem.unitPrice);
      }

      const itemValue = estimatedUnitCost * item.quantity;
      totalValue += itemValue;

      // By warehouse
      const warehouseKey = item.warehouseId;
      const warehouseData = warehouseMap.get(warehouseKey) || {
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse.name,
        totalQuantity: 0,
        estimatedValue: 0,
        currency: 'USD',
      };
      warehouseData.totalQuantity += item.quantity;
      warehouseData.estimatedValue += itemValue;
      warehouseMap.set(warehouseKey, warehouseData);

      // By product variant
      const variantKey = item.productVariantId;
      const variantData = variantMap.get(variantKey) || {
        productVariantId: item.productVariantId,
        productVariantSku: item.productVariant.sku,
        totalQuantity: 0,
        estimatedValue: 0,
        currency: 'USD',
      };
      variantData.totalQuantity += item.quantity;
      variantData.estimatedValue += itemValue;
      variantMap.set(variantKey, variantData);
    }

    return {
      byWarehouse: Array.from(warehouseMap.values()),
      byProductVariant: Array.from(variantMap.values()),
      totalValue,
      currency: 'USD',
    };
  }
}