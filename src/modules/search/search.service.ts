import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus, DocumentCategory } from '../../common/entities/document.entity';
import { AiService } from '../ai/ai.service';

export interface SearchResult {
  document: Document;
  score: number;
  highlights: string[];
}

export interface SearchQuery {
  query: string;
  limit?: number;
  category?: string;
  language?: string;
  minConfidence?: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private aiService: AiService,
  ) {}

  async searchDocuments(searchQuery: SearchQuery): Promise<SearchResult[]> {
    try {
      const { query, limit = 10, category, language, minConfidence } = searchQuery;

      // Build query builder
      let queryBuilder = this.documentRepository
        .createQueryBuilder('document')
        .where('document.status = :status', { status: 'processed' });

      // Add filters
      if (category) {
        queryBuilder = queryBuilder.andWhere('document.category = :category', { category });
      }

      if (language) {
        queryBuilder = queryBuilder.andWhere('document.language = :language', { language });
      }

      if (minConfidence) {
        queryBuilder = queryBuilder.andWhere('document.confidence >= :minConfidence', { minConfidence });
      }

      // Get all matching documents
      const documents = await queryBuilder
        .orderBy('document.createdAt', 'DESC')
        .limit(limit * 2) // Get more documents for better ranking
        .getMany();

      // Perform semantic search
      const results = await this.performSemanticSearch(query, documents, limit);

      return results;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      throw new Error('Search operation failed');
    }
  }

  private async performSemanticSearch(
    query: string,
    documents: Document[],
    limit: number,
  ): Promise<SearchResult[]> {
    // For now, implement a simple text-based search
    // In a production system, you would use vector similarity search
    
    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const document of documents) {
      let score = 0;
      const highlights: string[] = [];

      // Search in extracted text
      if (document.extractedText) {
        const textLower = document.extractedText.toLowerCase();
        const textScore = this.calculateTextSimilarity(queryLower, textLower);
        score += textScore * 0.4;

        // Find highlights
        const highlightsFound = this.findHighlights(queryLower, document.extractedText);
        highlights.push(...highlightsFound);
      }

      // Search in summary
      if (document.summary) {
        const summaryLower = document.summary.toLowerCase();
        const summaryScore = this.calculateTextSimilarity(queryLower, summaryLower);
        score += summaryScore * 0.3;
      }

      // Search in keywords
      if (document.keywords) {
        const keywordScore = this.calculateKeywordMatch(queryLower, document.keywords);
        score += keywordScore * 0.2;
      }

      // Boost by confidence
      if (document.confidence) {
        score += document.confidence * 0.1;
      }

      if (score > 0) {
        results.push({
          document,
          score,
          highlights: highlights.slice(0, 3), // Limit highlights
        });
      }
    }

    // Sort by score and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private calculateTextSimilarity(query: string, text: string): number {
    const queryWords = query.split(/\s+/).filter(word => word.length > 2);
    const textWords = text.split(/\s+/).filter(word => word.length > 2);

    let matches = 0;
    for (const queryWord of queryWords) {
      for (const textWord of textWords) {
        if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
          matches++;
          break;
        }
      }
    }

    return queryWords.length > 0 ? matches / queryWords.length : 0;
  }

  private calculateKeywordMatch(query: string, keywords: string[]): number {
    const queryWords = query.split(/\s+/).filter(word => word.length > 2);
    let matches = 0;

    for (const queryWord of queryWords) {
      for (const keyword of keywords) {
        if (keyword.toLowerCase().includes(queryWord) || queryWord.includes(keyword.toLowerCase())) {
          matches++;
          break;
        }
      }
    }

    return queryWords.length > 0 ? matches / queryWords.length : 0;
  }

  private findHighlights(query: string, text: string): string[] {
    const highlights: string[] = [];
    const queryWords = query.split(/\s+/).filter(word => word.length > 2);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);

    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      let hasMatch = false;

      for (const queryWord of queryWords) {
        if (sentenceLower.includes(queryWord)) {
          hasMatch = true;
          break;
        }
      }

      if (hasMatch) {
        highlights.push(sentence.trim());
      }
    }

    return highlights;
  }

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { category: category as DocumentCategory, status: DocumentStatus.PROCESSED },
      order: { createdAt: 'DESC' },
    });
  }

  async getDocumentsByLanguage(language: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { language, status: DocumentStatus.PROCESSED },
      order: { createdAt: 'DESC' },
    });
  }
} 