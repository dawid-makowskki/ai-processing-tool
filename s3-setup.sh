#!/bin/bash

echo "☁️  AWS S3 Configuration Helper"
echo "================================"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    echo ""
    echo "You can still configure S3 manually using the S3_SETUP.md guide."
    exit 1
fi

echo "✅ AWS CLI is installed."

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials are not configured."
    echo "Please run: aws configure"
    echo "Or set environment variables:"
    echo "export AWS_ACCESS_KEY_ID=your_key"
    echo "export AWS_SECRET_ACCESS_KEY=your_secret"
    echo "export AWS_DEFAULT_REGION=us-east-1"
    exit 1
fi

echo "✅ AWS credentials are configured."

# Get current AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "🔐 Using AWS Account: $ACCOUNT_ID"

# Interactive setup
echo ""
echo "Let's configure S3 for your AI Document Processing System:"
echo ""

# Get bucket name
read -p "Enter S3 bucket name (e.g., ai-doc-processor-2024): " BUCKET_NAME

if [ -z "$BUCKET_NAME" ]; then
    echo "❌ Bucket name is required."
    exit 1
fi

# Get region
read -p "Enter AWS region (default: us-east-1): " REGION
REGION=${REGION:-us-east-1}

echo ""
echo "📋 Configuration Summary:"
echo "   Bucket: $BUCKET_NAME"
echo "   Region: $REGION"
echo "   Account: $ACCOUNT_ID"
echo ""

read -p "Proceed with this configuration? (y/N): " CONFIRM

if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled."
    exit 1
fi

echo ""
echo "🚀 Setting up S3 configuration..."

# Check if bucket exists
if aws s3 ls "s3://$BUCKET_NAME" &> /dev/null; then
    echo "✅ Bucket '$BUCKET_NAME' already exists."
else
    echo "📦 Creating bucket '$BUCKET_NAME'..."
    if aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"; then
        echo "✅ Bucket created successfully."
    else
        echo "❌ Failed to create bucket. Please check your permissions."
        exit 1
    fi
fi

# Enable versioning
echo "🔄 Enabling bucket versioning..."
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

# Create test file
echo "🧪 Creating test file..."
echo "This is a test file for S3 configuration." > s3-test.txt

# Test upload
echo "📤 Testing upload..."
if aws s3 cp s3-test.txt "s3://$BUCKET_NAME/test-upload.txt"; then
    echo "✅ Upload test successful."
else
    echo "❌ Upload test failed. Please check your permissions."
    rm s3-test.txt
    exit 1
fi

# Test download
echo "📥 Testing download..."
if aws s3 cp "s3://$BUCKET_NAME/test-upload.txt" s3-test-download.txt; then
    echo "✅ Download test successful."
else
    echo "❌ Download test failed."
fi

# Clean up test files
echo "🧹 Cleaning up test files..."
aws s3 rm "s3://$BUCKET_NAME/test-upload.txt"
rm s3-test.txt s3-test-download.txt

# Update .env file
echo "📝 Updating .env file..."

if [ ! -f .env ]; then
    cp env.docker .env
    echo "✅ Created .env file from template."
fi

# Update .env with S3 configuration
sed -i.bak "s/USE_LOCAL_STORAGE=.*/USE_LOCAL_STORAGE=false/" .env
sed -i.bak "s/AWS_REGION=.*/AWS_REGION=$REGION/" .env
sed -i.bak "s/AWS_S3_BUCKET=.*/AWS_S3_BUCKET=$BUCKET_NAME/" .env

echo "✅ Updated .env file with S3 configuration."
echo ""
echo "🔧 Next steps:"
echo "1. Edit .env file and add your AWS credentials:"
echo "   AWS_ACCESS_KEY_ID=your_access_key_id"
echo "   AWS_SECRET_ACCESS_KEY=your_secret_access_key"
echo ""
echo "2. Start the application:"
echo "   docker-compose up -d"
echo ""
echo "3. Test the application:"
echo "   curl -X POST http://localhost:3000/documents/upload \\"
echo "     -F \"file=@test-invoice.txt\" \\"
echo "     -F \"description=Test S3 upload\""
echo ""
echo "4. Check S3 bucket:"
echo "   aws s3 ls s3://$BUCKET_NAME/documents/"
echo ""
echo "📖 For detailed configuration, see S3_SETUP.md"
echo "🎉 S3 configuration completed!" 