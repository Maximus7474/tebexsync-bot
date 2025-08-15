import { Events, Message } from "discord.js";
import EventHandler from "../../classes/event_handler";

import { TebexPurchaseWebhookPayload } from "../../types";
import Database from "../../utils/database";
import SettingsManager from "../../handlers/settings_handler";

// const tbxIdRegex = /tbx-[a-z0-9]{11,14}-[a-z0-9]{6}/g;

export default new EventHandler({
  name: 'TRANSACTION-LOGGING',
  eventName: Events.MessageCreate,
  type: "on",
  callback: async (logger, client, message: Message) => {
    const { channel, content, guild, author } = message;

    if (!guild) return;
    if (channel?.id !== SettingsManager.get('payment_log_channel') as string) return;
    if (author.id !== SettingsManager.get('notifying_discord_id') as string) return;

    let purchaseData: TebexPurchaseWebhookPayload | null;
    try {
      purchaseData = JSON.parse(content);

      if (!purchaseData || !(
        purchaseData.action && purchaseData.packageName && purchaseData.transaction
      )) return;
    } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      return;
    }

    if (purchaseData.action === 'chargeback' || purchaseData.action === 'refund') {
      Database.update(
        'UPDATE `transactions` SET `' +
        (purchaseData.action === 'chargeback' ? 'chargeback' : 'refund') +
        '` = 1 WHERE `tbxid` = ?',
        [purchaseData.transaction]
      );

      logger.info('Handling chargeback notification for', purchaseData.transaction);

      const customerId = await Database.get<{ discord_id: string }>('SELECT `discord_id` FROM `transactions` WHERE `tbxid` = ?', [purchaseData.transaction]);
      const developers = await Database.all<{ discord_id: string }>('SELECT `discord_id` FROM `customer_developers` WHERE `tbxid` = ?', [purchaseData.transaction]);

      if (customerId?.discord_id) {
        const customerUser = await guild.members.fetch(customerId.discord_id);
        if (customerUser) {
          const customerRole = SettingsManager.get('customer_role') as string;
          customerUser.roles.remove(customerRole)
          .catch(err => {
            logger.error(
              'Unable to remove customer role from',
              customerUser?.user.username ?? customerId,
              'err:', err
            );
          });
        }
      }

      if (developers.length > 0) {
        const customersDevRole = SettingsManager.get('customers_dev_role') as string;
        for (const { discord_id } of developers) {
          const developerUser = await guild.members.fetch(discord_id);
          if (developerUser) {
            await developerUser.roles.remove(customersDevRole)
            .catch(err => {
              logger.error(
                'Unable to remove customers developer role from',
                developerUser?.user.username ?? discord_id,
                'err:', err
              );
            });
          }
        }
      }
    } else if (purchaseData.action === 'purchase') {
      Database.insert(
        "INSERT OR IGNORE INTO INTO `transactions` (`tbxid`, `email`, `discord_id`, `purchaser_name`, `purchaser_uuid`) VALUES (?, ?, ?, ?, ?, ?)",
        [
          purchaseData.transaction,
          purchaseData.email,
          purchaseData.discordId || 'N/A',
          purchaseData.purchaserName,
          purchaseData.purchaserUuid
        ]
      );

      Database.insert(
        "INSERT INTO `transaction_packages` (`tbxid`, `package`) VALUES (?,?)",
        [
          purchaseData.transaction,
          purchaseData.packageName,
        ]
      );

      logger.info(`Successfully logged transaction ${purchaseData.transaction} for ${purchaseData.packageName}.`);
    } else {
      logger.error(`Unable to identify action for webhook notification ! ${message.url}`);
    }
  }
});
