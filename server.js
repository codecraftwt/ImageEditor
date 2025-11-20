require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Config ---
const CLIENT_ID = process.env.CONSTANT_CONTACT_CLIENT_ID;
const CLIENT_SECRET = process.env.CONSTANT_CONTACT_CLIENT_SECRET;
const REDIRECT_URI = process.env.CONSTANT_CONTACT_REDIRECT_URI;
const API_URL = "https://api.cc.email/v3";
const DEMO_LIST_NAME = "YAU TEST";
const COACH_LIST_NAME = process.env.COACH_LIST_NAME || "role-coach";
const MEMBER_LIST_NAME = process.env.MEMBER_LIST_NAME || "role-member";
const ADMIN_LIST_NAME = process.env.ADMIN_LIST_NAME || "role-admin";
const WELCOME_CAMPAIGN_ACTIVITY_ID = process.env.WELCOME_CAMPAIGN_ACTIVITY_ID;
const BULK_EMAIL_CAMPAIGN_ACTIVITY_ID = process.env.BULK_EMAIL_CAMPAIGN_ACTIVITY_ID;
const FROM_EMAIL = process.env.FROM_EMAIL;
const FROM_NAME = process.env.FROM_NAME || "Your Organization";
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || FROM_EMAIL;

let ACCESS_TOKEN = process.env.CONSTANT_CONTACT_ACCESS_TOKEN || "";
let REFRESH_TOKEN = process.env.CONSTANT_CONTACT_REFRESH_TOKEN || "";

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error("❌ Missing required env vars (CLIENT_ID/SECRET/REDIRECT_URI)");
  process.exit(1);
}

if (!FROM_EMAIL) {
  console.error("❌ Missing FROM_EMAIL in .env - Required for sending emails");
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

// --- Helper: Get List by Name ---
async function getOrCreateList(listName) {
  try {
    const response = await axios.get(`${API_URL}/contact_lists`, getApiConfig());
    const existing = response.data.lists?.find(
      (list) => list.name === listName
    );
    
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
    console.error(`Error in getOrCreateList (${listName}):`, err.response?.data || err.message);
    throw err;
  }
}

// --- Step 1: Start OAuth Flow ---
app.get("/auth", (req, res) => {
  const state = "my_custom_state_" + Date.now();
  const authUrl = `https://authz.constantcontact.com/oauth2/default/v1/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
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
      "https://authz.constantcontact.com/oauth2/default/v1/token",
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

    res.send(
      "Authentication successful! Copy access_token and refresh_token from server logs and save them in your .env file."
    );
  } catch (error) {
    console.error("OAuth Error:", error.response?.data || error.message);
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

// --- Step 3: Refresh Access Token if Needed ---
async function refreshAccessToken() {
  if (!REFRESH_TOKEN) throw new Error("No refresh token available");

  try {
    const response = await axios.post(
      "https://authz.constantcontact.com/oauth2/default/v1/token",
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
    console.error("Failed to refresh token:", err.response?.data || err.message);
    throw err;
  }
}

// --- Helper: Ensure Campaign Has Sender Details ---
async function validateCampaignActivity(campaignActivityId) {
  try {
    const response = await axios.get(
      `${API_URL}/emails/activities/${campaignActivityId}`,
      getApiConfig()
    );
    
    const activity = response.data;
    
    // Check if sender details exist
    if (!activity.from_email || !activity.from_name) {
      console.log(`⚠️ Campaign ${campaignActivityId} missing sender details, updating...`);
      
      await axios.put(
        `${API_URL}/emails/activities/${campaignActivityId}`,
        {
          from_email: FROM_EMAIL,
          from_name: FROM_NAME,
          reply_to_email: REPLY_TO_EMAIL,
          // Keep existing content, just add sender
          format_type: activity.format_type,
          html_content: activity.html_content,
          subject: activity.subject,
          preheader: activity.preheader
        },
        getApiConfig()
      );
      console.log(`✅ Updated sender details for campaign ${campaignActivityId}`);
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error validating campaign:", error.response?.data || error.message);
    throw error;
  }
}

// --- API Routes ---

// GET: Fetch all contact lists
app.get("/api/contact-lists", async (req, res) => {
  try {
    const response = await axios.get(
      `${API_URL}/contact_lists`,
      getApiConfig()
    );
    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      try {
        await refreshAccessToken();
        const retryResponse = await axios.get(
          `${API_URL}/contact_lists`,
          getApiConfig()
        );
        return res.json(retryResponse.data);
      } catch (retryErr) {
        return res.status(401).json({ error: "Authentication failed" });
      }
    }
    console.error("Error fetching lists:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch contact lists",
      details: error.response?.data || "Internal Server Error",
    });
  }
});

// GET: Fetch all email campaigns (with activities)
app.get("/api/emails", async (req, res) => {
  try {
    const response = await axios.get(
      `${API_URL}/emails?include=activities`,
      getApiConfig()
    );
    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      try {
        await refreshAccessToken();
        const retryResponse = await axios.get(
          `${API_URL}/emails?include=activities`,
          getApiConfig()
        );
        return res.json(retryResponse.data);
      } catch (retryErr) {
        return res.status(401).json({ error: "Authentication failed" });
      }
    }
    console.error("Error fetching emails:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch email campaigns",
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
      try {
        await refreshAccessToken();
        const retryResponse = await axios.post(
          `${API_URL}/contact_lists`,
          { name: listName },
          getApiConfig()
        );
        return res.status(201).json(retryResponse.data);
      } catch (retryErr) {
        return res.status(401).json({ error: "Authentication failed" });
      }
    }
    console.error("Error creating list:", error.response?.data || err.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to create contact list",
      details: error.response?.data || "Internal Server Error",
    });
  }
});

// --- Helper: get or create list ---
async function getOrCreateList(listName) {
  try {
    const response = await axios.get(`${API_URL}/contact_lists`, getApiConfig());
    const existing = response.data.lists?.find(
      (list) => list.name === listName
    );
    
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
    console.error(`Error in getOrCreateList (${listName}):`, err.response?.data || err.message);
    throw err;
  }
}

// --- Registration endpoint with Role Support ---
app.post("/api/register", async (req, res) => {
  const { parentFirst, parentLast, email, mobile, role = "member" } = req.body;

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

  // 3. Validate role
  const validRoles = ["coach", "member", "admin"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ 
      error: "Invalid role. Must be: coach, member, or admin" 
    });
  }

  // 4. Clean the email
  const cleanEmail = email.trim().toLowerCase();
  console.log(`📝 Registering contact: ${cleanEmail} | Role: ${role}`);

  try {
    // 5. Ensure lists exist
    const [demoListId, roleListId] = await Promise.all([
      getOrCreateList(DEMO_LIST_NAME),
      getOrCreateList(`role-${role}`)
    ]);

    // 6. Check if contact already exists
    const existingContact = await getContactByEmail(cleanEmail);
    if (existingContact) {
      console.log(`⚠️ Contact already exists: ${existingContact.contact_id}`);
      
      // Update list memberships to include role list
      if (!existingContact.list_memberships?.includes(roleListId)) {
        await axios.put(
          `${API_URL}/contacts/${existingContact.contact_id}`,
          {
            ...existingContact,
            list_memberships: [...(existingContact.list_memberships || []), roleListId],
            update_source: "Account"
          },
          getApiConfig()
        );
        console.log(`✅ Updated contact with role list: role-${role}`);
      }
      
      return res.json({
        success: true,
        message: "Contact already existed, updated with role",
        contactId: existingContact.contact_id,
      });
    }

    // 7. Prepare contact payload
    const contactPayload = {
      email_address: {
        address: cleanEmail,
        permission_to_send: "implicit"
      },
      first_name: parentFirst.trim(),
      last_name: parentLast.trim(),
      phone_number: mobile || "",
      list_memberships: [demoListId, roleListId],
      create_source: "Account"
    };

    console.log("📤 Sending payload:", JSON.stringify(contactPayload, null, 2));

    // 8. Create contact
    const contactRes = await axios.post(
      `${API_URL}/contacts`,
      contactPayload,
      getApiConfig()
    );

    const contactId = contactRes.data.contact_id;
    console.log(`✅ Contact created: ${contactId}`);

    // 9. Send Welcome Email
    if (WELCOME_CAMPAIGN_ACTIVITY_ID) {
      try {
        await axios.post(
          `${API_URL}/emails/activities/${WELCOME_CAMPAIGN_ACTIVITY_ID}/tests`,
          {
            email_addresses: [cleanEmail],
            personal_message: `Welcome to our platform! Your role: ${role}`
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
      message: "User registered with role",
      contactId: contactId,
      role: role
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

// --- Update User Role ---
app.put("/api/users/:email/role", async (req, res) => {
  const { email } = req.params;
  const { role } = req.body;

  const validRoles = ["coach", "member", "admin"];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be: coach, member, or admin" });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // Get contact
    const contact = await getContactByEmail(cleanEmail);
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    // Get old and new role list IDs
    const oldRoleListIds = await Promise.all(
      validRoles.map(r => getOrCreateList(`role-${r}`))
    );
    
    const newRoleListId = await getOrCreateList(`role-${role}`);

    // Update lists: remove other role lists, add new one
    const updatedLists = [
      ...(contact.list_memberships || []).filter(id => !oldRoleListIds.includes(id)),
      newRoleListId
    ];

    await axios.put(
      `${API_URL}/contacts/${contact.contact_id}`,
      {
        ...contact,
        list_memberships: updatedLists,
        update_source: "Account"
      },
      getApiConfig()
    );

    console.log(`✅ Updated role for ${cleanEmail} to ${role}`);
    
    res.json({
      success: true,
      message: `Role updated to ${role}`,
      contactId: contact.contact_id
    });
  } catch (error) {
    console.error("❌ Role update error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update role",
      details: error.response?.data || error.message
    });
  }
});

// --- Get Users by Role ---
app.get("/api/users/role/:role", async (req, res) => {
  const { role } = req.params;
  const validRoles = ["coach", "member", "admin"];
  
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be: coach, member, or admin" });
  }

  try {
    const listId = await getOrCreateList(`role-${role}`);
    
    // Get contacts in this list
    const response = await axios.get(
      `${API_URL}/contacts?list=${listId}`,
      getApiConfig()
    );

    res.json({
      success: true,
      role: role,
      count: response.data.contacts?.length || 0,
      users: response.data.contacts || []
    });
  } catch (error) {
    console.error("❌ Error fetching users by role:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      details: error.response?.data || error.message
    });
  }
});

// --- Send Email to Role Group ---
app.post("/api/send-email/role/:role", async (req, res) => {
  const { role } = req.params;
  const { campaignActivityId, personalMessage = "" } = req.body;

  const validRoles = ["coach", "member", "admin"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be: coach, member, or admin" });
  }

  if (!campaignActivityId) {
    return res.status(400).json({ error: "campaignActivityId is required" });
  }

  try {
    // Ensure campaign has sender details
    await validateCampaignActivity(campaignActivityId);

    const listId = await getOrCreateList(`role-${role}`);
    
    // Add list to campaign
    await axios.put(
      `${API_URL}/emails/activities/${campaignActivityId}`,
      {
        contact_list_ids: [listId]
      },
      getApiConfig()
    );

    // Schedule campaign for 5 minutes from now
    const scheduleDate = new Date(Date.now() + 5 * 60000).toISOString();
    
    await axios.post(
      `${API_URL}/emails/activities/${campaignActivityId}/schedules`,
      {
        scheduled_date: scheduleDate
      },
      getApiConfig()
    );

    console.log(`✅ Email scheduled for ${role} group at ${scheduleDate}`);
    
    res.json({
      success: true,
      message: `Email scheduled for ${role} group`,
      scheduledDate: scheduleDate
    });
  } catch (error) {
    console.error("❌ Error sending email to role:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to schedule email",
      details: error.response?.data || error.message
    });
  }
});

// --- Send Email to All Registered Users ---
app.post("/api/send-email/all", async (req, res) => {
  const { campaignActivityId, personalMessage = "" } = req.body;

  if (!campaignActivityId) {
    return res.status(400).json({ error: "campaignActivityId is required" });
  }

  try {
    // Ensure campaign has sender details
    await validateCampaignActivity(campaignActivityId);

    // Get IDs of all role lists
    const listIds = await Promise.all([
      getOrCreateList(COACH_LIST_NAME),
      getOrCreateList(MEMBER_LIST_NAME),
      getOrCreateList(ADMIN_LIST_NAME),
      getOrCreateList(DEMO_LIST_NAME)
    ]);

    // Add all lists to campaign
    await axios.put(
      `${API_URL}/emails/activities/${campaignActivityId}`,
      {
        contact_list_ids: listIds
      },
      getApiConfig()
    );

    // Schedule campaign
    const scheduleDate = new Date(Date.now() + 5 * 60000).toISOString();
    
    await axios.post(
      `${API_URL}/emails/activities/${campaignActivityId}/schedules`,
      {
        scheduled_date: scheduleDate
      },
      getApiConfig()
    );

    console.log(`✅ Bulk email scheduled for all users at ${scheduleDate}`);
    
    res.json({
      success: true,
      message: "Bulk email scheduled for all registered users",
      scheduledDate: scheduleDate,
      recipientLists: [COACH_LIST_NAME, MEMBER_LIST_NAME, ADMIN_LIST_NAME, DEMO_LIST_NAME]
    });
  } catch (error) {
    console.error("❌ Error sending bulk email:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to schedule bulk email",
      details: error.response?.data || error.message
    });
  }
});

// --- Health Check ---
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    tokens_set: !!ACCESS_TOKEN,
    sender_configured: !!FROM_EMAIL,
    role_lists: {
      coach: COACH_LIST_NAME,
      member: MEMBER_LIST_NAME,
      admin: ADMIN_LIST_NAME
    },
    welcome_campaign_id: WELCOME_CAMPAIGN_ACTIVITY_ID || "Not set",
    bulk_campaign_id: BULK_EMAIL_CAMPAIGN_ACTIVITY_ID || "Not set"
  });
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`🔑 Start OAuth flow at http://localhost:${PORT}/auth`);
  console.log(`📧 Welcome Campaign Activity ID: ${WELCOME_CAMPAIGN_ACTIVITY_ID || "Not set"}`);
  console.log(`📧 Bulk Campaign Activity ID: ${BULK_EMAIL_CAMPAIGN_ACTIVITY_ID || "Not set"}`);
  console.log(`👥 Role Lists: ${COACH_LIST_NAME}, ${MEMBER_LIST_NAME}, ${ADMIN_LIST_NAME}`);
});