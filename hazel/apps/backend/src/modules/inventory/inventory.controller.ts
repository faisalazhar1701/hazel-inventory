import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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

  @Get('product-variant/:productVariantId')
  async getInventoryByProductVariant(
    @Param('productVariantId') productVariantId: string,
  ) {
    return this.inventoryService.getInventoryByProductVariant(productVariantId);
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
}

