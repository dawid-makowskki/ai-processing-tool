import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
  import { ChatOllama } from '@langchain/community/chat_models/ollama';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as textract from 'textract';

export interface ProcessingResult {
  summary: string;
  keywords: string[];
  category: string;
  confidence: number;
  language: string;
  sentiment: number;
  extractedFields: Record<string, any>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private llm: ChatOllama;

  constructor(private configService: ConfigService) {
    this.initializeLLM();
  }

  private initializeLLM() {
    try {
      const ollamaUrl = this.configService.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434');
      this.llm = new ChatOllama({
        model: 'llama3.1:8b',
        baseUrl: ollamaUrl,
        temperature: 0.1,
      });
      this.logger.log(`Ollama LLM initialized successfully with URL: ${ollamaUrl}`);
    } catch (error) {
      this.logger.error('Failed to initialize Ollama LLM:', error.message);
    }
  }

  async extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf') {
        const data = await pdfParse(buffer);
        return data.text;
      } else if (mimeType.includes('word') || mimeType.includes('docx')) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      } else if (mimeType.includes('text/plain')) {
        return buffer.toString('utf-8');
      } else if (mimeType.includes('image/')) {
        // For images, we'll use textract (requires additional setup)
        return new Promise((resolve, reject) => {
          textract.fromBufferWithMime(mimeType, buffer, (error, text) => {
            if (error) {
              reject(error);
            } else {
              resolve(text);
            }
          });
        });
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      this.logger.error(`Text extraction failed: ${error.message}`);
      throw new Error('Text extraction failed');
    }
  }

  async processDocument(text: string): Promise<ProcessingResult> {
    if (!this.llm) {
      throw new Error('AI processing is not available. Please configure OpenAI API key.');
    }

    try {
      // Process all AI tasks in parallel
      const [summary, classification, keywords, sentiment] = await Promise.all([
        this.generateSummary(text),
        this.classifyDocument(text),
        this.extractKeywords(text),
        this.analyzeSentiment(text),
      ]);

      // Parse classification result
      const [category, confidenceStr] = classification.split('|');
      const confidence = parseFloat(confidenceStr) || 0.5;

      // Parse keywords
      const keywordList = keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      // Parse sentiment
      const sentimentScore = parseFloat(sentiment) || 0;

      // Extract structured data
      const extractedFields = this.extractStructuredData(text);

      return {
        summary: summary.trim(),
        keywords: keywordList,
        category: category.trim().toLowerCase(),
        confidence,
        language: this.detectLanguage(text),
        sentiment: sentimentScore,
        extractedFields,
      };
    } catch (error) {
      this.logger.error(`AI processing failed: ${error.message}`);
      throw new Error('AI processing failed');
    }
  }

  private async generateSummary(text: string): Promise<string> {
    const prompt = `Analyze the following document and provide a concise summary (2-3 sentences):
    
Document: ${text}

Summary:`;

    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }

  private async classifyDocument(text: string): Promise<string> {
    const prompt = `Classify the following document into one of these categories: invoice, contract, report, receipt, form, other.
Respond with only the category name and a confidence score (0-1).
Format: category|confidence

Document: ${text}

Classification:`;

    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }

  private async extractKeywords(text: string): Promise<string> {
    const prompt = `Extract 5-10 key terms or topics from the following document. Return them as a comma-separated list:

Document: ${text}

Keywords:`;

    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }

  private async analyzeSentiment(text: string): Promise<string> {
    const prompt = `Analyze the sentiment of the following document. Return a score between -1 (very negative) and 1 (very positive):

Document: ${text}

Sentiment score:`;

    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }

  private extractStructuredData(text: string): Record<string, any> {
    const fields: Record<string, any> = {};

    // Extract dates
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g;
    const dates = text.match(dateRegex);
    if (dates) {
      fields.dates = dates;
    }

    // Extract amounts/currency
    const amountRegex = /\$[\d,]+\.?\d*|\d+\.?\d*\s*(USD|EUR|GBP|PLN)/gi;
    const amounts = text.match(amountRegex);
    if (amounts) {
      fields.amounts = amounts;
    }

    // Extract email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex);
    if (emails) {
      fields.emails = emails;
    }

    // Extract phone numbers
    const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phoneRegex);
    if (phones) {
      fields.phones = phones;
    }

    return fields;
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const polishWords = ['i', 'oraz', 'lub', 'ale', 'w', 'na', 'do', 'dla', 'z', 'przez', 'od', 'do'];
    
    const words = text.toLowerCase().split(/\s+/);
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    const polishCount = words.filter(word => polishWords.includes(word)).length;
    
    if (polishCount > englishCount) {
      return 'pl';
    }
    return 'en';
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    // This is a placeholder. In a real implementation, you would use
    // OpenAI's embedding API or another embedding service
    this.logger.warn('Embedding generation not implemented');
    return [];
  }
} 