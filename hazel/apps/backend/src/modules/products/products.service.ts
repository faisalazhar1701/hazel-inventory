import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product, ProductVariant, BillOfMaterial } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsIn } from 'class-validator';

export type ProductLifecycleStatus = 'DRAFT' | 'ACTIVE' | 'DISCONTINUED';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsIn(['DRAFT', 'ACTIVE', 'DISCONTINUED'])
  @IsOptional()
  lifecycleStatus?: ProductLifecycleStatus;

  @IsString()
  @IsOptional()
  collectionId?: string;
}

export class CreateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsOptional()
  size?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  status?: string;
}

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

  async createProduct(data: CreateProductDto): Promise<Product> {
    // Verify collection exists if collectionId is provided
    if (data.collectionId) {
      const collection = await this.prisma.collection.findUnique({
        where: { id: data.collectionId },
      });
      if (!collection) {
        throw new NotFoundException(`Collection with ID ${data.collectionId} not found`);
      }
    }

    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl || null,
        lifecycleStatus: data.lifecycleStatus || 'DRAFT',
        collectionId: data.collectionId || null,
      },
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
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${data.productId} not found`);
    }

    // Auto-generate SKU based on product and variant attributes
    const baseSku = product.name.replace(/\s+/g, '-').toUpperCase();
    const colorPart = data.color.replace(/\s+/g, '-').toUpperCase();
    const sizePart = (data.size || '').replace(/\s+/g, '-').toUpperCase();
    const rawSku = [baseSku, colorPart, sizePart].filter(Boolean).join('-');

    // Ensure SKU uniqueness by appending a counter if needed
    let sku = rawSku;
    let counter = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.prisma.productVariant.findUnique({
        where: { sku },
      });
      if (!existing) break;
      counter += 1;
      sku = `${rawSku}-${counter}`;
    }

    return this.prisma.productVariant.create({
      data: {
        productId: data.productId,
        sku,
        color: data.color,
        size: data.size || '',
        price: data.price,
        status: data.status || 'ACTIVE',
      },
    });
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
