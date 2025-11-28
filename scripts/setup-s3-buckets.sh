#!/bin/bash

# =============================================================================
# AWS S3 Bucket Setup Script for Hotel Billing Admin Portal
# =============================================================================
# This script automates the creation and configuration of S3 buckets
# for the Hotel Billing Management Admin Portal
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    echo "Visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured."
    echo "Run: aws configure"
    exit 1
fi

print_info "AWS CLI is configured and ready."

# Prompt for configuration
echo ""
echo "==================================================================="
echo "  AWS S3 Bucket Setup for Hotel Billing Admin Portal"
echo "==================================================================="
echo ""

read -p "Enter the name for the PHOTOS bucket (e.g., hotel-photos-prod): " PHOTOS_BUCKET
read -p "Enter the name for the INVOICES bucket (e.g., hotel-invoices-prod): " INVOICES_BUCKET
read -p "Enter AWS region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

read -p "Enter your application domain (e.g., https://yourdomain.vercel.app): " APP_DOMAIN

echo ""
print_info "Configuration:"
echo "  Photos Bucket: $PHOTOS_BUCKET"
echo "  Invoices Bucket: $INVOICES_BUCKET"
echo "  Region: $AWS_REGION"
echo "  App Domain: $APP_DOMAIN"
echo ""

read -p "Proceed with bucket creation? (y/n): " CONFIRM
if [[ $CONFIRM != "y" && $CONFIRM != "Y" ]]; then
    print_warning "Setup cancelled."
    exit 0
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_info "AWS Account ID: $AWS_ACCOUNT_ID"

# =============================================================================
# Step 1: Create Buckets
# =============================================================================
echo ""
print_info "Step 1: Creating S3 buckets..."

# Create photos bucket
if aws s3api head-bucket --bucket "$PHOTOS_BUCKET" 2>/dev/null; then
    print_warning "Bucket $PHOTOS_BUCKET already exists. Skipping creation."
else
    if [ "$AWS_REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "$PHOTOS_BUCKET" --region "$AWS_REGION"
    else
        aws s3api create-bucket --bucket "$PHOTOS_BUCKET" --region "$AWS_REGION" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION"
    fi
    print_info "Created bucket: $PHOTOS_BUCKET"
fi

# Create invoices bucket
if aws s3api head-bucket --bucket "$INVOICES_BUCKET" 2>/dev/null; then
    print_warning "Bucket $INVOICES_BUCKET already exists. Skipping creation."
else
    if [ "$AWS_REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "$INVOICES_BUCKET" --region "$AWS_REGION"
    else
        aws s3api create-bucket --bucket "$INVOICES_BUCKET" --region "$AWS_REGION" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION"
    fi
    print_info "Created bucket: $INVOICES_BUCKET"
fi

# =============================================================================
# Step 2: Block Public Access
# =============================================================================
echo ""
print_info "Step 2: Blocking public access..."

aws s3api put-public-access-block \
    --bucket "$PHOTOS_BUCKET" \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
print_info "Public access blocked for: $PHOTOS_BUCKET"

aws s3api put-public-access-block \
    --bucket "$INVOICES_BUCKET" \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
print_info "Public access blocked for: $INVOICES_BUCKET"

# =============================================================================
# Step 3: Configure CORS
# =============================================================================
echo ""
print_info "Step 3: Configuring CORS..."

# Create temporary CORS config
CORS_CONFIG=$(cat <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "$APP_DOMAIN"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF
)

echo "$CORS_CONFIG" > /tmp/cors-config.json

aws s3api put-bucket-cors --bucket "$PHOTOS_BUCKET" --cors-configuration file:///tmp/cors-config.json
print_info "CORS configured for: $PHOTOS_BUCKET"

aws s3api put-bucket-cors --bucket "$INVOICES_BUCKET" --cors-configuration file:///tmp/cors-config.json
print_info "CORS configured for: $INVOICES_BUCKET"

rm /tmp/cors-config.json

# =============================================================================
# Step 4: Set Bucket Policies
# =============================================================================
echo ""
print_info "Step 4: Setting bucket policies..."

# Photos bucket policy
PHOTOS_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::$PHOTOS_BUCKET",
        "arn:aws:s3:::$PHOTOS_BUCKET/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
EOF
)

echo "$PHOTOS_POLICY" > /tmp/photos-policy.json
aws s3api put-bucket-policy --bucket "$PHOTOS_BUCKET" --policy file:///tmp/photos-policy.json
print_info "Bucket policy set for: $PHOTOS_BUCKET"
rm /tmp/photos-policy.json

# Invoices bucket policy
INVOICES_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::$INVOICES_BUCKET",
        "arn:aws:s3:::$INVOICES_BUCKET/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
EOF
)

echo "$INVOICES_POLICY" > /tmp/invoices-policy.json
aws s3api put-bucket-policy --bucket "$INVOICES_BUCKET" --policy file:///tmp/invoices-policy.json
print_info "Bucket policy set for: $INVOICES_BUCKET"
rm /tmp/invoices-policy.json

# =============================================================================
# Step 5: Enable Versioning (Optional)
# =============================================================================
echo ""
read -p "Enable versioning for buckets? (recommended) (y/n): " ENABLE_VERSIONING
if [[ $ENABLE_VERSIONING == "y" || $ENABLE_VERSIONING == "Y" ]]; then
    print_info "Step 5: Enabling versioning..."
    
    aws s3api put-bucket-versioning \
        --bucket "$PHOTOS_BUCKET" \
        --versioning-configuration Status=Enabled
    print_info "Versioning enabled for: $PHOTOS_BUCKET"
    
    aws s3api put-bucket-versioning \
        --bucket "$INVOICES_BUCKET" \
        --versioning-configuration Status=Enabled
    print_info "Versioning enabled for: $INVOICES_BUCKET"
else
    print_warning "Skipping versioning setup."
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "==================================================================="
print_info "S3 Bucket Setup Complete!"
echo "==================================================================="
echo ""
echo "Buckets created and configured:"
echo "  - $PHOTOS_BUCKET (Photos)"
echo "  - $INVOICES_BUCKET (Invoices)"
echo ""
echo "Next steps:"
echo "  1. Add these environment variables to your .env file:"
echo ""
echo "     AWS_REGION=$AWS_REGION"
echo "     S3_BUCKET_PHOTOS=$PHOTOS_BUCKET"
echo "     S3_BUCKET_INVOICES=$INVOICES_BUCKET"
echo ""
echo "  2. Create an IAM user with S3 access permissions"
echo "     See: docs/s3-configs/iam-policy.json"
echo ""
echo "  3. Add IAM credentials to your environment:"
echo "     AWS_ACCESS_KEY_ID=your_access_key"
echo "     AWS_SECRET_ACCESS_KEY=your_secret_key"
echo ""
echo "  4. For Vercel deployment, add these as environment variables"
echo "     in your Vercel project settings"
echo ""
echo "==================================================================="
