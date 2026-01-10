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
  DropsService,
  CreateDropDto,
  UpdateDropDto,
} from './drops.service';

@Controller('drops')
export class DropsController {
  constructor(private readonly dropsService: DropsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDrop(@Body() createDropDto: CreateDropDto) {
    return this.dropsService.createDrop(createDropDto);
  }

  @Get()
  async listDrops() {
    return this.dropsService.listDrops();
  }

  @Get(':id')
  async getDropById(@Param('id') id: string) {
    return this.dropsService.getDropById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateDrop(
    @Param('id') id: string,
    @Body() updateDropDto: UpdateDropDto,
  ) {
    return this.dropsService.updateDrop(id, updateDropDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDrop(@Param('id') id: string) {
    await this.dropsService.deleteDrop(id);
  }
}

