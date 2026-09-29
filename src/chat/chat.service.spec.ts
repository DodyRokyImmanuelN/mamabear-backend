import { DEFAULT_GUARDRAIL_MODEL } from './ai-chat.service';
import {
  ChatHistoryMessage,
  ChatService,
  TECHNICAL_ERROR_REPLY,
  summarizeDescription,
} from './chat.service';

describe('ChatService.generateReply routing', () => {
  const aiChatService = { classifyMessage: jest.fn(), complete: jest.fn() };
  const searchService = { findProductsBySemanticSearch: jest.fn() };
  const settingsService = { get: jest.fn() };
  const withSettings =
    (values: Record<string, string>) => (key: string, fallback?: string) =>
      values[key] ?? fallback;
  const service = new ChatService(
    aiChatService as any,
    searchService as any,
    settingsService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    settingsService.get.mockImplementation(
      withSettings({ contact_phone: '+62 812-3456-7890' }),
    );
  });

  const expectNoGeneration = () => {
    expect(searchService.findProductsBySemanticSearch).not.toHaveBeenCalled();
    expect(aiChatService.complete).not.toHaveBeenCalled();
  };

  it('redirects medical questions to WhatsApp without generating an answer', async () => {
    aiChatService.classifyMessage.mockResolvedValue('MEDIS');

    const reply = await service.generateReply('boleh diminum pas minum obat?');
    expect(reply).toContain('pertanyaan seputar kesehatan');
    expect(reply.endsWith('\n\nKONTAK ADMIN: 6281234567890')).toBe(true);
    expectNoGeneration();
  });

  it('redirects store questions to the WhatsApp admin without generating an answer', async () => {
    aiChatService.classifyMessage.mockResolvedValue('TOKO');

    const reply = await service.generateReply('ongkir ke Surabaya berapa?');
    expect(reply).toContain('admin MamaBear');
    expect(reply.endsWith('\n\nKONTAK ADMIN: 6281234567890')).toBe(true);
    expectNoGeneration();
  });

  it('declines off-topic requests without generating an answer', async () => {
    aiChatService.classifyMessage.mockResolvedValue('DILUAR_TOPIK');

    const reply = await service.generateReply('buatin puisi dong');
    expect(reply).toContain('cuma bisa bantu soal produk MamaBear');
    expectNoGeneration();
  });

  it('falls back to the default WhatsApp number when contact_phone is not set', async () => {
    aiChatService.classifyMessage.mockResolvedValue('MEDIS');
    settingsService.get.mockImplementation(withSettings({}));

    const reply = await service.generateReply('dosisnya berapa?');
    expect(reply).toContain('KONTAK ADMIN: 628888695757');
  });

  it('uses the AI models configured in settings', async () => {
    settingsService.get.mockImplementation(
      withSettings({
        ai_guardrail_model: 'custom/guard',
        ai_generation_model: ' custom/gen ',
      }),
    );
    aiChatService.classifyMessage.mockResolvedValue('AMAN');
    searchService.findProductsBySemanticSearch.mockResolvedValue({ data: [] });
    aiChatService.complete.mockResolvedValue('Halo Mama');

    await service.generateReply('halo');

    expect(aiChatService.classifyMessage).toHaveBeenCalledWith(
      'halo',
      'custom/guard',
    );
    const [, model, options] = aiChatService.complete.mock.calls[0];
    expect(model).toBe('custom/gen');
    expect(options.fallbackModel).toEqual(expect.any(String));
    expect(options.reasoningEffort).toBe('low');
  });

  it('uses the built-in models when the settings are empty or blank', async () => {
    settingsService.get.mockImplementation(
      withSettings({ ai_generation_model: '   ' }),
    );
    aiChatService.classifyMessage.mockResolvedValue('AMAN');
    searchService.findProductsBySemanticSearch.mockResolvedValue({ data: [] });
    aiChatService.complete.mockResolvedValue('Halo Mama');

    await service.generateReply('halo');

    expect(aiChatService.classifyMessage).toHaveBeenCalledWith(
      'halo',
      DEFAULT_GUARDRAIL_MODEL,
    );
    const [, model, options] = aiChatService.complete.mock.calls[0];
    expect(model).toBe(options.fallbackModel);
  });

  it('answers product questions from the retrieved products', async () => {
    aiChatService.classifyMessage.mockResolvedValue('AMAN');
    searchService.findProductsBySemanticSearch.mockResolvedValue({
      data: [
        {
          slug: 'mamabear-almonmix',
          name: 'AlmonMix',
          harga: 80000,
          deskripsi: 'Minuman almond',
        },
      ],
    });
    aiChatService.complete.mockResolvedValue(
      'Halo Mama, coba AlmonMix.\n\n**Rekomendasi produk:** mamabear-almonmix',
    );

    const reply = await service.generateReply('ada pelancar ASI?');

    expect(searchService.findProductsBySemanticSearch).toHaveBeenCalledWith({
      q: 'ada pelancar ASI?',
      limit: 5,
    });
    const [messages] = aiChatService.complete.mock.calls[0];
    expect(messages[0].content).toContain('ATURAN TOPIK:');
    expect(messages[0].content).toContain(
      'kecuali blok produk itu menyebutkannya secara eksplisit',
    );
    expect(messages[0].content).toContain('ATURAN MENGGALI KEBUTUHAN:');
    expect(messages[0].content).toContain(
      'Tulis cara pakai dan takaran persis seperti di blok produk',
    );
    expect(messages[0].content).toContain(
      'Saat merekomendasikan atau membandingkan produk, jawab ringkas',
    );
    expect(reply).toBe(
      'Halo Mama, coba AlmonMix.\n\nREKOMENDASI PRODUK: mamabear-almonmix',
    );
  });

  describe('with conversation history', () => {
    const history: ChatHistoryMessage[] = [
      { role: 'user', content: 'ada pelancar ASI?' },
      { role: 'assistant', content: 'Ada AlmonMix dan Teh Pelancar ASI.' },
      { role: 'user', content: 'yang rasanya enak apa?' },
      { role: 'assistant', content: TECHNICAL_ERROR_REPLY },
    ];

    beforeEach(() => {
      aiChatService.classifyMessage.mockResolvedValue('AMAN');
      searchService.findProductsBySemanticSearch.mockResolvedValue({
        data: [],
      });
      aiChatService.complete.mockResolvedValue('Halo Mama');
    });

    it('classifies only the current message', async () => {
      await service.generateReply('yang kapsul aja', history);
      expect(aiChatService.classifyMessage.mock.calls[0][0]).toBe(
        'yang kapsul aja',
      );
    });

    it('searches with the recent user messages plus the current one', async () => {
      await service.generateReply('yang kapsul aja', history);
      expect(searchService.findProductsBySemanticSearch).toHaveBeenCalledWith({
        q: 'ada pelancar ASI?\nyang rasanya enak apa?\nyang kapsul aja',
        limit: 5,
      });
    });

    it('uses at most the last 3 user messages for search', async () => {
      const long = ['u1', 'u2', 'u3', 'u4', 'u5'].map(
        (content): ChatHistoryMessage => ({ role: 'user', content }),
      );
      await service.generateReply('sekarang', long);
      expect(searchService.findProductsBySemanticSearch).toHaveBeenCalledWith({
        q: 'u3\nu4\nu5\nsekarang',
        limit: 5,
      });
    });

    it('sends the conversation to the model without technical-error replies', async () => {
      await service.generateReply('yang kapsul aja', history);
      const [messages] = aiChatService.complete.mock.calls[0];
      expect(messages.slice(1)).toEqual([
        { role: 'user', content: 'ada pelancar ASI?' },
        { role: 'assistant', content: 'Ada AlmonMix dan Teh Pelancar ASI.' },
        { role: 'user', content: 'yang rasanya enak apa?' },
        { role: 'user', content: 'yang kapsul aja' },
      ]);
    });

    it('shortens long earlier messages', async () => {
      await service.generateReply('lanjut', [
        { role: 'assistant', content: 'a'.repeat(1500) },
      ]);
      const [messages] = aiChatService.complete.mock.calls[0];
      expect(messages[1].content).toBe(`${'a'.repeat(1000)}...`);
    });
  });

  describe('discovery question cap', () => {
    const MUST_RECOMMEND = 'jangan bertanya lagi';
    const question = (content: string): ChatHistoryMessage[] => [
      { role: 'user', content: 'jawaban Mama' },
      { role: 'assistant', content },
    ];
    const systemPromptFor = async (history: ChatHistoryMessage[]) => {
      await service.generateReply('lanjut', history);
      return aiChatService.complete.mock.calls[0][0][0].content as string;
    };

    beforeEach(() => {
      aiChatService.classifyMessage.mockResolvedValue('AMAN');
      searchService.findProductsBySemanticSearch.mockResolvedValue({
        data: [],
      });
      aiChatService.complete.mockResolvedValue('Halo Mama');
    });

    it('lets the model keep asking below the limit', async () => {
      const history = [
        ...question('Mama sedang hamil atau menyusui?'),
        ...question('Mama lebih suka minuman atau kapsul?'),
      ];
      expect(await systemPromptFor(history)).not.toContain(MUST_RECOMMEND);
    });

    it('forces a recommendation after 3 questions', async () => {
      const history = [
        ...question('Mama sedang hamil atau menyusui?'),
        ...question('Mama lebih suka minuman atau kapsul?'),
        ...question('Mama suka rasa apa?'),
      ];
      expect(await systemPromptFor(history)).toContain(MUST_RECOMMEND);
    });

    it('only counts questions asked since the last recommendation', async () => {
      const history = [
        ...question('Mama sedang hamil atau menyusui?'),
        ...question('Mama lebih suka minuman atau kapsul?'),
        ...question(
          'Coba AlmonMix ya.\n\nREKOMENDASI PRODUK: mamabear-almonmix-isi-6-sachet',
        ),
        ...question('Ada lagi yang Mama cari?'),
      ];
      expect(await systemPromptFor(history)).not.toContain(MUST_RECOMMEND);
    });
  });
});

describe('summarizeDescription', () => {
  it('truncates long text at the last space and appends ellipsis', () => {
    const long = Array(300).fill('kata').join(' ');
    const res = summarizeDescription(long, 100);
    expect(res.endsWith('...')).toBe(true);
    expect(res.length).toBeLessThanOrEqual(103);
  });

  it('re-appends safety lines that were cut off', () => {
    const description = `${Array(30).fill('kata').join(' ')}\n\nPeringatan: produk ini berisi alergi kacang.`;
    const res = summarizeDescription(description, 100);
    expect(res).toContain(
      '[Catatan penting: Peringatan: produk ini berisi alergi kacang.]',
    );
  });
});
