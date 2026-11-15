import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tự động tương thích với các request từ Postman hoặc client không kèm tiền tố /api/v1
  app.use((req: any, _res: any, next: any) => {
    if (
      typeof req.url === 'string' &&
      !req.url.startsWith('/api/v1') &&
      req.url !== '/favicon.ico'
    ) {
      req.url = '/api/v1' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
    next();
  });

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.CORS_ORIGIN || 'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT || process.env.API_PORT || 3001);
  await app.listen(port, '0.0.0.0');
}

bootstrap();
