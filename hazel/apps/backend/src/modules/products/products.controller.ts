import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ProductsService,
  CreateProductDto,
  CreateProductVariantDto,
  CreateBomDto,
  UpdateProductDto,
  UpdateLifecycleStatusDto,
  AssignProductRelationsDto,
  ProductLifecycleStatus,
} from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() createProductDto: CreateProductDto) {
    try {
      return await this.productsService.createProduct(createProductDto);
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) throw err;
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Failed to create product',
      );
    }
  }

  @Get()
  async listProducts() {
    return this.productsService.listProducts();
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Post(':productId/variants/bulk')
  @HttpCode(HttpStatus.CREATED)
  async createProductVariantsBulk(
    @Param('productId') productId: string,
    @Body() body: { items: Omit<CreateProductVariantDto, 'productId'>[] },
  ) {
    const items = Array.isArray(body?.items) ? body.items : [];
    return this.productsService.createProductVariantsBulk(productId, items);
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

  @Post(':variantId/bom')
  @HttpCode(HttpStatus.CREATED)
  async createBom(
    @Param('variantId') variantId: string,
    @Body() createBomDto: Omit<CreateBomDto, 'variantId'>,
  ) {
    return this.productsService.createBom({
      ...createBomDto,
      variantId,
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Patch(':id/lifecycle')
  @HttpCode(HttpStatus.OK)
  async updateProductLifecycleStatus(
    @Param('id') id: string,
    @Body() updateLifecycleDto: UpdateLifecycleStatusDto,
  ) {
    return this.productsService.updateProductLifecycleStatus(
      id,
      updateLifecycleDto.lifecycleStatus,
    );
  }

  @Patch(':id/assign')
  @HttpCode(HttpStatus.OK)
  async assignProductRelations(
    @Param('id') id: string,
    @Body() assignDto: AssignProductRelationsDto,
  ) {
    return this.productsService.assignProductRelations(id, assignDto);
  }
}
