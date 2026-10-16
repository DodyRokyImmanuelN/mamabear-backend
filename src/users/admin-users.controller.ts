import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';

@ApiTags('users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.ADMIN, Role.SUPERADMIN])
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({summary: 'Gets all admins\' info'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Returned 5 admin users (page 1 of 1)`,
        data: '[{ users info }]',
      }
    }
  })
  @Get()
  findAllAdmin(@Query() query: AdminUsersQueryDto) {
    return this.usersService.findAllAdmin(query);
  }

  @ApiOperation({summary: 'Gets a user\'s info by id'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Found user with id 67`,
        data: '{ user info }',
      }
    }
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

}
