import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'Sunloved Backend API is running! 🚀',
    };
  }

  /** Confirms Postgres is reachable after `prisma migrate deploy` (or equivalent). */
  @Get('health/db')
  async databaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown database error';
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
        message,
      });
    }
  }
}

