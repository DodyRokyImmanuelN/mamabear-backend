import { ChatService, summarizeDescription } from './chat.service';

describe('ChatService.generateReply routing', () => {
  const aiChatService = { classifyMessage: jest.fn(), complete: jest.fn() };
  const searchService = { findProductsBySemanticSearch: jest.fn() };
  const settingsService = {
    get: jest.fn().mockReturnValue('+62 812-3456-7890'),
  };
  const service = new ChatService(
    aiChatService as any,
    searchService as any,
    settingsService as any,
  );

  beforeEach(() => jest.clearAllMocks());

  const expectNoGeneration = () => {
    expect(searchService.findProductsBySemanticSearch).not.toHaveBeenCalled();
    expect(aiChatService.complete).not.toHaveBeenCalled();
  };

  it('redirects medical questions to WhatsApp without generating an answer', async () => {
    aiChatService.classifyMessage.mockResolvedValue('MEDIS');

    const reply = await service.generateReply('boleh diminum pas minum obat?');
    expect(reply).toContain('pertanyaan seputar kesehatan');
    expect(reply).toContain('phone=6281234567890');
    expectNoGeneration();
  });

  it('redirects store questions to the WhatsApp admin without generating an answer', async () => {
    aiChatService.classifyMessage.mockResolvedValue('TOKO');

    const reply = await service.generateReply('ongkir ke Surabaya berapa?');
    expect(reply).toContain('admin MamaBear');
    expect(reply).toContain('phone=6281234567890');
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
    settingsService.get.mockImplementationOnce(
      (_key: string, fallback: string) => fallback,
    );

    const reply = await service.generateReply('dosisnya berapa?');
    expect(reply).toContain('phone=628888695757');
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
