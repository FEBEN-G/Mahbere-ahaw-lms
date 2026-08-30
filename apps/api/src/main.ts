import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { validateEnvironment } from './config/env.validation';

async function bootstrap() {
  validateEnvironment();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

  app.useLogger(logger);
  app.use(helmet());
  app.use(
    compression({
      threshold: 1024,
      // Keep file streams uncompressed so browsers can download binaries correctly.
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        const contentType = String(res.getHeader('Content-Type') ?? '');
        if (
          contentType.includes('application/pdf') ||
          contentType.includes('octet-stream') ||
          contentType.includes('multipart/')
        ) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );
  app.enableCors({
    origin: configService.get<string[]>('api.corsOrigins'),
    credentials: true,
  });
  app.setGlobalPrefix(configService.get<string>('api.prefix') ?? 'api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mahbere Ahaw Seminary LMS API')
    .setDescription('Distance Learning Management System REST API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('api.port') ?? 4000;
  await app.listen(port);
  logger.log(`API listening on port ${port}`);
}

void bootstrap();
