import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Endpoint Giám sát Sức khỏe Đa tầng (Liveness & Readiness probe)
   * GET /api/v1/health (thực thi SELECT 1 kiểm tra kết nối PostgreSQL)
   */
  @Get()
  async check(@Res() res: Response) {
    const startTime = Date.now();
    let dbStatus = 'connected';
    let dbError: string | null = null;

    try {
      // Thực hiện truy vấn nhẹ SELECT 1 để kiểm tra kết nối CSDL thực tế
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      dbStatus = 'disconnected';
      dbError = err?.message || 'Database connection error';
    }

    const latency = Date.now() - startTime;
    const isHealthy = dbStatus === 'connected';

    const responsePayload = {
      status: isHealthy ? 'ok' : 'degraded',
      service: 'BrewLite API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbStatus,
          latencyMs: latency,
          ...(dbError ? { error: dbError } : {}),
        },
        memory: {
          rssBytes: process.memoryUsage().rss,
          heapUsedBytes: process.memoryUsage().heapUsed,
        },
      },
    };

    return res
      .status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
      .json(responsePayload);
  }
}
