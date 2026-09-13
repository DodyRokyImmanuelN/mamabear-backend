import 'dotenv/config'
import { Injectable } from '@nestjs/common'
import { OpenRouter } from '@openrouter/sdk'

type ChatCompletionMessage = {
  role: 'system'| 'user' | 'assistant';
  content: string;
};

const GUARDRAIL_MODEL = 'nvidia/nemotron-3.5-lightning:free';

@Injectable()
export class AiChatService {
  private readonly openrouter: OpenRouter;

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('AiChatService: OPENROUTER_API_KEY not Found');
    }
    this.openrouter = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
  }

  async complete(messages: ChatCompletionMessage[], model: string): Promise<string> {
    const result = await this.openrouter.chat.send({
      chatRequest: {model, messages}
    });

    const answer = result.choices[0].message.content;
    if (typeof answer !== 'string') {
      throw new Error('AiChatService: format balasan dari OpenRouter gak sesuai dugaan. ')
    }
    return answer;
  }

  async checkIsMedicalQuestion(message: string): Promise<boolean> {
    const answer = await this.complete([
        {
            role: 'system',
          content: "Kamu adalah classifier untuk chatbot toko produk ibu hamil & menyusui MamaBear. Tugasmu HANYA menjawab satu kata: MEDIS atau AMAN.\n\nPENTING: hampir semua produk MamaBear memang untuk tujuan kesehatan (misal pelancar ASI, nutrisi kehamilan) — pertanyaan MENCARI/MEREKOMENDASIKAN produk untuk tujuan itu TETAP AMAN, itu justru fungsi utama toko ini.\n\nJawab MEDIS HANYA kalau user secara spesifik menanyakan: dosis/takaran, keamanan konsumsi untuk kondisi kesehatan tertentu (alergi, penyakit, trimester tertentu, sedang minum obat lain), interaksi obat, atau diagnosa gejala/kondisi medis.\n\nJawab AMAN untuk: pencarian/rekomendasi produk berdasarkan tujuan (termasuk tujuan kesehatan seperti 'nambah ASI'), preferensi rasa/bentuk/harga, perbandingan produk, pertanyaan umum.\n\nContoh AMAN: 'ada yang bubuk buat nambah ASI?', 'produk apa yang bagus buat ibu hamil?', 'yang rasa coklat ada?'\nContoh MEDIS: 'aman gak diminum pas trimester 3?', 'boleh dicampur obat lain gak?', 'anakku alergi kacang, boleh minum ini?'\n\nJangan menjawab apa pun selain satu kata: MEDIS atau AMAN."
        },
        {
            role: 'user',
            content: message
        }
    ], GUARDRAIL_MODEL);

    return answer.toUpperCase().includes('MEDIS');
  }
}
