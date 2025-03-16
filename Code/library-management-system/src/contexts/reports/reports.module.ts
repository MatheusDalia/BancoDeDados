// src/contexts/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { RepositoriesModule } from '../../infrastructure/repositories/repositories.module';
import { ReportsService } from './reports.service';

@Module({
  imports: [RepositoriesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
