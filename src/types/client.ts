import { AutocompleteInteraction, ChatInputCommandInteraction, Client, Collection } from "discord.js";

export type CommandCollection = Collection<string, (client: DiscordClient, interaction: ChatInputCommandInteraction) => void>;
export type CommandAutocompleteCollections = Collection<string, (client: DiscordClient, interaction: AutocompleteInteraction) => void>;

export interface DiscordClient extends Client {
  commands: CommandCollection;
  autocompleteCommands: CommandAutocompleteCollections;
}
