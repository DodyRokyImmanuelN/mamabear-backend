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

  describe('classifyMessage', () => {
    it.each([
      ['MEDIS', 'MEDIS'],
      ['TOKO', 'TOKO'],
      ['DILUAR_TOPIK', 'DILUAR_TOPIK'],
      ['DILUAR TOPIK', 'DILUAR_TOPIK'],
      ['AMAN', 'AMAN'],
      ['medis.', 'MEDIS'],
      ['tidak yakin', 'AMAN'],
    ])('maps model output %p to %s', async (output, expected) => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      const service = new AiChatService();
      (service as any).openrouter.chat.send.mockResolvedValueOnce({
        choices: [{ message: { content: output } }],
      });

      await expect(service.classifyMessage('pertanyaan')).resolves.toBe(
        expected,
      );
    });

    it('waits at most 15s for the guardrail and 60s for other calls', async () => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      const delays: number[] = [];
      jest.spyOn(global, 'setTimeout').mockImplementation(((
        _fn: () => void,
        ms: number,
      ) => {
        delays.push(ms);
        return 0;
      }) as any);
      const service = new AiChatService();
      const send = (service as any).openrouter.chat.send;
      send.mockResolvedValue({ choices: [{ message: { content: 'AMAN' } }] });

      await service.classifyMessage('halo');
      await service.complete([{ role: 'user', content: 'test' }], 'some-model');

      expect(delays).toEqual([15_000, 60_000]);
      jest.restoreAllMocks();
    });

    it('asks for a short answer without reasoning', async () => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      const service = new AiChatService();
      const send = (service as any).openrouter.chat.send;
      send.mockResolvedValueOnce({
        choices: [{ message: { content: 'AMAN' } }],
      });

      await service.classifyMessage('halo');
      expect(send).toHaveBeenCalledWith({
        chatRequest: expect.objectContaining({
          reasoning: { effort: 'none' },
          maxTokens: 10,
        }),
      });
    });
  });

    describe('checkIsMedicalQuestion', () => {
    it.each(['MEDIS', 'medis', ' MEDIS ', 'Hmm, Medis?', 'Klasifikasi: MEDIS.'])(
      'returns true when model answers %p',
      async (content) => {
        process.env.OPENROUTER_API_KEY = 'test-key';
        const service = new AiChatService();
        (service as any).openrouter.chat.send.mockResolvedValueOnce({
          choices: [{ message: { content } }],
        });
        await expect(service.checkIsMedicalQuestion('ada yang tercampur obat?')).resolves.toBe(true);
      },
    );

    it.each(['AMAN', 'aman', 'Aman.', 'Saya tidak yakin'])(
      'returns false when model answers %p',
      async (content) => {
        process.env.OPENROUTER_API_KEY = 'test-key';
        const service = new AiChatService();
        (service as any).openrouter.chat.send.mockResolvedValueOnce({
          choices: [{ message: { content } }],
        });
        await expect(service.checkIsMedicalQuestion('ada produk pelancar ASI?')).resolves.toBe(false);
      },
    );

     it.each(['TOKO', 'DILUAR_TOPIK', '', '   '])(
      'returns false when model answers other category or empty string %p',
      async (content) => {
        process.env.OPENROUTER_API_KEY = 'test-key';
        const service = new AiChatService();
        (service as any).openrouter.chat.send.mockResolvedValueOnce({
          choices: [{ message: { content } }],
        });
        await expect(service.checkIsMedicalQuestion('pertanyaan umum')).resolves.toBe(false);
      },
    );
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

  describe('retry on transient provider errors', () => {
    const sdkError = (name: string, statusCode?: number) =>
      Object.assign(new Error(name), { name, statusCode });
    const ok = { choices: [{ message: { content: 'AMAN' } }] };

    // Retry back-off delays (1-2s) fire immediately; request timeouts (15s/60s) never fire
    beforeEach(() => {
      process.env.OPENROUTER_API_KEY = 'test-key';
      jest.spyOn(global, 'setTimeout').mockImplementation(((
        fn: () => void,
        ms: number,
      ) => {
        if (ms < 10_000) fn();
        return 0;
      }) as any);
    });

    afterEach(() => jest.restoreAllMocks());

    it.each([
      [
        'provider overload (ResponseValidationError)',
        sdkError('ResponseValidationError'),
      ],
      ['server error (5xx)', sdkError('OpenRouterError', 503)],
    ])('retries after a %s and returns the answer', async (_label, error) => {
      const service = new AiChatService();
      const send = (service as any).openrouter.chat.send;
      send.mockRejectedValueOnce(error).mockResolvedValueOnce(ok);

      await expect(
        service.complete([{ role: 'user', content: 'test' }], 'some-model'),
      ).resolves.toBe('AMAN');
      expect(send).toHaveBeenCalledTimes(2);
    });

    it('does not retry when the daily quota is exhausted (429)', async () => {
      const service = new AiChatService();
      const send = (service as any).openrouter.chat.send;
      send.mockRejectedValueOnce(sdkError('TooManyRequestsResponseError', 429));

      await expect(
        service.complete([{ role: 'user', content: 'test' }], 'some-model'),
      ).rejects.toThrow();
      expect(send).toHaveBeenCalledTimes(1);
    });

    it('gives up after 3 attempts', async () => {
      const service = new AiChatService();
      const send = (service as any).openrouter.chat.send;
      send.mockRejectedValue(sdkError('ResponseValidationError'));

      await expect(
        service.complete([{ role: 'user', content: 'test' }], 'some-model'),
      ).rejects.toThrow();
      expect(send).toHaveBeenCalledTimes(3);
    });

    it('stops waiting after the timeout without retrying', async () => {
      jest.spyOn(global, 'setTimeout').mockImplementation(((fn: () => void) => {
        fn();
        return 0;
      }) as any);
      const service = new AiChatService();
      const send = (service as any).openrouter.chat.send;
      send.mockReturnValue(new Promise(() => {}));

      await expect(
        service.complete([{ role: 'user', content: 'test' }], 'some-model'),
      ).rejects.toMatchObject({ name: 'AiTimeoutError' });
      expect(send).toHaveBeenCalledTimes(1);
    });
  });
});
