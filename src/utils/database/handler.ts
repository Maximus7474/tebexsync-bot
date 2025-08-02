import Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { DBConnectionDetails } from '../../types';

import Logger from '../logger';
const logger = new Logger('SQLiteHandler');

/*
    Better SQLITE 3 is a syncronous module, to follow the same structure for
    the database handler class we're using Promises to "fake" the asyncronous
    behaviour to allow for better switching capability of handlers.
*/
export default class SQLiteHandler {
  private db: Database.Database;

  constructor({ SQLITE_PATH }: DBConnectionDetails) {
    if (typeof SQLITE_PATH !== 'string') {
      throw new Error(`DB Path for SQLite database is invalid !`);
    }

    this.db = new Database(SQLITE_PATH);
  }

  /**
   * Sets up the database by running the base.sql file to
   * run all queries listed in it
   * @returns {Promise<void>}
   */
  async initializeDB(): Promise<void> {
    const scriptPath = path.join(import.meta.dirname, 'base-sqlite.sql');
    let sqlScript: string;

    if (existsSync(scriptPath)) {
      sqlScript = readFileSync(scriptPath, 'utf8');
    } else {
      logger.warn(`SQLite base script not found at ${scriptPath}. Skipping database initialization.`);
      return Promise.reject(new Error(`SQLite base script not found at ${scriptPath}`));
    }

    try {
      this.db.exec(sqlScript);
      return Promise.resolve();
    } catch (error) {
      logger.error(`Error initializing database: ${error}`);
      return Promise.reject(error);
    }
  }

  /**
   * Executes a SQL query that does not return any result (e.g., INSERT, UPDATE, DELETE).
   *
   * @param query - The SQL query string to be executed.
   * @param params - An optional array of parameters to bind to the query placeholders.
   *                 Defaults to an empty array if not provided.
   *
   * @throws {Error} If the query execution fails.
   * @returns {Promise<void>}
   */
  async execute(query: string, params: unknown[] = []): Promise<void> {
    try {
      const stmt = this.db.prepare(query);
      stmt.run(...params);
      return Promise.resolve();
    } catch (error) {
      logger.error(`Error running query "${query}": ${error}`);
      return Promise.reject(error);
    }
  }

  /**
   * Performs an INSERT operation and returns the ID of the newly inserted row.
   * This relies on SQLite's `last_insert_rowid()` or `AUTOINCREMENT` behavior.
   *
   * @param {string} query - The SQL INSERT query string.
   * @param {unknown[]} params - An array of parameters to bind to the query.
   *
   * @returns {Promise<number | null>} A Promise that resolves with the ID of the last inserted row,
   * or the number of affected rows.
   * @throws {Error} If the insert query execution fails.
   */
  async insert(query: string, params: unknown[]): Promise<number | null> {
    try {
      const stmt = this.db.prepare(query);
      const result = stmt.run(...params);

      if (result.lastInsertRowid !== undefined && result.lastInsertRowid !== null) {
        return Promise.resolve(Number(result.lastInsertRowid));
      } else {
        logger.warn(`Insert query "${query}" did not return a last inserted ID.`);
        return Promise.resolve(result.changes);
      }
    } catch (err) {
      logger.error(`Error inserting data with query "${query}":`, err);
      return Promise.reject(err);
    }
  }

  /**
   * Executes an UPDATE SQL query and returns the number of rows affected.
   *
   * @param {string} query - The SQL UPDATE query string.
   * @param {unknown[]} params - An array of parameters to bind to the query.
   * @returns {Promise<number>} A Promise that resolves with the number of rows affected by the update.
   * @throws {Error} If the update query execution fails.
   */
  async update(query: string, params: unknown[]): Promise<number> {
    try {
      const stmt = this.db.prepare(query);
      const result = stmt.run(...params);

      return Promise.resolve(result.changes);
    } catch (err) {
      logger.error(`Error updating data with query "${query}":`, err);
      return Promise.reject(err);
    }
  }

  /**
   * Executes a SQL query to retrieve a single row from the database.
   *
   * @template T The expected type of the returned data by the query.
   * @param query - The SQL query string to be executed.
   * @param params - An optional array of parameters to bind to the query.
   *
   * @throws {Error} If the query execution fails.
   * @returns The first row of the result set as an object, or `undefined` if no rows are found.
   */
  async get<T>(query: string, params: unknown[] = []): Promise<T | undefined> {
    try {
      const stmt = this.db.prepare(query);
      return Promise.resolve(stmt.get(...params) as T | undefined);
    } catch (error) {
      logger.error(`Error getting data with query "${query}": ${error}`);
      return Promise.reject(error);
    }
  }

  /**
   * Executes a SQL query and retrieves all matching rows from the database.
   *
   * @template T The expected type of the returned data by the query.
   * @param query - The SQL query string to execute.
   * @param params - An optional array of parameters to bind to the query. Defaults to an empty array.
   *
   * @throws {Error} If the query execution fails.
   * @returns An array of objects representing the rows returned by the query.
   */
  async all<T>(query: string, params: unknown[] = []): Promise<T[]> {
    try {
      const stmt = this.db.prepare(query);
      return Promise.resolve(stmt.all(...params) as T[]);
    } catch (error) {
      logger.error(`Error getting all data with query "${query}": ${error}`);
      return Promise.reject(error);
    }
  }

  /**
   * Closes the connection to the database
   *
   * @throws {Error} If the query execution fails.
   * @returns
   */
  async close(): Promise<void> {
    try {
      this.db.close();
      return Promise.resolve();
    } catch (error) {
      logger.error(`Error closing database: ${error}`);
      return Promise.reject(error);
    }
  }
}
