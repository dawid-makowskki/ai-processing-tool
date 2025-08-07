import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus, DocumentCategory } from '../../common/entities/document.entity';
import { StorageService } from '../storage/storage.service';
import { AiService, ProcessingResult } from '../ai/ai.service';
import { UploadDocumentDto, ProcessDocumentDto, DocumentResponseDto } from '../../common/dto/upload-document.dto';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private storageService: StorageService,
    private aiService: AiService,
  ) {}

  async uploadDocument(file: Express.Multer.File, uploadDto: UploadDocumentDto): Promise<DocumentResponseDto> {
    try {
      // Validate file
      this.validateFile(file);

      // Upload to storage
      const { key, url } = await this.storageService.uploadFile(file);

      // Create document record
      const document = this.documentRepository.create({
        filename: file.filename || file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey: key,
        status: DocumentStatus.UPLOADED,
      });

      const savedDocument = await this.documentRepository.save(document);

      // Start async processing
      this.processDocumentAsync(savedDocument.id);

      return this.mapToResponseDto(savedDocument);
    } catch (error) {
      this.logger.error(`Document upload failed: ${error.message}`);
      throw error;
    }
  }

  async getDocument(id: string): Promise<DocumentResponseDto> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return this.mapToResponseDto(document);
  }

  async getAllDocuments(): Promise<DocumentResponseDto[]> {
    const documents = await this.documentRepository.find({
      order: { createdAt: 'DESC' },
    });
    return documents.map(doc => this.mapToResponseDto(doc));
  }

  async deleteDocument(id: string): Promise<void> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Delete from storage
    await this.storageService.deleteFile(document.storageKey);

    // Delete from database
    await this.documentRepository.remove(document);
  }

  async reprocessDocument(processDto: ProcessDocumentDto): Promise<DocumentResponseDto> {
    const document = await this.documentRepository.findOne({ where: { id: processDto.documentId } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${processDto.documentId} not found`);
    }

    // Start async processing
    this.processDocumentAsync(document.id, processDto.customPrompt);

    return this.mapToResponseDto(document);
  }

  private async processDocumentAsync(documentId: string, customPrompt?: string): Promise<void> {
    try {
      // Update status to processing
      await this.documentRepository.update(documentId, { status: DocumentStatus.PROCESSING });

      const document = await this.documentRepository.findOne({ where: { id: documentId } });
      if (!document) return;

      // Get file from storage
      const fileBuffer = await this.storageService.getFile(document.storageKey);

      // Extract text
      const extractedText = await this.aiService.extractTextFromFile(fileBuffer, document.mimeType);

      // Process with AI
      const processingResult = await this.aiService.processDocument(extractedText);

      // Generate embeddings
      const embeddings = await this.aiService.generateEmbeddings(extractedText);

      // Update document with results
      await this.documentRepository.update(documentId, {
        status: DocumentStatus.PROCESSED,
        extractedText,
        summary: processingResult.summary,
        keywords: processingResult.keywords,
        category: processingResult.category as DocumentCategory,
        confidence: processingResult.confidence,
        language: processingResult.language,
        sentiment: processingResult.sentiment,
        extractedFields: processingResult.extractedFields,
        embeddings,
      });

      this.logger.log(`Document ${documentId} processed successfully`);
    } catch (error) {
      this.logger.error(`Document processing failed for ${documentId}: ${error.message}`);
      
      // Update status to failed
      await this.documentRepository.update(documentId, { 
        status: DocumentStatus.FAILED,
        metadata: { error: error.message }
      });
    }
  }

  private validateFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Unsupported file type: ${file.mimetype}`);
    }

    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum limit of 10MB`);
    }
  }

  private mapToResponseDto(document: Document): DocumentResponseDto {
    return {
      id: document.id,
      filename: document.filename,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
      status: document.status,
      summary: document.summary,
      keywords: document.keywords,
      category: document.category,
      confidence: document.confidence,
      language: document.language,
      sentiment: document.sentiment,
      metadata: document.metadata,
      extractedFields: document.extractedFields,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
} 