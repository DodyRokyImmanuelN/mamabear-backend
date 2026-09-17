import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { PromoShipmentService } from './promo-shipment.service';
import { UsePromoShipmentDto } from './dto/use-promo-shipment.dto';
import { UpdatePromoShipmentDto } from './dto/update-promo-shipment.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';

@ApiTags('promo shipment')
@Controller('promo-shipment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JwtAuthGuard')
export class PromoShipmentController {
  constructor(private readonly promoShipmentService: PromoShipmentService) {}

  @Post()
  async use(@Req() req: any, @Body() promoCode: UsePromoShipmentDto) {
    const result = await this.promoShipmentService.usePromo(req.user.sub, promoCode.code)
    return result;
  }

  @Get(':code')
  async check(@Param('code') code: string, @Req() req: any) {
    const result = await this.promoShipmentService.checkPromoUsage(req.user.sub, code)
    return result;
  }
}
