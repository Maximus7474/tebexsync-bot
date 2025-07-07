import { Events, Message } from "discord.js";
import EventHandler from "../../classes/event_handler";

import { TebexPurchaseWebhookPayload } from "../../types";
import Database from "../../utils/database";

import { customer, customersDeveloper } from '../../../config/roles.json';
import { payments } from '../../../config/channels.json';

// const tbxIdRegex = /tbx-[a-z0-9]{11,14}-[a-z0-9]{6}/g;

export default new EventHandler({
  name: 'TRANSACTION-LOGGING',
  eventName: Events.MessageCreate,
  type: "on",
  callback: async (logger, client, message: Message) => {
    const { channel, webhookId, content, guild } = message;

    if (!guild) return;
    if (channel?.id !== payments) return;
    if (!webhookId) return;

    let purchaseData: TebexPurchaseWebhookPayload | null;
    try {
      purchaseData = JSON.parse(content);

      if (!purchaseData || !(
        purchaseData.action && purchaseData.packages && purchaseData.transactionId
      )) return;
    } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      return;
    }

    if (purchaseData.action === 'chargeback') {
      Database.run('UPDATE `transactions` SET `chargeback` = 1 WHERE `tbxid` = ?', [purchaseData.transactionId]);

      logger.info('Handling chargeback notification for', purchaseData.transactionId);

      const customerId = Database.get<{ discord_id: string }>('SELECT `discord_id` FROM `transactions` WHERE `tbxid` = ?', [purchaseData.transactionId]);
      const developers = Database.all<{ discord_id: string }>('SELECT `discord_id` FROM `customer_developers` WHERE `tbxid` = ?', [purchaseData.transactionId]);

      if (customerId?.discord_id) {
        const customerUser = await guild.members.fetch(customerId.discord_id);
        if (customerUser) {
          customerUser.roles.remove(customer)
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
        for (const { discord_id } of developers) {
          const developerUser = await guild.members.fetch(discord_id);
          if (developerUser) {
            await developerUser.roles.remove(customersDeveloper)
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
      Database.run(
        "INSERT INTO `transactions` (`tbxid`, `email`, `discord_id`, `webstore`, `purchaser_name`, `purchaser_uuid`) VALUES (?, ?, ?, ?, ?, ?)",
        [
          purchaseData.transactionId,
          purchaseData.email,
          purchaseData.discordId || 'N/A',
          purchaseData.webstore,
          purchaseData.purchaserName,
          purchaseData.purchaserUuid
        ]
      );

      const packages = purchaseData.packages.split(',');

      for (const pkg of packages) {
        Database.run(
          "INSERT INTO `transaction_packages` (`tbxid`, `package`) VALUES (?,?)",
          [
            purchaseData.transactionId,
            pkg
          ]
        );
      }

      logger.info(`Successfully logged transaction ${purchaseData.transactionId} with ${packages.length} packages.`);
    } else {
      logger.error(`Unable to identify action for webhook notification ! ${message.url}`);
    }
  }
});
