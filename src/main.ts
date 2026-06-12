import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import 'dotenv/config';
import * as express from 'express';
import helmet from 'helmet';

import { HttpExceptionFilter } from 'src/exceptions/http.exception';
import { AppModule } from './app.module';
import { buildCorsOptions } from './core/config/cors';
import { setupSwagger } from './swagger';
import { validateRequiredAuthEnv } from './config/validate-env';

async function bootstrap() {
  validateRequiredAuthEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  app.enableCors(buildCorsOptions());
  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ extended: true, limit: '200mb' }));
  app.use(helmet());
  setupGlobalPipes(app);
  app.useGlobalFilters(new HttpExceptionFilter());

  setupSwagger(app);

  const port = Number(configService.get('PORT')) || 3000;
  await app.listen(port);
}

function setupGlobalPipes(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al iniciar la aplicación: ${message}`);
  process.exit(1);
});
