import { ClientEvents } from "discord.js";
import Logger from "../utils/logger";
import { DiscordClient } from "./client";

export type EventHandlerSetup = (logger: Logger, client: DiscordClient) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventHandlerCallback = (logger: Logger, client: DiscordClient, ...args: any[]) => void;

export interface EventHandlerOptions {
    name: string;
    eventName: keyof ClientEvents;
    type: "on" | "once";
    callback: EventHandlerCallback;
    setup?: EventHandlerSetup;
}