import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ForecastService, ForecastOptions } from './forecast.service';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetForecastsQueryDto {
  @IsOptional()
  @IsString()
  productVariantId?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(90)
  days?: 30 | 60 | 90;

  @IsOptional()
  @IsString()
  generate?: 'true' | 'false'; // Whether to generate new forecasts or return existing
}

@Controller('forecast')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getForecasts(@Query() query: GetForecastsQueryDto) {
    const { generate, days = 30, ...rest } = query;

    // If generate=true, create new forecasts; otherwise return existing
    if (generate === 'true') {
      const options: ForecastOptions = {
        ...rest,
        days: days as 30 | 60 | 90,
      };
      const forecasts = await this.forecastService.generateForecasts(options);
      
      // Optionally save to database
      await this.forecastService.saveForecasts(forecasts);
      
      return forecasts;
    }

    // Return existing forecasts from database
    return this.forecastService.getForecasts(rest);
  }
}

