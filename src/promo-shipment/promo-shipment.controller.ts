import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { PromoShipmentService } from './promo-shipment.service';
import { UsePromoShipmentDto } from './dto/use-promo-shipment.dto';
import { UpdatePromoShipmentDto } from './dto/update-promo-shipment.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';

@ApiTags('promo shipment')
@Controller('promo-shipment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JwtAuthGuard')
export class PromoShipmentController {
  constructor(private readonly promoShipmentService: PromoShipmentService) {}

  @ApiOperation({summary: 'Validates shipment promo usage.'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Promo Mamabear with code MAMABEAR10 has successfully used`,
        data: '{ promo usage details }',
      }
    }
  })
  @ApiResponse({status: 400, description: 'Bad Request, also if promo does not exist'})
  @Post()
  async use(@Req() req: any, @Body() promoCode: UsePromoShipmentDto) {
    const result = await this.promoShipmentService.usePromo(req.user.sub, promoCode.code)
    return result;
  }

  @ApiOperation({summary: 'Validates shipment promo usage.'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Promo Mamabear with code MAMABEAR10 has successfully used`,
        data: '{ promo usage details }',
      }
    }
  })
  @ApiResponse({status: 404, description: 'Promo does not exist'})
  @ApiResponse({status: 400, description: 'Promo has already been used'})
  @Get(':code')
  async check(@Param('code') code: string, @Req() req: any) {
    const result = await this.promoShipmentService.checkPromoUsage(req.user.sub, code)
    return result;
  }
}
