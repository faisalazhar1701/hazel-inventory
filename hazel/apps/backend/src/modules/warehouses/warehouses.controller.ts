import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  WarehousesService,
  CreateWarehouseDto,
  UpdateWarehouseDto,
} from './warehouses.service';

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWarehouse(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehousesService.createWarehouse(createWarehouseDto);
  }

  @Get()
  async listWarehouses() {
    return this.warehousesService.listWarehouses();
  }

  @Get(':id')
  async getWarehouseById(@Param('id') id: string) {
    return this.warehousesService.getWarehouseById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateWarehouse(
    @Param('id') id: string,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
  ) {
    return this.warehousesService.updateWarehouse(id, updateWarehouseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWarehouse(@Param('id') id: string) {
    await this.warehousesService.deleteWarehouse(id);
  }
}

