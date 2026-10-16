import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HighlightsService } from './highlights.service';

@ApiTags('highlights')
@Controller('highlights')
export class HighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @ApiOperation({ summary: 'Gets all highlights'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Found 7 highlights`,
        data: '[{ highlights details }]'
      }
    }
  })
  @Get()
  findAll() {
    return this.highlightsService.findAll();
  }

  @ApiOperation({ summary: 'Gets a highlights by id'})
  @ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
      example: {
        success: true,
        message: `Found highlight with id 67`,
        data: '{ highlight details }'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Highlight not found'
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.highlightsService.findOne(+id);
  }
}
