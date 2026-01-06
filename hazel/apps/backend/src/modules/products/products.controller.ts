import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService, CreateProductDto, CreateProductVariantDto } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProduct(createProductDto);
  }

  @Get()
  async listProducts() {
    return this.productsService.listProducts();
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Post(':productId/variants')
  @HttpCode(HttpStatus.CREATED)
  async createProductVariant(
    @Param('productId') productId: string,
    @Body() createVariantDto: Omit<CreateProductVariantDto, 'productId'>,
  ) {
    return this.productsService.createProductVariant({
      ...createVariantDto,
      productId,
    });
  }

  @Get(':productId/variants')
  async listVariantsByProduct(@Param('productId') productId: string) {
    return this.productsService.listVariantsByProduct(productId);
  }
}

