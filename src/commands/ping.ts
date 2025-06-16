import { MessageFlags, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../classes/slash_command";

export default new SlashCommand({
    name: 'ping',
    guildSpecific: true,
    slashcommand: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Ping the bot to check if it is alive !'),
    callback: async (logger, client, interaction) => {
        logger.success('Successfully received usage of /ping from discord API');
        await interaction.reply({
            // Ping is calculated by subtracting the current timestamp from the interaction created timestamp
            // This is not the best way to calculate ping, but it is a good approximation
            content: `Pong ! (${interaction.createdTimestamp - Date.now()} ms)`,
            flags: MessageFlags.Ephemeral,
        })
    }
});