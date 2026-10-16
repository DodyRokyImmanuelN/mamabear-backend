import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { AdminActivityLogService } from '@/activity-log/admin-activity-log.service';

@ApiTags('users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.SUPERADMIN])
export class SuperAdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly activityLogService: AdminActivityLogService,
  ) {}

  @ApiOperation({summary: 'Creates a new user/account'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: 'User created successfully',
        data: '{ account details }',
      }
    }
  })
  @Post()
  async create(@Req() req: any, @Body() createUserDto: CreateUserDto) {
    const result = await this.usersService.create(createUserDto);
    if (result.success) {
      this.activityLogService.log(req.user.sub, 'CREATE', 'User', result.data.id);
    }
    return result;
  }

  @ApiOperation({summary: 'Deletes an existing user/account by id'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: 'User deleted successfully',
        data: '{ account details }',
      }
    }
  })
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    if(req.user.sub === id) {
        throw new ForbiddenException('Cannot self delete current logged in user!');
    }
    const result = await this.usersService.remove(req.user, id);
    if (result.success) {
      this.activityLogService.log(req.user.sub, 'DELETE', 'User', id);
    }
    return result;
  }

  @ApiOperation({summary: 'Updates a user\'s role by id'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `User role updated to MEGAADMIN`,
        data: '{ account details }',
      }
    }
  })
  @Put(':id/role')
  async updateRole(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const result = await this.usersService.updateRole(id, dto, {
      id: req.user.sub,
      role: req.user.role,
    });
    if (result.success) {
      this.activityLogService.log(req.user.sub, 'UPDATE_ROLE', 'User', id);
    }
    return result;
  }

  @ApiOperation({summary: 'Block/Reactivates admin/user\'s account'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `User blocked / reactivated successfully`,
        data: '{ account details }',
      }
    }
  })
  @Put(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const result = await this.usersService.updateStatus(id, dto, {
      id: req.user.sub,
      role: req.user.role,
    });
    if (result.success) {
      this.activityLogService.log(req.user.sub, 'UPDATE_STATUS', 'User', id);
    }
    return result;
  }
}
