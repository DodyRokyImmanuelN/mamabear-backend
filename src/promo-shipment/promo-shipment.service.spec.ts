import { Test, TestingModule } from '@nestjs/testing';
import { PromoShipmentService } from './promo-shipment.service';
import { PromoShipmentRepository } from './promo-shipment.repository';
import { PinoLogger } from 'pino-nestjs';

describe('PromoShipmentService', () => {
  let service: PromoShipmentService;

  const mockRepo = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOneByCode: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    checkPromoUsage: jest.fn(),
    usePromo: jest.fn(),
  };

  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromoShipmentService,
        { provide: PromoShipmentRepository, useValue: mockRepo },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PromoShipmentService>(PromoShipmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
