import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateProductVariantDto {
  @IsString()
  productId: string;

  @IsString()
  color: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  status?: string;
}
