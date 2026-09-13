import { AiChatService } from './ai-chat.service';

describe('AiChatService', () => {
  const originalApiKey = process.env.OPENROUTER_API_KEY;

  afterEach(() => {
    process.env.OPENROUTER_API_KEY = originalApiKey;
  });

  it('should be defined', () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    const service = new AiChatService();
    expect(service).toBeDefined();
  });

  it('should throw if OPENROUTER_API_KEY is missing', () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(() => new AiChatService()).toThrow('OPENROUTER_API_KEY');
  });

  describe('checkIsMedicalQuestion', () => {
    it('returns true when the model answers MEDIS', async () => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      const service = new AiChatService();
      (service as any).openrouter.chat.send.mockResolvedValueOnce({
        choices: [{ message: { content: 'MEDIS' } }],
      });

      const result = await service.checkIsMedicalQuestion('aman gak diminum pas hamil?');
      expect(result).toBe(true);
    });

    it('returns false when the model answers AMAN', async () => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      const service = new AiChatService();
      (service as any).openrouter.chat.send.mockResolvedValueOnce({
        choices: [{ message: { content: 'AMAN' } }],
      });

      const result = await service.checkIsMedicalQuestion('ada yang rasa coklat gak?');
      expect(result).toBe(false);
    });
  });

  describe('complete', () => {
    it('returns the content string from the model response', async () => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      const service = new AiChatService();
      (service as any).openrouter.chat.send.mockResolvedValueOnce({
        choices: [{ message: { content: 'Halo, ini jawabannya.' } }],
      });

      const result = await service.complete(
        [{ role: 'user', content: 'test' }],
        'some-model',
      );
      expect(result).toBe('Halo, ini jawabannya.');
    });

    it('throws when the response content is not a string', async () => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      const service = new AiChatService();
      (service as any).openrouter.chat.send.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      await expect(
        service.complete([{ role: 'user', content: 'test' }], 'some-model'),
      ).rejects.toThrow();
    });
  });
});
