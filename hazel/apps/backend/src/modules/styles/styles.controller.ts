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
  StylesService,
  CreateStyleDto,
  UpdateStyleDto,
} from './styles.service';

@Controller('styles')
export class StylesController {
  constructor(private readonly stylesService: StylesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStyle(@Body() createStyleDto: CreateStyleDto) {
    return this.stylesService.createStyle(createStyleDto);
  }

  @Get()
  async listStyles() {
    return this.stylesService.listStyles();
  }

  @Get(':id')
  async getStyleById(@Param('id') id: string) {
    return this.stylesService.getStyleById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateStyle(
    @Param('id') id: string,
    @Body() updateStyleDto: UpdateStyleDto,
  ) {
    return this.stylesService.updateStyle(id, updateStyleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStyle(@Param('id') id: string) {
    await this.stylesService.deleteStyle(id);
  }
}

