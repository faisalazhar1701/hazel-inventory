import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product, ProductVariant, BillOfMaterial } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsIn } from 'class-validator';
import { CreateProductDto, ProductLifecycleStatus } from './dto/create-product.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';

export { CreateProductDto, ProductLifecycleStatus } from './dto/create-product.dto';
export { CreateProductVariantDto } from './dto/create-product-variant.dto';

export class CreateBomDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsString()
  @IsNotEmpty()
  componentName: string;

  @IsString()
  @IsIn(['FABRIC', 'TRIM', 'PACKAGING', 'OTHER'])
  category: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;
}

export class UpdateLifecycleStatusDto {
  @IsString()
  @IsIn(['DRAFT', 'ACTIVE', 'DISCONTINUED'])
  @IsNotEmpty()
  lifecycleStatus: ProductLifecycleStatus;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  collectionId?: string;
}

export class AssignProductRelationsDto {
  @IsString()
  @IsOptional()
  collectionId?: string;

  @IsString()
  @IsOptional()
  styleId?: string; // This will assign the style's productId to this product
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async createProduct(dto: CreateProductDto): Promise<Product> {
    try {
      if (dto.collectionId) {
        const collection = await this.prisma.collection.findUnique({
          where: { id: dto.collectionId },
        });
        if (!collection) {
          throw new NotFoundException(`Collection with ID ${dto.collectionId} not found`);
        }
      }
      return await this.prisma.product.create({
        data: {
          name: dto.name?.trim() ?? '',
          description: dto.description?.trim() || null,
          imageUrl: dto.imageUrl?.trim() || null,
          lifecycleStatus: dto.lifecycleStatus ?? 'DRAFT',
          collectionId: dto.collectionId || null,
        },
      });
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Failed to create product',
      );
    }
  }

  async remove(id: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    await this.prisma.product.delete({
      where: { id },
    });
  }

  async listProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            season: true,
            year: true,
          },
        },
        style: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async getProductById(
    id: string,
  ): Promise<
    Product & {
      variants: (ProductVariant & { bomComponents: BillOfMaterial[] })[];
      collection: any;
      style: any;
    }
  > {
    const product = await this.prisma.product.findUnique({
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
        style: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        variants: {
          include: {
            bomComponents: true,
          },
        },
      },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async createProductVariant(data: CreateProductVariantDto): Promise<ProductVariant> {
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${data.productId} not found`);
    }

    const color = data.color?.trim() ?? '';
    const size = (data.size?.trim() ?? '') || '';

    // Prevent duplicate color+size per product
    const duplicate = await this.prisma.productVariant.findFirst({
      where: {
        productId: data.productId,
        color,
        size,
      },
    });
    if (duplicate) {
      throw new BadRequestException(
        `Variant already exists for color "${color}" and size "${size}". Use a different combination.`,
      );
    }

    const baseSku = product.name.replace(/\s+/g, '-').toUpperCase();
    const colorPart = color.replace(/\s+/g, '-').toUpperCase();
    const sizePart = size.replace(/\s+/g, '-').toUpperCase();
    const rawSku = [baseSku, colorPart, sizePart].filter(Boolean).join('-');

    let sku = rawSku;
    let counter = 1;
    while (true) {
      const existing = await this.prisma.productVariant.findUnique({
        where: { sku },
      });
      if (!existing) break;
      sku = `${rawSku}-${counter}`;
      counter += 1;
    }

    try {
      return await this.prisma.productVariant.create({
        data: {
          productId: data.productId,
          sku,
          color,
          size,
          price: data.price,
          status: data.status || 'ACTIVE',
        },
      });
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Failed to create variant',
      );
    }
  }

  /**
   * Bulk create variants for a product (color × size matrix).
   * Skips duplicate color+size; returns created and skipped counts.
   */
  async createProductVariantsBulk(
    productId: string,
    items: Omit<CreateProductVariantDto, 'productId'>[],
  ): Promise<{ created: ProductVariant[]; skipped: number; errors: string[] }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const created: ProductVariant[] = [];
    let skipped = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        const variant = await this.createProductVariant({
          ...item,
          productId,
        });
        created.push(variant);
      } catch (err) {
        if (err instanceof BadRequestException && err.message.includes('already exists')) {
          skipped += 1;
        } else {
          errors.push(
            `${item.color}/${item.size || ''}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          );
        }
      }
    }

    return { created, skipped, errors };
  }

  async listVariantsByProduct(productId: string): Promise<ProductVariant[]> {
    return this.prisma.productVariant.findMany({
      where: { productId },
    });
  }

  async createBom(data: CreateBomDto): Promise<BillOfMaterial> {
    return this.prisma.billOfMaterial.create({
      data: {
        variantId: data.variantId,
        componentName: data.componentName,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
      },
      include: {
        variant: true,
      },
    });
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Verify collection exists if collectionId is provided
    if (data.collectionId !== undefined) {
      if (data.collectionId) {
        const collection = await this.prisma.collection.findUnique({
          where: { id: data.collectionId },
        });
        if (!collection) {
          throw new NotFoundException(`Collection with ID ${data.collectionId} not found`);
        }
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
    if (data.collectionId !== undefined) updateData.collectionId = data.collectionId || null;

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            season: true,
            year: true,
          },
        },
        style: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async updateProductLifecycleStatus(id: string, lifecycleStatus: ProductLifecycleStatus): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.prisma.product.update({
      where: { id },
      data: { lifecycleStatus },
    });
  }

  async assignProductRelations(id: string, data: AssignProductRelationsDto): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Verify collection exists if collectionId is provided
    if (data.collectionId !== undefined) {
      if (data.collectionId) {
        const collection = await this.prisma.collection.findUnique({
          where: { id: data.collectionId },
        });
        if (!collection) {
          throw new NotFoundException(`Collection with ID ${data.collectionId} not found`);
        }
      }
    }

    // Handle style assignment: update the style's productId to point to this product
    if (data.styleId !== undefined) {
      if (data.styleId) {
        const style = await this.prisma.style.findUnique({
          where: { id: data.styleId },
        });
        if (!style) {
          throw new NotFoundException(`Style with ID ${data.styleId} not found`);
        }

        // Check if style is already assigned to another product
        if (style.productId && style.productId !== id) {
          throw new BadRequestException(`Style with ID ${data.styleId} is already assigned to another product`);
        }

        // Update the style to point to this product
        await this.prisma.style.update({
          where: { id: data.styleId },
          data: { productId: id },
        });
      } else {
        // If styleId is null/empty, remove the style assignment
        // Find the style currently assigned to this product and remove the assignment
        const currentStyle = await this.prisma.style.findUnique({
          where: { productId: id },
        });
        if (currentStyle) {
          await this.prisma.style.update({
            where: { id: currentStyle.id },
            data: { productId: null },
          });
        }
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        collectionId: data.collectionId !== undefined ? (data.collectionId || null) : undefined,
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
        style: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }
}
