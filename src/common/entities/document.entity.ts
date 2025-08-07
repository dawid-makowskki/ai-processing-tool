import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum DocumentStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

export enum DocumentCategory {
  INVOICE = 'invoice',
  CONTRACT = 'contract',
  REPORT = 'report',
  RECEIPT = 'receipt',
  FORM = 'form',
  OTHER = 'other',
}

@Entity('documents')
export class Document {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  filename: string;

  @ApiProperty()
  @Column()
  originalName: string;

  @ApiProperty()
  @Column()
  mimeType: string;

  @ApiProperty()
  @Column('bigint')
  size: number;

  @ApiProperty()
  @Column()
  storageKey: string;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.UPLOADED,
  })
  status: DocumentStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  extractedText?: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  summary?: string;

  @ApiProperty({ required: false })
  @Column('simple-array', { nullable: true })
  keywords?: string[];

  @ApiProperty({ required: false })
  @Column({
    type: 'enum',
    enum: DocumentCategory,
    nullable: true,
  })
  category?: DocumentCategory;

  @ApiProperty({ required: false })
  @Column('float', { nullable: true })
  confidence?: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  language?: string;

  @ApiProperty({ required: false })
  @Column('float', { nullable: true })
  sentiment?: number;

  @ApiProperty({ required: false })
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty({ required: false })
  @Column('jsonb', { nullable: true })
  extractedFields?: Record<string, any>;

  @ApiProperty({ required: false })
  @Column('simple-array', { nullable: true })
  embeddings?: number[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
} 