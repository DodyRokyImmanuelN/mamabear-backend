import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HighlightsService } from './highlights.service';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { UpdateHighlightDto } from './dto/update-highlight.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { AdminActivityLogService } from '@/activity-log/admin-activity-log.service';

@ApiTags('highlights (admin)')
@Controller('admin/highlights')
@UseGuards(new JwtAuthGuard())
@Roles([Role.ADMIN])
@ApiBearerAuth('JwtAuthGuard')
export class HighlightsAdminController {
  constructor(
    private readonly highlightsService: HighlightsService,
    private readonly activityLogService: AdminActivityLogService,
  ) {}

  @ApiOperation({ summary: 'Creates a new highlight'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Created highlight jamu-herbal`,
        data: '{ Highlight details and product details }',
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Highlight already exist'
  })
  @Post()
  async create(@Req() req: any, @Body() createHighlightDto: CreateHighlightDto) {
    const result = await this.highlightsService.create(createHighlightDto);
    if (result.success) {
      this.activityLogService.log(req.user.sub, 'CREATE', 'Highlight', String(result.data.id));
    }
    return result;
  }

  @ApiOperation({ summary: 'Updates a highlight'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Highlight jamu-herbal updated successfully`,
        data: '{ Highlight details and product details }',
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Highlight already exist or Highlight not found'
  })
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateHighlightDto: UpdateHighlightDto,
  ) {
    const result = await this.highlightsService.update(+id, updateHighlightDto);
    if (result.success) {
      this.activityLogService.log(req.user.sub, 'UPDATE', 'Highlight', id);
    }
    return result;
  }

  @ApiOperation({ summary: 'Updates a highlight'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `jamu-herbal deleted successfully`,
        data: '{ Highlight details and product details }',
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Highlight not found or Highlight has products'
  })
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const result = await this.highlightsService.remove(+id);
    if (result.success) {
      this.activityLogService.log(req.user.sub, 'DELETE', 'Highlight', id);
    }
    return result;
  }
}
