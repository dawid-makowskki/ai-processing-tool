import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { UploadDocumentDto, ProcessDocumentDto, DocumentResponseDto } from '../../common/dto/upload-document.dto';

@ApiTags('documents')
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a document for processing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document file and metadata',
    type: UploadDocumentDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: DocumentResponseDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentService.uploadDocument(file, uploadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents' })
  @ApiResponse({
    status: 200,
    description: 'List of all documents',
    type: [DocumentResponseDto],
  })
  async getAllDocuments(): Promise<DocumentResponseDto[]> {
    return this.documentService.getAllDocuments();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific document by ID' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({
    status: 200,
    description: 'Document details',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async getDocument(@Param('id') id: string): Promise<DocumentResponseDto> {
    return this.documentService.getDocument(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async deleteDocument(@Param('id') id: string): Promise<void> {
    return this.documentService.deleteDocument(id);
  }

  @Post('process')
  @ApiOperation({ summary: 'Reprocess a document with AI' })
  @ApiBody({
    description: 'Document processing request',
    type: ProcessDocumentDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Document processing started',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async reprocessDocument(@Body() processDto: ProcessDocumentDto): Promise<DocumentResponseDto> {
    return this.documentService.reprocessDocument(processDto);
  }
} 