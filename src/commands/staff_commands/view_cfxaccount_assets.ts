import { EmbedBuilder, MessageFlags, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import { GetCfxUserAssetGrants } from "../../handlers/browser_handler";

export default new SlashCommand({
  name: 'view-account-assets',
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName('view_user_assets')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
    .setDescription('Add a developer to also gain access to support channels.')
    .addStringOption(o =>
      o.setName('username')
      .setDescription('Cfx username to check')
      .setRequired(true)
    ),
  callback: async (logger, client, interaction) => {
    const { guild, options } = interaction;

    if (!guild) {
      interaction.reply({
        content: "This command can only be used on a server.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const username = options.getString('username', true);

    await interaction.deferReply();

    try {
      const response = await GetCfxUserAssetGrants(username);

      const embed = new EmbedBuilder()
        .setTitle(`Granted Asset Lookup`)
        .setDescription(
          `Look up for user: \`${username}\``+
          (response.length > 0
            ? ''
            : '\n* No assets were found.'
          )
        )
        .setFields(
          response.length > 0
            ? response.map(item => ({
                name: item.asset,
                value: `* Granted at: <t:${item.granted_at}>\n`+
                  (item.transferred_from ? `* Transferred from: \`${item.transferred_from}\`\n` : 'Original owner\n')+
                  (item.transferred_to ? `* Transferred to: \`${item.transferred_to}\`` : 'Not transferred'),
                inline: false,
              }))
            : []
        );

      interaction.reply({
        embeds: [embed],
      });
    } catch (err) {
      interaction.reply({
        content: `Unable to obtain cfx assets for username: \`${username}\`\nError:\n> ${(err as Error).message}`,
        flags: MessageFlags.Ephemeral
      });
    }
  },
});
