import { MessageFlags, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import Database from "../../utils/database";
import settings_handler from "../../handlers/settings_handler";

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

    const purchase = await Database.get<{ tbxid: string }>(
      'SELECT `tbxid` FROM `transactions` WHERE `discord_id` = ? AND `refund` = 0 AND `chargeback` = 0',
      [ user.id ]
    );

    if (!purchase) {
      interaction.reply({
        content: 'No linked purchases',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const currentDevs = await Database.all<{discord_id: string}>(
      'SELECT `discord_id` AS `count` FROM `customer_developers` WHERE `tbxid` = ?',
      [purchase.tbxid]
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
