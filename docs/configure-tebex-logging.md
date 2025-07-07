## Setting Up Tebex Discord Webhooks for Your Bot

This guide will walk you through configuring Tebex to send purchase and chargeback notifications to your Discord server, which your bot can then process.

-----

### Step 1: Access Your Tebex Creator Panel

1.  **Log in** to your Tebex Creator Panel:
      * [https://creator.tebex.io](https://creator.tebex.io)

### Step 2: Navigate to Integrations & Notifications

2.  From the dashboard, go to the **Integrations & Notifications** section:
      * [https://creator.tebex.io/notifications](https://creator.tebex.io/notifications)

### Step 3: Create a New Discord Notification

3.  Under the "Discord Notifications" section, click on the **`Setup Notification`** button.

### Step 4: Create a Discord Webhook URL

4.  **In your Discord server**:
      * Go to the channel where you want your bot to receive these raw Tebex webhook messages (e.g., a private `#tebex-logs` channel).
      * Right-click on the channel name, go to **`Edit Channel`** \> **`Integrations`** \> **`Create Webhook`**.
      * Give your webhook a recognizable name (e.g., "Tebex Bot Listener").
      * **Copy the generated Webhook URL**.

### Step 5: Paste the Webhook URL in Tebex

5.  **Back on the Tebex page**:
      * Paste the Discord Webhook URL you just copied into the designated input field.

### Step 6: Configure Event Triggers

6.  Ensure the following checkboxes are **checked** for your notification:
      * `Payment Received`
      * `Payment Chargeback`

### Step 7: Customize "Payment Received" Message

7.  For the **`Payment Received`** event:

      * Click on **`Customize this event message`**.
      * In the text area, **delete any existing content** and paste the following exact JSON structure. This specific format is crucial for your bot to correctly parse the purchase data.

    <!-- end list -->

    ```json
    {"action": "purchase", "webstore": "{webstore}", "username": "{username}", "price": "{price}", "paymentId": "{paymentId}", "transactionId": "{transactionId}", "packageName": "{packageName}", "time": "{time}", "date": "{date}", "email": "{email}", "purchaserName": "{purchaserName}", "purchaserUuid": "{purchaserUuid}", "server": "{server}", "packages": "{packages}", "discordId": "{discordId}"}
    ```

### Step 8: Customize "Payment Chargeback" Message

8.  For the **`Payment Chargeback`** event:

      * Click on **`Customize this event message`**.
      * In the text area, **delete any existing content** and paste the following exact JSON structure. Notice the `action` field is different, signaling a chargeback.

    <!-- end list -->

    ```json
    {"action": "chargeback", "webstore": "{webstore}", "username": "{username}", "price": "{price}", "paymentId": "{paymentId}", "transactionId": "{transactionId}", "packageName": "{packageName}", "time": "{time}", "date": "{date}", "email": "{email}", "purchaserName": "{purchaserName}", "purchaserUuid": "{purchaserUuid}", "server": "{server}", "packages": "{packages}", "discordId": "{discordId}"}
    ```

### Step 9: Finalize Setup

9.  Scroll down and click the **`Create`** button to save your new notification.
