import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ProductLifecycleStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DISCONTINUED = 'DISCONTINUED',
}

export class CreateProductDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  description?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  collectionId?: string;

  @IsOptional()
  @IsEnum(ProductLifecycleStatus)
  lifecycleStatus?: ProductLifecycleStatus;
}
