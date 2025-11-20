Here is the complete, updated markdown file with detailed steps for creating `WELCOME_CAMPAIGN_ACTIVITY_ID` via dashboard integrated into your existing guide:

---

```markdown
# Constant Contact MERN Stack Integration Guide

Complete step-by-step implementation for adding contacts and sending emails via Constant Contact V3 API.

---

## **Step 1: Prerequisites & Account Setup**

### 1.1 Create Developer Account
1. Go to [Constant Contact Developer Portal](https://developer.constantcontact.com/ )
2. Sign up for a free developer account
3. Verify your email address

### 1.2 Register Your Application
1. Log in to Developer Portal → **My Applications** → **New Application**
2. Configure:
   - **Name**: Your app name
   - **OAuth2 Flow**: Authorization Code Flow
   - **Refresh Token Method**: Rotating Refresh Tokens
3. Copy credentials:
   - **API Key (client_id)**
   - **Client Secret** (click Generate, copy immediately)
4. Add Redirect URIs:
   - Development: `http://localhost:3001/callback`
   - Production: `https://yourdomain.com/callback `

**Required Scopes**:
- `contact_data`
- `campaign_data`
- `account_read`
- `offline_access`

---

## **Step 2: Environment Configuration**

Create `.env` file in your project root:

```env
# Constant Contact Credentials
CONSTANT_CONTACT_CLIENT_ID=your_client_id_here
CONSTANT_CONTACT_CLIENT_SECRET=your_client_secret_here
CONSTANT_CONTACT_REDIRECT_URI=http://localhost:3001/callback
CONSTANT_CONTACT_ACCESS_TOKEN=
CONSTANT_CONTACT_REFRESH_TOKEN=

# Campaign Activity IDs (will be filled later)
WELCOME_CAMPAIGN_ACTIVITY_ID=
BULK_EMAIL_CAMPAIGN_ACTIVITY_ID=

# Email Sender Details (must be verified in CC account)
FROM_EMAIL=your-verified-email@example.com
FROM_NAME=Your Organization Name

# Server
PORT=3001
```

---

## **Step 3: Backend Implementation**

Install dependencies:
```bash
npm install express cors axios dotenv
```

Create `server.js`:

```javascript
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Config ---
const CLIENT_ID = process.env.CONSTANT_CONTACT_CLIENT_ID;
const CLIENT_SECRET = process.env.CONSTANT_CONTACT_CLIENT_SECRET;
const REDIRECT_URI = process.env.CONSTANT_CONTACT_REDIRECT_URI;
const API_URL = "https://api.cc.email/v3 ";
const DEMO_LIST_NAME = "demo-contact-list";
const WELCOME_CAMPAIGN_ACTIVITY_ID = process.env.WELCOME_CAMPAIGN_ACTIVITY_ID;

let ACCESS_TOKEN = process.env.CONSTANT_CONTACT_ACCESS_TOKEN || "";
let REFRESH_TOKEN = process.env.CONSTANT_CONTACT_REFRESH_TOKEN || "";

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error("❌ Missing required env vars (CLIENT_ID/SECRET/REDIRECT_URI)");
  process.exit(1);
}

// --- Helper: Validate Email Format ---
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// --- Helper: Get Contact by Email ---
async function getContactByEmail(email) {
  try {
    const response = await axios.get(
      `${API_URL}/contacts?email=${encodeURIComponent(email)}`,
      getApiConfig()
    );
    return response.data.contacts?.[0] || null;
  } catch (error) {
    return null;
  }
}

// --- Helper: Get or Create List ---
async function getOrCreateList(listName) {
  try {
    const response = await axios.get(`${API_URL}/contact_lists`, getApiConfig());
    const existing = response.data.lists?.find(list => list.name === listName);
    
    if (existing) {
      console.log(`✅ Found list: ${listName} (ID: ${existing.list_id})`);
      return existing.list_id;
    }

    const createRes = await axios.post(
      `${API_URL}/contact_lists`,
      { name: listName },
      getApiConfig()
    );
    console.log(`✅ Created list: ${listName} (ID: ${createRes.data.list_id})`);
    return createRes.data.list_id;
  } catch (err) {
    console.error(`❌ Error with list ${listName}:`, err.response?.data || err.message);
    throw err;
  }
}

// --- Step 1: Start OAuth Flow ---
app.get("/auth", (req, res) => {
  const state = "state_" + Date.now();
  const authUrl = `https://authz.constantcontact.com/oauth2/default/v1/authorize?client_id= ${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=offline_access%20contact_data%20campaign_data%20account_read&state=${state}`;
  
  res.redirect(authUrl);
});

// --- Step 2: Handle OAuth Callback ---
app.get("/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing authorization code");

  try {
    const tokenResponse = await axios.post(
      "https://authz.constantcontact.com/oauth2/default/v1/token ",
      new URLSearchParams({
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        auth: { username: CLIENT_ID, password: CLIENT_SECRET },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    ACCESS_TOKEN = tokenResponse.data.access_token;
    REFRESH_TOKEN = tokenResponse.data.refresh_token;

    console.log("✅ Access Token:", ACCESS_TOKEN);
    console.log("🔄 Refresh Token:", REFRESH_TOKEN);

    res.send("✅ Authentication successful! Copy tokens from server logs and save to .env");
  } catch (error) {
    console.error("❌ OAuth Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to exchange code for tokens" });
  }
});

// --- Helper: API Config ---
function getApiConfig() {
  return {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
}

// --- Step 3: Refresh Access Token ---
async function refreshAccessToken() {
  if (!REFRESH_TOKEN) throw new Error("No refresh token available");

  try {
    const response = await axios.post(
      "https://authz.constantcontact.com/oauth2/default/v1/token ",
      new URLSearchParams({
        refresh_token: REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
      {
        auth: { username: CLIENT_ID, password: CLIENT_SECRET },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    ACCESS_TOKEN = response.data.access_token;
    if (response.data.refresh_token) {
      REFRESH_TOKEN = response.data.refresh_token;
    }

    console.log("🔄 Token refreshed!");
    return ACCESS_TOKEN;
  } catch (err) {
    console.error("❌ Failed to refresh token:", err.response?.data || err.message);
    throw err;
  }
}

// --- API Routes ---

// GET: Fetch all contact lists
app.get("/api/contact-lists", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/contact_lists`, getApiConfig());
    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      await refreshAccessToken();
      return app.handle(req, res);
    }
    console.error("❌ Error fetching lists:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch contact lists",
      details: error.response?.data || "Internal Server Error",
    });
  }
});

// POST: Create a new contact list
app.post("/api/contact-lists", async (req, res) => {
  const { listName } = req.body;
  if (!listName) return res.status(400).json({ error: "listName is required" });

  try {
    const response = await axios.post(
      `${API_URL}/contact_lists`,
      { name: listName },
      getApiConfig()
    );
    res.status(201).json(response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      await refreshAccessToken();
      return app.handle(req, res);
    }
    console.error("❌ Error creating list:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to create contact list",
      details: error.response?.data || "Internal Server Error",
    });
  }
});

// --- Registration endpoint ---
app.post("/api/register", async (req, res) => {
  const { parentFirst, parentLast, email, mobile } = req.body;

  // 1. Validate required fields
  if (!parentFirst || !parentLast || !email) {
    return res.status(400).json({ 
      error: "Missing required fields: parentFirst, parentLast, email" 
    });
  }

  // 2. Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ 
      error: "Invalid email format",
      received: email 
    });
  }

  // 3. Clean the email
  const cleanEmail = email.trim().toLowerCase();
  console.log(`📝 Registering contact: ${cleanEmail}`);

  try {
    // 4. Ensure demo list exists
    const listId = await getOrCreateList(DEMO_LIST_NAME);

    // 5. Check if contact already exists
    const existingContact = await getContactByEmail(cleanEmail);
    if (existingContact) {
      console.log(`⚠️ Contact already exists: ${existingContact.contact_id}`);
      return res.json({
        success: true,
        message: "Contact already existed",
        contactId: existingContact.contact_id,
      });
    }

    // 6. Prepare contact payload
    const contactPayload = {
      email_address: {
        address: cleanEmail,
        permission_to_send: "implicit"
      },
      first_name: parentFirst.trim(),
      last_name: parentLast.trim(),
      phone_number: mobile || "",
      list_memberships: [listId],
      create_source: "Account"
    };

    console.log("📤 Sending payload:", JSON.stringify(contactPayload, null, 2));

    // 7. Create contact
    const contactRes = await axios.post(
      `${API_URL}/contacts`,
      contactPayload,
      getApiConfig()
    );

    const contactId = contactRes.data.contact_id;
    console.log(`✅ Contact created: ${contactId}`);

    // 8. Send Welcome Email
    if (WELCOME_CAMPAIGN_ACTIVITY_ID) {
      try {
        await axios.post(
          `${API_URL}/emails/activities/${WELCOME_CAMPAIGN_ACTIVITY_ID}/tests`,
          {
            email_addresses: [cleanEmail],
            personal_message: "Welcome to our platform!"
          },
          getApiConfig()
        );
        console.log("✅ Welcome test email sent");
      } catch (emailError) {
        console.warn("⚠️  Welcome email failed:", emailError.response?.data?.message || emailError.message);
      }
    }

    res.json({
      success: true,
      message: "User registered and added to demo list",
      contactId: contactId,
    });
  } catch (error) {
    console.error("❌ Registration error:", error.response?.data || error.message);
    
    if (error.response?.status === 409) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
        details: error.response.data
      });
    }
    
    if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.response.data
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to register user",
      details: error.response?.data || error.message,
    });
  }
});

// --- Health Check ---
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    tokens_set: !!ACCESS_TOKEN,
    welcome_campaign_id: WELCOME_CAMPAIGN_ACTIVITY_ID || "Not set",
    demo_list: DEMO_LIST_NAME
  });
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`🔑 Start OAuth flow at http://localhost:${PORT}/auth`);
  console.log(`📧 Welcome Campaign Activity ID: ${WELCOME_CAMPAIGN_ACTIVITY_ID || "Not set"}`);
});
```

---

## **Step 4: Get Campaign Activity IDs**

### **⚠️ CRITICAL: Dashboard vs API Campaigns**

**Dashboard-created campaigns CANNOT be used for API sending** due to missing sender fields. However, you can extract `campaign_activity_id` for reference. For production API sending, **always create campaigns via API**.

---

### **Method 1: Create Campaign via Dashboard (For Reference/Testing)**

**Step-by-Step UI Flow:**

1. **Create Campaign**:
   - Click **"Campaigns"** → **"Create"** → **"Email"**
   - Choose template → Design welcome email content
   - **Set sender details** (must match verified email):
     - **From email**: `your-verified-email@example.com`
     - **From name**: Your organization name
     - **Subject**: "Welcome to our platform!"

2. **Save as Draft**:
   - Click **"Save & Continue"** → **"Save for later"**
   - **CRITICAL**: Must be in DRAFT status for API use

3. **Extract campaign_activity_id**:
   - Go to **Campaigns** → **"All campaigns"**
   - Click **campaign name** (not Edit)
   - Look at URL: `.../campaigns/ID1/activities/ID2/summary`
   - Copy **ID2** (the second UUID) = your `campaign_activity_id`

**Example URL**:
```
https://app.constantcontact.com/pages/campaigns/abc123/activities/def456-uuid-here/summary
```
Your `WELCOME_CAMPAIGN_ACTIVITY_ID` = `def456-uuid-here`

---

### **Method 2: Create Campaign via API (Recommended for Production)**

**Create Welcome Campaign**:

```bash
curl --location 'https://api.cc.email/v3/emails ' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--header 'Content-Type: application/json' \
--data '{
  "name": "Welcome Email Campaign",
  "type": "NEWSLETTER",
  "email_campaign_activities": [
    {
      "format_type": 5,
      "from_email": "your-verified-email@example.com",
      "from_name": "Your Organization",
      "reply_to_email": "your-verified-email@example.com",
      "subject": "Welcome to Our Platform",
      "html_content": "<html><body>[[trackingImage]]<h1>Welcome [[FIRST_NAME]]!</h1><p>Thank you for joining us.</p></body></html>",
      "preheader": "Welcome to our community"
    }
  ]
}'
```

**Extract from response:**
```json
{
  "campaign_id": "...",
  "email_campaign_activities": [
    {
      "campaign_activity_id": "COPY_THIS_ID",  // ✅ Your WELCOME_CAMPAIGN_ACTIVITY_ID
      "role": "primary_email"
    }
  ]
}
```

---

### **Method 3: Use Existing Campaign**

**Get Campaign ID**:
```bash
curl --location 'https://api.cc.email/v3/emails' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Get Activity ID**:
```bash
curl --location 'https://api.cc.email/v3/emails/YOUR_CAMPAIGN_ID ' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Copy** the `campaign_activity_id` with `role: "primary_email"`

---

### **Method 4: Verify Campaign via API (cURL)**

**Check if campaign is API-ready:**
```bash
curl --location 'https://api.cc.email/v3/emails/activities/YOUR_CAMPAIGN_ACTIVITY_ID ' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Expected Response:**
```json
{
  "campaign_activity_id": "your-id-here",
  "current_status": "DRAFT",
  "from_email": "your-verified-email@example.com",
  "from_name": "Your Organization",
  "subject": "Welcome to Our Platform"
}
```

**Key Checks**:
- `current_status` must be **"DRAFT"**
- `from_email` matches your verified sender
- All fields are populated

---

## **Step 5: Update .env File**

```bash
# .env
WELCOME_CAMPAIGN_ACTIVITY_ID=b1306103-29da-436c-83b5-3e0bf48dc1e0
BULK_EMAIL_CAMPAIGN_ACTIVITY_ID=c398da35-aa45-4322-8959-d89980fb19db
```

---

## **Step 6: Test Registration & Email Sending**

### **1. Start Server**
```bash
node server.js
```

### **2. Register a User**
```bash
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{"parentFirst":"John","parentLast":"Doe","email":"john@example.com","mobile":"555-1234"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered and added to demo list",
  "contactId": "aa35674c-c541-11f0-a3c2-0242ca1b9f82"
}
```

### **3. Check Contact Lists**
```bash
curl http://localhost:3001/api/contact-lists
```

### **4. Test Welcome Email (if campaign configured)**
```bash
curl http://localhost:3001/health
```

---

## **Troubleshooting Guide**

### **Error: "email_address is invalid"**
**Cause**: Using wrong endpoint format
**Fix**: Ensure `/contacts` endpoint (not `/sign_up_form`) and use:
```javascript
email_address: {
  address: cleanEmail,
  permission_to_send: "implicit"
}
```

### **Error: "campaign activity not found"**
**Cause**: Wrong Activity ID or campaign not in DRAFT status
**Fix**: Create new campaign via API, ensure status is "draft"

### **Error: "from email is null"**
**Cause**: UI-created campaign missing sender details
**Fix**: Create campaign via API with `from_email`, `from_name`, `reply_to_email`

### **Rate Limits**
- 10,000 calls/day
- 4 calls/second
- Test emails: 50/day (5 per request)

---

## **API Endpoints Reference**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth` | Start OAuth flow |
| `GET` | `/callback` | OAuth callback |
| `GET` | `/health` | Check system status |
| `GET` | `/api/contact-lists` | Get all lists |
| `POST` | `/api/contact-lists` | Create new list |
| `POST` | `/api/register` | Register user & send welcome email |
| `GET` | `/api/emails` | Get all campaigns |

---

## **Next Steps (Beyond This Guide)**

- **Implement Frontend React UI**
- **Add email analytics tracking**
- **Set up webhooks for bounces/unsubscribes**
- **Use Constant Contact Automations for welcome series**
- **Implement retry logic with exponential backoff**

---

## **📋 Summary: Creating All Required Fields**

### **Required Fields Checklist**

| Field | How to Create | Notes |
|-------|---------------|-------|
| **CLIENT_ID** | Developer Portal → My Applications | Copy from app settings |
| **CLIENT_SECRET** | Developer Portal → Generate | Copy immediately, shown once |
| **ACCESS_TOKEN** | OAuth flow → `/callback` | Logs to console after auth |
| **REFRESH_TOKEN** | OAuth flow → `/callback` | Logs to console after auth |
| **FROM_EMAIL** | Constant Contact Account → Verify Email | Must be verified sender |
| **WELCOME_CAMPAIGN_ACTIVITY_ID** | See Step 4 (API recommended) | Must be DRAFT status |
| **DEMO_LIST_NAME** | Auto-created in `/api/register` | Or pre-create via dashboard |

### **Quick Command Reference**

```bash
# Get tokens
curl http://localhost:3001/auth

# Create campaign via API
curl --location 'https://api.cc.email/v3/emails ' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data '{"name":"Welcome Email","type":"NEWSLETTER","email_campaign_activities":[{"format_type":5,"from_email":"verified@example.com","from_name":"Org","reply_to_email":"verified@example.com","subject":"Welcome","html_content":"<html><body>[[trackingImage]]<h1>Welcome</h1></body></html>"}]}'

# Verify campaign
curl --location 'https://api.cc.email/v3/emails/activities/YOUR_CAMPAIGN_ACTIVITY_ID ' \
--header 'Authorization: Bearer YOUR_TOKEN'

# Register user
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{"parentFirst":"Test","parentLast":"User","email":"test@example.com"}'
```

---

**Your Constant Contact integration is now complete!**
```

---