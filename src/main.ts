// src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './presentation/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Set up structured logging
  app.useLogger(app.get(Logger));

  // Set up global exception filter
  // PinoLogger is request-scoped, so we create filter without logger for now
  // The filter will get the logger from the request context when needed
  app.useGlobalFilters(new AllExceptionsFilter(null));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('SOOFT Technology Backend Challenge')
    .setDescription(
      'API para gestión de empresas y seguimiento de transferencias con arquitectura hexagonal',
    )
    .setVersion('1.0')
    .addTag('companies', 'Gestión de empresas PYME y Corporativas')
    .addTag('reports', 'Reportes con vistas materializadas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const appLogger = app.get(Logger);
  appLogger.log(`Application is running on: http://localhost:${port}`);
  appLogger.log(`Swagger documentation: http://localhost:${port}/api`);
  appLogger.log(`Health check: http://localhost:${port}/health`);
  appLogger.log(`Metrics: http://localhost:${port}/metrics`);
}

bootstrap();
