import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  InventoryService,
  AddInventoryDto,
  DeductInventoryDto,
  TransferInventoryDto,
} from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('product-variant/:variantId')
  async getInventoryByProductVariant(
    @Param('variantId') variantId: string,
  ) {
    return this.inventoryService.getInventoryByProductVariant(variantId);
  }

  @Get('warehouse/:warehouseId')
  async getInventoryByWarehouse(@Param('warehouseId') warehouseId: string) {
    return this.inventoryService.getInventoryByWarehouse(warehouseId);
  }

  @Post('add')
  @HttpCode(HttpStatus.OK)
  async addInventory(@Body() addInventoryDto: AddInventoryDto) {
    return this.inventoryService.addInventory(addInventoryDto);
  }

  @Post('deduct')
  @HttpCode(HttpStatus.OK)
  async deductInventory(@Body() deductInventoryDto: DeductInventoryDto) {
    return this.inventoryService.deductInventory(deductInventoryDto);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  async transferInventory(@Body() transferInventoryDto: TransferInventoryDto) {
    return this.inventoryService.transferInventory(transferInventoryDto);
  }

  @Get('stock-movements')
  async getStockMovements(
    @Query('productVariantId') productVariantId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.inventoryService.getStockMovements(productVariantId, warehouseId);
  }

  @Get('stock-movements/product-variant/:productVariantId')
  async getStockMovementsByVariant(@Param('productVariantId') productVariantId: string) {
    return this.inventoryService.getStockMovements(productVariantId);
  }

  @Get('stock-movements/warehouse/:warehouseId')
  async getStockMovementsByWarehouse(@Param('warehouseId') warehouseId: string) {
    return this.inventoryService.getStockMovements(undefined, warehouseId);
  }
}

