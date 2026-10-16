import { Body, Controller, ForbiddenException, Get, Logger, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { UserThrottlerGuard } from '@/common/guards/user-throttler.guard';
import { GetUserId } from '@/common/decorators/get-user-id-decorator';
import { PrismaService } from '@/prisma/prisma.service';
import { ChatService, HISTORY_LIMIT, TECHNICAL_ERROR_REPLY } from './chat.service';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

@ApiTags('chat')
@ApiBearerAuth('JwtAuthGuard')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
    private readonly logger = new Logger(ChatController.name);
    constructor(
        private readonly chatService: ChatService,
        private readonly prisma: PrismaService,
    ) {}

    @ApiOperation({ summary: 'Kirim pesan ke chatbot MamaBear' })
    @ApiResponse({
      status: 201,
      description: 'Jawaban chatbot beserta session id',
      schema: {
        example: {
          success: true,
          statusCode: 201,
          data: { message: 'Ya, MamaBear punya minuman bubuk...', sessionId: '01a09b8a-88c8-74f9-ba8a-7536f1610d80' },
        },
      },
    })
    @ApiResponse({ status: 429, description: 'Terlalu banyak pesan (10/menit atau 100/hari per user)' })
    @UseGuards(UserThrottlerGuard)
    @Throttle({
        default: { limit: 10, ttl: 60_000 },
        daily: { limit: 100, ttl: 86_400_000 },
    })
    @Post()
    async sendMessage(@GetUserId() userId: string, @Body() dto: SendChatMessageDto) {
        let session = dto.sessionId
            ? await this.prisma.chatSession.findUnique({ where: { id: dto.sessionId } })
            : null;

        if (dto.sessionId) {
            if (!session) {
                throw new NotFoundException('Sesi chat tidak ditemukan.');
            }
            if (session.userId !== userId) {
                throw new ForbiddenException('Sesi chat ini bukan milik kamu.');
            }
        }

        if (!session) {
            session = await this.prisma.chatSession.create({ data: { userId } });
        }

        // Loaded before saving the new message so the history only holds earlier turns
        const history = dto.sessionId
            ? (await this.prisma.chatMessage.findMany({
                  where: { sessionId: session.id },
                  orderBy: { createdAt: 'desc' },
                  take: HISTORY_LIMIT,
                  select: { role: true, content: true },
              })).reverse()
            : [];

        await this.prisma.chatMessage.create({
            data: { sessionId: session.id, role: 'user', content: dto.message },
        });

        let answer: string;
        try {
            answer = await this.chatService.generateReply(dto.message, history);
        } catch (err) {
            this.logger.error('Failed to generate chat reply', err instanceof Error ? err.stack : err);
            answer = TECHNICAL_ERROR_REPLY;
        }

        await this.prisma.chatMessage.create({
            data: { sessionId: session.id, role: 'assistant', content: answer },
        });

        return { message: answer, sessionId: session.id };
    }

    @ApiOperation({ summary: 'Daftar sesi chat milik user, terbaru dulu' })
    @ApiResponse({
      status: 201,
      description: 'Daftar sesi chat milik user, terbaru dulu',
      schema: {
        example: {
          "success": true,
          "statusCode": 200,
          "message": [
              "No message specified"
          ],
          "data": [
              {
                  "id": "01a13a7a-0ed7-7169-9978-94fe290a92b6",
                  "userId": "5a8057dc-f967-45bc-8f03-b13e65bcb35b",
                  "title": null,
                  "createdAt": "2026-10-14T12:54:00.151Z",
                  "updatedAt": "2026-10-14T12:54:00.151Z"
              }
          ],
          "timestamp": "2026-10-14T12:55:47.802Z"
        },
      },
    })
    @Get()
    async getSessions(@GetUserId() userId: string) {
        return this.prisma.chatSession.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    @ApiOperation({ summary: 'Semua pesan dalam satu sesi chat' })
    @ApiResponse({
      status: 200,
      description: 'Session found',
      schema: {
        example: {
          "success": true,
          "statusCode": 200,
          "message": [
              "No message specified"
          ],
          "data": [
              {
                  "id": "01a13a7a-0efc-72bb-a38f-fa9ce55cb948",
                  "sessionId": "01a13a7a-0ed7-7169-9978-94fe290a92b6",
                  "role": "user",
                  "content": "hai",
                  "createdAt": "2026-10-14T12:54:00.188Z"
              },
              {
                  "id": "01a13a7a-24f1-7300-a340-4fc827fa644e",
                  "sessionId": "01a13a7a-0ed7-7169-9978-94fe290a92b6",
                  "role": "assistant",
                  "content": "Halo Mama! Ada yang bisa saya bantu terkait produk MamaBear untuk ibu hamil atau menyusui? Misalnya kamu mencari produk untuk pelancar ASI, camilan bergizi, atau minuman spesifik? Jika boleh tahu, lebih suka yang diminum, teh, kapsul, atau bentuk lain? Ini akan membantu saya memberikan rekomendasi yang paling sesuai.",
                  "createdAt": "2026-10-14T12:54:05.809Z"
              }
          ],
          "timestamp": "2026-10-14T13:00:48.570Z"
      },
    }
    })
    @ApiResponse(
        {
            status: 401, 
            description: 'Session not found',
            schema: {
                example: {
                    status: 401,
                    message: 'Sesi chat tidak ditemukan.'
                }
            }
        }
    )
    @ApiResponse(
        {
            status: 403, 
            description: 'Session mismatch',
            schema: {
                example: {
                    status: 403,
                    message: 'Sesi chat ini bukan milik kamu.'
                }
            }
        }
    )
    @Get(':sessionId')
    async getMessages(@GetUserId() userId: string, @Param('sessionId') sessionId: string) {
        const session = await this.prisma.chatSession.findUnique({ where: { id: sessionId } });
        if (!session) {
            throw new NotFoundException('Sesi chat tidak ditemukan.');
        }
        if (session.userId !== userId) {
            throw new ForbiddenException('Sesi chat ini bukan milik kamu.');
        }

        return this.prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
        });
    }
}
