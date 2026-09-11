import 'dotenv/config'
import { Injectable } from '@nestjs/common'
import { OpenRouter } from '@openrouter/sdk'

type ChatCompletionMessage = {
  role: 'system'| 'user' | 'assistant';
  content: string;
};

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
}