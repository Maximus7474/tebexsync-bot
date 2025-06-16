import dotenv from 'dotenv';

import Logger from './logger';
const logger = new Logger('CONFIG');

dotenv.config();

const fields = {
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    MAIN_GUILD_ID: process.env.MAIN_GUILD_ID,
    // Database variables
    DATABASE_PROTOCOL: process.env.DATABASE_PROTOCOL,
    // SQLite setup
    SQLITE_PATH: process.env.SQLITE_PATH,
    // Tebex secret key
    TEBEX_SECRET: process.env.TEBEX_SECRET,
};

interface Config {
    DISCORD_BOT_TOKEN: string;
    MAIN_GUILD_ID: string|false;
    DATABASE_PROTOCOL: string|false;
    SQLITE_PATH: string;
    TEBEX_SECRET: string|false;
};

if (!fields.DISCORD_BOT_TOKEN) {
    throw new Error('No Discord Token was provided in the environment variables, make sure it\'s set under "DISCORD_BOT_TOKEN"')
}

if (!fields.MAIN_GUILD_ID) {
    logger.warn('No MAIN_GUILD detected, deployed commands will not be restricted to a guild !')
}

const env: Config = {
    DISCORD_BOT_TOKEN: fields.DISCORD_BOT_TOKEN,
    MAIN_GUILD_ID: fields.MAIN_GUILD_ID ?? false,
    DATABASE_PROTOCOL: fields.DATABASE_PROTOCOL ?? false,
    SQLITE_PATH: fields.SQLITE_PATH!,
    TEBEX_SECRET: fields.TEBEX_SECRET ?? false,
}

export default env;