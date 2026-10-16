import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { format } from 'fast-csv';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';
import { ProductReportQueryDto } from './dto/product-report-query.dto';
import {
  PagePaginationMetaDto,
  PagePaginationResponseDto,
} from '@/common/dto/response/page-pagination.response.dto';
import { Response } from 'express';


@ApiTags('reports (admin)')
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.ADMIN, Role.SUPERADMIN])
@ApiBearerAuth('JwtAuthGuard')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({summary: 'Gets Admin Dashboard data'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 200,
        "message": [
          "Dashboard"
        ],
        "data": {
          "getRevenueOrders": [],
          "totalRevenue": 0,
          "getOrderCount": 0,
          "getCustomerCount": 4,
          "getProductCount": 5,
          "getRecentOrder": [],
          "getLowStockProducts": [
            {
              "name": "Cokelat",
              "stock": 100,
              "product": {
                "name": "MamaBear AlmonMix Isi 6 Sachet - Minuman Serbuk dengan Almond - Kaya Nutrisi Untuk Ibu Menyusui BPOM HALAL"
              }
            },
            {
              "name": "Choco Hazelnut",
              "stock": 100,
              "product": {
                "name": "MamaBear AlmonMix Isi 6 Sachet - Minuman Serbuk dengan Almond - Kaya Nutrisi Untuk Ibu Menyusui BPOM HALAL"
              }
            }
          ],
          "getTopSellingProducts": [
            {
              "name": "MamaBear AlmonMix Isi 6 Sachet - Minuman Serbuk dengan Almond - Kaya Nutrisi Untuk Ibu Menyusui BPOM HALAL",
              "totalSold": 0,
              "variants": [
                {
                  "name": "Cokelat",
                  "priceIdr": "80000"
                },
                {
                  "name": "Choco Hazelnut",
                  "priceIdr": "80000"
                }
              ]
            }
          ]
        },
        "timestamp": "2026-10-16T03:45:38.650Z"
      }
    }
  })
  @Get('dashboard')
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  @ApiOperation({summary: 'Gets Sales data'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 200,
        "message": [
          "Sales Report"
        ],
        "data": {
          "totalRevenue": 0,
          "orderCount": 0,
          "avgOrderValue": 0,
          "trends": [],
          "topProducts": []
        },
        "timestamp": "2026-10-16T06:24:23.157Z"
      }
    }
  })
  @Get('sales')
  getSalesReport(@Query() query: SalesReportQueryDto) {
    return this.reportsService.getSalesReport(query);
  }

  @ApiOperation({summary: 'Gets Product Performance Report data'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        "success": true,
        "statusCode": 200,
        "message": [
          "Product Performance Report"
        ],
        "data": [],
        "timestamp": "2026-10-16T06:25:00.804Z"
      }
    }
  })
  @Get('products')
  async getProductPerformance(@Query() query: SalesReportQueryDto) {
    return this.reportsService.getProductPerformance(query);
  }

  @ApiOperation({summary:'Exports Product Performance Report to CSV'})
  @Get('products/export')
  async exportProducts(
    @Query() query: SalesReportQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.reportsService.getProductPerformance(query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=product-report.csv',
    );

    const csvStream = format({
      headers: true, 
    });

    csvStream.pipe(res);

    result.data.forEach((row) => {
      csvStream.write(row);
    });

    csvStream.end();
  }

  @ApiOperation({summary:'Exports Sales Report to CSV'})
  @Get('sales/export')
  async exportSales(@Query() query: SalesReportQueryDto, @Res() res: Response) {
    const result = await this.reportsService.getSalesReport(query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales-report.csv',
    );

    const csvStream = format({
      headers: true,
    });

    csvStream.pipe(res);

    csvStream.write({
      totalRevenue: result.data.totalRevenue,
      orderCount: result.data.orderCount,
      avgOrderValue: result.data.avgOrderValue,
    });

    csvStream.end();
  }
}
