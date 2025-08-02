import { Pool, Client, QueryResult } from 'pg';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { DBConnectionDetails } from '../../types';

import Logger from '../logger';
const logger = new Logger('PostgresHandler');

export default class PostgresHandler {
    private pool: Pool;

    constructor({ SQL_HOST, SQL_USER, SQL_PASSWORD, SQL_DATABASE, SQL_PORT }: DBConnectionDetails) {
        if (
            typeof SQL_HOST !== 'string'
            || typeof SQL_USER !== 'string'
            || typeof SQL_PASSWORD !== 'string'
            || typeof SQL_DATABASE !== 'string'
        ) {
            throw new Error(`Invalid PostgreSQL connection details provided!`);
        }

        this.pool = new Pool({
            host: SQL_HOST,
            user: SQL_USER,
            password: SQL_PASSWORD,
            database: SQL_DATABASE,
            port: SQL_PORT || 5432,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // this.pool.on('error', (err: Error) => {
        //     logger.error(`Unexpected error on client: ${err.message}`, err);
        // });
    }

    /**
     * Sets up the database by running the base.sql file to
     * run all queries listed in it
     * @returns {Promise<void>}
     */
    async initializeDB(): Promise<void> {
        const scriptPath = path.join(import.meta.dirname, 'pgsql-base.sql'); // Store path in a variable
        let sqlScript: string;

        if (existsSync(scriptPath)) {
            sqlScript = readFileSync(scriptPath, 'utf8');
        } else {
            logger.warn(`PostgreSQL base script not found at ${scriptPath}. Skipping database initialization.`);
            return;
        }

        let client: Client | undefined;

        try {
            client = await this.pool.connect();

            const statements = sqlScript.split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (const stmt of statements) {
                if (stmt) {
                    await client.query(stmt);
                }
            }
            logger.info('PostgreSQL database initialized successfully.');
        } catch (error) {
            logger.error('Error initializing PostgreSQL database:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    /**
     * Executes a SQL query that does not return any result (e.g., INSERT, UPDATE, DELETE).
     * PostgreSQL uses $1, $2, etc. for parameterized queries.
     *
     * @param query - The SQL query string to be executed.
     * @param params - An optional array of parameters to bind to the query placeholders.
     * Defaults to an empty array if not provided.
     *
     * @throws {Error} If the query execution fails.
     */
    async execute<T>(query: string, params: unknown[] = []): Promise<QueryResult<T>> {
        let client: Client | undefined;
        try {
            client = await this.pool.connect();
            // pg's query method handles parameter substitution using $1, $2, etc.
            await client.query(query, params);
        } catch (error) {
            logger.error('Error executing PostgreSQL run query:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    /**
     * Performs an INSERT operation and returns the ID of the newly inserted row.
     * The `query` MUST include a `RETURNING id` (or `RETURNING primary_key_column_name`) clause
     * to retrieve the generated ID.
     *
     * @param {string} query - The SQL INSERT query string, e.g., "INSERT INTO users (name) VALUES ($1) RETURNING id".
     * @param {unknown[]} params - An array of parameters to bind to the query.
     * @returns {Promise<number>} A Promise that resolves with the ID of the last inserted row,
     * or the number of changed rows.
     *
     * @throws {Error} If the insert query execution fails.
     */
    async insert(query: string, params: unknown[]): Promise<number> {
        try {
            const result = await this.execute<{ id: number }>(query, params);

            if (result.rows && result.rows.length > 0 && result.rows[0].id !== undefined) {
                return result.rows[0].id;
            } else {
                logger.warn(`Insert query "${query}" did not return an ID.`);
                return result.rows.length;
            }
        } catch (err) {
            logger.error(`Error inserting data with query "${query}":`, err);
            throw err;
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
            const result = await this.execute(query, params);

            return result.rowCount;
        } catch (err) {
            logger.error(`Error updating data with query "${query}":`, err);
            throw err;
        }
    }

    /**
     * Executes a SQL query to retrieve a single row from the database.
     *
     * @param query - The SQL query string to be executed.
     * @param params - An optional array of parameters to bind to the query.
     *
     * @throws {Error} If the query execution fails.
     * @returns The first row of the result set as an object, or `undefined` if no rows are found.
     */
    async get<T = unknown>(query: string, params: unknown[] = []): Promise<T | undefined> {
        let client: Client | undefined;
        try {
            client = await this.pool.connect();
            // pg's query returns a QueryResult object, with rows in result.rows
            const result: QueryResult<T> = await client.query(query, params);
            return (result.rows && result.rows.length > 0) ? result.rows[0] : undefined;
        } catch (error) {
            logger.error('Error executing PostgreSQL get query:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    /**
     * Executes a SQL query and retrieves all matching rows from the database.
     *
     * @param query - The SQL query string to execute.
     * @param params - An optional array of parameters to bind to the query. Defaults to an empty array.
     *
     * @throws {Error} If the query execution fails.
     * @returns An array of objects representing the rows returned by the query.
     */
    async all<T = unknown>(query: string, params: unknown[] = []): Promise<T[]> {
        let client: Client | undefined;
        try {
            client = await this.pool.connect();
            const result: QueryResult<T> = await client.query(query, params);
            return result.rows || []; // Return empty array if no rows
        } catch (error) {
            logger.error('Error executing PostgreSQL all query:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
        logger.info('PostgreSQL connection pool closed.');
    }
}
