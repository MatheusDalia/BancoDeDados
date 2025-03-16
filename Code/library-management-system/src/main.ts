import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MigrationService } from './infrastructure/database/migration.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Run migrations
  const migrationService = app.get(MigrationService);
  await migrationService.runMigrations().catch((error) => {
    console.error('Migration failed:', error);
    // Continue application startup even if migrations fail
  });

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Library Management System API')
    .setDescription('API for managing a university library system')
    .setVersion('1.0')
    .addTag('books', 'Book related operations')
    .addTag('users', 'User related operations')
    .addTag('loans', 'Loan management operations')
    .addTag('reports', 'Reports and analytics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
