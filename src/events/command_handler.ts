import { AutocompleteInteraction, ChatInputCommandInteraction, Events } from "discord.js";
import EventHandler from "../classes/event_handler";
import Logger from "../utils/logger";
import { DiscordClient } from "../types";

export default new EventHandler({
    name: 'COMMANDS',
    eventName: Events.InteractionCreate,
    type: "on",
    callback: (logger: Logger, client: DiscordClient, interaction: ChatInputCommandInteraction | AutocompleteInteraction) => {
        if (interaction.isChatInputCommand()) {
            const commandCallback = client.commands.get(interaction.commandName);
            if (!commandCallback) return;

            commandCallback(client, interaction);
            return;
        }
        
        if (interaction.isAutocomplete()) {
            const commandAutoComplete = client.autocompleteCommands.get(interaction.commandName);
            if (!commandAutoComplete) return;

            commandAutoComplete(client, interaction);
            return;
        }
    }
});