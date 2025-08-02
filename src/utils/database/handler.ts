import { DBConnectionDetails } from '../../types';
import { red } from 'colors';

export default class SQLiteHandler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(data: DBConnectionDetails) {
    console.error(red('[ERROR] No database handler installed !'));
    console.error(red('[ERROR] Use the setup-db script to install one.'));
  }

  initializeDB(): void { }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  run(query: string, params: unknown[] = []): void {
    console.error(red('[ERROR] No database handler installed !'));
    console.error(red(`[ERROR] Unable to run query: ${query}.`));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  get(query: string, params: unknown[] = []): unknown {
    console.error(red('[ERROR] No database handler installed !'));
    console.error(red(`[ERROR] Unable to run get query: ${query}.`));
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  all(query: string, params: unknown[] = []): unknown[] {
    console.error(red('[ERROR] No database handler installed !'));
    console.error(red(`[ERROR] Unable to run all query: ${query}.`));
    return [];
  }

  close(): void {
    console.error(red('[ERROR] No database handler installed !'));
    console.error(red('[ERROR] Unable to close connection.'));
  }
}
