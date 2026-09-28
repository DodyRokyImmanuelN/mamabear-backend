import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingsService } from './embeddings.service';

describe('EmbeddingsService', () => {
  let service: EmbeddingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmbeddingsService],
    }).compile();

    service = module.get<EmbeddingsService>(EmbeddingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('stops waiting for an embedding after the timeout', async () => {
    jest.spyOn(global, 'setTimeout').mockImplementation(((fn: () => void) => {
      fn();
      return 0;
    }) as any);
    (service as any).openrouter.embeddings.generate.mockReturnValueOnce(
      new Promise(() => {}),
    );

    await expect(
      service.generateEmbeddingFromString('pelancar ASI'),
    ).rejects.toMatchObject({ name: 'AiTimeoutError' });
    jest.restoreAllMocks();
  });
});
