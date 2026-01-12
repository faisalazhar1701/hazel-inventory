import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AssetsService } from './assets.service';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

class UploadAssetDto {
  @IsEnum(['IMAGE', 'TECH_PACK', 'CERTIFICATE', 'OTHER'])
  @IsNotEmpty()
  category: string;

  @IsEnum(['PRODUCT', 'VARIANT', 'STYLE', 'COLLECTION'])
  @IsNotEmpty()
  entityType: string;

  @IsString()
  @IsNotEmpty()
  entityId: string;
}

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  /**
   * POST /assets/upload
   * Upload a new asset
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAsset(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query() query: UploadAssetDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.assetsService.uploadAsset({
      file,
      category: query.category,
      entityType: query.entityType,
      entityId: query.entityId,
    });
  }

  /**
   * GET /assets
   * List assets with optional filters
   */
  @Get()
  async listAssets(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.assetsService.listAssets(entityType, entityId);
  }

  /**
   * GET /assets/:id/download
   * Download an asset file
   */
  @Get(':id/download')
  async downloadAsset(@Param('id') id: string, @Res() res: Response) {
    const filePath = await this.assetsService.getAssetFilePath(id);
    const asset = await this.assetsService.getAsset(id);
    
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${asset.fileName}"`);
    res.sendFile(filePath);
  }

  /**
   * DELETE /assets/:id
   * Delete an asset
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAsset(@Param('id') id: string) {
    await this.assetsService.deleteAsset(id);
  }
}
