// src/infrastructure/repositories/emprestimo.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { Emprestimo, EmprestimoComDetalhes } from '../../domain/models';
import { DATABASE_CONNECTION } from '../database/database.provider';

@Injectable()
export class EmprestimoRepository extends BaseRepository<Emprestimo> {
  constructor(
    @Inject(DATABASE_CONNECTION)
    protected readonly connection: any,
  ) {
    super(connection, 'Emprestimo');
  }

  /**
   * Create a new loan using raw SQL
   */
  async createLoan(
    usuarioId: number,
    exemplarId: string,
    dataDevolucaoPrevista: Date,
    observacoes?: string,
  ): Promise<Emprestimo> {
    return this.transaction(async (conn) => {
      // Check if copy is available
      const checkSql = `
        SELECT *
        FROM Exemplar
        WHERE codigo_tombamento = ?
        AND status = 'DISPONÍVEL'
      `;

      const [copies] = await conn.query(checkSql, [exemplarId]);
      const copiesArray = copies as any[];

      if (copiesArray.length === 0) {
        throw new Error('Exemplar não está disponível para empréstimo');
      }

      // Insert loan record
      const createSql = `
        INSERT INTO Emprestimo (
          usuario_id,
          exemplar_id,
          data_emprestimo,
          data_devolucao_prevista,
          status,
          numero_renovacoes,
          observacoes
        )
        VALUES (?, ?, CURRENT_DATE, ?, 'ATIVO', 0, ?)
      `;

      const [result] = await conn.query(createSql, [
        usuarioId,
        exemplarId,
        dataDevolucaoPrevista,
        observacoes || null,
      ]);

      const loanId = (result as any).insertId;

      // Update copy status
      const updateSql = `
        UPDATE Exemplar
        SET status = 'EMPRESTADO'
        WHERE codigo_tombamento = ?
      `;

      await conn.query(updateSql, [exemplarId]);

      // Get the created loan
      const getSql = `
        SELECT *
        FROM Emprestimo
        WHERE id = ?
      `;

      const [loans] = await conn.query(getSql, [loanId]);
      return (loans as any[])[0] as Emprestimo;
    });
  }

  /**
   * Return a book (complete a loan) using raw SQL
   */
  async returnLoan(id: number): Promise<Emprestimo | null> {
    return this.transaction(async (conn) => {
      // Find the loan
      const findSql = `
        SELECT *
        FROM Emprestimo
        WHERE id = ?
        AND status = 'ATIVO'
        AND data_devolucao_efetiva IS NULL
      `;

      const [loans] = await conn.query(findSql, [id]);
      const loansArray = loans as any[];

      if (loansArray.length === 0) {
        throw new Error('Empréstimo não encontrado ou já finalizado');
      }

      const loan = loansArray[0] as Emprestimo;

      // Update loan status
      const updateLoanSql = `
        UPDATE Emprestimo
        SET data_devolucao_efetiva = CURRENT_DATE,
            status = 'CONCLUIDO'
        WHERE id = ?
      `;

      await conn.query(updateLoanSql, [id]);

      // Update copy status
      const updateCopySql = `
        UPDATE Exemplar
        SET status = 'DISPONÍVEL'
        WHERE codigo_tombamento = ?
      `;

      await conn.query(updateCopySql, [loan.exemplar_id]);

      // Get the updated loan
      const getUpdatedSql = `
        SELECT *
        FROM Emprestimo
        WHERE id = ?
      `;

      const [updatedLoans] = await conn.query(getUpdatedSql, [id]);
      return (updatedLoans as any[])[0] as Emprestimo;
    });
  }

  /**
   * Renew a loan using raw SQL
   */
  async renewLoan(id: number, newDueDate: Date): Promise<Emprestimo | null> {
    return this.transaction(async (conn) => {
      // Find the loan
      const findSql = `
        SELECT *
        FROM Emprestimo
        WHERE id = ?
        AND status = 'ATIVO'
        AND data_devolucao_efetiva IS NULL
      `;

      const [loans] = await conn.query(findSql, [id]);
      const loansArray = loans as any[];

      if (loansArray.length === 0) {
        throw new Error('Empréstimo não encontrado ou já finalizado');
      }

      const loan = loansArray[0] as Emprestimo;

      if (loan.numero_renovacoes >= 3) {
        throw new Error('Número máximo de renovações atingido');
      }

      // Update loan
      const updateSql = `
        UPDATE Emprestimo
        SET data_devolucao_prevista = ?,
            numero_renovacoes = numero_renovacoes + 1
        WHERE id = ?
      `;

      await conn.query(updateSql, [newDueDate, id]);

      // Get the updated loan
      const getUpdatedSql = `
        SELECT *
        FROM Emprestimo
        WHERE id = ?
      `;

      const [updatedLoans] = await conn.query(getUpdatedSql, [id]);
      return (updatedLoans as any[])[0] as Emprestimo;
    });
  }

  /**
   * Find active loans by user using raw SQL
   */
  async findActiveByUser(usuarioId: number): Promise<EmprestimoComDetalhes[]> {
    const sql = `
      SELECT
        e.*,
        l.titulo,
        CASE
          WHEN e.data_devolucao_efetiva IS NOT NULL THEN 'DEVOLVIDO'
          WHEN CURRENT_DATE > e.data_devolucao_prevista THEN 'ATRASADO'
          ELSE 'REGULAR'
        END as situacao
      FROM Emprestimo e
      JOIN Exemplar ex ON e.exemplar_id = ex.codigo_tombamento
      JOIN Livro l ON ex.isbn = l.isbn
      WHERE e.usuario_id = ?
      AND e.status = 'ATIVO'
      ORDER BY e.data_emprestimo DESC
    `;

    const [loans] = await this.connection.query(sql, [usuarioId]);
    return loans as EmprestimoComDetalhes[];
  }

  /**
   * Adapt SQLite date functions for findOverdue
   */
  async findOverdue(): Promise<any[]> {
    const sql = `
      SELECT
        u.nome,
        u.email,
        l.titulo,
        e.data_devolucao_prevista,
        julianday('now') - julianday(e.data_devolucao_prevista) as dias_atraso
      FROM Emprestimo e
      JOIN Usuario u ON e.usuario_id = u.id
      JOIN Exemplar ex ON e.exemplar_id = ex.codigo_tombamento
      JOIN Livro l ON ex.isbn = l.isbn
      WHERE e.data_devolucao_efetiva IS NULL
      AND e.data_devolucao_prevista < date('now')
      ORDER BY dias_atraso DESC
    `;

    const [loans] = await this.connection.query(sql);
    return loans as any[];
  }

  /**
   * Find a loan with all details using raw SQL
   */
  async findByIdWithDetails(id: number): Promise<EmprestimoComDetalhes | null> {
    const sql = `
      SELECT
        e.*,
        u.nome as nome_usuario,
        u.email,
        ex.codigo_tombamento,
        ex.localizacao,
        l.titulo as titulo_livro,
        l.isbn
      FROM Emprestimo e
      JOIN Usuario u ON e.usuario_id = u.id
      JOIN Exemplar ex ON e.exemplar_id = ex.codigo_tombamento
      JOIN Livro l ON ex.isbn = l.isbn
      WHERE e.id = ?
    `;

    const [loans] = await this.connection.query(sql, [id]);
    const loansArray = loans as any[];

    return loansArray.length > 0
      ? (loansArray[0] as EmprestimoComDetalhes)
      : null;
  }
}
