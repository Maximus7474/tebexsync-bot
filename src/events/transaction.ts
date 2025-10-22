import { Events, Message } from "discord.js";
import EventHandler from "../classes/event_handler";

import SettingsManager from "../handlers/settings_handler";
import tebexHandler from "../handlers/tebex_handler";
import PurchaseManager from "../handlers/purchase_handler";
import { prisma } from "../utils/prisma";

export default new EventHandler({
  name: 'TRANSACTION-LOGGING',
  eventName: Events.MessageCreate,
  type: "on",
  callback: async (logger, client, message: Message) => {
    const { channel, content, guild, author } = message;

    if (!guild) return;
    if (channel?.id !== SettingsManager.get('payment_log_channel') as string) return;
    if (author.id !== SettingsManager.get('notifying_discord_id') as string) return;

    const purchaseData = tebexHandler.parsePurchaseJson(content);
    if (!purchaseData) return;

    if (purchaseData.action === 'chargeback' || purchaseData.action === 'refund') {
      const purchaseListing = await prisma.transactions.findUnique({
        where: {
          tbxId: purchaseData.transaction,
        },
        include: {
          customer: true,
        }
      });

      if (!purchaseListing) return;

      await prisma.transactions.update({
        where: {
          tbxId: purchaseData.transaction,
        },
        data: (
          purchaseData.action === 'chargeback'
            ? { chargeback: 1 }
            : { refund: 1 }
        )
      });

      if (!purchaseListing.customer) return;

      PurchaseManager.checkCustomerPurchases(purchaseListing.customer.id);

      logger.info(`Handling ${purchaseData.action} notification for ${purchaseData.transaction}`);
    } else {
      logger.error(`Unable to identify action for webhook notification ! ${message.url}`);
    }
  }
});
