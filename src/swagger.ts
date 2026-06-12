import { INestApplication } from '@nestjs/common';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import { isProductionEnv } from 'src/common/utils/redact-sensitive.util';

export function setupSwagger(app: INestApplication): void {
  const enabled =
    !isProductionEnv() ||
    (process.env.ENABLE_SWAGGER || '').trim().toLowerCase() === 'true';

  if (!enabled) {
    return;
  }

  const local = {
    url: process.env.APP_BASE_URL || 'http://localhost:3000/',
  };
  const production = {
    url: process.env.PUBLIC_API_BASE_URL || '',
  };

  const config = new DocumentBuilder()
    .setTitle('Documentación del Sistema Template')
    .setDescription('Sistema de Template')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'authorization',
      },
      'authorization',
    )
    .build();

  const options: SwaggerCustomOptions = {
    swaggerOptions: {
      docExpansion: 'none',
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
    },
  };

  config.servers = [local, production].filter((server) => server.url);
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, options);
}
