import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Drop } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateDropDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsOptional()
  releaseDate?: string;

  @IsString()
  @IsOptional()
  collectionId?: string;
}

export class UpdateDropDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  releaseDate?: string;

  @IsString()
  @IsOptional()
  collectionId?: string;
}

@Injectable()
export class DropsService {
  constructor(private prisma: PrismaService) {}

  async createDrop(data: CreateDropDto): Promise<Drop> {
    // Verify collection exists if collectionId is provided
    if (data.collectionId) {
      const collection = await this.prisma.collection.findUnique({
        where: { id: data.collectionId },
      });
      if (!collection) {
        throw new NotFoundException(`Collection with ID ${data.collectionId} not found`);
      }
    }

    return this.prisma.drop.create({
      data: {
        name: data.name,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        collectionId: data.collectionId || null,
      },
    });
  }

  async listDrops(): Promise<Drop[]> {
    return this.prisma.drop.findMany({
      orderBy: {
        releaseDate: 'desc',
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            season: true,
            year: true,
            brand: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async getDropById(id: string): Promise<Drop & { collection: any }> {
    const drop = await this.prisma.drop.findUnique({
      where: { id },
      include: {
        collection: {
          include: {
            brand: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!drop) {
      throw new NotFoundException(`Drop with ID ${id} not found`);
    }

    return drop;
  }

  async updateDrop(id: string, data: UpdateDropDto): Promise<Drop> {
    const drop = await this.prisma.drop.findUnique({
      where: { id },
    });

    if (!drop) {
      throw new NotFoundException(`Drop with ID ${id} not found`);
    }

    // Verify collection exists if collectionId is provided
    if (data.collectionId) {
      const collection = await this.prisma.collection.findUnique({
        where: { id: data.collectionId },
      });
      if (!collection) {
        throw new NotFoundException(`Collection with ID ${data.collectionId} not found`);
      }
    }

    return this.prisma.drop.update({
      where: { id },
      data: {
        name: data.name,
        releaseDate: data.releaseDate !== undefined ? (data.releaseDate ? new Date(data.releaseDate) : null) : undefined,
        collectionId: data.collectionId !== undefined ? (data.collectionId || null) : undefined,
      },
    });
  }

  async deleteDrop(id: string): Promise<void> {
    const drop = await this.prisma.drop.findUnique({
      where: { id },
    });

    if (!drop) {
      throw new NotFoundException(`Drop with ID ${id} not found`);
    }

    await this.prisma.drop.delete({
      where: { id },
    });
  }
}

