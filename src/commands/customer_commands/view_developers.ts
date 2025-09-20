import { MessageFlags, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import Database from "../../utils/database";
import settings_handler from "../../handlers/settings_handler";
import PurchaseManager from "../../handlers/purchase_handler";

export default new SlashCommand({
  name: 'view-developers',
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName('viewdevelopers')
    .setDescription('Add a developer to also gain access to support channels.'),
  callback: async (logger, client, interaction) => {
    const { user, guild } = interaction;

    if (!guild) {
      interaction.reply({
        content: "This command can only be used on a server.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const customerId = await PurchaseManager.getCustomerId(user.id, true);

    const hasPurchases = customerId ? await PurchaseManager.checkCustomerPurchases(customerId) : false;

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

    interaction.reply({
      content: `Current developers linked (${currentDevs.length}/${settings_handler.get('max_developers')}):\n` + currentDevs
        .map(({ discord_id }) => `* <@${discord_id}>`)
        .join('\n'),
      flags: MessageFlags.Ephemeral,
    });
  }
});
