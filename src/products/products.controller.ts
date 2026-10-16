import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ReviewsService } from '@/reviews/reviews.service';
import { CreateReviewDto } from '@/reviews/dto/create-review.dto';
import { CursorPaginationRequestDto } from '@/common/dto/request/pagination.request.dto';
import { VariantService } from '@/variant/variant.service';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { SearchRequestDto } from '@/search/dto/search-request.dto';
import { SearchService } from '@/search/search.service';
import { SearchAutocompleteOptionsDto } from '@/search/dto/search-autocomplete-options.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { ReviewPaginationDto } from '@/reviews/dto/review-pagination.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly reviewsService: ReviewsService,
    private readonly variantService: VariantService,
    private readonly searchService: SearchService,
  ) {}

  @ApiOperation({summary: 'Gets all products details'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Retrieved 14 products`,
        data: '[{ product details }]',
      }
    }
  })
  @Get()
  findAll(@Query() paginationDto: CursorPaginationRequestDto) {
    return this.productsService.findAll(paginationDto);
  }

  @ApiOperation({summary: 'Searches products matched the query'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Found 5 products matching query 'Jamu Herbal'`,
        data: {
            success: true,
            data: '[{ products matching query }]',
            pagination: { limit: 10, nextCursor: 1, hasNextPage: null },
        },
      }
    }
  })
  @Get('search')
  searchForProducts(@Query() query: SearchRequestDto) {
    return this.searchService.findProductsMatchingQuery(query);
  }

  @ApiOperation({summary: 'Filters products to display'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Returned 12 products with the selected filters`,
        data: '[{ filtered products details }]',
      }
    }
  })
  @Get('filter')
  filterProducts(@Query() query: FilterProductsDto) {
    return this.productsService.findProductsWithFilter(query);
  }
  
  @ApiOperation({summary: 'Suggests product search'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Found 4 products matching query 'jamu' with fuzzy search`,
        data: '[{ matched Products }]'
      }
    }
  })
  @Get('search/suggestions')
  suggestAutocomplete(
    @Query() query: SearchRequestDto,
    @Query() options?: SearchAutocompleteOptionsDto,
  ) {
    return this.searchService.getFuzzyAutocompleteResults(query, options);
  }

  @ApiOperation({summary: 'Gets product details by slug'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Found product with slug jamu-herbal`,
        data: '{ product details} ',
      }
    }
  })
  @Get(':slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @ApiOperation({summary: 'Gets related product details'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Returned 5 products that are similar to jamu-herbal`,
        data: '[{ products details }]',
      }
    }
  })
  @Get(':slug/related')
  findRelatedProductsBySlug(@Param('slug') slug: string) {
    return this.productsService.findRelatedProducts(slug);
  }

  @ApiOperation({summary: 'Gets product variants'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Found 3 variants for product jamu-herbal`,
        data: '[{ product details }]',
      }
    }
  })
  @Get(':slug/variants')
  getProductVariantBySlug(@Param('slug') slug: string) {
    return this.variantService.getProductVariantBySlug(slug);
  }

  @ApiOperation({summary: 'Gets product reviews summary'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Review summary of product jamu-herbal obtained`,
        data: '{ review summary }',
      }
    }
  })
  @Get(':slug/reviews')
  findAllReviewsOfProductBySlug(
    @Param('slug') slug: string,
    @Query() paginationDto: ReviewPaginationDto,
  ) {
    return this.reviewsService.findReviewsOfProductBySlug(slug, paginationDto);
  }
  @Get(':slug/reviews/summary')
  getReviewSummaryOfProductWithSlug(@Param('slug') slug: string) {
    return this.reviewsService.getReviewSummaryOfProductWithSlug(slug);
  }

  @ApiOperation({summary: 'Create a review for a product'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: 'Review created successfully',
        data: '{ review details }',
      }
    }
  })
  @UseGuards(new JwtAuthGuard())
  @ApiBearerAuth('JwtAuthGuard')
  @Post(':slug/reviews')
  createReviewForProduct(
    @Param('slug') slug: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReviewForProductWithSlug(slug, dto);
  }

  @ApiOperation({summary: 'Upvotes a review for a product'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Review 67 upvoted successfully`,
        data: '{ review details }',
      }
    }
  })
  @UseGuards(new JwtAuthGuard())
  @ApiBearerAuth('JwtAuthGuard')
  @Patch(':slug/reviews/:reviewId/upvote')
  upvoteReviewOfProduct(@Param('reviewId') reviewId: number) {
    return this.reviewsService.upvoteReviewWithId(reviewId);
  }
}
