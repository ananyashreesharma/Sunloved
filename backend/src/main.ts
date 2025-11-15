import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend (accept multiple ports for dev)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5000',
    process.env.FRONTEND_URL || 'http://localhost:3001',
  ];
  
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert types automatically
      },
    }),
  );

  // Global exception filter (handles all errors consistently)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global response transform interceptor (wraps all responses in { data, meta, error })
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.PORT || 2000;
  await app.listen(port);

  console.log(`
  🚀 Sunloved Backend Server is running!
  
  📍 Local:            http://localhost:${port}
  🌐 API Base:         http://localhost:${port}/api
  🎯 Health Check:     http://localhost:${port}/api/health
  
  📝 Environment:      ${process.env.NODE_ENV || 'development'}
  🔗 Frontend URL:     ${process.env.FRONTEND_URL || 'http://localhost:5000'}
  `);
}

bootstrap();

