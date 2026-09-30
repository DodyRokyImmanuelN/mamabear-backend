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
    @Get()
    async getSessions(@GetUserId() userId: string) {
        return this.prisma.chatSession.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    @ApiOperation({ summary: 'Semua pesan dalam satu sesi chat' })
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
