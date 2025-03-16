// src/contexts/loans/loans.module.ts
import { RepositoriesModule } from 'src/infrastructure/repositories/repositories.module';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [RepositoriesModule],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
