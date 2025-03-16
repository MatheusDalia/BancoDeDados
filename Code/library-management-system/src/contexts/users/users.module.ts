// src/contexts/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { RepositoriesModule } from '../../infrastructure/repositories/repositories.module';
import { UsersService } from './users.service';

@Module({
  imports: [RepositoriesModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
