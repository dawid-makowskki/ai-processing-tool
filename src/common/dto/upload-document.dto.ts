import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { DocumentCategory } from '../entities/document.entity';

export class UploadDocumentDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: Express.Multer.File;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: DocumentCategory })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;
}

export class ProcessDocumentDto {
  @ApiProperty()
  @IsString()
  documentId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customPrompt?: string;
}

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  summary?: string;

  @ApiProperty({ required: false })
  keywords?: string[];

  @ApiProperty({ required: false })
  category?: string;

  @ApiProperty({ required: false })
  confidence?: number;

  @ApiProperty({ required: false })
  language?: string;

  @ApiProperty({ required: false })
  sentiment?: number;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ required: false })
  extractedFields?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
} 