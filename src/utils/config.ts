import dotenv from 'dotenv';

import { DBConnectionDetails } from '../types';

dotenv.config();

const fields = {
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  MAIN_GUILD_ID: process.env.MAIN_GUILD_ID,

  // SQLite setup
  SQLITE_PATH: process.env.SQLITE_PATH,

  // SQL setup
  SQL_HOST: process.env.SQL_HOST,
  SQL_PORT: Number(process.env.SQL_PORT) || undefined,
  SQL_USER: process.env.SQL_USER,
  SQL_DATABASE: process.env.SQL_DATABASE,
  SQL_PASSWORD: process.env.SQL_PASSWORD,

  // Tebex secret
  TEBEX_SECRET: process.env.TEBEX_SECRET,

  // Cfx forum cookie
  CFX_COOKIE: process.env.CFX_COOKIE,
};

interface Config extends DBConnectionDetails {
  DISCORD_BOT_TOKEN: string;
  MAIN_GUILD_ID: string;
  TEBEX_SECRET: string | false;
  CFX_COOKIE: string | false;
};

if (!fields.DISCORD_BOT_TOKEN) {
  throw new Error('No Discord Token was provided in the environment variables, make sure it\'s set under "DISCORD_BOT_TOKEN"')
}

if (!fields.MAIN_GUILD_ID) {
  throw new Error('No MAIN_GUILD_ID detected, this is required !')
}

const env: Config = {
  DISCORD_BOT_TOKEN: fields.DISCORD_BOT_TOKEN,
  MAIN_GUILD_ID: fields.MAIN_GUILD_ID,
  SQLITE_PATH: fields.SQLITE_PATH,
  SQL_HOST: fields.SQL_HOST,
  SQL_PORT: fields.SQL_PORT,
  SQL_USER: fields.SQL_USER,
  SQL_DATABASE: fields.SQL_DATABASE,
  SQL_PASSWORD: fields.SQL_PASSWORD,
  TEBEX_SECRET: fields.TEBEX_SECRET ?? false,
  CFX_COOKIE: fields.CFX_COOKIE ?? false,
}

export default env;
