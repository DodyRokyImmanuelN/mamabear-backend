import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ProductUtils } from '@/product-utils/product-utils';
import { EmbeddingsService } from '@/embeddings/embeddings.service';

describe('SearchService', () => {
  let service: SearchService;

  const mockPrisma = {
    product: { findMany: jest.fn() },
    productVariant: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
  };

  const mockProductUtils = {};

  const mockEmbeddingsService = {
    generateEmbeddingFromString: jest.fn(),
    embeddingArrayToString: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProductUtils, useValue: mockProductUtils },
        { provide: EmbeddingsService, useValue: mockEmbeddingsService },
      ],
    }).compile();


    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
