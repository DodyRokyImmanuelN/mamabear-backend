import { Injectable } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { SearchService } from '@/search/search.service';
import { SettingsService } from '@/settings/settings.service';

const GENERATION_MODEL = 'nex-agi/nex-n2.5-pro:free';
const SAFETY_KEYWORDS = [
  'tidak untuk',
  'catatan',
  'peringatan',
  'alergi',
  'kontraindikasi',
  'efek samping',
  'dilarang',
  'hindari',
];

const RECOMMENDATION_LINE_PATTERN = /^REKOMENDASI\s+PRODUK:[ \t]*([^\n]*)$/m;
const MAX_RECOMMENDATIONS = 3;

function summarizeDescription(description: string, maxLength = 1500): string {
  if (!description) return '';

  const lines = description
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const safetyLines = lines.filter((line) =>
    SAFETY_KEYWORDS.some((keyword) => line.toLowerCase().includes(keyword)),
  );

  let mainText = description.slice(0, maxLength);
  if (mainText.length < description.length) {
    const lastSpace = mainText.lastIndexOf(' ');
    if (lastSpace > 0) mainText = mainText.slice(0, lastSpace);
    mainText += '...';
  }

  const missingSafetyLines = safetyLines.filter(
    (line) => !mainText.includes(line),
  );
  if (missingSafetyLines.length > 0) {
    mainText += '\n[Catatan penting: ' + missingSafetyLines.join('; ') + ']';
  }

  return mainText;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly aiChatService: AiChatService,
    private readonly searchService: SearchService,
    private readonly settingsService: SettingsService,
  ) {}

  private getMedicalRedirectMessage(): string {
    const rawPhone = this.settingsService.get('contact_phone', '628888695757');
    const phone = rawPhone.replace(/[^0-9]/g, '');
    return `Maaf, untuk pertanyaan seputar kesehatan seperti ini, aku sarankan konsultasi langsung dengan tim MamaBear ya, biar dapat jawaban yang lebih tepat. Chat kami di sini: https://api.whatsapp.com/send/?phone=${phone}&text&type=phone_number&app_absent=0`;
  }

  async generateReply(message: string): Promise<string> {
    const isMedical = await this.aiChatService.checkIsMedicalQuestion(message);
    if (isMedical) {
      return this.getMedicalRedirectMessage();
    }

    const searchResult = await this.searchService.findProductsBySemanticSearch({
      q: message,
    });
    const products = searchResult.data as any[];

    const productContext = products
      .map(
        (p) =>
          `- ${p.slug} ${p.name}, (Rp${p.harga}): ${summarizeDescription(p.deskripsi)}`,
      )
      .join('\n');

    const systemPrompt = `Kamu adalah asisten MamaBear, toko produk untuk ibu hamil dan menyusui. 
        Panggil user dengan sapaan "Mama" (misal "Halo Mama, ..."). Jawab pertanyaan user HANYA 
        berdasarkan produk di bawah ini. Jangan menyebut produk lain di luar daftar ini. 
        Kalau tidak ada yang benar-benar cocok, katakan terus terang tidak ada, jangan memaksakan rekomendasi.
        
        Setiap produk diawali dengan slug uniknya. Saat kamu merekomendasikan produk, 
        SISIPKAN di akhir jawaban satu baris tersendiri dengan format persis: REKOMENDASI PRODUK: slug1, slug2, slug3 (dipisah koma, maksimal 3, HANYA pakai slug yang ada di daftar di bawah). 
        Jangan tulis baris ini di tengah kalimat dan jangan tambahkan nama produk lain selain slug di baris itu.
        \n\nPRODUK YANG RELEVAN:\n${productContext}`;

    const answer = await this.aiChatService.complete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      GENERATION_MODEL,
    );

    return this.validateRecommendationFooter(answer, products);
  }

  private validateRecommendationFooter(
    answer: string,
    products: any[],
  ): string {
    const match = answer.match(RECOMMENDATION_LINE_PATTERN);
    if (!match) return answer;

    const allowedSlugs = new Set(products.map((p) => p.slug));

    const slugs = [
      ...new Set(
        match[1]
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      ),
    ]
      .filter((s) => allowedSlugs.has(s))
      .slice(0, MAX_RECOMMENDATIONS);

    if (slugs.length === 0) {
      return answer.replace(RECOMMENDATION_LINE_PATTERN, '').trim();
    }

    // Footer dipertahankan di teks tersimpan agar riwayat tetap menampilkan kartu
    return answer.replace(
      RECOMMENDATION_LINE_PATTERN,
      `REKOMENDASI PRODUK: ${slugs.join(', ')}`,
    );
  }
}
