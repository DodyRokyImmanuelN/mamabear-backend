import { Module } from "@nestjs/common";
import { AiChatService } from "./ai-chat.service";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { SearchModule } from "@/search/search.module";
import { SettingsModule } from "@/settings/settings.module";

@Module({
  imports: [SearchModule, SettingsModule],
  controllers: [ChatController],
  providers: [AiChatService, ChatService],
  exports: [AiChatService, ChatService],
})
export class ChatModule {}
