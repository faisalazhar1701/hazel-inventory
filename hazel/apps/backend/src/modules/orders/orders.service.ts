import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  Order,
  OrderItem,
  ProductVariant,
} from '@prisma/client';
import { OrderChannel, OrderStatus, InventoryItemType } from '@hazel/shared-types';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  Min,
  IsEnum,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderChannel as OrderChannelEnum } from '@hazel/shared-types';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productVariantId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;
}

export class CreateOrderDto {
  @IsEnum(OrderChannelEnum)
  channel: OrderChannelEnum;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class ReturnOrderItemDto {
  @IsString()
  @IsNotEmpty()
  orderItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ReturnOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnOrderItemDto)
  items: ReturnOrderItemDto[];
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  private async generateUniqueOrderNumber(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const orderNumber = `ORD-${timestamp}-${random}`;

      // Check if order number already exists (across all channels)
      const existingOrder = await this.prisma.order.findUnique({
        where: { orderNumber },
      });

      if (!existingOrder) {
        this.logger.debug(`Generated unique order number: ${orderNumber}`);
        return orderNumber;
      }

      attempts++;
      this.logger.warn(
        `Order number collision detected: ${orderNumber}. Attempt ${attempts}/${maxAttempts}`,
      );
    }

    throw new BadRequestException(
      'Failed to generate unique order number after multiple attempts',
    );
  }

  private validateChannel(channel: OrderChannelEnum): void {
    const validChannels = ['DTC', 'B2B', 'POS', 'WHOLESALE'];
    if (!validChannels.includes(channel)) {
      this.logger.error(`Invalid channel provided: ${channel}`);
      throw new BadRequestException(
        `Invalid channel: ${channel}. Must be one of: ${validChannels.join(', ')}`,
      );
    }
    this.logger.debug(`Channel validated: ${channel}`);
  }

  async createOrder(data: CreateOrderDto): Promise<Order & { orderItems: OrderItem[] }> {
    // Validate all product variants exist
    const variantIds = data.items.map((item) => item.productVariantId);
    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
      },
    });

    if (variants.length !== variantIds.length) {
      throw new NotFoundException('One or more product variants not found');
    }

    // Calculate total amount
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    // Generate unique order number (check for duplicates across all channels)
    const orderNumber = await this.generateUniqueOrderNumber();

    // Create order with items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          channel: data.channel as OrderChannel,
          status: OrderStatus.DRAFT,
          totalAmount,
          currency: data.currency,
        },
      });

      this.logger.log(
        `Order created: ${orderNumber} (Channel: ${data.channel}, ID: ${createdOrder.id})`,
      );

      const orderItems = await Promise.all(
        data.items.map((item) =>
          tx.orderItem.create({
            data: {
              orderId: createdOrder.id,
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
            },
          }),
        ),
      );

      this.logger.debug(
        `Created ${orderItems.length} order items for order ${orderNumber}`,
      );

      return { ...createdOrder, orderItems };
    });

    this.logger.log(
      `Order creation completed: ${order.orderNumber} (Channel: ${data.channel})`,
    );
    return order;
  }

  async listOrders(): Promise<Order[]> {
    return this.prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrderById(id: string): Promise<Order & { orderItems: (OrderItem & { productVariant: ProductVariant })[] }> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            productVariant: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async confirmOrder(id: string): Promise<Order> {
    this.logger.log(`Confirming order: ${id}`);

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      this.logger.error(`Order not found: ${id}`);
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.logger.debug(
      `Order found: ${order.orderNumber} (Channel: ${order.channel}, Status: ${order.status})`,
    );

    if (order.status !== OrderStatus.DRAFT) {
      this.logger.warn(
        `Cannot confirm order ${order.orderNumber}: Invalid status ${order.status}`,
      );
      throw new BadRequestException(
        `Cannot confirm order with status ${order.status}. Only DRAFT orders can be confirmed.`,
      );
    }

    // Track allocation results per order item
    interface ItemAllocationResult {
      orderItemId: string;
      requestedQuantity: number;
      allocatedQuantity: number;
      isFullyAllocated: boolean;
    }

    const allocationResults: ItemAllocationResult[] = [];

    // Allocate inventory per order item - support partial allocation
    for (const item of order.orderItems) {
      let remainingQuantity = item.quantity;
      let allocatedQuantity = 0;

      // Get all inventory items for this product variant with available stock
      const inventoryItems = await this.prisma.inventoryItem.findMany({
        where: {
          productVariantId: item.productVariantId,
          quantity: { gt: 0 },
        },
        orderBy: {
          quantity: 'desc',
        },
      });

      // Allocate from warehouses - support partial allocation
      for (const invItem of inventoryItems) {
        if (remainingQuantity <= 0) break;

        // Deduct what's available (partial allocation supported)
        const deductQuantity = Math.min(remainingQuantity, invItem.quantity);

        try {
          // Deduct inventory - this will automatically log to InventoryLedger
          // Inventory updates are consistent across all channels
          this.logger.debug(
            `Allocating inventory for order ${order.orderNumber} (Channel: ${order.channel}): ` +
              `ProductVariant ${item.productVariantId}, Warehouse ${invItem.warehouseId}, Quantity ${deductQuantity}`,
          );

          await this.inventoryService.deductInventory({
            productVariantId: item.productVariantId,
            warehouseId: invItem.warehouseId,
            quantity: deductQuantity,
            reason: `Order ${order.orderNumber} (${order.channel}) confirmation - Item allocation`,
          });

          this.logger.debug(
            `Inventory allocated successfully: ${deductQuantity} units from warehouse ${invItem.warehouseId}`,
          );

          allocatedQuantity += deductQuantity;
          remainingQuantity -= deductQuantity;
        } catch (error) {
          // If deduction fails, log but continue with other warehouses
          // This allows partial allocation even if one warehouse fails
          this.logger.error(
            `Failed to allocate inventory from warehouse ${invItem.warehouseId} for order ${order.orderNumber}: ` +
              `${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          // Continue to next warehouse
        }
      }

      // Track allocation result for this item
      allocationResults.push({
        orderItemId: item.id,
        requestedQuantity: item.quantity,
        allocatedQuantity,
        isFullyAllocated: remainingQuantity === 0,
      });
    }

    // Determine order status based on allocation results
    const allItemsFullyAllocated = allocationResults.every(
      (result) => result.isFullyAllocated,
    );
    const anyItemAllocated = allocationResults.some(
      (result) => result.allocatedQuantity > 0,
    );

    let newStatus: OrderStatus;

    if (!anyItemAllocated) {
      // No items were allocated - reject confirmation
      throw new BadRequestException(
        `Could not allocate inventory for any items in order ${order.orderNumber}. Order remains in DRAFT status.`,
      );
    } else if (allItemsFullyAllocated) {
      // All items fully allocated
      newStatus = OrderStatus.FULFILLED;
    } else {
      // Some items partially allocated
      newStatus = OrderStatus.PARTIALLY_FULFILLED;
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: newStatus,
      },
    });

    return updatedOrder;
  }

  async cancelOrder(id: string): Promise<Order> {
    this.logger.log(`Cancelling order: ${id}`);

    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      this.logger.error(`Order not found for cancellation: ${id}`);
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.logger.debug(
      `Order found for cancellation: ${order.orderNumber} (Channel: ${order.channel}, Status: ${order.status})`,
    );

    if (order.status === OrderStatus.CANCELLED) {
      this.logger.warn(
        `Attempted to cancel already cancelled order: ${order.orderNumber}`,
      );
      throw new BadRequestException('Order is already cancelled');
    }

    if (order.status === OrderStatus.FULFILLED) {
      this.logger.warn(
        `Attempted to cancel fulfilled order: ${order.orderNumber} (Channel: ${order.channel})`,
      );
      throw new BadRequestException('Cannot cancel a fulfilled order');
    }

    // Update order status to CANCELLED
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });

    this.logger.log(
      `Order cancelled: ${order.orderNumber} (Channel: ${order.channel})`,
    );

    // If order was confirmed, we might want to restore inventory
    // For now, we'll just cancel the order
    // TODO: Consider restoring inventory if order was confirmed but not fulfilled

    return updatedOrder;
  }

  async returnOrder(id: string, returnData: ReturnOrderDto): Promise<Order> {
    this.logger.log(`Processing return for order: ${id}`);

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            productVariant: true,
          },
        },
      },
    });

    if (!order) {
      this.logger.error(`Order not found for return: ${id}`);
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    this.logger.debug(
      `Order found for return: ${order.orderNumber} (Channel: ${order.channel}, Status: ${order.status})`,
    );

    // Validate order can be returned
    if (order.status === OrderStatus.DRAFT) {
      this.logger.warn(
        `Attempted to return draft order: ${order.orderNumber} (Channel: ${order.channel})`,
      );
      throw new BadRequestException('Cannot return a draft order');
    }

    if (order.status === OrderStatus.CANCELLED) {
      this.logger.warn(
        `Attempted to return cancelled order: ${order.orderNumber} (Channel: ${order.channel})`,
      );
      throw new BadRequestException('Cannot return a cancelled order');
    }

    if (order.status === OrderStatus.RETURNED) {
      this.logger.warn(
        `Attempted to return already returned order: ${order.orderNumber} (Channel: ${order.channel})`,
      );
      throw new BadRequestException('Order is already returned');
    }

    // Validate return items
    const orderItemMap = new Map(
      order.orderItems.map((item) => [item.id, item]),
    );

    // Track return quantities per order item
    const returnQuantities = new Map<string, number>();

    for (const returnItem of returnData.items) {
      const orderItem = orderItemMap.get(returnItem.orderItemId);

      if (!orderItem) {
        throw new NotFoundException(
          `Order item with ID ${returnItem.orderItemId} not found in order`,
        );
      }

      // Check if return quantity is valid
      const previousReturnQty = returnQuantities.get(returnItem.orderItemId) || 0;
      const totalReturnQty = previousReturnQty + returnItem.quantity;

      if (totalReturnQty > orderItem.quantity) {
        throw new BadRequestException(
          `Return quantity (${totalReturnQty}) exceeds order quantity (${orderItem.quantity}) for order item ${returnItem.orderItemId}`,
        );
      }

      returnQuantities.set(
        returnItem.orderItemId,
        totalReturnQty,
      );
    }

    // Restore inventory for each return item
    for (const returnItem of returnData.items) {
      const orderItem = orderItemMap.get(returnItem.orderItemId);

      if (!orderItem) {
        continue; // Already validated above
      }

      // Get the itemType from existing inventory (check return warehouse first, then any warehouse)
      // For returns, we assume returned items are finished goods if no inventory exists
      let existingInventory = await this.prisma.inventoryItem.findFirst({
        where: {
          productVariantId: orderItem.productVariantId,
          warehouseId: returnItem.warehouseId,
        },
      });

      // If not found in return warehouse, check any warehouse for this product variant
      if (!existingInventory) {
        existingInventory = await this.prisma.inventoryItem.findFirst({
          where: {
            productVariantId: orderItem.productVariantId,
          },
        });
      }

      const itemType = existingInventory
        ? (existingInventory.itemType as InventoryItemType)
        : InventoryItemType.FINISHED_GOOD;

      // Add inventory back to warehouse - this will log to InventoryLedger
      // Inventory updates are consistent across all channels
      this.logger.debug(
        `Restoring inventory for order return ${order.orderNumber} (Channel: ${order.channel}): ` +
          `ProductVariant ${orderItem.productVariantId}, Warehouse ${returnItem.warehouseId}, Quantity ${returnItem.quantity}`,
      );

      await this.inventoryService.addInventory({
        productVariantId: orderItem.productVariantId,
        warehouseId: returnItem.warehouseId,
        quantity: returnItem.quantity,
        itemType,
        reason: `Order ${order.orderNumber} (${order.channel}) return - ${returnItem.reason}`,
      });

      this.logger.debug(
        `Inventory restored successfully: ${returnItem.quantity} units to warehouse ${returnItem.warehouseId}`,
      );
    }

    // Determine if it's a full or partial return
    const allItemsFullyReturned = order.orderItems.every((item) => {
      const returnQty = returnQuantities.get(item.id) || 0;
      return returnQty === item.quantity;
    });

    const anyItemReturned = returnQuantities.size > 0;

    // Update order status
    let newStatus: OrderStatus;

    if (allItemsFullyReturned && anyItemReturned) {
      // All items fully returned
      newStatus = OrderStatus.RETURNED;
      this.logger.log(
        `Order fully returned: ${order.orderNumber} (Channel: ${order.channel})`,
      );
    } else if (anyItemReturned) {
      // Partial return - set to PARTIALLY_FULFILLED
      // Note: This means some items were returned but not all
      newStatus = OrderStatus.PARTIALLY_FULFILLED;
      this.logger.warn(
        `Order partially returned: ${order.orderNumber} (Channel: ${order.channel})`,
      );
    } else {
      // No items returned (shouldn't happen, but handle edge case)
      this.logger.error(
        `Return processing failed: ${order.orderNumber} (Channel: ${order.channel}) - No items returned`,
      );
      throw new BadRequestException('No items were returned');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: newStatus,
      },
    });

    this.logger.log(
      `Order return completed: ${order.orderNumber} (Channel: ${order.channel}, Status: ${newStatus})`,
    );

    return updatedOrder;
  }
}

