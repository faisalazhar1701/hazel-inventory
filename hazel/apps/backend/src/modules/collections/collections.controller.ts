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
  CollectionsService,
  CreateCollectionDto,
  UpdateCollectionDto,
} from './collections.service';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCollection(@Body() createCollectionDto: CreateCollectionDto) {
    return this.collectionsService.createCollection(createCollectionDto);
  }

  @Get()
  async listCollections() {
    return this.collectionsService.listCollections();
  }

  @Get(':id')
  async getCollectionById(@Param('id') id: string) {
    return this.collectionsService.getCollectionById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateCollection(
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
  ) {
    return this.collectionsService.updateCollection(id, updateCollectionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCollection(@Param('id') id: string) {
    await this.collectionsService.deleteCollection(id);
  }
}

