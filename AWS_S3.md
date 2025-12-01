# AWS S3 Integration Guide - Step by Step Implementation

This guide provides detailed instructions on how to implement AWS S3 cloud storage in the Top Tutors Connect project. It covers everything from creating an AWS account to configuring buckets, IAM users, and setting up the application.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create AWS Account](#step-1-create-aws-account)
3. [Step 2: Create S3 Buckets](#step-2-create-s3-buckets)
4. [Step 3: Create IAM User](#step-3-create-iam-user)
5. [Step 4: Configure IAM Policies](#step-4-configure-iam-policies)
6. [Step 5: Get Access Keys](#step-5-get-access-keys)
7. [Step 6: Configure Bucket Settings](#step-6-configure-bucket-settings)
8. [Step 7: Set Up Environment Variables](#step-7-set-up-environment-variables)
9. [Step 8: Install Dependencies](#step-8-install-dependencies)
10. [Step 9: Testing the Integration](#step-9-testing-the-integration)
11. [Troubleshooting](#troubleshooting)
12. [Cost Optimization](#cost-optimization)
13. [Security Best Practices](#security-best-practices)

---

## Prerequisites

Before starting, ensure you have:

- An AWS account (or ability to create one)
- Access to AWS Console
- Admin access to your project's backend environment
- Node.js and npm installed
- Basic understanding of cloud storage concepts

**Note**: AWS offers a Free Tier that includes 5 GB of S3 storage for 12 months, which is perfect for getting started.

---

## Step 1: Create AWS Account

### 1.1 Sign Up for AWS

1. Go to [AWS Sign Up Page](https://aws.amazon.com/)
2. Click **"Create an AWS Account"**
3. Follow the registration process:
   - Enter your email address
   - Create a password
   - Provide contact information
   - Add payment method (required, but Free Tier won't charge you)
   - Verify your identity via phone call or SMS

### 1.2 Access AWS Console

1. Once registered, go to [AWS Console](https://console.aws.amazon.com/)
2. Sign in with your credentials
3. You'll see the AWS Management Console dashboard

### 1.3 Get Your AWS Account ID

You'll need your AWS Account ID for some configurations:

1. Click on your account name (top right)
2. Your **12-digit Account ID** is displayed in the dropdown
3. **Copy this number** - you'll need it later

---

## Step 2: Create S3 Buckets

The project uses S3 for multiple purposes. You can use one bucket with different folders or create separate buckets. We'll create separate buckets for better organization.

### 2.1 Create Documents Bucket

1. In AWS Console, search for **"S3"** in the top search bar
2. Click on **"S3"** service
3. Click **"Create bucket"** button

#### Bucket Configuration:

1. **Bucket name**: 
   - Enter a unique name (e.g., `top-tutors-documents-prod`)
   - ⚠️ Bucket names must be globally unique across all AWS accounts
   - Use lowercase letters, numbers, and hyphens only
   - Cannot start or end with a hyphen

2. **AWS Region**: 
   - Select your preferred region (e.g., `us-east-1`, `us-west-2`, `eu-west-1`)
   - **Note**: Choose a region close to your users for better performance
   - **Important**: Remember this region - you'll need it for environment variables

3. **Object Ownership**:
   - Select **"ACLs disabled (recommended)"** for better security
   - Or **"ACLs enabled"** if you need fine-grained access control

4. **Block Public Access settings**:
   - ✅ **Keep all settings enabled** (recommended)
   - We'll use signed URLs for secure access, so public access isn't needed

5. **Bucket Versioning**:
   - **Disable** (unless you need version history)
   - Can be enabled later if needed

6. **Default encryption**:
   - ✅ **Enable**
   - Select **"Amazon S3 managed keys (SSE-S3)"** (recommended)
   - Or **"AWS KMS"** for more control (additional cost)

7. **Advanced settings**:
   - Leave defaults for now
   - Can configure lifecycle policies later

8. Click **"Create bucket"**

### 2.2 Create Recordings Bucket (Optional but Recommended)

For storing Zoom meeting recordings separately:

1. Click **"Create bucket"** again
2. **Bucket name**: `top-tutors-recordings-prod` (or similar)
3. **Region**: Same region as documents bucket (recommended)
4. **Settings**: Same as documents bucket
5. Click **"Create bucket"**

### 2.3 Create Chat Media Bucket (Optional)

For storing chat media files:

1. Click **"Create bucket"** again
2. **Bucket name**: `top-tutors-chat-media-prod` (or similar)
3. **Region**: Same region as other buckets
4. **Settings**: Same as documents bucket
5. Click **"Create bucket"**

**Note**: You can use a single bucket with folders (`documents/`, `recordings/`, `chat-media/`) if preferred. The code supports both approaches.

---

## Step 3: Create IAM User

IAM (Identity and Access Management) users provide secure programmatic access to AWS services.

### 3.1 Navigate to IAM

1. In AWS Console, search for **"IAM"**
2. Click on **"IAM"** service
3. You'll see the IAM dashboard

### 3.2 Create New User

1. Click **"Users"** in the left sidebar
2. Click **"Create user"** button

### 3.3 Configure User Details

1. **User name**: 
   - Enter a descriptive name (e.g., `ttc-s3-storage-user`)
   - This is for your reference only

2. **AWS credential type**:
   - ✅ Check **"Provide user access to the AWS Management Console"** (optional, for manual access)
   - ✅ **REQUIRED**: Check **"Access key - Programmatic access"**
   - This is essential for API access

3. Click **"Next"**

### 3.4 Set Permissions (Temporary)

1. For now, select **"Attach policies directly"**
2. **Don't attach any policies yet** - we'll create a custom policy
3. Click **"Next"** to proceed
4. Review and click **"Create user"**

**Note**: We'll create and attach a custom policy in the next step for better security.

---

## Step 4: Configure IAM Policies

Creating a custom policy ensures the IAM user only has the minimum permissions needed.

### 4.1 Create Custom Policy

1. In IAM Console, click **"Policies"** in the left sidebar
2. Click **"Create policy"** button

### 4.2 Use JSON Editor

1. Click on the **"JSON"** tab
2. Delete the default content
3. Paste the following policy (adjust bucket names as needed):

#### Policy for Documents Bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowDocumentUpload",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/documents/*",
        "arn:aws:s3:::your-bucket-name/chat-media/*"
      ]
    },
    {
      "Sid": "AllowListBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name"
    },
    {
      "Sid": "AllowGetBucketLocation",
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

#### Policy for Recordings Bucket (if separate):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowRecordingUpload",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-recordings-bucket-name/recordings/*"
    },
    {
      "Sid": "AllowListRecordingsBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-recordings-bucket-name"
    },
    {
      "Sid": "AllowGetRecordingsBucketLocation",
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::your-recordings-bucket-name"
    }
  ]
}
```

#### Combined Policy (if using multiple buckets):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowDocumentOperations",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::top-tutors-documents-prod/documents/*",
        "arn:aws:s3:::top-tutors-documents-prod/chat-media/*"
      ]
    },
    {
      "Sid": "AllowRecordingOperations",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::top-tutors-recordings-prod/recordings/*"
      ]
    },
    {
      "Sid": "AllowListBuckets",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::top-tutors-documents-prod",
        "arn:aws:s3:::top-tutors-recordings-prod"
      ]
    },
    {
      "Sid": "AllowGetBucketLocations",
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::top-tutors-documents-prod",
        "arn:aws:s3:::top-tutors-recordings-prod"
      ]
    }
  ]
}
```

### 4.3 Configure Policy Details

1. Replace `your-bucket-name` with your actual bucket name(s)
2. Replace `your-recordings-bucket-name` if using separate buckets
3. Click **"Next"**

### 4.4 Name and Create Policy

1. **Policy name**: `TopTutorsS3AccessPolicy` (or your preferred name)
2. **Description**: `Allows S3 access for Top Tutors Connect application`
3. Click **"Create policy"**

### 4.5 Attach Policy to User

1. Go back to **"Users"** in IAM
2. Click on the user you created (e.g., `ttc-s3-storage-user`)
3. Click **"Add permissions"** → **"Attach policies directly"**
4. Search for your policy name (e.g., `TopTutorsS3AccessPolicy`)
5. ✅ Check the box next to your policy
6. Click **"Next"** → **"Add permissions"**

---

## Step 5: Get Access Keys

### 5.1 Create Access Key

1. In IAM Console, go to **"Users"**
2. Click on your IAM user (e.g., `ttc-s3-storage-user`)
3. Click on the **"Security credentials"** tab
4. Scroll down to **"Access keys"** section
5. Click **"Create access key"** button

### 5.2 Configure Access Key

1. **Use case**: Select **"Application running outside AWS"**
2. Click **"Next"**
3. (Optional) Add a description tag
4. Click **"Create access key"**

### 5.3 Save Credentials

**⚠️ CRITICAL**: This is the only time you'll see the secret access key!

1. **Access Key ID**: Copy this value
   - Format: `AKIAIOSFODNN7EXAMPLE`
   - You can see this again later if needed

2. **Secret Access Key**: Copy this value immediately
   - Format: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
   - **You cannot retrieve this again** - save it securely!

3. Click **"Done"**

### 5.4 Store Credentials Securely

- ✅ Save in a password manager
- ✅ Store in your `.env` file (never commit to git)
- ❌ Never share in emails or chat
- ❌ Never commit to version control

---

## Step 6: Configure Bucket Settings

### 6.1 Enable CORS (If Needed)

If your frontend needs direct S3 access (optional, as we use signed URLs):

1. Go to your S3 bucket
2. Click **"Permissions"** tab
3. Scroll to **"Cross-origin resource sharing (CORS)"**
4. Click **"Edit"**
5. Add CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-domain.com", "http://localhost:5173"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

6. Click **"Save changes"**

### 6.2 Configure Lifecycle Policies (Optional)

To automatically delete old files or move them to cheaper storage:

1. Go to your S3 bucket
2. Click **"Management"** tab
3. Click **"Create lifecycle rule"**
4. Configure:
   - **Rule name**: `DeleteOldRecordings`
   - **Rule scope**: Apply to all objects or prefix `recordings/`
   - **Actions**: 
     - ✅ **Delete expired delete markers or incomplete multipart uploads**
     - ✅ **Delete expired objects** (e.g., after 90 days)
5. Click **"Create rule"**

### 6.3 Enable Versioning (Optional)

If you want to keep file versions:

1. Go to your S3 bucket
2. Click **"Properties"** tab
3. Scroll to **"Bucket Versioning"**
4. Click **"Edit"** → Enable → **"Save changes"**

---

## Step 7: Set Up Environment Variables

### 7.1 Locate Your .env File

Navigate to your backend directory:

```bash
cd Backend
nano .env  # or use your preferred editor
```

### 7.2 Add AWS S3 Environment Variables

Add the following variables to your `.env` file:

```env
# ============================================
# AWS S3 CONFIGURATION
# ============================================

# AWS Credentials (from IAM user)
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here

# AWS Region (where your buckets are located)
AWS_REGION=us-east-1

# S3 Bucket Names
AWS_S3_BUCKET=top-tutors-documents-prod
# For recordings (if using separate bucket, this can be the same or different)
# The code uses AWS_S3_BUCKET for recordings by default

# AWS Account ID (12-digit number)
AWS_ACCOUNT_ID=123456789012

# Optional: Custom S3 Base URL (usually auto-generated)
# AWS_S3_BASE_URL=https://your-bucket-name.s3.us-east-1.amazonaws.com

# ============================================
# MEDIA STORAGE CONFIGURATION
# ============================================

# Storage type: 's3' for AWS S3, 'local' for local file system
MEDIA_STORAGE=s3

# Maximum file size in bytes (default: 20MB)
# MAX_FILE_SIZE=20971520

# Signed URL expiration in seconds (default: 7 days, max: 7 days for S3)
# MEDIA_SIGNED_URL_EXPIRY=604800

# ============================================
# FILE UPLOAD SETTINGS
# ============================================

# Maximum file size for document uploads (default: 10MB)
# MAX_FILE_SIZE=10485760

# Local upload directory (used when MEDIA_STORAGE=local)
# UPLOAD_DIR=./uploads/chat_media
```

### 7.3 Replace Placeholder Values

Replace the placeholder values with your actual credentials:

1. `your_access_key_id_here` → Your Access Key ID from Step 5.3
2. `your_secret_access_key_here` → Your Secret Access Key from Step 5.3
3. `us-east-1` → Your AWS region (e.g., `us-west-2`, `eu-west-1`)
4. `top-tutors-documents-prod` → Your actual bucket name
5. `123456789012` → Your 12-digit AWS Account ID

### 7.4 Security Best Practices

- ✅ **Never commit `.env` files to version control**
- ✅ Add `.env` to your `.gitignore` file:
  ```gitignore
  # Environment variables
  .env
  .env.local
  .env.production
  ```
- ✅ Use different buckets/credentials for development and production
- ✅ Rotate access keys periodically (every 90 days recommended)
- ✅ Use AWS Secrets Manager or Parameter Store in production

---

## Step 8: Install Dependencies

The project uses AWS SDK v3 for S3 operations. Verify dependencies are installed:

### 8.1 Check package.json

The following packages should be in `Backend/package.json`:

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.940.0",
    "@aws-sdk/s3-request-presigner": "^3.940.0"
  }
}
```

### 8.2 Install Dependencies

If not already installed:

```bash
cd Backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 8.3 Verify Installation

```bash
npm list @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

You should see the packages listed with their versions.

---

## Step 9: Testing the Integration

### 9.1 Start Your Server

1. Make sure your backend server is running:
   ```bash
   cd Backend
   npm start
   ```

2. Check the console output - you should see:
   ```
   ☁️ AWS S3 configured, using cloud storage
   S3 bucket top-tutors-documents-prod is accessible
   ```

### 9.2 Test File Upload

#### Option A: Test via API Endpoint

```bash
# Test document upload
curl -X POST http://localhost:4000/api/your-upload-endpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/test-file.pdf"
```

#### Option B: Test via Application

1. Log in to your application
2. Navigate to a file upload feature (e.g., document upload, chat media)
3. Upload a test file
4. Check that the file appears in your S3 bucket

### 9.3 Verify Files in S3

1. Go to AWS Console → S3
2. Click on your bucket
3. Navigate to the appropriate folder:
   - `documents/` for document uploads
   - `chat-media/` for chat media
   - `recordings/` for Zoom recordings
4. You should see your uploaded files

### 9.4 Test Signed URL Generation

The application generates signed URLs for secure file access. Test this:

```bash
# Get signed URL for a file (example endpoint)
curl -X GET http://localhost:4000/api/media/signed-url?key=chat-media/filename.jpg \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

You should receive a signed URL that works for accessing the file.

### 9.5 Test Recording Upload (If Using Zoom Integration)

1. Create a Zoom meeting with recording enabled
2. Record and end the meeting
3. Check that the recording appears in S3 under `recordings/` folder
4. Verify the recording URL is stored in the database

---

## Troubleshooting

### Issue: "Access Denied" Error

**Error Message**:
```
AccessDenied: Access Denied
```

**Solutions**:
1. **Verify IAM Policy**:
   - Check that your IAM policy includes the correct bucket name
   - Ensure the policy is attached to your IAM user
   - Verify the resource ARN matches your bucket

2. **Check Bucket Permissions**:
   - Ensure bucket doesn't have conflicting policies
   - Check bucket ACLs if enabled

3. **Verify Credentials**:
   - Double-check `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
   - Ensure no extra spaces or quotes in `.env` file
   - Try creating new access keys

### Issue: "Bucket Does Not Exist"

**Error Message**:
```
NoSuchBucket: The specified bucket does not exist
```

**Solutions**:
1. **Check Bucket Name**:
   - Verify bucket name in `.env` matches actual bucket name
   - Bucket names are case-sensitive
   - Check for typos

2. **Check Region**:
   - Ensure `AWS_REGION` matches the bucket's region
   - Buckets are region-specific

3. **Verify Bucket Exists**:
   - Go to S3 Console and verify bucket exists
   - Check you're looking in the correct AWS account

### Issue: "InvalidAccessKeyId"

**Error Message**:
```
InvalidAccessKeyId: The AWS Access Key Id you provided does not exist
```

**Solutions**:
1. **Verify Access Key**:
   - Check that `AWS_ACCESS_KEY_ID` is correct
   - Ensure no extra spaces or characters

2. **Check IAM User**:
   - Verify the IAM user exists and is active
   - Ensure access keys are created for the correct user

### Issue: Files Uploading but Not Accessible

**Symptoms**: Files appear in S3 but signed URLs don't work

**Solutions**:
1. **Check Bucket Policy**:
   - Ensure bucket policy allows `s3:GetObject` for your IAM user
   - Verify resource ARN includes the correct path

2. **Check Object Permissions**:
   - Objects should be private (ACL: private)
   - Signed URLs should handle access

3. **Verify Signed URL Generation**:
   - Check that `getSignedUrl` function is working
   - Ensure expiration time is valid (max 7 days for S3)

### Issue: "Request Entity Too Large"

**Error Message**:
```
RequestEntityTooLarge: Your proposed upload exceeds the maximum allowed size
```

**Solutions**:
1. **Check File Size Limits**:
   - S3 allows up to 5TB per object
   - Check your application's `MAX_FILE_SIZE` setting
   - Increase limit in `.env` if needed

2. **Use Multipart Upload**:
   - For files > 100MB, consider multipart upload
   - The AWS SDK handles this automatically for large files

### Issue: Slow Upload Speeds

**Symptoms**: File uploads are very slow

**Solutions**:
1. **Check Region**:
   - Use a region close to your server
   - Consider using CloudFront for better performance

2. **Check Network**:
   - Verify server's internet connection
   - Consider using AWS Direct Connect for production

3. **Optimize Upload**:
   - Use multipart upload for large files
   - Consider compression before upload

### Issue: "SignatureDoesNotMatch"

**Error Message**:
```
SignatureDoesNotMatch: The request signature we calculated does not match
```

**Solutions**:
1. **Verify Secret Key**:
   - Check that `AWS_SECRET_ACCESS_KEY` is correct
   - Ensure no extra spaces or encoding issues

2. **Check System Clock**:
   - AWS requires accurate system time
   - Ensure server's clock is synchronized (use NTP)

---

## Cost Optimization

### Understanding S3 Costs

S3 pricing includes:
- **Storage**: ~$0.023 per GB/month (Standard storage)
- **PUT requests**: ~$0.005 per 1,000 requests
- **GET requests**: ~$0.0004 per 1,000 requests
- **Data transfer out**: First 1 GB/month free, then ~$0.09 per GB

### Cost Optimization Tips

1. **Use Lifecycle Policies**:
   - Move old files to cheaper storage classes (e.g., Glacier)
   - Automatically delete files after retention period

2. **Enable Compression**:
   - Compress files before upload
   - Reduces storage and transfer costs

3. **Use Appropriate Storage Classes**:
   - **Standard**: Frequently accessed files
   - **Intelligent-Tiering**: Automatic cost optimization
   - **Glacier**: Long-term archival

4. **Monitor Usage**:
   - Set up CloudWatch alarms for unexpected costs
   - Review AWS Cost Explorer regularly

5. **Optimize File Sizes**:
   - Resize images before upload
   - Use appropriate formats (WebP for images)

### Estimated Monthly Costs

For a typical tutoring platform:
- **Storage**: 50 GB × $0.023 = ~$1.15/month
- **Requests**: 10,000 PUT + 50,000 GET = ~$0.07/month
- **Data Transfer**: 10 GB = ~$0.90/month
- **Total**: ~$2-5/month

---

## Security Best Practices

### 1. IAM Policies

- ✅ **Principle of Least Privilege**: Only grant necessary permissions
- ✅ **Use Resource-Specific ARNs**: Limit access to specific buckets/folders
- ✅ **Regular Audits**: Review IAM policies periodically

### 2. Access Keys

- ✅ **Rotate Regularly**: Change access keys every 90 days
- ✅ **One Key Per Application**: Use separate keys for dev/staging/prod
- ✅ **Monitor Usage**: Set up CloudTrail to log API calls

### 3. Bucket Security

- ✅ **Block Public Access**: Keep all public access blocked
- ✅ **Encryption**: Enable server-side encryption (SSE-S3 or SSE-KMS)
- ✅ **Versioning**: Enable for critical data (optional)
- ✅ **MFA Delete**: Require MFA for bucket deletion (optional)

### 4. Application Security

- ✅ **Never Commit Credentials**: Use `.gitignore` for `.env` files
- ✅ **Use Environment Variables**: Never hardcode credentials
- ✅ **Signed URLs**: Use signed URLs instead of public URLs
- ✅ **HTTPS Only**: Ensure all S3 access uses HTTPS

### 5. Monitoring

- ✅ **CloudTrail**: Enable logging for audit trails
- ✅ **CloudWatch**: Monitor API calls and errors
- ✅ **Alarms**: Set up alerts for unusual activity

---

## Additional Resources

### AWS Documentation
- [AWS S3 User Guide](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

### Project Files Reference
- Media Upload: `Backend/utils/mediaUpload.js`
- Cloud Storage: `Backend/services/cloudStorage.js`
- Recording Ingestion: `Backend/services/recordingIngestionService.js`

### AWS Console Links
- [S3 Console](https://s3.console.aws.amazon.com/)
- [IAM Console](https://console.aws.amazon.com/iam/)
- [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)

---

## Quick Checklist

Use this checklist to ensure everything is set up correctly:

- [ ] AWS account created and verified
- [ ] AWS Account ID copied
- [ ] S3 bucket(s) created with appropriate names
- [ ] Bucket region noted
- [ ] IAM user created with programmatic access
- [ ] Custom IAM policy created with correct bucket ARNs
- [ ] Policy attached to IAM user
- [ ] Access Key ID and Secret Access Key saved securely
- [ ] Environment variables added to `.env` file
- [ ] AWS SDK dependencies installed
- [ ] Server restarted after environment variable changes
- [ ] Test file uploaded successfully
- [ ] Files visible in S3 bucket
- [ ] Signed URLs working correctly
- [ ] `.env` file added to `.gitignore`

---

## Storage Modes

The application supports two storage modes:

### S3 Mode (Recommended for Production)

- Set `MEDIA_STORAGE=s3` in `.env`
- Files stored in AWS S3
- Secure signed URLs for access
- Scalable and reliable
- Requires AWS credentials

### Local Mode (Development/Testing)

- Set `MEDIA_STORAGE=local` in `.env`
- Files stored in `./uploads/chat_media/` directory
- Direct file access
- No AWS credentials needed
- Not recommended for production

**Note**: The application automatically falls back to local storage if S3 is not configured.

---

## Notes

- **Bucket Naming**: Bucket names must be globally unique. If your preferred name is taken, try variations.
- **Region Selection**: Choose a region close to your users for better performance and lower latency.
- **Cost Monitoring**: Set up AWS Cost Alerts to monitor spending.
- **Backup Strategy**: Consider enabling versioning or setting up cross-region replication for critical data.
- **Compliance**: If handling sensitive data, ensure S3 configuration meets compliance requirements (HIPAA, GDPR, etc.).

---

**Last Updated**: December 2024
**Version**: 1.0

