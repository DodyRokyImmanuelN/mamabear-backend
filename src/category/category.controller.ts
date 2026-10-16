import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: 'Gets all categories'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: 'Found 5 categories',
        data: '[{ category details and images details }]',
      }
    }
  })
  @Get()
  findAll() {
    return this.categoryService.getAllCategory();
  }

  @ApiOperation({ summary: 'Get a categories by slug'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: 'Category with slug jamu-herbal found',
        data: '{ category details and images details }',
      }
    }
  })
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.categoryService.getCategoryBySlug(slug);
  }
}
