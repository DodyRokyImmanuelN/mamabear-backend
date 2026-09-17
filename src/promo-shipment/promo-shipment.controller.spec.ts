import { Test, TestingModule } from '@nestjs/testing';
import { PromoShipmentController } from './promo-shipment-admin.controller';
import { PromoShipmentService } from './promo-shipment.service';

describe('PromoShipmentController', () => {
  let controller: PromoShipmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromoShipmentController],
      providers: [PromoShipmentService],
    }).compile();

    controller = module.get<PromoShipmentController>(PromoShipmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
