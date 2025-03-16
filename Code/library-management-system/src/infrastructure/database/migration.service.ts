import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { DATABASE_CONNECTION } from './database.provider';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly connection: any,
  ) {}

  async onModuleInit() {
    // Auto-run migrations on application start if not in production
    if (process.env.NODE_ENV !== 'production') {
      await this.runMigrations();
    }
  }

  async runMigrations() {
    try {
      this.logger.log('Running database migrations...');

      // Create migrations table if it doesn't exist
      await this.connection.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Get all applied migrations
      const [rows] = await this.connection.query(
        'SELECT name FROM migrations ORDER BY id',
      );
      const appliedMigrations = new Set((rows as any[]).map((row) => row.name));

      // Use the migrations folder in the project root
      const migrationsDir = path.join(process.cwd(), 'migrations');
      if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
        this.logger.log('Created migrations directory');
        return;
      }

      // Process all files ending in ".sql" (covers both ".sqlite.sql" and ".sql")
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((filename) => filename.endsWith('.sql'))
        .sort((a, b) => {
          const numA = parseInt(a.split('_')[0]);
          const numB = parseInt(b.split('_')[0]);
          return numA - numB;
        });

      let appliedCount = 0;
      for (const file of migrationFiles) {
        if (!appliedMigrations.has(file)) {
          this.logger.log(`Applying migration: ${file}`);
          const filePath = path.join(migrationsDir, file);
          const sql = fs.readFileSync(filePath, 'utf8');
          const statements = sql
            .split(';')
            .map((stmt) => stmt.trim())
            .filter((stmt) => stmt.length > 0);
          const connection = await this.connection.getConnection();
          await connection.beginTransaction();
          try {
            for (const statement of statements) {
              await connection.query(statement);
            }
            // Record migration as applied
            await connection.query('INSERT INTO migrations (name) VALUES (?)', [
              file,
            ]);
            await connection.commit();
            appliedCount++;
          } catch (error) {
            await connection.rollback();
            this.logger.error(
              `Failed to apply migration ${file}: ${error.message}`,
              error.stack,
            );
            throw error;
          } finally {
            connection.release();
          }
        }
      }

      if (appliedCount > 0) {
        this.logger.log(`Applied ${appliedCount} migrations`);
      } else {
        this.logger.log('No pending migrations');
      }
    } catch (error) {
      this.logger.error(`Migration failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
