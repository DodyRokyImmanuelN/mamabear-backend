import { Test, TestingModule } from '@nestjs/testing';
import { PromoShipmentService } from './promo-shipment.service';

describe('PromoShipmentService', () => {
  let service: PromoShipmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromoShipmentService],
    }).compile();

    service = module.get<PromoShipmentService>(PromoShipmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
