import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class SendChatMessageDto {
  @ApiPropertyOptional({ description: 'Existing chat session id; omit to start a new session' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiProperty({ description: 'User Message' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}