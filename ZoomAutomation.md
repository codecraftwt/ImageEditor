# Zoom Integration Guide - Step by Step Implementation

This guide provides detailed instructions on how to implement Zoom automation in the Top Tutors Connect project. It covers everything from creating Zoom API credentials to configuring webhooks and testing the integration.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create a Zoom App](#step-1-create-a-zoom-app)
3. [Step 2: Configure OAuth Scopes](#step-2-configure-oauth-scopes)
4. [Step 3: Get API Credentials](#step-3-get-api-credentials)
5. [Step 4: Configure Webhooks](#step-4-configure-webhooks)
6. [Step 5: Set Up Environment Variables](#step-5-set-up-environment-variables)
7. [Step 6: Database Setup](#step-6-database-setup)
8. [Step 7: Testing the Integration](#step-7-testing-the-integration)
9. [Troubleshooting](#troubleshooting)
10. [API Endpoints Reference](#api-endpoints-reference)

---

## Prerequisites

Before starting, ensure you have:

- A Zoom account (Pro, Business, or Enterprise plan recommended)
- Admin access to your Zoom account
- Access to your project's backend environment
- A publicly accessible server URL for webhooks (not localhost)
- Node.js and npm installed
- PostgreSQL database set up

---

## Step 1: Create a Zoom App

### 1.1 Access Zoom Marketplace

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Sign in with your Zoom account
3. Click on **"Develop"** → **"Build App"** in the top navigation

### 1.2 Create Server-to-Server OAuth App

1. Click **"Create"** button
2. Select **"Server-to-Server OAuth"** as the app type
3. Fill in the app information:
   - **App Name**: `Top Tutors Connect` (or your preferred name)
   - **Company Name**: Your company name
   - **Developer Contact Information**: Your email address
   - **App Description**: Brief description of your app's purpose
   - **Company Website**: Your website URL

4. Click **"Create"** to proceed

### 1.3 App Credentials

After creating the app, you'll be taken to the app's information page. **Keep this page open** - you'll need the credentials in the next steps.

---

## Step 2: Configure OAuth Scopes

### 2.1 Navigate to Scopes

1. In your Zoom app dashboard, click on **"Scopes"** in the left sidebar
2. You'll see a list of available scopes

### 2.2 Add Required Scopes

Add the following scopes by checking the boxes next to them:

#### Meeting Scopes (Required):
- ✅ `meeting:write:meeting` - Create and manage meetings
- ✅ `meeting:read:meeting` - View meeting details
- ✅ `meeting:read:participant:admin` - View meeting participants (for attendance tracking)

#### Recording Scopes (Required for Recording Features):
- ✅ `cloud_recording:read:recording:admin` - Access meeting recordings

#### Optional Scopes (Recommended):
- ✅ `meeting:read:chat_message:admin` - Access chat messages (for chat transcript import)
- ✅ `user:read:admin` - Read user information (if needed)

### 2.3 Save Scopes

1. Click **"Save"** at the bottom of the page
2. You may be prompted to activate the app - click **"Activate"** if prompted

**Important**: Some scopes require Zoom's approval. You may need to submit your app for review if you're using admin-level scopes.

---

## Step 3: Get API Credentials

### 3.1 Access App Credentials

1. In your Zoom app dashboard, click on **"App Credentials"** in the left sidebar
2. You'll see three important values:

### 3.2 Copy Credentials

Copy the following values (you'll add them to your environment variables):

1. **Account ID** (`ZOOM_ACCOUNT_ID`)
   - Found in the "Account ID" field
   - Format: Usually a long alphanumeric string

2. **Client ID** (`ZOOM_CLIENT_ID`)
   - Found in the "Client ID" field
   - Format: Usually a long alphanumeric string

3. **Client Secret** (`ZOOM_CLIENT_SECRET`)
   - Found in the "Client Secret" field
   - Click **"Show"** to reveal it
   - **⚠️ Keep this secret secure - never commit it to version control**

### 3.3 Legacy JWT Credentials (Optional - Fallback)

If you need to use the legacy JWT authentication method (for backward compatibility):

1. Go to **"JWT"** in the left sidebar (if available)
2. Copy:
   - **API Key** (`ZOOM_API_KEY`)
   - **API Secret** (`ZOOM_API_SECRET`)

**Note**: The project uses Server-to-Server OAuth by default, but JWT credentials serve as a fallback.

---

## Step 4: Configure Webhooks

### 4.1 Navigate to Webhooks

1. In your Zoom app dashboard, click on **"Webhooks"** in the left sidebar
2. Click **"Add Webhook"** or **"Add Event Subscription"**

### 4.2 Configure Webhook URL

1. **Webhook URL**: Enter your public server URL
   ```
   https://your-domain.com/api/zoom/webhook
   ```
   - Replace `your-domain.com` with your actual domain
   - The endpoint `/api/zoom/webhook` is already configured in the codebase

2. **Verification URL** (if separate field):
   ```
   https://your-domain.com/api/zoom/webhook/verify
   ```

### 4.3 Subscribe to Events

Subscribe to the following events by checking the boxes:

#### Meeting Events:
- ✅ **Meeting started** (`meeting.started`)
- ✅ **Participant joined meeting** (`meeting.participant_joined`)
- ✅ **Participant left meeting** (`meeting.participant_left`)
- ✅ **Meeting ended** (`meeting.ended`)

#### Recording Events:
- ✅ **All Recordings have completed** (`recording.completed`)

#### Optional Events:
- ⚠️ **In-meeting chat message received** (`meeting.chat_message`)

### 4.4 Webhook Secret Token

1. **Webhook Secret Token**: Generate a secure random string
   - You can use an online generator or run:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Copy this token - you'll add it to your environment variables as `ZOOM_WEBHOOK_SECRET_TOKEN`
   - **⚠️ Keep this secret secure**

2. Paste the token into the **"Secret Token"** field in Zoom

3. Click **"Save"** or **"Add"**

### 4.5 Verify Webhook

After saving, Zoom will immediately send a validation request to your webhook URL. The endpoint should respond with:
```json
{
  "plainToken": "...",
  "encryptedToken": "..."
}
```

If you see an error, check:
- Your server is running and accessible
- The webhook URL is correct
- The `ZOOM_WEBHOOK_SECRET_TOKEN` environment variable is set correctly

---

## Step 5: Set Up Environment Variables

### 5.1 Locate Your .env File

Navigate to your backend directory and open or create the `.env` file:
```bash
cd Backend
nano .env  # or use your preferred editor
```

### 5.2 Add Zoom Environment Variables

Add the following variables to your `.env` file:

```env
# ============================================
# ZOOM INTEGRATION CONFIGURATION
# ============================================

# Server-to-Server OAuth (Primary Method)
ZOOM_ACCOUNT_ID=your_account_id_here
ZOOM_CLIENT_ID=your_client_id_here
ZOOM_CLIENT_SECRET=your_client_secret_here

# Legacy JWT (Fallback - Optional)
ZOOM_API_KEY=your_api_key_here
ZOOM_API_SECRET=your_api_secret_here

# Webhook Configuration
ZOOM_WEBHOOK_SECRET_TOKEN=your_webhook_secret_token_here

# Mock Mode (for development/testing)
# Set to 'true' to use mock Zoom service instead of real API
USE_MOCK_ZOOM=false
```

### 5.3 Replace Placeholder Values

Replace the placeholder values with the actual credentials you copied:

1. `your_account_id_here` → Your Zoom Account ID
2. `your_client_id_here` → Your Zoom Client ID
3. `your_client_secret_here` → Your Zoom Client Secret
4. `your_api_key_here` → Your Zoom API Key (if using JWT fallback)
5. `your_api_secret_here` → Your Zoom API Secret (if using JWT fallback)
6. `your_webhook_secret_token_here` → Your Webhook Secret Token

### 5.4 Security Best Practices

- ✅ **Never commit `.env` files to version control**
- ✅ Add `.env` to your `.gitignore` file
- ✅ Use different credentials for development and production
- ✅ Rotate secrets periodically
- ✅ Use environment variable management tools in production (AWS Secrets Manager, Azure Key Vault, etc.)

---

## Step 6: Database Setup

### 6.1 Verify Database Schema

The Zoom integration requires the following database columns. These should already be set up, but verify:

#### Sessions Table:
- `zoom_link` (TEXT) - Stores the Zoom meeting join URL
- `zoom_meeting_id` (VARCHAR(255)) - Stores the Zoom meeting ID

#### Session Artifacts Table:
- `tutor_join_time` (TIMESTAMP) - When tutor joined the meeting
- `student_join_time` (TIMESTAMP) - When student(s) joined
- `student_end_time` (TIMESTAMP) - When student(s) left
- `recording_url` (TEXT) - URL to the meeting recording
- `duration` (INTEGER) - Actual meeting duration in seconds

### 6.2 Run Database Migrations

If the columns don't exist, the application will attempt to create them automatically on startup. However, you can also run migrations manually:

```bash
cd Backend
npm run migrate  # If you have a migration script
```

Or check the `Backend/config/db.js` file for automatic schema creation.

---

## Step 7: Testing the Integration

### 7.1 Start Your Server

1. Make sure your backend server is running:
   ```bash
   cd Backend
   npm install  # If you haven't already
   npm start
   ```

2. Check the console output - you should see:
   ```
   🔧 [ZOOM SERVICE] Using REAL Zoom service
   ✅ [ZOOM API] Access token obtained
   ```

### 7.2 Test Meeting Creation

#### Option A: Using API Endpoint

```bash
# Create a test meeting
curl -X POST http://localhost:4000/api/zoom/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "topic": "Test Tutoring Session",
    "start_time": "2024-12-31T10:00:00Z",
    "duration": 60,
    "timezone": "UTC"
  }'
```

#### Option B: Create Through Session

Create a session through your application's scheduling interface. The Zoom meeting should be automatically created.

### 7.3 Verify Meeting in Zoom

1. Log in to your Zoom account
2. Go to **"Meetings"** → **"Scheduled"**
3. You should see the test meeting you just created

### 7.4 Test Webhook Events

1. **Join a Test Meeting**:
   - Use the join URL from the created meeting
   - Join as both tutor and student (use different Zoom accounts)
   - Check your server logs for webhook events:
     ```
     Incoming Zoom event: meeting.participant_joined
     Tutor joined session 123 at 2024-12-31T10:00:00Z
     ```

2. **End the Meeting**:
   - End the meeting from Zoom
   - Check logs for:
     ```
     Incoming Zoom event: meeting.ended
     Meeting ended. Duration: 3600 seconds for session 123
     ```

3. **Check Database**:
   ```sql
   SELECT 
     id, 
     zoom_link, 
     zoom_meeting_id,
     status
   FROM sessions 
   WHERE zoom_meeting_id IS NOT NULL;
   ```

### 7.5 Test Recording (If Enabled)

1. Start a meeting with recording enabled
2. Record the meeting in Zoom
3. End the meeting
4. Wait for the `recording.completed` webhook
5. Check that the recording URL is stored in the database

---

## Troubleshooting

### Issue: "Missing required scopes" Error

**Error Message**:
```
❌ [ZOOM] Missing required scopes. Add "meeting:write:meeting" scope in Zoom Marketplace.
```

**Solution**:
1. Go to your Zoom app dashboard
2. Navigate to **"Scopes"**
3. Ensure `meeting:write:meeting` is checked and saved
4. If the app is not activated, click **"Activate"**
5. Wait a few minutes for changes to propagate

### Issue: Webhooks Not Received

**Symptoms**: No webhook events appearing in logs

**Solutions**:
1. **Verify Webhook URL is Public**:
   - Webhooks won't work with `localhost` or `127.0.0.1`
   - Use a public URL or a tunneling service like ngrok for testing:
     ```bash
     ngrok http 4000
     # Use the ngrok URL in Zoom webhook configuration
     ```

2. **Check Webhook Secret Token**:
   - Ensure `ZOOM_WEBHOOK_SECRET_TOKEN` matches the token in Zoom
   - Restart your server after changing the token

3. **Verify Webhook is Active**:
   - Go to Zoom app dashboard → **"Webhooks"**
   - Ensure the webhook subscription is **"Active"**
   - Check that events are subscribed

4. **Check Firewall/Security Groups**:
   - Ensure Zoom's IP addresses can reach your server
   - Zoom webhook IPs: Check [Zoom's documentation](https://developers.zoom.us/docs/api/rest/webhook-reference/#ip-addresses)

### Issue: "Failed to authenticate with Zoom API"

**Error Message**:
```
❌ [ZOOM API] Failed to get access token
```

**Solutions**:
1. **Verify Credentials**:
   - Double-check `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, and `ZOOM_CLIENT_SECRET`
   - Ensure there are no extra spaces or quotes

2. **Check Account Status**:
   - Ensure your Zoom account is active
   - Verify the account has the necessary permissions

3. **Verify Scopes**:
   - Ensure required scopes are approved in Zoom Marketplace

### Issue: Meetings Created but Not Appearing

**Symptoms**: API call succeeds but meeting not visible in Zoom

**Solutions**:
1. **Check Meeting Host**:
   - Meetings are created for the account associated with the OAuth app
   - Log in to that Zoom account to see meetings

2. **Verify Meeting Settings**:
   - Check that meetings aren't being created as private
   - Verify timezone settings

### Issue: Recordings Not Downloading

**Error Message**:
```
No recording file found for meeting
```

**Solutions**:
1. **Enable Cloud Recording**:
   - Ensure cloud recording is enabled in your Zoom account settings
   - Check account-level recording permissions

2. **Verify Recording Scope**:
   - Ensure `cloud_recording:read:recording:admin` scope is approved

3. **Check Recording Settings**:
   - Verify recordings are set to be saved to cloud (not local)
   - Check that recording started successfully

### Issue: Chat Transcript Not Importing

**Symptoms**: Chat messages not appearing in application

**Solutions**:
1. **Enable Chat Recording**:
   - Ensure chat recording is enabled in meeting settings
   - Check Zoom account settings for chat recording

2. **Verify Scope**:
   - Ensure `meeting:read:chat_message:admin` scope is approved

3. **Check Transcript Format**:
   - Zoom chat transcript format may vary
   - Check logs for parsing errors

---

## API Endpoints Reference

### Meeting Management

#### Create Meeting
```
POST /api/zoom/meetings
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "topic": "Meeting Topic",
  "start_time": "2024-12-31T10:00:00Z",
  "duration": 60,
  "timezone": "UTC",
  "agenda": "Meeting agenda"
}
```

#### Get Meeting Details
```
GET /api/zoom/meetings/:meetingId
Authorization: Bearer {token}
```

#### Update Meeting
```
PATCH /api/zoom/meetings/:meetingId
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "topic": "Updated Topic",
  "start_time": "2024-12-31T11:00:00Z"
}
```

#### Delete Meeting
```
DELETE /api/zoom/meetings/:meetingId
Authorization: Bearer {token}
```

### Session Integration

#### Create Meeting for Session
```
POST /api/zoom/sessions/:sessionId/meeting
Authorization: Bearer {token}
```

#### Batch Create Meetings
```
POST /api/zoom/sessions/batch-meetings
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "sessionIds": [1, 2, 3]
}
```

#### Get Session Artifacts
```
GET /api/zoom/sessions/:sessionId/artifacts
Authorization: Bearer {token}
```

### Webhook Endpoints

#### Webhook Handler (Zoom calls this)
```
POST /api/zoom/webhook
Content-Type: application/json
X-Zm-Signature: {signature}
X-Zm-Request-Timestamp: {timestamp}
```

#### Webhook Verification
```
GET /api/zoom/webhook/verify?plainToken={token}
```

---

## Additional Resources

### Zoom API Documentation
- [Zoom API Reference](https://developers.zoom.us/docs/api/rest/)
- [Server-to-Server OAuth](https://developers.zoom.us/docs/api/rest/using-zoom-apis/#server-to-server-oauth)
- [Webhook Events](https://developers.zoom.us/docs/api/rest/webhook-reference/)

### Project Files Reference
- Main Zoom Service: `Backend/services/zoomService.js`
- Real Zoom Service: `Backend/services/realZoomService.js`
- Mock Zoom Service: `Backend/services/mockZoomService.js`
- Webhook Controller: `Backend/controllers/zoomWebhookController.js`
- Zoom Routes: `Backend/routes/zoomRoutes.js`

### Support
- Zoom Developer Support: [Zoom Developer Forum](https://devforum.zoom.us/)
- Zoom API Status: [Zoom Status Page](https://status.zoom.us/)

---

## Quick Checklist

Use this checklist to ensure everything is set up correctly:

- [ ] Zoom app created in Zoom Marketplace
- [ ] Server-to-Server OAuth app type selected
- [ ] Required scopes added and approved
- [ ] Account ID, Client ID, and Client Secret copied
- [ ] Webhook URL configured in Zoom
- [ ] Webhook events subscribed
- [ ] Webhook secret token generated and configured
- [ ] Environment variables added to `.env` file
- [ ] Server restarted after environment variable changes
- [ ] Test meeting created successfully
- [ ] Webhook events received and logged
- [ ] Database columns verified
- [ ] Recording functionality tested (if applicable)

---

## Notes

- **Development Mode**: Set `USE_MOCK_ZOOM=true` to use mock Zoom service for development without API calls
- **Rate Limits**: Zoom API has rate limits. The code includes delays in batch operations to avoid hitting limits
- **Token Expiration**: OAuth tokens are automatically refreshed. The service handles token expiration internally
- **Error Handling**: The system falls back to placeholder meetings if Zoom API fails, ensuring sessions can still be created

---

**Last Updated**: December 2024
**Version**: 1.0

