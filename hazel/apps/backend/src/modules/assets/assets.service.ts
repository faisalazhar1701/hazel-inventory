import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface UploadAssetDto {
  file: Express.Multer.File;
  category: string;
  entityType: string;
  entityId: string;
}

export interface AssetResponse {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  category: string;
  entityType: string;
  entityId: string;
  version: number;
  createdAt: Date;
}

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Upload a new asset
   */
  async uploadAsset(dto: UploadAssetDto): Promise<AssetResponse> {
    const { file, category, entityType, entityId } = dto;

    // Validate category
    const validCategories = ['IMAGE', 'TECH_PACK', 'CERTIFICATE', 'OTHER'];
    if (!validCategories.includes(category)) {
      throw new BadRequestException(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Validate entityType
    const validEntityTypes = ['PRODUCT', 'VARIANT', 'STYLE', 'COLLECTION'];
    if (!validEntityTypes.includes(entityType)) {
      throw new BadRequestException(`Invalid entityType. Must be one of: ${validEntityTypes.join(', ')}`);
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(this.uploadsDir, uniqueFileName);

    // Save file to disk
    try {
      fs.writeFileSync(filePath, file.buffer);
    } catch (error) {
      this.logger.error(`Failed to save file: ${error.message}`);
      throw new BadRequestException('Failed to save file');
    }

    // Simple versioning: version = 1 + count of existing assets for this entity (no DB column)
    const existingCount = await this.prisma.asset.count({
      where: { entityType, entityId },
    });
    const version = existingCount + 1;

    const asset = await this.prisma.asset.create({
      data: {
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        category,
        entityType,
        entityId,
        filePath: uniqueFileName,
      },
    });

    return {
      id: asset.id,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      size: asset.size,
      category: asset.category,
      entityType: asset.entityType,
      entityId: asset.entityId,
      version,
      createdAt: asset.createdAt,
    };
  }

  /**
   * List assets by entity
   */
  async listAssets(entityType?: string, entityId?: string): Promise<AssetResponse[]> {
    const where: any = {};
    if (entityType) {
      where.entityType = entityType;
    }
    if (entityId) {
      where.entityId = entityId;
    }

    const assets = await this.prisma.asset.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const key = (a: { entityType: string; entityId: string }) => `${a.entityType}:${a.entityId}`;
    const byEntity = new Map<string, typeof assets>();
    for (const a of assets) {
      const k = key(a);
      if (!byEntity.has(k)) byEntity.set(k, []);
      byEntity.get(k)!.push(a);
    }
    return assets.map(asset => {
      const group = byEntity.get(key(asset))!;
      const sorted = [...group].sort(
        (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
      );
      const version = sorted.findIndex(a => a.id === asset.id) + 1;
      return {
        id: asset.id,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        size: asset.size,
        category: asset.category,
        entityType: asset.entityType,
        entityId: asset.entityId,
        version,
        createdAt: asset.createdAt,
      };
    });
  }

  /**
   * Get asset file path for download
   */
  async getAssetFilePath(assetId: string): Promise<string> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    const filePath = path.join(this.uploadsDir, asset.filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File not found for asset ${assetId}`);
    }

    return filePath;
  }

  /**
   * Get asset metadata
   */
  async getAsset(assetId: string): Promise<AssetResponse> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    const sameEntity = await this.prisma.asset.count({
      where: {
        entityType: asset.entityType,
        entityId: asset.entityId,
        createdAt: { lte: asset.createdAt },
      },
    });
    return {
      id: asset.id,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      size: asset.size,
      category: asset.category,
      entityType: asset.entityType,
      entityId: asset.entityId,
      version: sameEntity,
      createdAt: asset.createdAt,
    };
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId: string): Promise<void> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    // Delete file from disk
    const filePath = path.join(this.uploadsDir, asset.filePath);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        this.logger.warn(`Failed to delete file: ${error.message}`);
      }
    }

    // Delete asset record from database
    await this.prisma.asset.delete({
      where: { id: assetId },
    });
  }
}
