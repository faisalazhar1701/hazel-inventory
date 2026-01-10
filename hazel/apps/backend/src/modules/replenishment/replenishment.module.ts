import { Module } from '@nestjs/common';
import { ReplenishmentController } from './replenishment.controller';
import { ReplenishmentService } from './replenishment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ForecastModule } from '../forecast/forecast.module';

@Module({
  imports: [PrismaModule, ForecastModule],
  controllers: [ReplenishmentController],
  providers: [ReplenishmentService],
  exports: [ReplenishmentService],
})
export class ReplenishmentModule {}

