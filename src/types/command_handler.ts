import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";
import { DiscordClient } from "./client";
import type Logger from "../utils/logger";

export type SlashCommandBuilders = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;

export interface SlashCommandOptions {
    name: string;
    guildSpecific?: boolean;
    slashcommand: SlashCommandBuilders;
    callback: (logger: Logger, client: DiscordClient, interaction: ChatInputCommandInteraction) => Promise<void>;
    setup?: (logger: Logger, client: DiscordClient) => Promise<void>;
    autocomplete?: (logger: Logger, client: DiscordClient, interaction: AutocompleteInteraction) => Promise<void>;
}