// src/contexts/books/books.module.ts
import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { RepositoriesModule } from '../../infrastructure/repositories/repositories.module';
import { BooksService } from './books.service';

@Module({
  imports: [RepositoriesModule],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
