import { Module } from '@nestjs/common';
import { PromoShipmentController } from './promo-shipment.controller';
import { PromoShipmentAdminController } from './promo-shipment-admin.controller';
import { PromoShipmentService } from './promo-shipment.service';
import { PromoShipmentRepository } from './promo-shipment.repository';


@Module({
  controllers: [PromoShipmentAdminController, PromoShipmentController],
  providers: [PromoShipmentService, PromoShipmentRepository],
})
export class PromoShipmentModule {}
