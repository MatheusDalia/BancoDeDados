import { ConfigType } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import databaseConfig from '../../config/database.config';

/**
 * Database connection provider
 */
export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

export const databaseProviders = [
  {
    provide: DATABASE_CONNECTION,
    inject: [databaseConfig.KEY],
    useFactory: async (dbConfig: ConfigType<typeof databaseConfig>) => {
      const logger = new Logger('DatabaseProvider');

      try {
        let dbInstance: Database.Database;
        // Force file-based database in non-production environments for persistence
        const useInMemory =
          process.env.NODE_ENV === 'production' ? dbConfig.DB_IN_MEMORY : false;

        if (useInMemory) {
          logger.log('Using in-memory SQLite database');
          dbInstance = new Database(':memory:', {
            verbose: logger.debug.bind(logger),
          });
        } else {
          // Ensure directory exists
          const dbDir = path.dirname(dbConfig.DB_FILE);
          if (!fs.existsSync(dbDir)) {
            logger.log(`Creating database directory: ${dbDir}`);
            fs.mkdirSync(dbDir, { recursive: true });
          }

          logger.log(`Connecting to SQLite database file: ${dbConfig.DB_FILE}`);
          dbInstance = new Database(dbConfig.DB_FILE, {
            verbose: logger.debug.bind(logger),
            fileMustExist: false,
          });
        }

        // Enable foreign keys
        dbInstance.pragma('foreign_keys = ON');

        // Test connection
        const result = dbInstance.prepare('SELECT 1 AS test').get();
        if (result && result.test === 1) {
          logger.log('Successfully connected to SQLite database');
        }

        // Create a wrapper object that exposes a similar API to the mysql2 pool
        // to minimize changes to repository implementations
        return {
          async query(sql: string, params?: any[]) {
            try {
              if (!sql.trim()) {
                return [[], []];
              }
              const safeParams =
                params && params.length > 0 ? params : undefined;

              // Handle multiple statements
              if (sql.includes(';')) {
                const statements = sql
                  .split(';')
                  .map((stmt) => stmt.trim())
                  .filter((stmt) => stmt.length > 0);

                let results = [];
                for (const stmt of statements) {
                  if (stmt.toLowerCase().startsWith('select')) {
                    results.push(
                      safeParams
                        ? dbInstance.prepare(stmt).all(safeParams)
                        : dbInstance.prepare(stmt).all(),
                    );
                  } else {
                    results.push(
                      safeParams
                        ? dbInstance.prepare(stmt).run(safeParams)
                        : dbInstance.prepare(stmt).run(),
                    );
                  }
                }
                return [results, []];
              }

              // Handle single statement
              if (sql.toLowerCase().trim().startsWith('select')) {
                const rows = safeParams
                  ? dbInstance.prepare(sql).all(safeParams)
                  : dbInstance.prepare(sql).all();
                return [rows, []];
              } else {
                const result = safeParams
                  ? dbInstance.prepare(sql).run(safeParams)
                  : dbInstance.prepare(sql).run();
                return [result, []];
              }
            } catch (error) {
              logger.error(
                `Error executing SQL: ${error.message}`,
                error.stack,
              );
              throw error;
            }
          },

          async getConnection() {
            return {
              async beginTransaction() {
                dbInstance.prepare('BEGIN TRANSACTION').run();
              },
              async commit() {
                dbInstance.prepare('COMMIT').run();
              },
              async rollback() {
                dbInstance.prepare('ROLLBACK').run();
              },
              async query(sql: string, params?: any[]) {
                const safeParams =
                  params && params.length > 0 ? params : undefined;
                try {
                  if (sql.toLowerCase().trim().startsWith('select')) {
                    return safeParams
                      ? [dbInstance.prepare(sql).all(safeParams), []]
                      : [dbInstance.prepare(sql).all(), []];
                  } else {
                    return safeParams
                      ? [dbInstance.prepare(sql).run(safeParams), []]
                      : [dbInstance.prepare(sql).run(), []];
                  }
                } catch (error) {
                  logger.error(
                    `Error executing SQL: ${error.message}`,
                    error.stack,
                  );
                  throw error;
                }
              },
              release() {
                // No need to release connections in SQLite.
              },
            };
          },

          // Method to close the database connection
          close() {
            dbInstance.close();
          },
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          `Failed to connect to database: ${errorMessage}`,
          error instanceof Error ? error.stack : undefined,
        );
        throw error;
      }
    },
  },
];
