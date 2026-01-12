import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [AnalyticsModule, FinanceModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
