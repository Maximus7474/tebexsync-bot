import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';

export default class SQLiteHandler {
  private db: Database.Database;

  constructor(dbPath: string) {
    if (typeof dbPath !== 'string') {
      throw new Error(`DB Path for SQLite database is invalid !`);
    }

    this.db = new Database(dbPath);
  }

  init(): void {
    const sqlScript = readFileSync(path.join(__dirname, 'base.sql'), 'utf8');

    const statements = sqlScript
      .split(/;\s*[\r\n]+/g)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    for (const stmtText of statements) {
      try {
        this.db.prepare(stmtText).run();
      } catch (error) {
        console.error(`Error executing SQL statement: ${stmtText}`);
        console.error((error as Error).message);
        throw error;
      }
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
   */
  run(query: string, params: unknown[] = []): void {
    const stmt = this.db.prepare(query);
    stmt.run(...params);
  }

  /**
   * Executes a SQL query to retrieve a single row from the database.
   *
   * @template T The expected type of the result array.
   * @param query - The SQL query string to be executed.
   * @param params - An optional array of parameters to bind to the query.
   * @returns The first row of the result set as an object, or `undefined` if no rows are found.
   */
  get<T>(query: string, params: unknown[] = []): T | undefined {
    const stmt = this.db.prepare(query);
    return stmt.get(...params) as T;
  }

  /**
   * Executes a SQL query and retrieves all matching rows from the database.
   *
   * @template T The expected type of each row in the result array.
   * @param query - The SQL query string to execute.
   * @param params - An optional array of parameters to bind to the query. Defaults to an empty array.
   * @returns An array of objects representing the rows returned by the query.
   */
  all<T>(query: string, params: unknown[] = []): T[] {
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as T[];
  }

  close(): void {
    this.db.close();
  }
}
