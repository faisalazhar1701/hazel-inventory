import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryItem, InventoryLedger } from '@prisma/client';
import { InventoryItemType } from '@hazel/shared-types';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';

export class AddInventoryDto {
  @IsString()
  @IsNotEmpty()
  productVariantId: string;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsEnum(InventoryItemType)
  itemType: InventoryItemType;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class DeductInventoryDto {
  @IsString()
  @IsNotEmpty()
  productVariantId: string;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class TransferInventoryDto {
  @IsString()
  @IsNotEmpty()
  productVariantId: string;

  @IsString()
  @IsNotEmpty()
  fromWarehouseId: string;

  @IsString()
  @IsNotEmpty()
  toWarehouseId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateInventoryItem(
    productVariantId: string,
    warehouseId: string,
    itemType: InventoryItemType,
  ): Promise<InventoryItem> {
    // Check if inventory item exists
    let inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: {
        productVariantId_warehouseId: {
          productVariantId,
          warehouseId,
        },
      },
    });

    // Create if it doesn't exist
    if (!inventoryItem) {
      // Verify product variant exists
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: productVariantId },
      });
      if (!variant) {
        throw new NotFoundException(
          `Product variant with ID ${productVariantId} not found`,
        );
      }

      // Verify warehouse exists
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: warehouseId },
      });
      if (!warehouse) {
        throw new NotFoundException(
          `Warehouse with ID ${warehouseId} not found`,
        );
      }

      inventoryItem = await this.prisma.inventoryItem.create({
        data: {
          productVariantId,
          warehouseId,
          quantity: 0,
          itemType,
        },
      });
    }

    return inventoryItem;
  }

  async addInventory(data: AddInventoryDto): Promise<{
    inventoryItem: InventoryItem;
    ledgerEntry: InventoryLedger;
  }> {
    const inventoryItem = await this.getOrCreateInventoryItem(
      data.productVariantId,
      data.warehouseId,
      data.itemType,
    );

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Update inventory quantity
      const updatedItem = await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          quantity: {
            increment: data.quantity,
          },
        },
      });

      // Create ledger entry
      const ledgerEntry = await tx.inventoryLedger.create({
        data: {
          inventoryItemId: inventoryItem.id,
          changeQuantity: data.quantity,
          reason: data.reason,
        },
      });

      return { inventoryItem: updatedItem, ledgerEntry };
    });

    return result;
  }

  async deductInventory(data: DeductInventoryDto): Promise<{
    inventoryItem: InventoryItem;
    ledgerEntry: InventoryLedger;
  }> {
    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: {
        productVariantId_warehouseId: {
          productVariantId: data.productVariantId,
          warehouseId: data.warehouseId,
        },
      },
    });

    if (!inventoryItem) {
      throw new NotFoundException(
        `Inventory item not found for product variant ${data.productVariantId} in warehouse ${data.warehouseId}`,
      );
    }

    // Check if deduction would result in negative quantity
    if (inventoryItem.quantity < data.quantity) {
      throw new BadRequestException(
        `Insufficient inventory. Available: ${inventoryItem.quantity}, Requested: ${data.quantity}`,
      );
    }

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Update inventory quantity
      const updatedItem = await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          quantity: {
            decrement: data.quantity,
          },
        },
      });

      // Create ledger entry (negative quantity)
      const ledgerEntry = await tx.inventoryLedger.create({
        data: {
          inventoryItemId: inventoryItem.id,
          changeQuantity: -data.quantity,
          reason: data.reason,
        },
      });

      return { inventoryItem: updatedItem, ledgerEntry };
    });

    return result;
  }

  async transferInventory(data: TransferInventoryDto): Promise<{
    fromInventoryItem: InventoryItem;
    toInventoryItem: InventoryItem;
    fromLedgerEntry: InventoryLedger;
    toLedgerEntry: InventoryLedger;
  }> {
    if (data.fromWarehouseId === data.toWarehouseId) {
      throw new BadRequestException(
        'Source and destination warehouses cannot be the same',
      );
    }

    // Get source inventory item
    const fromInventoryItem = await this.prisma.inventoryItem.findUnique({
      where: {
        productVariantId_warehouseId: {
          productVariantId: data.productVariantId,
          warehouseId: data.fromWarehouseId,
        },
      },
    });

    if (!fromInventoryItem) {
      throw new NotFoundException(
        `Inventory item not found for product variant ${data.productVariantId} in source warehouse ${data.fromWarehouseId}`,
      );
    }

    // Check if transfer would result in negative quantity
    if (fromInventoryItem.quantity < data.quantity) {
      throw new BadRequestException(
        `Insufficient inventory for transfer. Available: ${fromInventoryItem.quantity}, Requested: ${data.quantity}`,
      );
    }

    // Get or create destination inventory item
    const toInventoryItem = await this.getOrCreateInventoryItem(
      data.productVariantId,
      data.toWarehouseId,
      fromInventoryItem.itemType as InventoryItemType,
    );

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Deduct from source
      const updatedFromItem = await tx.inventoryItem.update({
        where: { id: fromInventoryItem.id },
        data: {
          quantity: {
            decrement: data.quantity,
          },
        },
      });

      // Add to destination
      const updatedToItem = await tx.inventoryItem.update({
        where: { id: toInventoryItem.id },
        data: {
          quantity: {
            increment: data.quantity,
          },
        },
      });

      // Create ledger entry for source (negative)
      const fromLedgerEntry = await tx.inventoryLedger.create({
        data: {
          inventoryItemId: fromInventoryItem.id,
          changeQuantity: -data.quantity,
          reason: `Transfer to ${data.toWarehouseId}: ${data.reason}`,
        },
      });

      // Create ledger entry for destination (positive)
      const toLedgerEntry = await tx.inventoryLedger.create({
        data: {
          inventoryItemId: toInventoryItem.id,
          changeQuantity: data.quantity,
          reason: `Transfer from ${data.fromWarehouseId}: ${data.reason}`,
        },
      });

      return {
        fromInventoryItem: updatedFromItem,
        toInventoryItem: updatedToItem,
        fromLedgerEntry,
        toLedgerEntry,
      };
    });

    return result;
  }

  async getInventoryByProductVariant(productVariantId: string) {
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        productVariantId,
      },
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
            color: true,
            size: true,
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
      orderBy: {
        warehouse: {
          name: 'asc',
        },
      },
    });

    return inventoryItems;
  }

  async getInventoryByWarehouse(warehouseId: string) {
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        warehouseId,
      },
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
            color: true,
            size: true,
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
      orderBy: {
        productVariant: {
          product: {
            name: 'asc',
          },
        },
      },
    });

    return inventoryItems;
  }
}

