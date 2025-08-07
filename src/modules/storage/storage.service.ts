import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private useLocalStorage: boolean;
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.useLocalStorage = this.configService.get('USE_LOCAL_STORAGE', 'true') === 'true';
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');

    if (!this.useLocalStorage) {
      this.s3Client = new S3Client({
        region: this.configService.get('AWS_REGION', 'us-east-1'),
        credentials: {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        },
      });
      this.bucketName = this.configService.get('AWS_S3_BUCKET');
    } else {
      // Ensure upload directory exists
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<{ key: string; url: string }> {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const key = `documents/${fileName}`;

    try {
      if (this.useLocalStorage) {
        const filePath = path.join(this.uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        return {
          key,
          url: `file://${filePath}`,
        };
      } else {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        });

        await this.s3Client.send(command);
        return {
          key,
          url: `s3://${this.bucketName}/${key}`,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw new Error('File upload failed');
    }
  }

  async getFile(key: string): Promise<Buffer> {
    try {
      if (this.useLocalStorage) {
        const fileName = key.split('/').pop();
        const filePath = path.join(this.uploadDir, fileName);
        return fs.readFileSync(filePath);
      } else {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });

        const response = await this.s3Client.send(command);
        const chunks = [];
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      }
    } catch (error) {
      this.logger.error(`Failed to get file: ${error.message}`);
      throw new Error('File retrieval failed');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      if (this.useLocalStorage) {
        const fileName = key.split('/').pop();
        const filePath = path.join(this.uploadDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });

        await this.s3Client.send(command);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw new Error('File deletion failed');
    }
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (this.useLocalStorage) {
      return `file://${path.join(this.uploadDir, key.split('/').pop())}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
} 