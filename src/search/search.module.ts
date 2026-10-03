import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { ProductUtilsModule } from '@/product-utils/product-utils.module';
import { EmbeddingsModule } from '@/embeddings/embeddings.module';

@Module({
  imports: [ProductUtilsModule, EmbeddingsModule],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
