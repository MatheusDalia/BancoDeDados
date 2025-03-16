import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Database from 'better-sqlite3';
import * as dotenv from 'dotenv';

// Load environment variables
const environment = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${environment}` });

const logger = new Logger('DatabaseCLI');

/**
 * CLI for database operations
 */
async function main() {
  const command = process.argv[2];

  if (!command) {
    logger.error(
      'No command specified. Available commands: migrate, migrate:new, migrate:status',
    );
    process.exit(1);
  }

  try {
    const dbFile = process.env.DB_FILE || 'library.sqlite';
    const dbPath = path.isAbsolute(dbFile)
      ? dbFile
      : path.join(process.cwd(), dbFile);

    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      logger.log(`Creating database directory: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }

    logger.log(`Using database file: ${dbPath}`);
    const db = new Database(dbPath, { verbose: logger.debug.bind(logger) });

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Create migrations table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    switch (command) {
      case 'migrate':
        await runMigrations(db);
        break;
      case 'migrate:new':
        await createNewMigration();
        break;
      case 'migrate:status':
        await getMigrationStatus(db);
        break;
      default:
        logger.error(`Unknown command: ${command}`);
        process.exit(1);
    }

    // Close database connection
    db.close();
  } catch (error) {
    logger.error(`Error: ${error.message}`, error.stack);
    process.exit(1);
  }
}

/**
 * Run pending migrations
 */
async function runMigrations(db: Database.Database) {
  // Get applied migrations
  const appliedMigrations = new Set(
    db
      .prepare('SELECT name FROM migrations ORDER BY id')
      .all()
      .map((row) => row.name),
  );

  // Get all migration files from the migrations folder
  const migrationsDir = path.join(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    logger.log('Created migrations directory');
    return;
  }

  // Process all files ending in ".sql"
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
      logger.log(`Applying migration: ${file}`);

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Split SQL by semicolon to execute multiple statements
      const statements = sql
        .split(';')
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0);

      try {
        db.exec('BEGIN TRANSACTION');

        for (const statement of statements) {
          db.exec(statement);
        }

        // Record migration as applied
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);

        db.exec('COMMIT');
        appliedCount++;
      } catch (error) {
        db.exec('ROLLBACK');
        logger.error(`Failed to apply migration ${file}: ${error.message}`);
        throw error;
      }
    }
  }

  if (appliedCount > 0) {
    logger.log(`Applied ${appliedCount} migrations`);
  } else {
    logger.log('No pending migrations');
  }
}

/**
 * Create a new migration file
 */
async function createNewMigration() {
  const migrationName = process.argv[3];

  if (!migrationName) {
    logger.error('Migration name is required');
    process.exit(1);
  }

  const migrationsDir = path.join(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const filename = `${timestamp}_${migrationName}.sql`;
  const filePath = path.join(migrationsDir, filename);

  const template = `-- Migration: ${migrationName}
-- Created at: ${new Date().toISOString()}

-- Write your SQLite SQL statements here

`;

  fs.writeFileSync(filePath, template);
  logger.log(`Created migration file: ${filename}`);
}

/**
 * Get migration status
 */
async function getMigrationStatus(db: Database.Database) {
  // Get applied migrations
  const appliedMigrations = new Map();

  db.prepare('SELECT name, executed_at FROM migrations ORDER BY id')
    .all()
    .forEach((row) => {
      appliedMigrations.set(row.name, row.executed_at);
    });

  // Get all migration files
  const migrationsDir = path.join(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    logger.log('No migrations directory found');
    return;
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((filename) => filename.endsWith('.sql'))
    .sort();

  logger.log('Migration status:');
  console.log('-'.repeat(80));
  console.log(
    '| Status   | Migration File                                             |',
  );
  console.log('-'.repeat(80));

  for (const file of migrationFiles) {
    const status = appliedMigrations.has(file) ? 'Applied  ' : 'Pending  ';
    const executedAt = appliedMigrations.get(file)
      ? new Date(appliedMigrations.get(file)).toISOString()
      : '';
    console.log(`| ${status} | ${file.padEnd(60)} | ${executedAt}`);
  }

  console.log('-'.repeat(80));
}

// Run the CLI
main();
