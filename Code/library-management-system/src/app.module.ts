import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContextsModule } from './contexts/contexts.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RepositoriesModule } from './infrastructure/repositories/repositories.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    DatabaseModule,
    RepositoriesModule,
    ContextsModule,
  ],
})
export class AppModule {}
