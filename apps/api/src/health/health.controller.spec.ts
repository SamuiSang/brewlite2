import { HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrisma: any;
  let mockResponse: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    controller = new HealthController(mockPrisma);
  });

  it('should return HTTP 200 and status ok when DB is connected', async () => {
    await controller.check(mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ok',
        checks: expect.objectContaining({
          database: expect.objectContaining({ status: 'connected' }),
        }),
      }),
    );
  });

  it('should return HTTP 503 and status degraded when DB fails', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection lost'));

    await controller.check(mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'degraded',
        checks: expect.objectContaining({
          database: expect.objectContaining({ status: 'disconnected' }),
        }),
      }),
    );
  });
});
