import { DEFAULT_GUARDRAIL_MODEL } from './ai-chat.service';
import { ChatService, summarizeDescription } from './chat.service';

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
    });
    const [messages] = aiChatService.complete.mock.calls[0];
    expect(messages[0].content).toContain('ATURAN TOPIK:');
    expect(messages[0].content).toContain(
      'kecuali blok produk itu menyebutkannya secara eksplisit',
    );
    expect(reply).toBe(
      'Halo Mama, coba AlmonMix.\n\nREKOMENDASI PRODUK: mamabear-almonmix',
    );
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
