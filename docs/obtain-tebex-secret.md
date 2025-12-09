## Obtaining Your Tebex API Secret

This private API secret is **required** for your bot to successfully communicate with the Tebex API. Without it, all commands that query Tebex data **will fail**, including:

* The customer command to claim a role: `/claimrole`
* The staff command to view a purchase: `/view-purchase`

---

### Step 1: Access Your Tebex Dashboard

1.  Go to your Tebex creator dashboard and **log in**: [Tebex Dashboard](https://creator.tebex.io/dashboard).

---

### Step 2: Navigate to API Keys

1.  In the left-hand navigation menu, open the **Integrations** section.
2.  Select the **API Keys** sub-section.

---

### Step 3: Generate and Copy the Private Key

1.  Click the button to **Generate a private key**.
2.  **Copy the generated key**.

---

### Step 4: Place the Key in Configuration

1.  Paste the copied key into your bot's configuration file, typically the `.env` file, under the variable: `TEBEX_SECRET`.

> [!WARN]
> **Security Warning:** The Tebex API Secret grants full programmatic access to your store data. Treat this key with the same level of security as a password. Do not share it publicly, and ensure your `.env` file is secured.
