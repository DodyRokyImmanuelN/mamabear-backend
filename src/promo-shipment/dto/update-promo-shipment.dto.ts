import { PartialType } from '@nestjs/swagger';
import { CreatePromoShipmentDto } from './create-promo-shipment.dto';

export class UpdatePromoShipmentDto extends PartialType(CreatePromoShipmentDto) {}
