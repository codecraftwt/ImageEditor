

```js

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

let ACCESS_TOKEN = process.env.CONSTANT_CONTACT_ACCESS_TOKEN || "";
let REFRESH_TOKEN = process.env.CONSTANT_CONTACT_REFRESH_TOKEN || "";

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error("❌ Missing required env vars (CLIENT_ID/SECRET/REDIRECT_URI)");
  process.exit(1);
}

// --- Step 1: Start OAuth Flow ---
app.get("/auth", (req, res) => {
  const state = "my_custom_state_" + Date.now(); // you can generate random string here

  // const authUrl = `https://authz.constantcontact.com/oauth2/default/v1/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
  //   REDIRECT_URI
  // )}&scope=contact_data%20campaign_data%20account_read&state=${state}`;

  //! Note: Added offline_access scope to get refresh token

  // const authUrl = `https://authz.constantcontact.com/oauth2/default/v1/authorize
  // ?client_id=${CLIENT_ID}
  // &response_type=code
  // &redirect_uri=${encodeURIComponent(REDIRECT_URI)}
  // &scope=offline_access%20contact_data%20campaign_data%20account_read
  // &state=${state}`;

  //! it should be in one line without spaces

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

// --- Helper: API Config with Current Token ---
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
    REFRESH_TOKEN = response.data.refresh_token;

    console.log("🔄 Token refreshed!");
    return ACCESS_TOKEN;
  } catch (err) {
    console.error("Failed to refresh token:", err.response?.data || err.message);
    throw err;
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
      await refreshAccessToken();
      return app.handle(req, res); // retry
    }
    console.error("Error fetching Constant Contact lists:", error.response?.data || error.message);
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
    console.error("Error creating Constant Contact list:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to create contact list",
      details: error.response?.data || "Internal Server Error",
    });
  }
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`🔑 Start OAuth flow at http://localhost:${PORT}/auth`);
});


```