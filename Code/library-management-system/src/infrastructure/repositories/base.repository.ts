// src/infrastructure/repositories/base.repository.ts
import { Injectable, Logger } from '@nestjs/common';

/**
 * Base repository with common CRUD operations using raw SQL for SQLite
 */
@Injectable()
export abstract class BaseRepository<T> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly connection: any,
    protected readonly tableName: string,
    protected readonly primaryKey: string = 'id',
  ) {}

  /**
   * Find all records
   */
  async findAll(options?: { limit?: number; offset?: number }): Promise<T[]> {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);

      if (options?.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    try {
      const [rows] = await this.connection.query(sql, params);
      return rows as T[];
    } catch (error) {
      this.logger.error(`Error in findAll: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find by ID
   */
  async findById(id: number | string): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ? LIMIT 1`;

    try {
      const [rows] = await this.connection.query(sql, [id]);
      return rows.length > 0 ? (rows[0] as T) : null;
    } catch (error) {
      this.logger.error(`Error in findById: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find by condition
   */
  async findBy(condition: Record<string, any>): Promise<T[]> {
    const keys = Object.keys(condition);
    const params = Object.values(condition);

    if (keys.length === 0) {
      return this.findAll();
    }

    const whereClause = keys.map((key) => `${key} = ?`).join(' AND ');
    const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;

    try {
      const [rows] = await this.connection.query(sql, params);
      return rows as T[];
    } catch (error) {
      this.logger.error(`Error in findBy: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find one by condition
   */
  async findOneBy(condition: Record<string, any>): Promise<T | null> {
    const keys = Object.keys(condition);
    const params = Object.values(condition);

    if (keys.length === 0) {
      throw new Error('At least one condition is required for findOneBy');
    }

    const whereClause = keys.map((key) => `${key} = ?`).join(' AND ');
    const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;

    try {
      const [rows] = await this.connection.query(sql, params);
      return rows.length > 0 ? (rows[0] as T) : null;
    } catch (error) {
      this.logger.error(`Error in findOneBy: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async create(data: Record<string, any>): Promise<T> {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const params = Object.values(data);

    const sql = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
    `;

    try {
      const [result] = await this.connection.query(sql, params);

      // For SQLite, the ID is in lastID instead of insertId
      const id = result.lastID || result.insertId;

      if (id) {
        return this.findById(id) as Promise<T>;
      }

      // For non-auto-increment primary keys
      return data as unknown as T;
    } catch (error) {
      this.logger.error(`Error in create: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a record
   */
  async update(
    id: number | string,
    data: Record<string, any>,
  ): Promise<T | null> {
    const keys = Object.keys(data);

    if (keys.length === 0) {
      return this.findById(id) as Promise<T>;
    }

    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    const params = [...Object.values(data), id];

    const sql = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE ${this.primaryKey} = ?
    `;

    try {
      const [result] = await this.connection.query(sql, params);

      // For SQLite, it's changes instead of affectedRows
      if ((result.changes || 0) === 0) {
        return null;
      }

      return this.findById(id) as Promise<T>;
    } catch (error) {
      this.logger.error(`Error in update: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a record
   */
  async delete(id: number | string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;

    try {
      const [result] = await this.connection.query(sql, [id]);
      return (result.changes || 0) > 0;
    } catch (error) {
      this.logger.error(`Error in delete: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Count records
   */
  async count(condition?: Record<string, any>): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: any[] = [];

    if (condition) {
      const keys = Object.keys(condition);
      if (keys.length > 0) {
        const whereClause = keys.map((key) => `${key} = ?`).join(' AND ');
        sql += ` WHERE ${whereClause}`;
        params.push(...Object.values(condition));
      }
    }

    try {
      const [rows] = await this.connection.query(sql, params);
      return rows[0].count as number;
    } catch (error) {
      this.logger.error(`Error in count: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<R>(callback: (connection: any) => Promise<R>): Promise<R> {
    const conn = await this.connection.getConnection();

    try {
      await conn.beginTransaction();
      const result = await callback(conn);
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      this.logger.error(`Transaction failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      conn.release();
    }
  }
}
