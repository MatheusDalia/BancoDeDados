import { Module } from '@nestjs/common';
import { BooksModule } from './books/books.module';
import { UsersModule } from './users/users.module';
import { LoansModule } from './loans/loans.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [BooksModule, UsersModule, LoansModule, ReportsModule],
  exports: [BooksModule, UsersModule, LoansModule, ReportsModule],
})
export class ContextsModule {}
