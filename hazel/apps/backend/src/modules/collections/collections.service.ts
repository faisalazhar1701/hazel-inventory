import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Collection } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  season?: string;

  @IsInt()
  @Min(1900)
  @IsOptional()
  year?: number;
}

export class UpdateCollectionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  season?: string;

  @IsInt()
  @Min(1900)
  @IsOptional()
  year?: number;
}

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async createCollection(data: CreateCollectionDto): Promise<Collection> {
    return this.prisma.collection.create({
      data: {
        name: data.name,
        season: data.season,
        year: data.year,
      },
    });
  }

  async listCollections(): Promise<Collection[]> {
    return this.prisma.collection.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            products: true,
            drops: true,
          },
        },
      },
    });
  }

  async getCollectionById(id: string): Promise<Collection & { _count: { products: number; drops: number } }> {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        drops: true,
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        _count: {
          select: {
            products: true,
            drops: true,
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    return collection;
  }

  async updateCollection(id: string, data: UpdateCollectionDto): Promise<Collection> {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    return this.prisma.collection.update({
      where: { id },
      data: {
        name: data.name,
        season: data.season,
        year: data.year,
      },
    });
  }

  async deleteCollection(id: string): Promise<void> {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            drops: true,
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    // Check if collection has associated products or drops
    if (collection._count.products > 0 || collection._count.drops > 0) {
      throw new BadRequestException(
        `Cannot delete collection with ID ${id}. It has ${collection._count.products} product(s) and ${collection._count.drops} drop(s) associated with it.`,
      );
    }

    await this.prisma.collection.delete({
      where: { id },
    });
  }
}

