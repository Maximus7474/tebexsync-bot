import Config from '../config';

import Logger from '../logger';
import SQLiteHandler from './sqlite';
const logger = new Logger('Database');

const initDB = (): SQLiteHandler|null => {
    if (!Config.DATABASE_PROTOCOL) return null;

    switch (Config.DATABASE_PROTOCOL) {
        case 'SQLITE': {
            logger.info('Loading SQLite Handler');
            const Database = new SQLiteHandler(Config.SQLITE_PATH);
            return Database as SQLiteHandler;
        }
        default:
            throw new Error(`Invalid DATABASE_PROTOCOL: ${Config.DATABASE_PROTOCOL}`);
    }
};

const Database = initDB();

export default Database;
