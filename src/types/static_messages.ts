import { AnySelectMenuInteraction, ButtonInteraction } from "discord.js";
import type Logger from "../utils/logger";
import { DiscordClient } from "./client";

export type StaticMessageInteractions = ButtonInteraction | AnySelectMenuInteraction;

export type StaticMessageSetup = (logger: Logger, client: DiscordClient) => Promise<void>;
export type StaticMessageCallback = (logger: Logger, client: DiscordClient, interaction: StaticMessageInteractions) => Promise<void>;

export interface StaticMessageOptions {
    name: string;
    customIds: string[];
    setup: StaticMessageSetup;
    callback?: StaticMessageCallback;
}
