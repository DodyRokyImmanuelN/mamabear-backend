import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { PromoShipmentService } from './promo-shipment.service';
import { CreatePromoShipmentDto } from './dto/create-promo-shipment.dto';
import { UpdatePromoShipmentDto } from './dto/update-promo-shipment.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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

  @Post()
  async create(@Body() createPromoShipmentDto: CreatePromoShipmentDto) {
    const result = await this.promoShipmentService.create(createPromoShipmentDto)
    return result;
  }

  @Get()
  async fetchAll() {
    const result = await this.promoShipmentService.findAll()
    return result;
  }

  @Get(':code')
  async fetchOne(@Param('code') code: string) {
    const result = await this.promoShipmentService.findOne(code)
    return result;
  }

  @Patch(':code')
  async update(@Param('code') code: string, @Body() updatePromoShipmentDto: UpdatePromoShipmentDto) {
    const result = await this.promoShipmentService.update(code, updatePromoShipmentDto);
    return result;
  }

  @Delete(':code')
  async remove(@Param('code') code: string) {
    const result = await this.promoShipmentService.remove(code)
    return result;
  }
}
