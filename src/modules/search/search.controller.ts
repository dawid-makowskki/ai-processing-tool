import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SearchService, SearchResult, SearchQuery } from './search.service';
import { Document } from '../../common/entities/document.entity';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search documents semantically' })
  @ApiQuery({ name: 'query', description: 'Search query', required: true })
  @ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false })
  @ApiQuery({ name: 'category', description: 'Filter by document category', required: false })
  @ApiQuery({ name: 'language', description: 'Filter by document language', required: false })
  @ApiQuery({ name: 'minConfidence', description: 'Minimum confidence score', required: false })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          document: { type: 'object' },
          score: { type: 'number' },
          highlights: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  })
  async searchDocuments(
    @Query('query') query: string,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
    @Query('language') language?: string,
    @Query('minConfidence') minConfidence?: number,
  ): Promise<SearchResult[]> {
    const searchQuery: SearchQuery = {
      query,
      limit: limit ? parseInt(limit.toString()) : 10,
      category,
      language,
      minConfidence: minConfidence ? parseFloat(minConfidence.toString()) : undefined,
    };

    return this.searchService.searchDocuments(searchQuery);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get documents by category' })
  @ApiResponse({
    status: 200,
    description: 'Documents in the specified category',
    type: [Document],
  })
  async getDocumentsByCategory(@Query('category') category: string): Promise<Document[]> {
    return this.searchService.getDocumentsByCategory(category);
  }

  @Get('language/:language')
  @ApiOperation({ summary: 'Get documents by language' })
  @ApiResponse({
    status: 200,
    description: 'Documents in the specified language',
    type: [Document],
  })
  async getDocumentsByLanguage(@Query('language') language: string): Promise<Document[]> {
    return this.searchService.getDocumentsByLanguage(language);
  }
} 