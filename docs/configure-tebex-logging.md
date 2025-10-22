## Setting Up Tebex Discord Notifications for Your Bot

This guide will walk you through the process of setting up **Tebex webhooks** to send refund and chargeback notifications directly to your bot via a discord webhook, this is used to revoke the customer and their developer permissions if ever they decide to refund or chargeback their purchases, as tebex will remove it from their Cfx portal.

This is by no means required for the bot to work properly.

First, make sure you have the Tebex bot added to your Discord server and have a dedicated channel ready for these notifications.

-----

### Step 1: Access Your Tebex Account

1.  Log in to your Tebex creator account at the **Tebex panel**.

-----

### Step 2: Configure Webhook Actions

1.  Navigate to the specific package you want to set up notifications for. If you haven't created one yet, **create a new package**.
2.  Scroll to the bottom of the package page and click on **Discord Actions**.
3.  Add **three new webhook actions** to handle purchases, refunds, and chargebacks. Make sure each action is configured for the correct event type: **asset purchase**, **refund**, and **chargeback**.

-----

### Step 3: Add JSON Message Payloads

For each of the three actions you just created, you'll need to paste a specific JSON string into the **message field**. This JSON string contains all the information your bot needs to process the notification. Purchase action is not required, as we individually query tebex's API to get up to date information.

  * **For the refund action**, use this JSON payload:

    ```json
    { "action": "refund", "username": "{username}", "transaction": "{transaction}", "packageName": "{packageName}"}
    ```

  * **For the chargeback action**, use this JSON payload:

    ```json
    { "action": "chargeback", "username": "{username}", "transaction": "{transaction}", "packageName": "{packageName}"}
    ```

Once you've saved these actions, your Tebex account will now send detailed notifications to your bot whenever a purchase, refund, or chargeback occurs for that package.

> [!NOTE]
> If you want to extend the capacity of the logging with more information please note that the `"action"` is purely hardcoded for this bot's behaviour.
> Here are all the fields you can obtain from an individual purchased package using this method:
> ```json
>  {"username": "{username}", "price": "{price}", "transaction": "{transaction}", "packageName": "{packageName}", "time": "{time}", "date": "{date}", "email": ">{email}", "purchaserName": "{purchaserName}", "purchaserUuid": "{purchaserUuid}", "server": "{server}", "discordId": "{discordId}"}
> ```
> Please note that some fields will not work within the general notification panel of tebex's creator space (i.e. {discordId})
