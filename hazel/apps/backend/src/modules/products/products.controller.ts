import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ProductsService,
  CreateProductDto,
  CreateProductVariantDto,
  CreateBomDto,
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

  @Post(':variantId/bom')
  @HttpCode(HttpStatus.CREATED)
  async createBom(
    @Param('variantId') variantId: string,
    @Body() createBomDto: Omit<CreateBomDto, 'parentVariantId'>,
  ) {
    return this.productsService.createBom({
      ...createBomDto,
      parentVariantId: variantId,
    });
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
