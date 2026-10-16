import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiParam, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { AdminCustomersQueryDto } from './dto/admin-customers-query.dto';
import { AdminCustomersListResponseDto } from './dto/admin-customers-list-response.dto';
import { AdminCustomerDetailDto } from './dto/admin-customer-detail.dto';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';
import { AdminActivityLogService } from '@/activity-log/admin-activity-log.service';

@ApiTags('customers (admin)')
@Controller('admin/customers')
@UseGuards(new JwtAuthGuard())
@Roles([Role.ADMIN, Role.SUPERADMIN])
@ApiBearerAuth('JwtAuthGuard')
export class AdminCustomersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly activityLogService: AdminActivityLogService,
  ) {}

  @ApiOperation({summary: 'Exports customers data to CSV'})
  @Get('export')
  async export(@Query() query: AdminCustomersQueryDto, @Res() res: Response) {
    await this.usersService.exportCustomersToCSV(query, res);
  }

  
  @ApiOperation({summary: 'Gets all customers info'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Returned 20 customers (page 1 of 6)`,
        data: '[{ customers info }]',
      }
    }
  })
  @Get()
  @ApiOkResponse({ type: AdminCustomersListResponseDto })
  findAll(@Query() query: AdminCustomersQueryDto) {
    return this.usersService.findCustomers(query);
  }

  @ApiOperation({summary: 'Gets a customers info'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Found customer detail for id 67`,
        data: '{ customers info }',
      }
    }
  })
  @Get(':id')
  @ApiParam({ name: 'id', required: true })
  @ApiOkResponse({ type: AdminCustomerDetailDto })
  findOne(@Param('id') id: string) {
    return this.usersService.findCustomerDetail(id);
  }

  @ApiOperation({summary: 'Block/Reactivates customer\'s account'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Customer blocked / reactivated successfully`,
        data: '{ customer info }',
      }
    }
  })
  @Put(':id/status')
  @ApiParam({ name: 'id', required: true })
  async updateCustomerStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerStatusDto,
  ) {
    const result = await this.usersService.updateCustomerStatus(id, dto);
    if (result.success) {
      this.activityLogService.log(req.user.sub, 'UPDATE_STATUS', 'Customer', id);
    }
    return result;
  }
}
