import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}
  
  @ApiOperation({summary: 'Checks API health'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 200,
        "message": [
            "No message specified"
        ],
        "data": {
            "status": "healthy",
            "service": {
                "name": "mamabear-backend",
                "version": "0.0.1",
                "environment": "development",
                "uptimeSeconds": 62,
                "timestamp": "2026-10-15T03:02:39.162Z"
            },
            "checks": {
                "database": {
                    "status": "healthy",
                    "latencyMs": 30,
                    "message": "Connection successful"
                },
                "storage": {
                    "status": "healthy",
                    "latencyMs": 28,
                    "message": "S3 accessible"
                }
            },
            "summary": {
                "healthy": 2,
                "degraded": 0,
                "unhealthy": 0
            }
        },
        "timestamp": "2026-10-15T03:02:39.162Z"
      }
    }
  })
  @Get()
  async health() {
    return await this.healthService.getHealth();
  }
}
