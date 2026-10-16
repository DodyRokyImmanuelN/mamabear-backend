import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { PromoShipmentService } from './promo-shipment.service';
import { CreatePromoShipmentDto } from './dto/create-promo-shipment.dto';
import { UpdatePromoShipmentDto } from './dto/update-promo-shipment.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/generated/prisma';

@ApiTags('promo shipment (admin)')
@Controller('admin/promo-shipment')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.ADMIN, Role.SUPERADMIN])
@ApiBearerAuth('JwtAuthGuard')
export class PromoShipmentAdminController {
  constructor(private readonly promoShipmentService: PromoShipmentService) {}

  @ApiOperation({summary: 'Create a shipment promo'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Promo MAMABEAR has successfully created`,
        data: '{ promo shipment details }',
      }
    }
  })
  @ApiResponse({status: 400, description: 'Bad Request'})
  @Post()
  async create(@Body() createPromoShipmentDto: CreatePromoShipmentDto) {
    const result = await this.promoShipmentService.create(createPromoShipmentDto)
    return result;
  }

  @ApiOperation({summary: 'Gets all shipment promos'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Fetched 3 promos`,
        data: '[{ promo shipment details }]',
      }
    }
  })
  @Get()
  async fetchAll() {
    const result = await this.promoShipmentService.findAll()
    return result;
  }

  @ApiOperation({summary: 'Gets a shipment promo by promo code'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Fetched promo with code MAMABEAR `,
        data: '{ promo shipment details }',
      }
    }
  })
  @ApiResponse({status: 404, description: 'Promo with said code not found'})
  @Get(':code')
  async fetchOne(@Param('code') code: string) {
    const result = await this.promoShipmentService.findOne(code)
    return result;
  }

  @ApiOperation({summary: 'Update a shipment promo'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Updated promo with code MAMABEAR`,
        data: '{ updated promo shipment details }',
      }
    }
  })
  @ApiResponse({status: 400, description: 'Bad Request'})
  @Patch(':code')
  async update(@Param('code') code: string, @Body() updatePromoShipmentDto: UpdatePromoShipmentDto) {
    const result = await this.promoShipmentService.update(code, updatePromoShipmentDto);
    return result;
  }

  @ApiOperation({summary: 'Delete a shipment promo'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Deleted promo with code MAMABEAR `,
        data: '{ deleted promo shipment details}',
      }
    }
  })
  @ApiResponse({status: 400, description: 'Bad Request'})
  @Delete(':code')
  async remove(@Param('code') code: string) {
    const result = await this.promoShipmentService.remove(code)
    return result;
  }
}
