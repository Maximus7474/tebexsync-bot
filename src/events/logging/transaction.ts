import { Events, Message } from "discord.js";
import EventHandler from "../../classes/event_handler";

import Database from "../../utils/database";
import SettingsManager from "../../handlers/settings_handler";
import tebexHandler from "../../handlers/tebex_handler";

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

    const purchaseData = tebexHandler.parsePurchaseJson(content);
    if (!purchaseData) return;

    if (purchaseData.action === 'chargeback' || purchaseData.action === 'refund') {
      Database.update(
        'UPDATE `transactions` SET `' +
        (purchaseData.action === 'chargeback' ? 'chargeback' : 'refund') +
        '` = 1 WHERE `tbxid` = ?',
        [purchaseData.transaction]
      );

      logger.info(`Handling ${purchaseData.action} notification for`, purchaseData.transaction);

      const customerId = await Database.get<{ id: number; discord_id: string }>(
        `SELECT C.discord_id, C.id FROM transactions AS T
        JOIN customers AS C ON T.customer_id = C.id
        WHERE T.tbxid = ?`,
        [purchaseData.transaction]
      );

      if (!customerId) return;

      const { purchases } = await Database.get<{ purchases: number }>(
        'SELECT COUNT(`id`) AS `purchases` WHERE `customer_id` = ? AND `chargeback` = 0 AND `chargeback` = 0',
        [customerId.id]
      ) ?? { purchases: 0 };

      if (purchases > 0) return;

      const developers = await Database.all<{ discord_id: string }>(
        'SELECT `discord_id` FROM `customer_developers` WHERE `customer_id` = ?',
        [customerId.id]
      );

      const customerUser = await guild.members.fetch(customerId.discord_id);

      if (customerUser) {
        const customerRole = SettingsManager.get('customer_role') as string;

        customerUser.roles.remove(customerRole)
        .catch(err => {
          logger.error(
            'Unable to remove customer role from',
            customerUser?.user.username ?? customerId.discord_id,
            'err:', err
          );
        });
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

        await Database.execute(
          'DELETE FROM `customer_developers` WHERE `customer_id` = ?',
          [customerId.id]
        );
      }
    } else if (purchaseData.action === 'purchase') {
      let id = null;

      if (purchaseData.discordId) {
        id = await Database.insert(
          "INSERT OR IGNORE INTO `customers` (`discord_id`) VALUES (?)",
          [purchaseData.discordId]
        );
      }

      Database.insert(
        "INSERT OR IGNORE INTO `transactions` (`tbxid`, `email`, `customer_id`, `purchaser_name`, `purchaser_uuid`) VALUES (?, ?, ?, ?, ?)",
        [
          purchaseData.transaction,
          purchaseData.email,
          id ?? null,
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
