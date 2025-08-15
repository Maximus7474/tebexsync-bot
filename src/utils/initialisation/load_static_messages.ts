import { DiscordClient } from '../../types';
import { AnySelectMenuInteraction, ButtonInteraction } from 'discord.js';
import static_messages from '../../static_messages';

import Logger from '../logger';
const logger = new Logger('LoadStaticMessages');

export default (client: DiscordClient) => {
    const initialiseStaticMessage = async (client: DiscordClient) => {
        const callbackHandler = new Map<string, (client: DiscordClient, interaction: ButtonInteraction|AnySelectMenuInteraction) => Promise<void>>();

        static_messages.forEach(async (message) => {
            try {
                message.initialize(client)
                .catch((err) => {
                    logger.error('Unable to initialize', message.name, 'error:', err.message);
                });

                message.customIds.forEach((customId) => {
                    callbackHandler.set(customId, message.handleInteraction.bind(message));
                });

                logger.info(`Loaded static message: ${message.name}`)
            } catch (error) {
                console.error(`Failed to load static message: ${message.name}\n`, error);
            }
        });

        client.on('interactionCreate', async (interaction) => {
            if (interaction.isButton() || interaction.isAnySelectMenu()) {
                const { customId } = interaction;
                const handler = callbackHandler.get(customId);
                console.log(customId, callbackHandler.keys());
                if (handler) {
                    await handler(client, interaction);
                }
            }
        });
    }

    client.once('ready', async () => {
        await initialiseStaticMessage(client);
    });
}

