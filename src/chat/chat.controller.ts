import { Body, Controller, ForbiddenException, Logger, Post, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { GetUserId } from '@/common/decorators/get-user-id-decorator';
import { PrismaService } from '@/prisma/prisma.service';
import { ChatService } from './chat.service';
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
    @Post()

    async sendMessage(@GetUserId() userId: string, @Body() dto: SendChatMessageDto) {
        let session = dto.sessionId
            ? await this.prisma.chatSession.findUnique({ where: { id: dto.sessionId } })
            : null;

        if (dto.sessionId && (!session || session.userId !== userId)) {
            throw new ForbiddenException('Sesi chat tidak ditemukan atau bukan milik kamu.');
        }

        if (!session) {
            session = await this.prisma.chatSession.create({ data: { userId } });
        }

        await this.prisma.chatMessage.create({
            data: { sessionId: session.id, role: 'user', content: dto.message },
        });

        let answer: string;
        try {
            answer = await this.chatService.generateReply(dto.message);
        } catch (err) {
            this.logger.error('Failed to generate chat reply', err instanceof Error ? err.stack : err);
            answer = 'Maaf, lagi ada kendala teknis. Coba tanya lagi sebentar lagi ya.';
        }


        await this.prisma.chatMessage.create({
            data: { sessionId: session.id, role: 'assistant', content: answer },
        });

        return { message: answer, sessionId: session.id };
    }
}
