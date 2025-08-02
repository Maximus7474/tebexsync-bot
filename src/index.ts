import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';

import { DiscordClient } from './types';

import Config from './utils/config';

import LoadCommands from './utils/initialisation/load_commands';
import LoadEvents from './utils/initialisation/load_events';
import LoadStaticMessages from './utils/initialisation/load_static_messages';

const client: DiscordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
}) as DiscordClient;

client.commands = new Collection();
client.autocompleteCommands = new Collection();

LoadCommands(client);
LoadEvents(client);
LoadStaticMessages(client);

client.login(Config.DISCORD_BOT_TOKEN);
