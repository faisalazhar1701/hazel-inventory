import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { InventoryModule } from '../inventory/inventory.module';
import { FinanceModule } from '../finance/finance.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [InventoryModule, FinanceModule, IntegrationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

