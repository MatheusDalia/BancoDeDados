import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContextsModule } from './contexts/contexts.module';
import { ResourcesModule } from './resources/resources.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ResourcesModule,
    ContextsModule,
  ],
})
export class AppModule {}
