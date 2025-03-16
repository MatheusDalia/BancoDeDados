// src/infrastructure/repositories/livro.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { Livro, LivroComDetalhes } from '../../domain/models';
import { DATABASE_CONNECTION } from '../database/database.provider';

@Injectable()
export class LivroRepository extends BaseRepository<Livro> {
  constructor(
    @Inject(DATABASE_CONNECTION)
    protected readonly connection: any,
  ) {
    super(connection, 'Livro', 'isbn');
  }

  /**
   * Find a book by ISBN
   */
  async findByIsbn(isbn: string): Promise<Livro | null> {
    return this.findById(isbn);
  }

  /**
   * Find a book with all its details using raw SQL
   */
  async findByIsbnWithDetails(isbn: string): Promise<LivroComDetalhes | null> {
    const sql = `
      SELECT
        l.*,
        ld.resumo,
        ld.numero_paginas
      FROM Livro l
      LEFT JOIN Livro_Detalhe ld ON l.isbn = ld.isbn
      WHERE l.isbn = ?
    `;

    const [livros] = await this.connection.query(sql, [isbn]);
    const livrosArray = livros as any[];

    if (livrosArray.length === 0) {
      return null;
    }

    const livro = livrosArray[0] as LivroComDetalhes;

    // Get authors using raw SQL
    const authorsSql = `
      SELECT a.*
      FROM Autor a
      JOIN Livro_Autor la ON a.id = la.autor_id
      WHERE la.isbn = ?
    `;

    const [autores] = await this.connection.query(authorsSql, [isbn]);

    // Get keywords using raw SQL
    const keywordsSql = `
      SELECT p.*
      FROM PalavraChave p
      JOIN Livro_PalavraChave lp ON p.id = lp.palavra_id
      WHERE lp.isbn = ?
    `;

    const [palavrasChave] = await this.connection.query(keywordsSql, [isbn]);

    // Get copies using raw SQL
    const copiesSql = `
      SELECT *
      FROM Exemplar
      WHERE isbn = ?
    `;

    const [exemplares] = await this.connection.query(copiesSql, [isbn]);

    return {
      ...livro,
      autores: autores as any[],
      palavras_chave: palavrasChave as any[],
      exemplares: exemplares as any[],
    };
  }

  /**
   * Find books by category using raw SQL for SQLite
   */
  async findByCategory(categoryId: number): Promise<LivroComDetalhes[]> {
    // First get all subcategory IDs
    const subcategoriesSql = `
      SELECT id
      FROM Categoria
      WHERE parent_id = ?
    `;

    const [subcategories] = await this.connection.query(subcategoriesSql, [
      categoryId,
    ]);
    const subcategoryIds = (subcategories as any[]).map((row) => row.id);

    // Get all books in these categories
    let booksSql = '';
    let params: any[] = [];

    if (subcategoryIds.length > 0) {
      // In SQLite, we need to use individual ? placeholders instead of IN (?)
      const placeholders = subcategoryIds.map(() => '?').join(',');
      booksSql = `
        SELECT l.*, ld.resumo, ld.numero_paginas
        FROM Livro l
        LEFT JOIN Livro_Detalhe ld ON l.isbn = ld.isbn
        WHERE l.categoria_id = ? OR l.categoria_id IN (${placeholders})
      `;
      params = [categoryId, ...subcategoryIds];
    } else {
      booksSql = `
        SELECT l.*, ld.resumo, ld.numero_paginas
        FROM Livro l
        LEFT JOIN Livro_Detalhe ld ON l.isbn = ld.isbn
        WHERE l.categoria_id = ?
      `;
      params = [categoryId];
    }

    const [books] = await this.connection.query(booksSql, params);
    const booksArray = books as any[];

    // For each book, get additional details
    const livrosComDetalhes: LivroComDetalhes[] = [];

    for (const book of booksArray) {
      const livroDetalhado = await this.findByIsbnWithDetails(book.isbn);
      if (livroDetalhado) {
        livrosComDetalhes.push(livroDetalhado);
      }
    }

    return livrosComDetalhes;
  }

  // The rest of the repository implementation remains the same
  // with the transaction method now available from BaseRepository
}
