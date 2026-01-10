import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Brand } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateBrandDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async createBrand(data: CreateBrandDto): Promise<Brand> {
    return this.prisma.brand.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async listBrands(): Promise<Brand[]> {
    return this.prisma.brand.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        collections: true,
        _count: {
          select: {
            products: true,
            collections: true,
          },
        },
      },
    });
  }

  async getBrandById(id: string): Promise<Brand & { collections: any[]; _count: { products: number; collections: number } }> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        collections: {
          include: {
            _count: {
              select: {
                products: true,
                drops: true,
              },
            },
          },
        },
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
            collections: true,
          },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async updateBrand(id: string, data: UpdateBrandDto): Promise<Brand> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return this.prisma.brand.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async deleteBrand(id: string): Promise<void> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            collections: true,
          },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    // Check if brand has associated products or collections
    if (brand._count.products > 0 || brand._count.collections > 0) {
      throw new BadRequestException(
        `Cannot delete brand with ID ${id}. It has ${brand._count.products} product(s) and ${brand._count.collections} collection(s) associated with it.`,
      );
    }

    await this.prisma.brand.delete({
      where: { id },
    });
  }
}

