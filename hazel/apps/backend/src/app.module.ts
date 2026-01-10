import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ProductsModule } from './modules/products/products.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { DropsModule } from './modules/drops/drops.module';
import { StylesModule } from './modules/styles/styles.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CustomerUsersModule } from './modules/customer-users/customer-users.module';
import { ForecastModule } from './modules/forecast/forecast.module';
import { ReplenishmentModule } from './modules/replenishment/replenishment.module';
import { ProductionModule } from './modules/production/production.module';
import { FinanceModule } from './modules/finance/finance.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    ProductsModule,
    CollectionsModule,
    DropsModule,
    StylesModule,
    WarehousesModule,
    InventoryModule,
    OrdersModule,
    CustomersModule,
    CustomerUsersModule,
    ForecastModule,
    ReplenishmentModule,
    ProductionModule,
    FinanceModule,
    AnalyticsModule,
    IntegrationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
