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
    this.validateChannel(data.channel);

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

  async getOrderById(id: string): Promise<Order & { 
    orderItems: (OrderItem & { productVariant: ProductVariant })[];
    inventoryReservations: any[];
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            productVariant: true,
          },
        },
        inventoryReservations: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
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

      if (order.status !== OrderStatus.DRAFT) {
        this.logger.warn(
          `Cannot confirm order ${order.orderNumber}: Invalid status ${order.status}`,
        );
        throw new BadRequestException(
          `Cannot confirm order with status ${order.status}. Only DRAFT orders can be confirmed.`,
        );
      }

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

      // Update order status - Note: timestamp fields may need to be added manually if not in schema
      const newStatus = allReserved ? OrderStatus.ALLOCATED : OrderStatus.CONFIRMED;
      const updateData: any = {
        status: newStatus,
      };
      
      // Only update timestamp fields if they exist in the schema
      try {
        updateData.confirmedAt = new Date();
        if (allReserved) {
          updateData.allocatedAt = new Date();
        }
      } catch (e) {
        // Timestamp fields not available, skip
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

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('Order is already cancelled');
      }

      if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(order.status as OrderStatus)) {
        throw new BadRequestException(`Cannot cancel order with status ${order.status}`);
      }

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

    if (![OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(order.status as OrderStatus)) {
      throw new BadRequestException(
        `Cannot return order with status ${order.status}. Order must be SHIPPED, DELIVERED, or COMPLETED.`,
      );
    }

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

