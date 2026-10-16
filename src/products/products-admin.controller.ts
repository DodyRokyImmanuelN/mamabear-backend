import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  BadRequestException,
  Patch,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Role } from '@/generated/prisma';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { ReviewsService } from '@/reviews/reviews.service';
import { CursorPaginationRequestDto } from '@/common/dto/request/pagination.request.dto';
import { CreateDiscountDto } from '@/discounts/dto/create-discount.dto';
import { DiscountsService } from '@/discounts/discounts.service';
import { CreateVariantDto } from '@/variant/dto/create-variant.dto';
import { UpdateVariantDto } from '@/variant/dto/update-variant.dto';
import { VariantService } from '@/variant/variant.service';
import { AdminProductsQueryDto } from './dto/admin-products-query.dto';
import { ReviewPaginationDto } from '@/reviews/dto/review-pagination.dto';
import { memoryStorage } from 'multer';
import { BulkDeleteProductsDto } from './dto/bulk-delete-products.dto';
import { BulkUpdateProductsStatusDto } from './dto/bulk-update-products-status.dto';
import { format } from '@fast-csv/format';
import { Response } from 'express';
import { AdminActivityLogService } from '@/activity-log/admin-activity-log.service';

@ApiTags('products (admin)')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.ADMIN, Role.SUPERADMIN])
@ApiBearerAuth('JwtAuthGuard')
export class ProductsAdminController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly reviewsService: ReviewsService,
    private readonly discountsService: DiscountsService,
    private readonly variantService: VariantService,
    private readonly activityLogService: AdminActivityLogService,
  ) {}

  @ApiOperation({summary: 'Find all products for Admin view'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Returned 5 products (page 1 of 1)`,
        data: '[{ products details }]',
      }
    }
  })
  @Get()
  findAllAdmin(@Query() query: AdminProductsQueryDto) {
    return this.productsService.findAdminProducts(query);
  }

  
  @ApiOperation({summary: 'Create a new product entry'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Product Jamu Herbal created successfully`,
        data: '{ product details }',
      }
    }
  })
  @Post()
  async create(@Req() req: any, @Body() dto: CreateProductDto) {
    const result = await this.productsService.create(dto);
    if (result.success) {
      this.activityLogService.log(
        req.user.sub,
        'CREATE',
        'Product',
        String(result.data.id),
      );
    }
    return result;
  }

  @ApiOperation({summary: 'Deletes multiple products at once'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Successfully deleted 3 products`,
        data: { deletedCount: 3 },
      }
    }
  })
  @Delete('bulk-delete')
  async bulkDelete(@Req() req: any, @Body() dto: BulkDeleteProductsDto) {
    const result = await this.productsService.bulkDelete(dto);
    if (result.success) {
      this.activityLogService.log(
        req.user.sub,
        'BULK_DELETE',
        'Product',
        dto.ids.join(','),
      );
    }
    return result;
  }

  @ApiOperation({summary: 'Sets multiple products to be active/inactive at once'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Successfully updated status for 3 products to active / inactive}`,
        data: { updatedCount: 3 },
      }
    }
  })
  @Patch('bulk-publish')
  async bulkUpdateProductStatus(
    @Req() req: any,
    @Body() dto: BulkUpdateProductsStatusDto,
  ) {
    const result = await this.productsService.bulkUpdateProductStatus(dto);
    if (result.success) {
      this.activityLogService.log(
        req.user.sub,
        'BULK_UPDATE_STATUS',
        'Product',
        dto.ids.join(','),
      );
    }
    return result;
  }

  
  @ApiOperation({summary: 'Backfills product embeddings'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Backfilled embeddings for 5 of 8 products (2 failed)`,
        data: '[{ products details }]',
      }
    }
  })
  @Post('backfill-embeddings')
  async backfillEmbeddings(@Req() req: any) {
    const result = await this.productsService.backfillEmbeddings();
    if (result.success) {
      this.activityLogService.log(
        req.user.sub,
        'BACKFILL_EMBEDDINGS',
        'Product',
      );
    }
    return result;
  }

  @ApiOperation({summary: 'Exports product details data to CSV'})
  @Get('export')
  async exportProduct(@Res() res: Response) {
    const result = await this.productsService.exportProducts();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');

    const csvStream = format({
      headers: ['Name', 'SKU', 'Price', 'Stock', 'Total Sold', 'Category'],
    });

    csvStream.pipe(res);

    result.data.forEach((product) => {
      csvStream.write({
        Name: product.name,
        SKU: product.sku,
        Price: product.priceIdr,
        Stock: product.stock,
        'Total Sold': product.totalSold,
        Category: product.category,
      });
    });

    csvStream.end();
  }

  
  @ApiOperation({summary: 'Gets a product detail by id'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Found product with id 67`,
        data: '{ products details }',
      }
    }
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @ApiOperation({summary: 'Duplicates a product details with different SKU'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Product Jamu Herbal duplicated successfully`,
        data: '{ duplicated product details }',
      }
    }
  })
  @Post(':id/duplicate')
  async duplicateProduct(@Req() req: any, @Param('id') id: number) {
    const result = await this.productsService.duplicateProduct(id);
    if (result.success) {
      this.activityLogService.log(
        req.user.sub,
        'DUPLICATE',
        'Product',
        String(id),
      );
    }
    return result;
  }

  @ApiOperation({summary: 'Updates a product details'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Product updated successfully`,
        data: '{ updated product details }',
      }
    }
  })
  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const result = await this.productsService.update(+id, updateProductDto);
    if (result.success) {
      this.activityLogService.log(req.user.sub, 'UPDATE', 'Product', id);
    }
    return result;
  }

  @ApiOperation({summary: 'Deletes a product'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Product deleted successfully`,
        data: '{ deleted product details }',
      }
    }
  })
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const result = await this.productsService.remove(+id);
    if (result.success) {
      this.activityLogService.log(req.user.sub, 'DELETE', 'Product', id);
    }
    return result;
  }

  @ApiOperation({summary: 'Creates a variant of a product'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: 'Variant created successfully',
        data: '{ product variant details }',
      }
    }
  })
  @Post(':id/variants')
  async createProductVariant(
    @Req() req: any,
    @Param('id') id: number,
    @Body() dto: CreateVariantDto,
  ) {
    const result = await this.variantService.createVariant(
      req.user.id,
      id,
      dto,
    );
    this.activityLogService.log(
      req.user.sub,
      'CREATE',
      'ProductVariant',
      String(result.data?.id ?? id),
    );
    return result;
  }

  @ApiOperation({summary: 'Gets variants of a product'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Found 5 variants`,
        data: '[{ variants details }]',
      }
    }
  })
  @Get(':id/variants')
  getProductVariant(@Param('id') id: number) {
    return this.variantService.getProductVariant(id);
  }

  @ApiOperation({summary: 'Gets reviews of a product'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Found 3 reviews`,
        data: {
          success: true,
          data: '[{ reviews details }]',
          pagination: { limit: 5, nextCursor: 2, hasNextPage: null },
        }
      }
    }
  })
  @Get(':id/reviews')
  findAllReviewsOfProduct(
    @Param('id') productId: number,
    @Query() paginationDto: ReviewPaginationDto,
  ) {
    return this.reviewsService.findReviewsOfProduct(productId, paginationDto);
  }

  @ApiOperation({summary: 'Deletes a review of a product'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Review 67 deleted successfully`,
        data: '{ review details }',
      }
    }
  })
  @Delete(':id/reviews/:reviewId')
  async removeReview(@Req() req: any, @Param('reviewId') reviewId: number) {
    const result = await this.reviewsService.remove(reviewId);
    this.activityLogService.log(
      req.user.sub,
      'DELETE',
      'Review',
      String(reviewId),
    );
    return result;
  }

  @ApiOperation({summary: 'Creates a discount of a product variant'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: 'Discount created successfully',
        data: '{ discount details }',
      }
    }
  })
  @Post(':id/variants/:variantId/discount')
  async createDiscount(
    @Req() req: any,
    @Param('variantId') variantId: number,
    @Body() dto: CreateDiscountDto,
  ) {
    dto.variantId = variantId;
    const result = await this.discountsService.create(dto);
    this.activityLogService.log(
      req.user.sub,
      'CREATE',
      'Discount',
      String(variantId),
    );
    return result;
  }

  @ApiOperation({summary: 'Updates a product variant'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: 'Variant updated successfully',
        data: '{ variant details }',
      }
    }
  })
  @Put('variants/:id')
  async updateVariant(
    @Req() req: any,
    @Param('id') id: number,
    @Body() dto: UpdateVariantDto,
  ) {
    const result = await this.variantService.updateVariant(
      req.user.id,
      id,
      dto,
    );
    this.activityLogService.log(
      req.user.sub,
      'UPDATE',
      'ProductVariant',
      String(id),
    );
    return result;
  }

  @ApiOperation({summary: 'Deletes a product variant'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Variant SKU deleted successfully`,
        data: '{ deleted variant details }',
      }
    }
  })
  @Delete('variants/:id')
  async deleteVariant(@Req() req: any, @Param('id') id: number) {
    const result = await this.variantService.deleteVariant(req.user.id, id);
    this.activityLogService.log(
      req.user.sub,
      'DELETE',
      'ProductVariant',
      String(id),
    );
    return result;
  }

  @ApiOperation({summary: 'Deletes a product variant'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Review 67 deleted successfully`,
        data: '{ deleted review details}',
      }
    }
  })
  @Delete('reviews/:id')
  async removeReviewStandalone(@Req() req: any, @Param('id') id: number) {
    const result = await this.reviewsService.remove(id);
    this.activityLogService.log(req.user.sub, 'DELETE', 'Review', String(id));
    return result;
  }
}
