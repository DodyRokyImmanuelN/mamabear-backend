import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('ChatController', () => {
  let controller: ChatController;

  const mockChatService = {
    generateReply: jest.fn(),
  };

  const mockPrisma = {
    chatSession: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates a new session when sessionId is not provided', async () => {
    mockPrisma.chatSession.create.mockResolvedValue({ id: 'new-session-id', userId: 'user-1' });
    mockPrisma.chatMessage.create.mockResolvedValue({});
    mockChatService.generateReply.mockResolvedValue('Jawaban bot');

    const result = await controller.sendMessage('user-1', { message: 'halo' });

    expect(mockPrisma.chatSession.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.chatSession.create).toHaveBeenCalledWith({ data: { userId: 'user-1' } });
    expect(result).toEqual({ message: 'Jawaban bot', sessionId: 'new-session-id' });
  });

  it('reuses an existing session when sessionId belongs to the same user', async () => {
    mockPrisma.chatSession.findUnique.mockResolvedValue({ id: 'session-1', userId: 'user-1' });
    mockPrisma.chatMessage.create.mockResolvedValue({});
    mockChatService.generateReply.mockResolvedValue('Jawaban bot');

    const result = await controller.sendMessage('user-1', {
      sessionId: 'session-1',
      message: 'lanjutin dong',
    });

    expect(mockPrisma.chatSession.create).not.toHaveBeenCalled();
    expect(result.sessionId).toBe('session-1');
  });

  it('throws ForbiddenException when sessionId belongs to a different user', async () => {
    mockPrisma.chatSession.findUnique.mockResolvedValue({ id: 'session-1', userId: 'other-user' });

    await expect(
      controller.sendMessage('user-1', { sessionId: 'session-1', message: 'halo' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when sessionId does not exist', async () => {
    mockPrisma.chatSession.findUnique.mockResolvedValue(null);

    await expect(
      controller.sendMessage('user-1', { sessionId: 'missing-session', message: 'halo' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('falls back to a safe message when generateReply throws', async () => {
    mockPrisma.chatSession.create.mockResolvedValue({ id: 'new-session-id', userId: 'user-1' });
    mockPrisma.chatMessage.create.mockResolvedValue({});
    mockChatService.generateReply.mockRejectedValue(new Error('OpenRouter down'));

    const result = await controller.sendMessage('user-1', { message: 'halo' });

    expect(result.message).toContain('kendala teknis');
  });
});
