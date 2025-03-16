// src/config/database.config.ts
import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import * as path from 'path';

/**
 * Database configuration schema validation using Zod
 */
export const databaseConfigSchema = z.object({
  DB_FILE: z.string().default('library.sqlite'),
  DB_IN_MEMORY: z.coerce.boolean().default(false),
});

export type DatabaseConfigType = z.infer<typeof databaseConfigSchema>;

/**
 * Register database configuration namespace
 */
export default registerAs('database', (): DatabaseConfigType => {
  try {
    // Parse and validate environment variables
    const config = databaseConfigSchema.parse({
      DB_FILE: process.env.DB_FILE,
      DB_IN_MEMORY: process.env.DB_IN_MEMORY,
    });

    // Ensure DB_FILE is an absolute path
    if (!config.DB_IN_MEMORY && !path.isAbsolute(config.DB_FILE)) {
      config.DB_FILE = path.join(process.cwd(), config.DB_FILE);
    }

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Database configuration validation failed:', error.errors);
    }
    throw error;
  }
});
