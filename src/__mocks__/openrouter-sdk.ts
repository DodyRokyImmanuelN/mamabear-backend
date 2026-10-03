// Manual mock for the ESM-only `@openrouter/sdk` package.
// The real package ships as ESM which ts-jest/CommonJS cannot parse in unit
// tests. Stubs the shapes used by EmbeddingsService (`embeddings.generate`) and AiChatService (`chat.send`).
export class OpenRouter {
  embeddings = {
    generate: jest.fn().mockResolvedValue({ data: [{ embedding: [] }] }),
  };
  chat = {
    send: jest.fn().mockResolvedValue({ choices: [{ message: { content: '' } }] }),
  };
}
