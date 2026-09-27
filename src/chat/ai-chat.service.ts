import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { OpenRouter } from '@openrouter/sdk';
import { withTimeout } from '@/common/utils/with-timeout';

type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const GUARDRAIL_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';
const AI_REQUEST_TIMEOUT_MS = 30_000;

const MAX_AI_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1_000;

function isTransientAiError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === 'ResponseValidationError') return true;
  const status = (err as { statusCode?: number }).statusCode;
  return typeof status === 'number' && status >= 500;
}

type CompletionOptions = {
  reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high';
  maxTokens?: number;
};

@Injectable()
export class AiChatService {
  private readonly openrouter: OpenRouter;

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('AiChatService: OPENROUTER_API_KEY not Found');
    }
    this.openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
      // SDK default silently retries for up to 1 hour; retries are handled by sendWithRetry
      retryConfig: { strategy: 'none' },
    });
  }

  async complete(
    messages: ChatCompletionMessage[],
    model: string,
    options: CompletionOptions = {},
  ): Promise<string> {
    const result = await this.sendWithRetry({
      model,
      messages,
      ...(options.reasoningEffort && {
        reasoning: { effort: options.reasoningEffort },
      }),
      ...(options.maxTokens && { maxTokens: options.maxTokens }),
    });

    const answer = result.choices[0].message.content;
    if (typeof answer !== 'string') {
      throw new Error(
        'AiChatService: format balasan dari OpenRouter gak sesuai dugaan. ',
      );
    }
    return answer;
  }

  private async sendWithRetry(
    chatRequest: Parameters<OpenRouter['chat']['send']>[0]['chatRequest'],
  ) {
    for (let attempt = 1; ; attempt++) {
      try {
        return await withTimeout(
          this.openrouter.chat.send({
            chatRequest: { ...chatRequest, stream: false },
          }),
          AI_REQUEST_TIMEOUT_MS,
        );
      } catch (err) {
        if (attempt >= MAX_AI_ATTEMPTS || !isTransientAiError(err)) throw err;
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * attempt),
        );
      }
    }
  }

  async checkIsMedicalQuestion(message: string): Promise<boolean> {
    const answer = await this.complete(
      [
        {
          role: 'system',
          content:
            "Kamu adalah classifier untuk chatbot toko produk ibu hamil & menyusui MamaBear. Tugasmu HANYA menjawab satu kata: MEDIS atau AMAN.\n\nPENTING: hampir semua produk MamaBear memang untuk tujuan kesehatan (misal pelancar ASI, nutrisi kehamilan) — pertanyaan MENCARI/MEREKOMENDASIKAN produk untuk tujuan itu TETAP AMAN, itu justru fungsi utama toko ini.\n\nJawab MEDIS HANYA kalau user secara spesifik menanyakan: dosis/takaran, keamanan konsumsi untuk kondisi kesehatan tertentu (alergi, penyakit, trimester tertentu, sedang minum obat lain), interaksi obat, atau diagnosa gejala/kondisi medis.\n\nJawab AMAN untuk: pencarian/rekomendasi produk berdasarkan tujuan (termasuk tujuan kesehatan seperti 'nambah ASI'), preferensi rasa/bentuk/harga, perbandingan produk, pertanyaan umum.\n\nContoh AMAN: 'ada yang bubuk buat nambah ASI?', 'produk apa yang bagus buat ibu hamil?', 'yang rasa coklat ada?'\nContoh MEDIS: 'aman gak diminum pas trimester 3?', 'boleh dicampur obat lain gak?', 'anakku alergi kacang, boleh minum ini?'\n\nJangan menjawab apa pun selain satu kata: MEDIS atau AMAN.",
        },
        {
          role: 'user',
          content: message,
        },
      ],
      GUARDRAIL_MODEL,
      { reasoningEffort: 'none', maxTokens: 5 },
    );
    return answer.toUpperCase().includes('MEDIS');
  }
}
