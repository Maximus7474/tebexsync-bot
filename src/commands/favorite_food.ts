import { AutocompleteInteraction, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { DiscordClient } from "../types";
import Logger from "../utils/logger";
import SlashCommand from "../classes/slash_command";

export default new SlashCommand({
    name: "testautocomplete",
    guildSpecific: false,
    slashcommand: new SlashCommandBuilder()
        .setName("favoritefruit")
        .setDescription("A question to test autocomplete.")
        .addStringOption(option =>
            option.setName("item")
                .setDescription("Choose an fruit from the list.")
                .setAutocomplete(true) 
        ),
    callback: async (logger: Logger, client: DiscordClient, interaction: ChatInputCommandInteraction) => {
        const selectedItem = interaction.options.getString("item");
        if (selectedItem) {
            await interaction.reply({ content: `You selected: **${selectedItem}**`, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: "No fruit was selected :( .", flags: MessageFlags.Ephemeral });
        }
    },
    autocomplete: async (logger: Logger, client: DiscordClient, interaction: AutocompleteInteraction) => {
        const focusedValue = interaction.options.getFocused();
        const choices = ["apple", "banana", "orange", "grape", "strawberry", "blueberry", "kiwi", "mango", "pineapple"];
        
        const filtered = choices.filter(choice => 
            choice.toLowerCase().startsWith(focusedValue.toLowerCase())
        );

        const responseChoices = filtered.slice(0, 25).map(choice => ({ name: choice, value: choice }));
        
        await interaction.respond(responseChoices);
    }
});
