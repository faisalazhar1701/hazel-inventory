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
    // Fetch drops and sort in memory to handle nullable releaseDate safely
    // SQLite can handle null ordering, but in-memory sort is more predictable
    const drops = await this.prisma.drop.findMany({
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            season: true,
            year: true,
          },
        },
      },
    });

    // Sort by releaseDate (nulls last), then by name as secondary sort
    return drops.sort((a, b) => {
      if (!a.releaseDate && !b.releaseDate) return 0;
      if (!a.releaseDate) return 1; // nulls last
      if (!b.releaseDate) return -1; // nulls last
      return b.releaseDate.getTime() - a.releaseDate.getTime(); // desc order
    });
  }

  async getDropById(id: string): Promise<Drop & { collection: any }> {
    const drop = await this.prisma.drop.findUnique({
      where: { id },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            season: true,
            year: true,
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

