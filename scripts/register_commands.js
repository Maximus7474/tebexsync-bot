/* eslint-disable */
import { REST, Routes } from 'discord.js';
import path from 'path';
import 'dotenv/config';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DISCORD_BOT_TOKEN) {
    console.error('❌ Missing DISCORD_BOT_TOKEN in .env file.');
    process.exit(1);
}

function getUserIdFromToken(base64Str) {
    const decodedStr = Buffer.from(base64Str, 'base64').toString('utf-8');
    
    const number = BigInt(decodedStr);
    
    return number.toString();
}

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = getUserIdFromToken(TOKEN.split('.')[0]);
const GUILD_ID = process.env.MAIN_GUILD_ID || null;

const clearCommands = process.argv.includes('--clear-commands');

const commands = {
    public: [],
    guild: [],
};

if (clearCommands) {
    console.log('🗑️  Clearing all commands...');
} else {
    const absoluteCommandsPath = path.join(__dirname, '../dist/commands/index.js');

    const commandsUrl = pathToFileURL(absoluteCommandsPath).href;

    try {
        const commandsModule = await import(commandsUrl);
        const commandList = commandsModule.default;

        if (!Array.isArray(commandList)) {
            console.error('❌ Expected an array of commands from dist/commands/index.js, but received something else.');
            process.exit(1);
        }

        for (const command of commandList) {
            if (typeof command.register === 'function') {
                const commandData = command.register();
                console.log(`📜 Registering command: ${commandData.name}`);

                const isGuildSpecific = typeof command.isGuildSpecific === 'function' && command.isGuildSpecific();
                commands[isGuildSpecific ? 'guild' : 'public'].push(commandData);
            } else {
                console.warn(`⚠️  Skipping invalid command module: It does not have a 'register' function.`);
            }
        }

        console.log(`📜 Found ${commands.public.length} public commands and ${commands.guild.length} guild-specific commands.`);

    } catch (error) {
        if (error.code === 'ERR_MODULE_NOT_FOUND') {
            console.error(`❌ Could not find command index file at ${absoluteCommandsPath}. Please ensure the project is built.`);
        } else {
            console.error(`❌ Error loading commands from dist/commands/index.js:`, error);
        }
        process.exit(1);
    }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        if (!clearCommands) console.log(`🔁 Started refreshing ${commands.public.length + commands.guild.length} application (/) commands.`);

        if (GUILD_ID && (clearCommands || commands.guild.length > 0)) {
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commands.guild },
            );
            console.log(`✅ Successfully reloaded guild-specific (/) commands.`);
        }
        if (clearCommands || commands.public.length > 0) {
            await rest.put(
                Routes.applicationCommands(CLIENT_ID),
                { body: commands.public },
            );
            console.log(`✅ Successfully reloaded global (/) commands.`);
        }

        console.log('✅ Finished command registration.\n');

    } catch (error) {
        console.error('❌ Failed to register commands:', error);
    }
})();
