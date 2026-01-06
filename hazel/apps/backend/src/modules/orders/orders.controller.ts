import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  OrdersService,
  CreateOrderDto,
  ReturnOrderDto,
} from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(createOrderDto);
  }

  @Get()
  async listOrders() {
    return this.ordersService.listOrders();
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmOrder(@Param('id') id: string) {
    return this.ordersService.confirmOrder(id);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }

  @Patch(':id/return')
  @HttpCode(HttpStatus.OK)
  async returnOrder(
    @Param('id') id: string,
    @Body() returnOrderDto: ReturnOrderDto,
  ) {
    return this.ordersService.returnOrder(id, returnOrderDto);
  }
}

