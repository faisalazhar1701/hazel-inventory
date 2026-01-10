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
  @IsOptional()
  customerId?: string;

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
    const validChannels = ['DTC', 'B2B', 'POS', 'WHOLESALE', 'RETAIL'];
    if (!validChannels.includes(channel)) {
      this.logger.error(`Invalid channel provided: ${channel}`);
      throw new BadRequestException(
        `Invalid channel: ${channel}. Must be one of: ${validChannels.join(', ')}`,
      );
    }
    this.logger.debug(`Channel validated: ${channel}`);
  }

  /**
   * Validates order status transitions according to lifecycle rules:
   * DRAFT -> CONFIRMED -> FULFILLED
   * DRAFT -> CANCELLED (at any time)
   * FULFILLED -> RETURNED (after fulfillment)
   * Any status -> CANCELLED (except FULFILLED, RETURNED, CANCELLED)
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.DRAFT]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.FULFILLED, OrderStatus.CANCELLED, OrderStatus.ALLOCATED],
      [OrderStatus.ALLOCATED]: [OrderStatus.FULFILLED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.FULFILLED, OrderStatus.RETURNED],
      [OrderStatus.DELIVERED]: [OrderStatus.FULFILLED, OrderStatus.RETURNED],
      [OrderStatus.COMPLETED]: [OrderStatus.FULFILLED, OrderStatus.RETURNED],
      [OrderStatus.FULFILLED]: [OrderStatus.RETURNED],
      [OrderStatus.CANCELLED]: [], // Terminal state
      [OrderStatus.RETURNED]: [], // Terminal state
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      this.logger.warn(
        `Invalid status transition attempted: ${currentStatus} -> ${newStatus}`,
      );
      throw new BadRequestException(
        `Cannot transition order from ${currentStatus} to ${newStatus}. Valid transitions from ${currentStatus} are: ${allowedTransitions.join(', ') || 'none (terminal state)'}`,
      );
    }
    this.logger.debug(`Status transition validated: ${currentStatus} -> ${newStatus}`);
  }

  async createOrder(data: CreateOrderDto): Promise<Order & { orderItems: OrderItem[] }> {
    this.validateChannel(data.channel);

    // Enforce business rules: B2B/WHOLESALE orders must have customer, DTC orders may not
    const requiresCustomer = data.channel === OrderChannelEnum.B2B || data.channel === OrderChannelEnum.WHOLESALE;
    const allowsCustomer = data.channel === OrderChannelEnum.DTC || data.channel === OrderChannelEnum.RETAIL || data.channel === OrderChannelEnum.POS;

    if (requiresCustomer && !data.customerId) {
      throw new BadRequestException(
        `Orders with channel ${data.channel} must have a customer. Please provide a customerId.`,
      );
    }

    // Validate customer exists if provided
    if (data.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: data.customerId },
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${data.customerId} not found`);
      }

      // Validate customer status is ACTIVE
      if (customer.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Cannot create order for customer ${customer.companyName}. Customer status is ${customer.status}.`,
        );
      }

      // For B2B/WHOLESALE, validate customer type matches channel
      if (data.channel === OrderChannelEnum.B2B && customer.type !== 'B2B') {
        throw new BadRequestException(
          `Customer ${customer.companyName} has type ${customer.type}, but order channel is B2B. Customer type must match channel.`,
        );
      }

      if (data.channel === OrderChannelEnum.WHOLESALE && customer.type !== 'WHOLESALE') {
        throw new BadRequestException(
          `Customer ${customer.companyName} has type ${customer.type}, but order channel is WHOLESALE. Customer type must match channel.`,
        );
      }
    }

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

    // Validate all warehouses exist
    const warehouseIds = data.items.map((item) => item.warehouseId);
    const warehouses = await this.prisma.warehouse.findMany({
      where: {
        id: { in: warehouseIds },
      },
    });

    if (warehouses.length !== new Set(warehouseIds).size) {
      throw new NotFoundException('One or more warehouses not found');
    }

    // Calculate total amount
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    // Generate unique order number
    const orderNumber = await this.generateUniqueOrderNumber();

    // Create order with items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          channel: data.channel as OrderChannel,
          customerId: data.customerId || null,
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

  /**
   * List orders with optional customer filtering for role-based access
   * @param customerId - Optional customer ID to filter orders. If provided, only returns orders for that customer.
   */
  async listOrders(customerId?: string): Promise<Order[]> {
    const where = customerId ? { customerId } : {};
    
    return this.prisma.order.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            type: true,
          },
        },
      },
    });
  }

  /**
   * Get order by ID with optional customer user access check
   * @param id - Order ID
   * @param userId - Optional user ID to verify access. If provided, only returns order if user has access to the customer.
   */
  async getOrderById(id: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // If userId is provided and order has a customer, verify user has access to that customer
    if (userId && order.customerId) {
      const customerUser = await this.prisma.customerUser.findUnique({
        where: {
          userId_customerId: {
            userId: userId,
            customerId: order.customerId,
          },
        },
      });

      if (!customerUser) {
        throw new NotFoundException(
          `Order with ID ${id} not found or you do not have access to it`,
        );
      }
    }

    // Re-fetch with full includes
    const fullOrder = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            type: true,
            status: true,
          },
        },
        orderItems: {
          include: {
            productVariant: {
              include: {
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
        },
        inventoryReservations: {
          include: {
            inventoryItem: {
              include: {
                warehouse: {
                  select: {
                    id: true,
                    name: true,
                    location: true,
                  },
                },
                productVariant: {
                  select: {
                    id: true,
                    sku: true,
                    product: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return fullOrder;
  }

  async confirmOrder(id: string): Promise<Order> {
    this.logger.log(`Confirming order: ${id}`);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
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
        this.logger.error(`Order not found: ${id}`);
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      // Validate status transition
      this.validateStatusTransition(order.status as OrderStatus, OrderStatus.CONFIRMED);

      // Check available inventory and create reservations
      const reservations: { orderItemId: string; inventoryItemId: string; productVariantId: string; warehouseId: string; quantity: number }[] = [];
      let allReserved = true;

      for (const orderItem of order.orderItems) {
        // Find inventory items with available stock
        const inventoryItems = await tx.inventoryItem.findMany({
          where: {
            productVariantId: orderItem.productVariantId,
            quantity: { gt: 0 },
          },
          orderBy: {
            quantity: 'desc',
          },
        });

        let remainingQuantity = orderItem.quantity;

        // Calculate available quantity (physical stock minus active reservations)
        for (const invItem of inventoryItems) {
          if (remainingQuantity <= 0) break;

          // Get active reservations for this inventory item
          const activeReservations = await tx.inventoryReservation.findMany({
            where: {
              inventoryItemId: invItem.id,
              releasedAt: null,
              consumedAt: null,
            },
          });

          const reservedQuantity = activeReservations.reduce(
            (sum, res) => sum + res.quantity,
            0,
          );
          const availableQuantity = invItem.quantity - reservedQuantity;

          if (availableQuantity <= 0) continue;

          const reserveQuantity = Math.min(remainingQuantity, availableQuantity);

          if (reserveQuantity > 0) {
            reservations.push({
              orderItemId: orderItem.id,
              inventoryItemId: invItem.id,
              productVariantId: orderItem.productVariantId,
              warehouseId: invItem.warehouseId,
              quantity: reserveQuantity,
            });
            remainingQuantity -= reserveQuantity;
          }
        }

        if (remainingQuantity > 0) {
          allReserved = false;
          this.logger.warn(
            `Insufficient inventory for order item ${orderItem.id}. Requested: ${orderItem.quantity}, Reserved: ${orderItem.quantity - remainingQuantity}`,
          );
        }
      }

      if (reservations.length === 0) {
        throw new BadRequestException(
          `Cannot confirm order ${order.orderNumber}. No inventory available for any items.`,
        );
      }

      // Create reservations
      await Promise.all(
        reservations.map((res) =>
          tx.inventoryReservation.create({
            data: {
              orderId: order.id,
              orderItemId: res.orderItemId,
              inventoryItemId: res.inventoryItemId,
              productVariantId: res.productVariantId,
              warehouseId: res.warehouseId,
              quantity: res.quantity,
            },
          }),
        ),
      );

      // Update order status - Always transition to CONFIRMED first (validated above)
      // If all items are reserved, can optionally set to ALLOCATED (backward compatibility)
      // But the lifecycle is: DRAFT -> CONFIRMED -> (ALLOCATED) -> FULFILLED
      let newStatus = OrderStatus.CONFIRMED;
      
      // Optionally set to ALLOCATED if all items reserved (for backward compatibility)
      if (allReserved) {
        // Validate transition from CONFIRMED to ALLOCATED is allowed
        this.validateStatusTransition(OrderStatus.CONFIRMED, OrderStatus.ALLOCATED);
        newStatus = OrderStatus.ALLOCATED;
      }
      
      const updateData: any = {
        status: newStatus,
        confirmedAt: new Date(),
      };
      
      // Only update allocatedAt timestamp if set to ALLOCATED
      if (allReserved) {
        try {
          updateData.allocatedAt = new Date();
        } catch (e) {
          // Timestamp field not available, skip
        }
      }
      
      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(
        `Order ${order.orderNumber} confirmed. Status: ${newStatus}. Reservations created: ${reservations.length}`,
      );

      return updatedOrder;
    });
  }

  async cancelOrder(id: string): Promise<Order> {
    this.logger.log(`Cancelling order: ${id}`);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
      });

      if (!order) {
        this.logger.error(`Order not found for cancellation: ${id}`);
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      // Validate status transition - allow cancellation from any non-terminal state except FULFILLED and RETURNED
      if (order.status === OrderStatus.FULFILLED || order.status === OrderStatus.RETURNED) {
        throw new BadRequestException(`Cannot cancel order with status ${order.status}. Order is already fulfilled or returned.`);
      }
      
      this.validateStatusTransition(order.status as OrderStatus, OrderStatus.CANCELLED);

      // Release all active reservations
      const activeReservations = await tx.inventoryReservation.findMany({
        where: {
          orderId: id,
          releasedAt: null,
          consumedAt: null,
        },
      });

      if (activeReservations.length > 0) {
        await tx.inventoryReservation.updateMany({
          where: {
            id: { in: activeReservations.map((r) => r.id) },
          },
          data: {
            releasedAt: new Date(),
          },
        });

        this.logger.log(
          `Released ${activeReservations.length} reservations for order ${order.orderNumber}`,
        );
      }

      // Update order status
      const updateData: any = {
        status: OrderStatus.CANCELLED,
      };
      
      try {
        updateData.cancelledAt = new Date();
      } catch (e) {
        // Timestamp field not available, skip
      }
      
      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Order cancelled: ${order.orderNumber}`);
      return updatedOrder;
    });
  }

  async shipOrder(id: string): Promise<Order> {
    this.logger.log(`Shipping order: ${id}`);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          inventoryReservations: {
            where: {
              releasedAt: null,
              consumedAt: null,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      // Validate status transition - ship order from CONFIRMED or ALLOCATED status
      if (![OrderStatus.CONFIRMED, OrderStatus.ALLOCATED].includes(order.status as OrderStatus)) {
        throw new BadRequestException(
          `Cannot ship order with status ${order.status}. Order must be CONFIRMED or ALLOCATED.`,
        );
      }

      if (order.inventoryReservations.length === 0) {
        throw new BadRequestException(
          `Cannot ship order ${order.orderNumber}. No active reservations found.`,
        );
      }

      // Consume reservations and deduct inventory (atomic)
      for (const reservation of order.inventoryReservations) {
        // Get inventory item
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: reservation.inventoryItemId },
        });

        if (!inventoryItem) {
          throw new NotFoundException(
            `Inventory item ${reservation.inventoryItemId} not found`,
          );
        }

        // Check if deduction would result in negative quantity
        if (inventoryItem.quantity < reservation.quantity) {
          throw new BadRequestException(
            `Insufficient inventory for shipment. Available: ${inventoryItem.quantity}, Requested: ${reservation.quantity}`,
          );
        }

        // Deduct inventory within the same transaction
        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            quantity: {
              decrement: reservation.quantity,
            },
          },
        });

        // Create ledger entry
        await tx.inventoryLedger.create({
          data: {
            inventoryItemId: inventoryItem.id,
            changeQuantity: -reservation.quantity,
            reason: `Order ${order.orderNumber} shipment - Consuming reservation`,
          },
        });

        // Mark reservation as consumed
        await tx.inventoryReservation.update({
          where: { id: reservation.id },
          data: {
            consumedAt: new Date(),
          },
        });
      }

      // Update order status
      const updateData: any = {
        status: OrderStatus.SHIPPED,
      };
      
      try {
        updateData.shippedAt = new Date();
      } catch (e) {
        // Timestamp field not available, skip
      }
      
      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(
        `Order ${order.orderNumber} shipped. Consumed ${order.inventoryReservations.length} reservations.`,
      );

      return updatedOrder;
    });
  }

  /**
   * Fulfill an order - marks it as fulfilled after inventory has been consumed.
   * Order must be in CONFIRMED, ALLOCATED, SHIPPED, DELIVERED, or COMPLETED status.
   * All inventory reservations should already be consumed (via shipOrder).
   */
  async fulfillOrder(id: string): Promise<Order> {
    this.logger.log(`Fulfilling order: ${id}`);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          inventoryReservations: {
            where: {
              consumedAt: null,
              releasedAt: null,
            },
          },
        },
      });

      if (!order) {
        this.logger.error(`Order not found for fulfillment: ${id}`);
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      // Validate status - can fulfill from CONFIRMED/ALLOCATED/SHIPPED/DELIVERED/COMPLETED
      const fulfillableStatuses = [
        OrderStatus.CONFIRMED,
        OrderStatus.ALLOCATED,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.COMPLETED,
      ];

      if (!fulfillableStatuses.includes(order.status as OrderStatus)) {
        throw new BadRequestException(
          `Cannot fulfill order with status ${order.status}. Order must be in CONFIRMED, ALLOCATED, SHIPPED, DELIVERED, or COMPLETED status.`,
        );
      }

      // Check if there are any active reservations that need to be consumed first
      if (order.inventoryReservations.length > 0) {
        this.logger.warn(
          `Order ${order.orderNumber} has ${order.inventoryReservations.length} active reservations. These should be consumed via shipOrder before fulfilling.`,
        );
        // Don't throw error - allow fulfillment if reservations exist but warn
      }

      // Validate status transition
      this.validateStatusTransition(order.status as OrderStatus, OrderStatus.FULFILLED);

      // Update order status to FULFILLED
      const updateData: any = {
        status: OrderStatus.FULFILLED,
      };
      
      try {
        updateData.fulfilledAt = new Date();
      } catch (e) {
        // Timestamp field not available, skip
      }
      
      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Order ${order.orderNumber} fulfilled. Status: FULFILLED`);
      return updatedOrder;
    });
  }

  /**
   * Get inventory impact for an order - shows how much inventory is reserved/consumed
   */
  async getInventoryImpact(id: string): Promise<{
    orderId: string;
    orderNumber: string;
    status: string;
    totalItems: number;
    reservations: {
      active: number;
      consumed: number;
      released: number;
    };
    inventoryImpact: Array<{
      productVariantId: string;
      productVariantSku: string;
      warehouseId: string;
      warehouseName: string;
      quantityReserved: number;
      quantityConsumed: number;
      quantityReleased: number;
      netImpact: number;
    }>;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            productVariant: true,
          },
        },
        inventoryReservations: {
          include: {
            inventoryItem: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const inventoryImpactMap = new Map<
      string,
      {
        productVariantId: string;
        productVariantSku: string;
        warehouseId: string;
        warehouseName: string;
        quantityReserved: number;
        quantityConsumed: number;
        quantityReleased: number;
      }
    >();

    // Get order item map for SKU lookup
    const orderItemMap = new Map(
      order.orderItems.map((item) => [item.id, item]),
    );

    // Aggregate inventory impact by product variant and warehouse
    for (const reservation of order.inventoryReservations) {
      const orderItem = orderItemMap.get(reservation.orderItemId);
      const key = `${reservation.productVariantId}-${reservation.warehouseId}`;
      const existing = inventoryImpactMap.get(key);

      const impact = existing || {
        productVariantId: reservation.productVariantId,
        productVariantSku: orderItem?.productVariant?.sku || 'Unknown',
        warehouseId: reservation.warehouseId,
        warehouseName: reservation.inventoryItem?.warehouse?.name || 'Unknown',
        quantityReserved: 0,
        quantityConsumed: 0,
        quantityReleased: 0,
      };

      if (reservation.consumedAt) {
        impact.quantityConsumed += reservation.quantity;
      } else if (reservation.releasedAt) {
        impact.quantityReleased += reservation.quantity;
      } else {
        impact.quantityReserved += reservation.quantity;
      }

      inventoryImpactMap.set(key, impact);
    }

    const inventoryImpact = Array.from(inventoryImpactMap.values()).map((impact) => ({
      ...impact,
      netImpact: impact.quantityConsumed - impact.quantityReleased, // Net inventory removed
    }));

    const activeReservations = order.inventoryReservations.filter(
      (r) => !r.consumedAt && !r.releasedAt,
    ).length;
    const consumedReservations = order.inventoryReservations.filter(
      (r) => r.consumedAt !== null,
    ).length;
    const releasedReservations = order.inventoryReservations.filter(
      (r) => r.releasedAt !== null,
    ).length;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalItems: order.orderItems.length,
      reservations: {
        active: activeReservations,
        consumed: consumedReservations,
        released: releasedReservations,
      },
      inventoryImpact,
    };
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
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Validate return - can return from FULFILLED or legacy shipped/delivered/completed statuses
    if (![OrderStatus.FULFILLED, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(order.status as OrderStatus)) {
      throw new BadRequestException(
        `Cannot return order with status ${order.status}. Order must be FULFILLED, SHIPPED, DELIVERED, or COMPLETED.`,
      );
    }
    
    this.validateStatusTransition(order.status as OrderStatus, OrderStatus.RETURNED);

    // Validate return items
    const orderItemMap = new Map(
      order.orderItems.map((item) => [item.id, item]),
    );

    for (const returnItem of returnData.items) {
      const orderItem = orderItemMap.get(returnItem.orderItemId);

      if (!orderItem) {
        throw new NotFoundException(
          `Order item with ID ${returnItem.orderItemId} not found in order`,
        );
      }

      if (returnItem.quantity > orderItem.quantity) {
        throw new BadRequestException(
          `Return quantity (${returnItem.quantity}) exceeds order quantity (${orderItem.quantity}) for order item ${returnItem.orderItemId}`,
        );
      }

      // Get item type from existing inventory or default to FINISHED_GOOD
      const existingInventory = await this.prisma.inventoryItem.findFirst({
        where: {
          productVariantId: orderItem.productVariantId,
          warehouseId: returnItem.warehouseId,
        },
      });

      const itemType = existingInventory
        ? (existingInventory.itemType as InventoryItemType)
        : InventoryItemType.FINISHED_GOOD;

      // Add inventory back
      await this.inventoryService.addInventory({
        productVariantId: orderItem.productVariantId,
        warehouseId: returnItem.warehouseId,
        quantity: returnItem.quantity,
        itemType,
        reason: `Order ${order.orderNumber} return - ${returnItem.reason}`,
      });
    }

    // Calculate if full return
    const totalReturned = returnData.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalOrdered = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const isFullReturn = totalReturned >= totalOrdered;

    // Update order status
    const newStatus = isFullReturn ? OrderStatus.RETURNED : OrderStatus.SHIPPED;
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: newStatus,
      },
    });

    this.logger.log(
      `Order return processed: ${order.orderNumber}. Status: ${newStatus}. Items returned: ${returnData.items.length}`,
    );

    return updatedOrder;
  }
}

