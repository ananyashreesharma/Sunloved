import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`
  🚀 Sunloved Backend Server is running!
  
  📍 Local:            http://localhost:${port}
  🌐 API Base:         http://localhost:${port}/api
  🎯 Health Check:     http://localhost:${port}/api/health
  
  📝 Environment:      ${process.env.NODE_ENV || 'development'}
  🔗 Frontend URL:     ${process.env.FRONTEND_URL || 'http://localhost:3000'}
  `);
}

bootstrap();

