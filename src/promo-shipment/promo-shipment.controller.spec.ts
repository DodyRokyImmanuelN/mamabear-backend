import { Test, TestingModule } from '@nestjs/testing';
import { PromoShipmentController } from './promo-shipment.controller';
import { PromoShipmentService } from './promo-shipment.service';

describe('PromoShipmentController', () => {
  let controller: PromoShipmentController;

  const mockService = {
    checkPromoUsage: jest.fn(),
    usePromo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromoShipmentController],
      providers: [{ provide: PromoShipmentService, useValue: mockService }],
    }).compile();

    controller = module.get<PromoShipmentController>(PromoShipmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
