# S3 Bucket Configuration Guide

This guide explains how to configure AWS S3 buckets for the Hotel Billing Admin Portal with proper security settings.

## Required Buckets

You need to create two S3 buckets:
1. **Photos Bucket** - For hotel profile photos
2. **Invoices Bucket** - For generated invoice PDFs

## Bucket Creation Steps

### 1. Create the Buckets

```bash
# Replace with your desired bucket names
export PHOTOS_BUCKET="hotel-photos-bucket"
export INVOICES_BUCKET="hotel-invoices-bucket"
export AWS_REGION="us-east-1"

# Create photos bucket
aws s3api create-bucket \
  --bucket $PHOTOS_BUCKET \
  --region $AWS_REGION

# Create invoices bucket
aws s3api create-bucket \
  --bucket $INVOICES_BUCKET \
  --region $AWS_REGION
```

### 2. Block Public Access (REQUIRED)

**All buckets must be private.** Block all public access to ensure files are only accessible via presigned URLs.

```bash
# Block public access for photos bucket
aws s3api put-public-access-block \
  --bucket $PHOTOS_BUCKET \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Block public access for invoices bucket
aws s3api put-public-access-block \
  --bucket $INVOICES_BUCKET \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 3. Configure CORS for Client Uploads

CORS configuration allows the browser to upload files directly to S3 using presigned URLs.

Create a file named `cors-config.json`:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply CORS configuration:

```bash
# Apply CORS to photos bucket
aws s3api put-bucket-cors \
  --bucket $PHOTOS_BUCKET \
  --cors-configuration file://cors-config.json

# Apply CORS to invoices bucket
aws s3api put-bucket-cors \
  --bucket $INVOICES_BUCKET \
  --cors-configuration file://cors-config.json
```

### 4. Set Bucket Policy

Create a file named `bucket-policy.json` (replace `YOUR_BUCKET_NAME` and `YOUR_AWS_ACCOUNT_ID`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "AllowPresignedURLAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_AWS_ACCOUNT_ID:root"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

Apply bucket policy:

```bash
# Apply policy to photos bucket
aws s3api put-bucket-policy \
  --bucket $PHOTOS_BUCKET \
  --policy file://bucket-policy.json

# Apply policy to invoices bucket
aws s3api put-bucket-policy \
  --bucket $INVOICES_BUCKET \
  --policy file://bucket-policy.json
```

### 5. Enable Versioning (Optional but Recommended)

```bash
# Enable versioning for photos bucket
aws s3api put-bucket-versioning \
  --bucket $PHOTOS_BUCKET \
  --versioning-configuration Status=Enabled

# Enable versioning for invoices bucket
aws s3api put-bucket-versioning \
  --bucket $INVOICES_BUCKET \
  --versioning-configuration Status=Enabled
```

### 6. Configure Lifecycle Rules (Optional)

To automatically delete old invoice files after a certain period:

Create `lifecycle-policy.json`:

```json
{
  "Rules": [
    {
      "Id": "DeleteOldInvoices",
      "Status": "Enabled",
      "Prefix": "invoices/",
      "Expiration": {
        "Days": 2555
      }
    }
  ]
}
```

Apply lifecycle policy:

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket $INVOICES_BUCKET \
  --lifecycle-configuration file://lifecycle-policy.json
```

## IAM User Setup

Create an IAM user with programmatic access and attach the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_PHOTOS_BUCKET/*",
        "arn:aws:s3:::YOUR_INVOICES_BUCKET/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_PHOTOS_BUCKET",
        "arn:aws:s3:::YOUR_INVOICES_BUCKET"
      ]
    }
  ]
}
```

## Environment Variables

Add the following to your `.env` file:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET_PHOTOS=hotel-photos-bucket
S3_BUCKET_INVOICES=hotel-invoices-bucket
```

## Security Checklist

- [x] Buckets are set to private (no public access)
- [x] CORS is configured for allowed origins only
- [x] Bucket policy enforces HTTPS (SecureTransport)
- [x] IAM user has minimal required permissions
- [x] Presigned URLs expire after 15 minutes
- [x] File uploads are validated for type and size
- [x] User authorization is checked before generating URLs

## Testing Bucket Configuration

You can test your bucket configuration using the AWS CLI:

```bash
# Test that public access is blocked
aws s3api get-public-access-block --bucket $PHOTOS_BUCKET

# Test CORS configuration
aws s3api get-bucket-cors --bucket $PHOTOS_BUCKET

# Test bucket policy
aws s3api get-bucket-policy --bucket $PHOTOS_BUCKET
```

## Troubleshooting

### CORS Errors
- Ensure your application URL is in the `AllowedOrigins` list
- Check that the CORS configuration is applied correctly
- Verify that the browser is sending the correct Origin header

### Access Denied Errors
- Verify IAM user has correct permissions
- Check that bucket policy allows the IAM user
- Ensure presigned URLs haven't expired

### Upload Failures
- Verify file type is allowed
- Check file size limits
- Ensure Content-Type header matches the presigned URL
