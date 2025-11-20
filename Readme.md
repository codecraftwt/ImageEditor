# Constant Contact OAuth & Contact Management Flow

## Goal

We wanted a backend that connects to **Constant Contact (CC)** so we can:

* Authenticate once (single CC account, not per user).
* Store our app’s contacts (emails from registration flow).
* Manage contact lists (create new lists, fetch existing ones).
* Later: manage campaigns if needed.

## Flow We Implemented

### 1. **Project Setup**

* Backend: `Node.js` + `Express` + `Axios` + `dotenv`.
* Config in `.env`:

  ```env
  CONSTANT_CONTACT_CLIENT_ID=xxxx
  CONSTANT_CONTACT_CLIENT_SECRET=xxxx
  CONSTANT_CONTACT_REDIRECT_URI=http://localhost:3001/callback
  ```
* `server.js` runs at `http://localhost:3001`.

---

### 2. **OAuth Authorization**

* Created `/auth` route → builds the **Authorization URL** and redirects to Constant Contact login.
* Example generated URL:

  ```
  https://authz.constantcontact.com/oauth2/default/v1/authorize?client_id=CLIENT_ID
    &response_type=code
    &redirect_uri=http://localhost:3001/callback
    &scope=offline_access contact_data campaign_data account_read
    &state=xyz
  ```
* Visiting `http://localhost:3001/auth` → logs into CC → redirects back to `/callback`.

---

### 3. **Callback & Token Exchange**

* `/callback` route receives `code` + `state`.
* Exchanges `code` for **access_token** + **refresh_token** using:

  ```
  POST https://authz.constantcontact.com/oauth2/default/v1/token
  ```
* Logs the tokens for saving.
* **Access Token** → used in every API call.
* **Refresh Token** → used to generate a new access_token when the old one expires.

⚠️ Access tokens expire quickly (~1 hour).
✅ Refresh token is long-lived (180 days).

---

### 4. **Where Tokens Live**

* For dev: put them in `.env` like:

  ```env
  CONSTANT_CONTACT_ACCESS_TOKEN=xxxx
  CONSTANT_CONTACT_REFRESH_TOKEN=yyyy
  ```
* In production: store them in a database or secure vault (so you can refresh without doing login again).

---

### 5. **Contact List APIs**

We already implemented:

* **Get all lists**

  ```http
  GET /api/contact-lists
  ```

  → calls `GET https://api.cc.email/v3/contact_lists`.

* **Create a list**

  ```http
  POST /api/contact-lists
  {
    "listName": "New Users"
  }
  ```

  → calls `POST https://api.cc.email/v3/contact_lists`.

---

### 6. **Planned Next Step: Add Contacts**

* In your **registration flow**, when a user signs up:

  * Capture `email`, `first_name`, etc.
  * Send them to backend:

    ```http
    POST /api/contacts
    {
      "email": "user@example.com",
      "first_name": "Vikas",
      "list_ids": ["your-list-id"]
    }
    ```
  * Backend calls CC API:

    ```
    POST https://api.cc.email/v3/contacts/sign_up_form
    ```

---

## Summary

✅ We can now:

* Authenticate with CC once (no per-user login).
* Store tokens locally.
* Fetch and create contact lists.
* Ready to add contacts programmatically.

⚠️ Still pending:

* Implement refresh token flow (auto-renew access token).
* Add `/api/contacts` route.

---

This gives us the working foundation. Your admin (CC account) stays connected, while your users just register → their emails get synced into CC.

# This Refresh token will expire after the 180 days.
# Then what that we should think about ? 
# 
