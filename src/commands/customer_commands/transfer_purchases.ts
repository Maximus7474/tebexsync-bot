import { MessageFlags, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import Database from "../../utils/database";
import settings_handler from "../../handlers/settings_handler";
import PurchaseManager from "../../handlers/purchase_handler";

export default new SlashCommand({
  name: 'transfer-purchase',
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName('transferpurchase')
    .setDescription('Transfer one of your purchases to a new account.')
    .addUserOption(o =>
      o.setName('member')
      .setDescription('Account that receives the purchase')
      .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('purchase')
      .setDescription('Purchase to transfer')
      .setRequired(true)
      .setAutocomplete(true)
    ),
  callback: async (logger, client, interaction) => {
    const { user, options, guild } = interaction;

    if (!guild) {
      interaction.reply({
        content: "This command can only be used on a server.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const tbxid = options.getString('purchase', true);
    const newOwner = options.getUser('member', true);

    const { id: customerId } = await Database.get<{ id: number }>('SELECT `id` FROM `customers` WHERE `discord_id` = ?', [ user.id ]) ?? { id: null };

    if (!customerId) {
      interaction.reply({
        content: "You don't have any claimed purchases",
        flags: [ MessageFlags.Ephemeral ],
      });
      return;
    }

    const purchase = await Database.get<{id: number; refund: 0 | 1, chargeback: 0 | 1}>(
      'SELECT `id`, `chargeback`, `refund` FROM `transactions` WHERE `tbxid` = ? AND `customer_id` = ?',
      [ tbxid, customerId ]
    );

    if (!purchase) {
      interaction.reply({
        content: `No purchase was found for: ${tbxid}\nMake sure it's a suggested input, otherwise it's unclaimed.`,
        flags: [ MessageFlags.Ephemeral ],
      });
      return;
    }

    if (purchase.chargeback === 1 || purchase.refund === 1) {
      interaction.reply({
        content: `This purchase was ${purchase.chargeback === 1 ? 'chargebacked' : 'refunded'}, it can not be transferred.`,
        flags: [ MessageFlags.Ephemeral ],
      });
      return;
    }

    const newCustomerId = await PurchaseManager.getCustomerId(newOwner.id);

    await Database.execute(
      'UPDATE `transactions` SET `customer_id` = ? WHERE `tbxid` = ?',
      [ newCustomerId, tbxid ],
    );

    const { purchases } = await Database.get<{ purchases: number }>(
      'SELECT COUNT(`id`) AS purchases FROM `transactions` WHERE `refund` = 0 AND `chargeback` = 0 AND `customer_id` = ?',
      [ customerId ],
    ) ?? { purchases: 0 };

    const customerRole = settings_handler.get('customer_role') as string;

    const role = await guild.roles.fetch(customerRole);

    if (purchases < 1) {
      const member = await guild.members.fetch(user.id);
      if (role) {
        await member.roles.remove(role, 'Purchase transferred');
        logger.success(`Removed customer role from ${user.username} (${user.id}) has he has no active purchases anymore.`);
      } else {
        logger.error('Unable to find customer role to remove from previous customer !');
      }
    }

    const newCustomer = await guild.members.fetch(newOwner.id);
    if (newCustomer) {
      if (role) {
        await newCustomer.roles.add(role, 'Purchase transferred');
        logger.success(`Added customer role to ${newCustomer.user.username} (${newCustomer.id}) being transferred from ${user.username} (${user.id}).`);
      } else {
        logger.error('Unable to find customer role to add to new customer !');
      }
    }

    interaction.reply({
      content: `The purchase (${tbxid}) was transferred to <@${newOwner.id}>`,
      flags: MessageFlags.Ephemeral,
    });
  },
  autocomplete: async (logger, client, interaction) => {
    const focusedOption = interaction.options.getFocused(true);

    const transactions = await Database.all<{tbxid: string; packages: string[]}>(
      `SELECT
        T.tbxid AS tbxid,
        GROUP_CONCAT(TP.package, ' - ') AS packages
      FROM customers AS C
      JOIN transactions AS T
        ON C.id = T.customer_id
      JOIN transaction_packages AS TP
        ON T.tbxid = TP.tbxid
      WHERE
        C.discord_id = ?
        AND (
              T.tbxid LIKE ?
          OR  TP.package LIKE ?
        )
      GROUP BY
        T.id;`,
      [ interaction.user.id, `%${focusedOption.value}%`, `%${focusedOption.value}%` ],
    );

    await interaction.respond(
      transactions.map(({ tbxid, packages }) => ({ name: `${tbxid}: ${packages}`, value: tbxid }))
    );
  },
});
