# AWS S3 Configuration Guide

This guide will help you configure AWS S3 for the AI Document Processing System.

## Prerequisites

- AWS Account
- AWS CLI installed (optional, but recommended)
- Basic knowledge of AWS IAM and S3

## Step 1: Create S3 Bucket

### Option A: Using AWS Console

1. **Sign in to AWS Console**
   - Go to https://console.aws.amazon.com/
   - Navigate to S3 service

2. **Create Bucket**
   - Click "Create bucket"
   - Choose a unique bucket name (e.g., `ai-document-processor-2024`)
   - Select your preferred region
   - Keep default settings for now

3. **Configure Bucket**
   - Go to your bucket → Properties
   - Enable versioning (recommended)
   - Configure lifecycle rules (optional)

### Option B: Using AWS CLI

```bash
# Create bucket
aws s3 mb s3://your-bucket-name --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket your-bucket-name \
    --versioning-configuration Status=Enabled
```

## Step 2: Create IAM User and Policy

### Create IAM User

1. **Go to IAM Console**
   - Navigate to IAM → Users
   - Click "Create user"

2. **User Details**
   - Username: `ai-doc-processor-s3`
   - Access type: Programmatic access

3. **Permissions**
   - Attach policies directly
   - Create custom policy (see below)

### Create Custom Policy

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
```

### Alternative: Use Existing Policy

You can also use the `AmazonS3FullAccess` policy for testing, but it's not recommended for production.

## Step 3: Get Access Credentials

1. **Create Access Keys**
   - Go to IAM → Users → your-user
   - Security credentials tab
   - Create access key
   - Download the CSV file

2. **Note the credentials**
   - Access Key ID
   - Secret Access Key
   - Keep these secure!

## Step 4: Configure Environment Variables

1. **Update your .env file**

```env
# Storage Configuration
USE_LOCAL_STORAGE=false

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET=your-bucket-name
```

2. **For Docker deployment**

```bash
# Copy the template
cp env.docker .env

# Edit the file
nano .env
```

## Step 5: Test S3 Configuration

### Option A: Using AWS CLI

```bash
# Test bucket access
aws s3 ls s3://your-bucket-name

# Test upload
echo "test" > test.txt
aws s3 cp test.txt s3://your-bucket-name/
aws s3 ls s3://your-bucket-name/
aws s3 rm s3://your-bucket-name/test.txt
```

### Option B: Using the Application

1. **Start the application**
   ```bash
   docker-compose up -d
   ```

2. **Upload a test document**
   ```bash
   curl -X POST http://localhost:3000/documents/upload \
     -F "file=@test-invoice.txt" \
     -F "description=Test S3 upload"
   ```

3. **Check S3 bucket**
   - Go to AWS Console → S3 → your-bucket
   - You should see uploaded files in the `documents/` folder

## Step 6: Security Best Practices

### Bucket Policy (Optional)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowAppAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR-ACCOUNT-ID:user/ai-doc-processor-s3"
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

### CORS Configuration (if needed)

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## Step 7: Monitoring and Logging

### Enable S3 Access Logging

1. **Create logging bucket**
   ```bash
   aws s3 mb s3://your-bucket-logs
   ```

2. **Configure logging**
   - Go to your main bucket → Properties
   - Server access logging
   - Enable logging to the logs bucket

### CloudWatch Alarms

Set up CloudWatch alarms for:
- Bucket size
- Number of objects
- Error rates

## Troubleshooting

### Common Issues

1. **Access Denied**
   - Check IAM permissions
   - Verify bucket name
   - Ensure region is correct

2. **Bucket Not Found**
   - Verify bucket name spelling
   - Check if bucket exists in the specified region

3. **Upload Failures**
   - Check file size limits
   - Verify network connectivity
   - Check AWS service status

### Debug Commands

```bash
# Check AWS credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://your-bucket-name

# Check application logs
docker-compose logs -f app
```

## Production Considerations

1. **Use IAM Roles** instead of access keys when possible
2. **Enable encryption** at rest and in transit
3. **Set up lifecycle policies** for cost optimization
4. **Monitor costs** regularly
5. **Use CloudTrail** for audit logging
6. **Consider using S3 Transfer Acceleration** for better performance

## Cost Optimization

1. **Lifecycle Policies**
   - Move old files to cheaper storage classes
   - Delete files after a certain period

2. **Storage Classes**
   - Standard for frequently accessed files
   - Standard-IA for infrequently accessed files
   - Glacier for long-term storage

3. **Monitoring**
   - Set up billing alerts
   - Monitor storage usage

## Example Lifecycle Policy

```json
{
    "Rules": [
        {
            "ID": "MoveToIA",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "documents/"
            },
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                }
            ]
        }
    ]
}
```

## Next Steps

After configuring S3:

1. **Test the application** with file uploads
2. **Monitor the logs** for any issues
3. **Set up monitoring** and alerting
4. **Configure backup** strategies
5. **Review security** settings

Your AI Document Processing System is now ready to use S3 for scalable, reliable file storage! 