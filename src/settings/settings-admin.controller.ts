import { Controller, Get, Param, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { AdminActivityLogService } from '@/activity-log/admin-activity-log.service';

@ApiTags('settings (admin)')
@Controller('admin/settings')
@UseGuards(new JwtAuthGuard())
@Roles([Role.ADMIN])
@ApiBearerAuth('JwtAuthGuard')
export class SettingsAdminController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly activityLogService: AdminActivityLogService,
  ) {}

  @ApiOperation({summary: 'Gets all settings details'})
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
        "data": "[{ settings details }]"
      }
    }
  })
  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @ApiOperation({summary: 'Gets a setting details by key'})
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
        "data": "{ settings details }"
      }
    }
  })
  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @ApiOperation({summary: 'Updates a setting details by key'})
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
        "data": "{ settings details }"
      }
    }
  })
  @Put(':key')
  async update(@Req() req: any, @Param('key') key: string, @Body() dto: UpdateSettingDto) {
    const result = await this.settingsService.upsertByKey(key, dto);
    this.activityLogService.log(req.user.sub, 'UPDATE', 'Setting', key);
    return result;
  }
}
