import { GuildMember, MessageFlags, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import Database from "../../utils/database";
import tebexHandler from "../../handlers/tebex_handler";
import SettingsManager from "../../handlers/settings_handler";

export default new SlashCommand({
  name: 'claim-role',
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName('claimrole')
    .setDescription('Claim your customer role to access support channels.')
    .addStringOption(o =>
      o.setName('transactionid')
      .setDescription('Transaction ID provided by the purchase')
      .setRequired(true)
      .setMinLength(20)
      .setMaxLength(45)
    ),
  callback: async (logger, client, interaction) => {
    const { user, member, options, guild } = interaction;

    if (!guild || !member) {
      interaction.reply({
        content: "This command can only be used on a server.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const transactionId = options.getString('transactionid', true);

    let purchaseLog = await Database.get<{
      customer_id: number | null;
      discord_id: string | null;
      refund: 0 | 1;
      chargeback: 0 | 1;
    }>(`SELECT
          C.discord_id,
          C.id as customer_id,
          T.refund,
          T.chargeback
        FROM transactions AS T
        LEFT JOIN customers AS C ON T.customer_id = C.id
        WHERE T.tbxid = ?`,
      [transactionId]
    );

    if (!purchaseLog) {
      try {
        const rawPurchaseData = await tebexHandler.verifyPurchase(transactionId);

        if (!rawPurchaseData.success) {
          interaction.reply({
            content: 'The provided transaction ID is invalid.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const customerId = await tebexHandler.getCustomerInternalId(user.id);

        const id = await Database.insert(
          "INSERT INTO `transactions` (`tbxid`, `customer_id`, `purchaser_name`, `purchaser_uuid`, `refund`, `chargeback`) VALUES (?, ?, ?, ?, ?, ?)",
          [
            transactionId,
            customerId,
            rawPurchaseData.data.player.name,
            rawPurchaseData.data.player.uuid,
            rawPurchaseData.data.status === 'Refund' ? 1 : 0,
            rawPurchaseData.data.status === 'Chargeback' ? 1 : 0,
          ]
        );

        for (let i = 0; i < rawPurchaseData.data.packages.length; i++) {
          const packageData = rawPurchaseData.data.packages[i];
          await Database.insert(
            'INSERT OR IGNORE INTO `transaction_packages` (`tbxid`, `package`) VALUES (?, ?)',
            [ transactionId, packageData.name ]
          );
        }

        if (!id) {
          logger.error('Unable to insert purchase to database !');
          logger.error(`Claim role was executed by ${user.username} (${user.id}) with transaction id: ${transactionId} but failed to insert into database.`);

          interaction.reply({
            content: 'An error has occured.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        purchaseLog = {
          customer_id: customerId,
          discord_id: user.id,
          refund: rawPurchaseData.data.status === 'Refund' ? 1 : 0,
          chargeback: rawPurchaseData.data.status === 'Chargeback' ? 1 : 0
        }
      } catch (err: any) {  // eslint-disable-line
        logger.error('Unable to insert purchase to database !');
        logger.error(`Claim role was executed by ${user.username} (${user.id}) with transaction id: ${transactionId} but failed to insert into database.`);

        interaction.reply({
          content: 'An error has occured while checking your transaction ID.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    if (purchaseLog.chargeback === 1 || purchaseLog.refund === 1) {
      interaction.reply({
        content: `The purchase linked to this transaction id is not claimable, reason: \`a ${purchaseLog.chargeback === 1 ? 'chargeback' : 'refund'} has been made.\``,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (purchaseLog.customer_id && purchaseLog.discord_id !== user.id) {
      interaction.reply({
        content: 'The purchase linked to this transaction ID has already been claimed.\nIf you are related to the user, you can ask him to add you as his developer.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!purchaseLog.customer_id) {
      let customer = await Database.get<{id: number}>('SELECT `id` FROM `customers` WHERE `discord_id` = ?', [ user.id ]);

      if (!customer) {
        const id = await Database.insert(
          "INSERT INTO `customers` (`discord_id`) VALUES (?)",
          [ user.id ]
        );

        if (!id) {
          logger.error('Unable to insert customer to database !');
          logger.error(`Claim role was executed by ${user.username} (${user.id}) with transaction id: ${transactionId} but failed to insert him into the customer channel.`);

          interaction.reply({
            content: 'An error has occured while checking your transaction ID.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        customer = { id };
      }

      await Database.update('UPDATE `transactions` SET `customer_id` = ? WHERE `tbxid` = ?', [ customer.id, transactionId ]);
    }

    const customerRole = SettingsManager.get('customer_role') as string;

    const role = await guild.roles.fetch(customerRole);
    if (role) {
      await (member as GuildMember).roles.add(role, 'Purchase claimed');
    } else {
      logger.error(`Unable to grant customer role, role with ID ${customerRole} was not found.`);
      interaction.reply({
        content: `Unable to grant customer role, please notify server staff that the bot isn't setup properly.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    interaction.reply({
      content: 'Role claim accepted',
      flags: MessageFlags.Ephemeral,
    });

    logger.success(`Purchase: ${transactionId} was claimed by ${user.username} (id: ${user.id})`)
  },
})
