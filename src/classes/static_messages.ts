import { DiscordClient, StaticMessageCallback, StaticMessageOptions, StaticMessageSetup } from "../types";

import Logger from "../utils/logger";
import { magenta } from "../utils/console_colours";
import { AnySelectMenuInteraction, ButtonInteraction } from "discord.js";

export default class StaticMessage {

    private logger: Logger;
    public customIds: string[];
    public name: string;
    private setup: StaticMessageSetup;
    private callback?: StaticMessageCallback;

    /**
     * Constructs an instance of the static message handler.
     *
     * @param options - An object containing the configuration for the static message handler.
     * @param options.name - The name of the static message handler.
     * @param options.customIds - An array of custom IDs this handler will respond to (for buttons/select menus).
     * @param options.setup - A function to perform setup logic, often used to send or fetch the static message.
     * @param options.callback - (Optional) The function to be executed when an interaction with a matching customId is triggered.
     */
    constructor({ name, customIds, setup, callback }: StaticMessageOptions) {
        this.name = name;
        this.logger = new Logger(`${magenta('MSG')}:${name}`);
        this.customIds = customIds || [];

        this.setup = setup;
        this.callback = callback;
    }

    async initialize (client: DiscordClient): Promise<void> {
        await this.setup(this.logger, client);
    }

    getCustomIds (): string[] {
        return this.customIds;
    }

    handleInteraction (client: DiscordClient, interaction: ButtonInteraction|AnySelectMenuInteraction): Promise<void> {
        if (!this.callback) {
            this.logger.error(`No callback found for interaction ID: ${interaction.customId}`);
            return Promise.resolve();
        }
        return this.callback(this.logger, client, interaction);
    }
}