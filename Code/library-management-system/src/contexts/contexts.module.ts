import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'src/config/database.module';
import { LoansModule } from './loans/loans.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { BooksModule } from './books/books.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    BooksModule,
    UsersModule,
    LoansModule,
    ReportsModule,
    ContextsModule,
  ],
})
export class ContextsModule {}
