import { EmbedBuilder, InteractionContextType, MessageFlags, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../classes/slash_command";
import SettingsManager from "../handlers/settings_handler";

export default new SlashCommand({
  name: "settings",
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName("settings")
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM)
    .setDescription("Manage bot settings.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName("get")
        .setDescription("Get the current value of a specific setting.")
        .addStringOption(o =>
          o
            .setName("key")
            .setDescription("The name of the setting to retrieve.")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("set")
        .setDescription("Set a new value for a specific setting.")
        .addStringOption(o =>
          o
            .setName("key")
            .setDescription("The name of the setting to set.")
            .setRequired(true)
        )
        .addStringOption(o =>
          o
            .setName("value")
            .setDescription("The new value for the setting.")
            .setRequired(true)
        )
    ),
  callback: async (logger, client, interaction) => {
    if (
      !interaction.inGuild() &&
      interaction.user.id !== client.application?.owner?.id
    ) {
      await interaction.reply({ content: "This command can only be used on a server.", flags: MessageFlags.Ephemeral });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "get") {
      const key = interaction.options.getString("key", true);
      const value = SettingsManager.get(key);

      if (value !== null) {
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`Setting: \`${key}\``)
          .setDescription(`\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``)
          .addFields(
            { name: "Type", value: `\`${typeof value}\``, inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: `The setting \`${key}\` is unknown.`, flags: MessageFlags.Ephemeral });
      }
    } else if (subcommand === "set") {
      const key = interaction.options.getString("key", true);
      const rawValue = interaction.options.getString("value", true);

      const currentValue = SettingsManager.get(key);
      const type = typeof currentValue;

      if (!currentValue) {
        await interaction.reply({ content: `The setting \`${key}\` is unknown.`, flags: MessageFlags.Ephemeral });
        return;
      }

      let parsedValue: string | number | object = rawValue;
      if (type === 'number') {
        const numValue = parseInt(rawValue.trim());
        if (isNaN(numValue)) {
          await interaction.reply({
            content: `Invalid integer value provided for \`${key}\`. Please enter a valid number...`,
            ephemeral: true
          });
          return;
        }
        parsedValue = numValue;
      } else if (type === 'object') {
        try {
          parsedValue = JSON.parse(rawValue.trim());
        } catch (err) {
          await interaction.reply({
            content: `Invalid JSON object provided for \`${key}\`. Please ensure that this is valid JSON...\n> ${(err as Error).message}`,
            ephemeral: true
          });
          return;
        }
      }

      SettingsManager.set(key, parsedValue);

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle("Setting upated!")
        .setDescription(`The value of the setting \`${key}\` was updated successfully, new value:\n\`\`\`json\n${JSON.stringify(parsedValue, null, 2)}\n\`\`\``)
        .addFields(
          { name: "Type", value: `\`${typeof parsedValue}\``, inline: true }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

      logger.info(`Setting '${key}' updated to '${JSON.stringify(parsedValue)}' by ${interaction.user.tag}`);
    }
  },
  autocomplete: async (logger, client, interaction) => {
    const focusedOption = interaction.options.getFocused(true);
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "get" && focusedOption.name === "key") {
      const settings = SettingsManager.get_keys();

      const filtered = settings
        .filter(setting =>
          setting.toLowerCase().startsWith(focusedOption.value.toLowerCase())
        )
        .slice(0, 25);

      await interaction.respond(
        filtered.map(setting => ({ name: setting, value: setting }))
      );
    }
  },
});
