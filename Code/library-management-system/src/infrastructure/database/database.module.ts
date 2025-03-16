// src/infrastructure/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { databaseProviders } from './database.provider';
import { MigrationService } from './migration.service';
import databaseConfig from '../../config/database.config';

@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
  providers: [...databaseProviders, MigrationService],
  exports: [...databaseProviders, MigrationService],
})
export class DatabaseModule {}
