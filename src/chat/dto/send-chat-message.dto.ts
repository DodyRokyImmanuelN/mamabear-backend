import { Transform } from 'class-transformer';
import { sanitizeMessage } from '../utils/sanitize-message';
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class SendChatMessageDto {
  @ApiPropertyOptional({ description: 'Existing chat session id; omit to start a new session' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiProperty({ description: 'User Message' })
  @Transform(({ value }) => sanitizeMessage(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}