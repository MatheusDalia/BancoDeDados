import { Module } from '@nestjs/common';
import { createPool } from 'mysql2/promise';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return createPool({
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          user: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });
      },
    },
  ],
  exports: ['DATABASE_CONNECTION'],
})
export class DatabaseModule {}
