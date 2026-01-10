import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ReplenishmentService, ReplenishmentOptions } from './replenishment.service';
import { IsOptional, IsString, IsInt, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GetReplenishmentSuggestionsQueryDto {
  @IsOptional()
  @IsString()
  productVariantId?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(90)
  days?: 30 | 60 | 90;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStockThreshold?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  safetyStockMultiplier?: number;

  @IsOptional()
  @IsString()
  generate?: 'true' | 'false'; // Whether to generate new suggestions or return existing
}

@Controller('replenishment-suggestions')
export class ReplenishmentController {
  constructor(private readonly replenishmentService: ReplenishmentService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getReplenishmentSuggestions(@Query() query: GetReplenishmentSuggestionsQueryDto) {
    const { generate, ...rest } = query;

    // If generate=true, create new suggestions; otherwise return existing
    if (generate === 'true') {
      const options: ReplenishmentOptions = {
        productVariantId: rest.productVariantId,
        warehouseId: rest.warehouseId,
        days: rest.days as 30 | 60 | 90,
        minStockThreshold: rest.minStockThreshold,
        safetyStockMultiplier: rest.safetyStockMultiplier,
      };
      const suggestions = await this.replenishmentService.generateSuggestions(options);
      
      // Optionally save to database
      await this.replenishmentService.saveSuggestions(suggestions);
      
      return suggestions;
    }

    // Return existing suggestions from database
    return this.replenishmentService.getSuggestions({
      productVariantId: rest.productVariantId,
      warehouseId: rest.warehouseId,
    });
  }
}

