import { GuildMember, MessageFlags, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import { tbxIdRegex } from "../../utils/utils";
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
      .setMaxLength(26)
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

    if (!tbxIdRegex.test(transactionId)) {
      interaction.reply({
        content: 'No valid transaction id was provided',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    let purchaseLog = await Database.get<{
      id: number;
      discord_id: string | null;
      refund: 0 | 1;
      chargeback: 0 | 1;
    }>('SELECT * FROM `transactions` WHERE `tbxid` = ?', [ transactionId ]);

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

        const id = await Database.insert(
          "INSERT INTO INTO `transactions` (`tbxid`, `email`, `discord_id`, `purchaser_name`, `purchaser_uuid`, `refund`, `chargeback`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            transactionId,
            rawPurchaseData.data.email,
            user.id,
            rawPurchaseData.data.player.name,
            rawPurchaseData.data.player.uuid,
            rawPurchaseData.data.status === 'Refund' ? 1 : 0,
            rawPurchaseData.data.status === 'Chargeback' ? 1 : 0,
          ]
        );

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
          id,
          discord_id: user.id,
          refund: rawPurchaseData.data.status === 'Refund' ? 1 : 0,
          chargeback: rawPurchaseData.data.status === 'Chargeback' ? 1 : 0
        }
      } catch (err: any) {  // eslint-disable-line @typescript-eslint/no-explicit-any
        logger.error('Unable to insert purchase to database ! Error:', err);
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

    if (purchaseLog.discord_id && purchaseLog.discord_id !== user.id) {
      interaction.reply({
        content: 'The purchase linked to this transaction ID has already been claimed.\nIf you are related to the user, you can ask him to add you as his developer.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await Database.update('UPDATE `transactions` SET `discord_id` = ? WHERE `tbxid` = ?', [ user.id, transactionId ]);

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
