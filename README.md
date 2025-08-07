# AI-Powered Document Processing System

A comprehensive document processing backend system built with NestJS, LangChain, and OpenAI. The system can analyze, classify, and extract information from various document formats using AI.

## Features

- **Document Upload & Storage**: Support for PDF, DOCX, TXT, and image files
- **AI-Powered Processing**: 
  - Text extraction from various formats
  - Document summarization using LLM
  - Automatic classification (invoice, contract, report, etc.)
  - Keyword extraction
  - Language detection
  - Sentiment analysis
  - Structured data extraction
- **Semantic Search**: Search documents using natural language queries
- **Flexible Storage**: Local file system or AWS S3 integration
- **RESTful API**: Complete API with Swagger documentation
- **Database Integration**: PostgreSQL with TypeORM

## Tech Stack

- **Backend**: NestJS (Node.js/TypeScript)
- **AI/ML**: LangChain, OpenAI GPT
- **Database**: PostgreSQL with TypeORM
- **Storage**: Local filesystem or AWS S3
- **Document Parsing**: pdf-parse, mammoth, textract
- **API Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- OpenAI API key (for AI features)

## Installation

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI_workshop
   ```

2. **Set up environment variables**
   ```bash
   cp env.docker .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # OpenAI API Key (required for AI features)
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Storage Configuration
   USE_LOCAL_STORAGE=false  # Set to 'true' for local storage
   
   # AWS S3 Configuration (required when USE_LOCAL_STORAGE=false)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_S3_BUCKET=your_s3_bucket_name
   ```

3. **Configure S3 (Optional but Recommended)**

   **Quick Setup (if you have AWS CLI):**
   ```bash
   ./s3-setup.sh
   ```

   **Manual Setup:**
   - Follow the detailed guide in `S3_SETUP.md`
   - Create S3 bucket and IAM user
   - Configure credentials in `.env` file

4. **Run with Docker Compose**

   **Production:**
   ```bash
   docker-compose up -d
   ```

   **Development (with hot reload):**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

5. **Access the application**
   - API: http://localhost:3000
   - Swagger Docs: http://localhost:3000/api
   - Health Check: http://localhost:3000/health

### Option 2: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI_workshop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_NAME=ai_document_processor
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Storage (use local storage for development)
   USE_LOCAL_STORAGE=true
   UPLOAD_DIR=./uploads
   ```

4. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE ai_document_processor;
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production build
   npm run build
   npm run start:prod
   ```

## API Documentation

Once the application is running, you can access the Swagger documentation at:
```
http://localhost:3000/api
```

## API Endpoints

### Documents
- `POST /documents/upload` - Upload a document for processing
- `GET /documents` - Get all documents
- `GET /documents/:id` - Get a specific document
- `DELETE /documents/:id` - Delete a document
- `POST /documents/process` - Reprocess a document with AI

### Search
- `GET /search?query=<search_term>` - Search documents semantically
- `GET /search/category/:category` - Get documents by category
- `GET /search/language/:language` - Get documents by language

## Usage Examples

### Upload and Process a Document

```bash
curl -X POST http://localhost:3000/documents/upload \
  -F "file=@/path/to/your/document.pdf" \
  -F "description=Sample invoice" \
  -F "category=invoice"
```

### Search Documents

```bash
curl "http://localhost:3000/search?query=invoice&limit=5&category=invoice"
```

### Get Document Details

```bash
curl http://localhost:3000/documents/{document_id}
```

## Document Processing Flow

1. **Upload**: Document is uploaded and stored (local or S3)
2. **Text Extraction**: Text is extracted from the document based on its format
3. **AI Processing**: 
   - Summary generation
   - Classification with confidence score
   - Keyword extraction
   - Language detection
   - Sentiment analysis
   - Structured data extraction
4. **Storage**: Results are stored in the database
5. **Search**: Documents become searchable via semantic search

## Supported File Formats

- **PDF**: Using pdf-parse
- **DOCX**: Using mammoth
- **TXT**: Direct text processing
- **Images**: Using textract (requires additional system dependencies)

## Configuration Options

### Storage Configuration
- `USE_LOCAL_STORAGE`: Set to `true` for local storage, `false` for S3
- `UPLOAD_DIR`: Local directory for file storage
- AWS S3 credentials (when using S3):
  - `AWS_REGION`: S3 bucket region
  - `AWS_ACCESS_KEY_ID`: IAM user access key
  - `AWS_SECRET_ACCESS_KEY`: IAM user secret key
  - `AWS_S3_BUCKET`: S3 bucket name

### AI Configuration
- `OPENAI_API_KEY`: Your OpenAI API key
- `OPENAI_MODEL`: Model to use (default: gpt-3.5-turbo)

### Database Configuration
- PostgreSQL connection settings
- Database name, host, port, credentials

## Development

### Project Structure
```
src/
├── main.ts                 # Application entry point
├── app.module.ts          # Root module
├── config/                # Configuration files
├── common/                # Shared entities, DTOs, interfaces
├── modules/               # Feature modules
│   ├── document/          # Document management
│   ├── ai/               # AI processing
│   ├── storage/          # File storage
│   └── search/           # Search functionality
```

### Adding New Features

1. Create a new module in `src/modules/`
2. Define entities in `src/common/entities/`
3. Create DTOs in `src/common/dto/`
4. Implement services and controllers
5. Add the module to `app.module.ts`

## Docker Commands

### Production
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Remove all data (volumes)
docker-compose down -v
```

### Development
```bash
# Start development environment with hot reload
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

### Individual Services
```bash
# Start only database
docker-compose up -d postgres redis

# Start only application
docker-compose up -d app

# Access database
docker-compose exec postgres psql -U postgres -d ai_document_processor

# Access application container
docker-compose exec app sh
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set up AWS S3 (recommended for production)
4. Configure proper security settings
5. Use environment variables for sensitive data
6. Use Docker Compose for easy deployment

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and credentials are correct
2. **OpenAI API**: Verify API key is valid and has sufficient credits
3. **File Upload**: Check file size limits and supported formats
4. **Text Extraction**: Some formats may require additional system dependencies

### Logs

Check application logs for detailed error information:
```bash
npm run start:dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License. 