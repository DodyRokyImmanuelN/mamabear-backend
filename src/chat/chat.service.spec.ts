import { ChatService, summarizeDescription } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let mockAi: { checkIsMedicalQuestion: jest.Mock; complete: jest.Mock };
  let mockSearch: { findProductsBySemanticSearch: jest.Mock };
  let mockSettings: { get: jest.Mock };

  beforeEach(() => {
    mockAi = { checkIsMedicalQuestion: jest.fn(), complete: jest.fn() };
    mockSearch = { findProductsBySemanticSearch: jest.fn() };
    mockSettings = { get: jest.fn() };
    service = new ChatService(mockAi as any, mockSearch as any, mockSettings as any);
  });

  describe('generateReply', () => {
    it('returns WA redirect template when question is medical', async () => {
      mockAi.checkIsMedicalQuestion.mockResolvedValue(true);
      mockSettings.get.mockImplementation((key: string, def: unknown) => String(def));

      const reply = await service.generateReply('aman gak diminum pas hamil?');

      expect(mockAi.checkIsMedicalQuestion).toHaveBeenCalledWith('aman gak diminum pas hamil?');
      expect(reply).toMatch(/^Maaf, untuk pertanyaan seputar kesehatan/);
      expect(reply).toContain('https://api.whatsapp.com/send/?phone=628888695757');
      expect(mockSearch.findProductsBySemanticSearch).not.toHaveBeenCalled();
      expect(mockAi.complete).not.toHaveBeenCalled();
    });

    it('uses the contact_phone setting for the WA link (sanitized)', async () => {
      mockAi.checkIsMedicalQuestion.mockResolvedValue(true);
      mockSettings.get.mockImplementation((key: string, def: unknown) =>
        key === 'contact_phone' ? '+62 811-222-3333' : def,
      );

      const reply = await service.generateReply('dosisnya berapa?');

      expect(reply).toContain('phone=628112223333');
    });

    it('builds product context and calls complete when not medical', async () => {
      mockAi.checkIsMedicalQuestion.mockResolvedValue(false);
      mockSearch.findProductsBySemanticSearch.mockResolvedValue({
        data: [{ slug: 'alg-bar', name: 'AlmonMix', harga: '150000', deskripsi: 'kaya nutrisi untuk ibu menyusui' }],
      });
      mockAi.complete.mockResolvedValue('Ini saran Mama.\nREKOMENDASI PRODUK: alg-bar');

      const reply = await service.generateReply('ada pelancar ASI?');

      expect(mockAi.complete).toHaveBeenCalledWith(
        [
          expect.objectContaining({ role: 'system', content: expect.stringContaining('alg-bar') }),
          { role: 'user', content: 'ada pelancar ASI?' },
        ],
        expect.any(String),
      );
      expect(reply).toContain('REKOMENDASI PRODUK: alg-bar');
    });
  });

  describe('validateRecommendationFooter', () => {
    const products = [{ slug: 'alg-bar' }, { slug: 'zoy-mix' }, { slug: 'teh-asi' }, { slug: 'kukis-oat' }];
    const validate = (answer: string) => (service as any).validateRecommendationFooter(answer, products);

    it('returns the answer unchanged when there is no footer', () => {
      const answer = 'Terima kasih sudah bertanya, Mama.';
      expect(validate(answer)).toBe(answer);
    });

    it('keeps the footer when all slugs are allowed', () => {
      const answer = 'Coba ini.\nREKOMENDASI PRODUK: alg-bar, zoy-mix';
      expect(validate(answer)).toBe('Coba ini.\nREKOMENDASI PRODUK: alg-bar, zoy-mix');
    });

    it('normalizes case, trims and dedupes slugs', () => {
      const answer = 'Saran.\nREKOMENDASI PRODUK: Alg-Bar, alg-bar ,  ZOY-MIX';
      expect(validate(answer)).toBe('Saran.\nREKOMENDASI PRODUK: alg-bar, zoy-mix');
    });

    it('caps the footer at 3 slugs', () => {
      const answer = 'Banyak.\nREKOMENDASI PRODUK: alg-bar, zoy-mix, teh-asi, kukis-oat';
      expect(validate(answer)).toBe('Banyak.\nREKOMENDASI PRODUK: alg-bar, zoy-mix, teh-asi');
    });

    it('removes the footer when no slug is allowed', () => {
      const answer = 'Saran.\nREKOMENDASI PRODUK: barang-lain, produk-fiktif';
      expect(validate(answer)).toBe('Saran.');
    });

    it('keeps only allowed slugs (mixed)', () => {
      const answer = 'Saran.\nREKOMENDASI PRODUK: barang-lain, zoy-mix, teh-asi, fiktif';
      expect(validate(answer)).toBe('Saran.\nREKOMENDASI PRODUK: zoy-mix, teh-asi');
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
      expect(res).toContain('[Catatan penting: Peringatan: produk ini berisi alergi kacang.]');
    });
  });
});