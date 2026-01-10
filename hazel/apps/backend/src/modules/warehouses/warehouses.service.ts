import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Warehouse } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;
}

export class UpdateWarehouseDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  location?: string;
}

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async createWarehouse(data: CreateWarehouseDto): Promise<Warehouse> {
    return this.prisma.warehouse.create({
      data: {
        name: data.name,
        location: data.location,
      },
    });
  }

  async listWarehouses(): Promise<(Warehouse & { _count: { inventoryItems: number; fulfillments: number } })[]> {
    return this.prisma.warehouse.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            inventoryItems: true,
            fulfillments: true,
          },
        },
      },
    });
  }

  async getWarehouseById(id: string): Promise<Warehouse & { _count: { inventoryItems: number; fulfillments: number } }> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventoryItems: true,
            fulfillments: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async updateWarehouse(id: string, data: UpdateWarehouseDto): Promise<Warehouse> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name,
        location: data.location,
      },
    });
  }

  async deleteWarehouse(id: string): Promise<void> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventoryItems: true,
            fulfillments: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    // Check if warehouse has associated inventory items or fulfillments
    if (warehouse._count.inventoryItems > 0 || warehouse._count.fulfillments > 0) {
      throw new BadRequestException(
        `Cannot delete warehouse with ID ${id}. It has ${warehouse._count.inventoryItems} inventory item(s) and ${warehouse._count.fulfillments} fulfillment(s) associated with it.`,
      );
    }

    await this.prisma.warehouse.delete({
      where: { id },
    });
  }
}

