import { MessageFlags, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import Database from "../../utils/database";
import settings_handler from "../../handlers/settings_handler";
import PurchaseManager from "../../handlers/purchase_handler";

export default new SlashCommand({
  name: 'remove-developer',
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName('removedeveloper')
    .setDescription('Remove a developer that is linked to your purchase.')
    .addUserOption(o =>
      o.setName('member')
      .setDescription('Member to remove the developer role from')
      .setRequired(true)
    ),
  callback: async (logger, client, interaction) => {
    const { user, guild, options } = interaction;

    if (!guild) {
      interaction.reply({
        content: "This command can only be used on a server.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const customerId = await PurchaseManager.getCustomerId(user.id);

    const hasPurchases = await PurchaseManager.checkCustomerPurchases(customerId);

    if (!hasPurchases) {
      interaction.reply({
        content: 'No linked or active purchases',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const currentDevs = await Database.all<{discord_id: string}>(
      'SELECT `discord_id` AS `count` FROM `customer_developers` WHERE `customer_id` = ?',
      [ customerId ]
    );

    if (currentDevs.length === 0) {
      interaction.reply({
        content: `You have no linked developers.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const developer = options.getUser('member', true);

    const listed = currentDevs.find(({ discord_id }) => discord_id === developer.id);

    if (!listed) {
      interaction.reply({
        content: `<@${developer.id}> is not listed as your developer.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    Database.execute(
      'DELETE FROM `customer_developers` WHERE `customer_id` = ? AND `discord_id` = ?',
      [ customerId, developer.id ]
    );

    const member = await guild.members.fetch({ user: developer, cache: false });

    if (member) {
      const customersDevRole = settings_handler.get('customers_dev_role') as string;
      await member.roles.remove(customersDevRole)
    }

    interaction.reply({
      content: `<@${developer.id}> has been removed from your developers.`,
      flags: MessageFlags.Ephemeral,
    });

    logger.success(`${developer.username} (${developer.id}) was removed as developer by ${user.username} (${user.id})`);
  }
});
