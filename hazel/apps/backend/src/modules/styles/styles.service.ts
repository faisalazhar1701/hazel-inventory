import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Style } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStyleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  productId?: string;
}

export class UpdateStyleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  productId?: string;
}

@Injectable()
export class StylesService {
  constructor(private prisma: PrismaService) {}

  async createStyle(data: CreateStyleDto): Promise<Style> {
    // Verify product exists if productId is provided
    if (data.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: data.productId },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${data.productId} not found`);
      }

      // Check if product already has a style
      const existingStyle = await this.prisma.style.findUnique({
        where: { productId: data.productId },
      });
      if (existingStyle) {
        throw new BadRequestException(`Product with ID ${data.productId} already has a style assigned`);
      }
    }

    return this.prisma.style.create({
      data: {
        name: data.name,
        code: data.code,
        productId: data.productId || null,
      },
    });
  }

  async listStyles(): Promise<Style[]> {
    return this.prisma.style.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });
  }

  async getStyleById(id: string): Promise<Style & { product: any }> {
    const style = await this.prisma.style.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            description: true,
          },
        },
      },
    });

    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    return style;
  }

  async updateStyle(id: string, data: UpdateStyleDto): Promise<Style> {
    const style = await this.prisma.style.findUnique({
      where: { id },
    });

    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    // Verify product exists if productId is provided
    if (data.productId !== undefined) {
      if (data.productId) {
        const product = await this.prisma.product.findUnique({
          where: { id: data.productId },
        });
        if (!product) {
          throw new NotFoundException(`Product with ID ${data.productId} not found`);
        }

        // Check if another style already uses this productId
        const existingStyle = await this.prisma.style.findUnique({
          where: { productId: data.productId },
        });
        if (existingStyle && existingStyle.id !== id) {
          throw new BadRequestException(`Product with ID ${data.productId} already has a style assigned`);
        }
      }
    }

    return this.prisma.style.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        productId: data.productId !== undefined ? (data.productId || null) : undefined,
      },
    });
  }

  async deleteStyle(id: string): Promise<void> {
    const style = await this.prisma.style.findUnique({
      where: { id },
    });

    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }

    await this.prisma.style.delete({
      where: { id },
    });
  }
}

