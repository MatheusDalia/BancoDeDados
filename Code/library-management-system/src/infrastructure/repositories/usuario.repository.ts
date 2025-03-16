// src/infrastructure/repositories/usuario.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { Usuario, UsuarioComDetalhes } from '../../domain/models';
import { DATABASE_CONNECTION } from '../database/database.provider';

@Injectable()
export class UsuarioRepository extends BaseRepository<Usuario> {
  constructor(
    @Inject(DATABASE_CONNECTION)
    protected readonly connection: any,
  ) {
    super(connection, 'Usuario');
  }

  /**
   * Find a user with all details using raw SQL
   */
  async findByIdWithDetails(id: number): Promise<UsuarioComDetalhes | null> {
    const userSql = `
      SELECT u.*, e.logradouro, e.numero, e.cidade
      FROM Usuario u
      LEFT JOIN Endereco e ON u.id = e.usuario_id
      WHERE u.id = ?
    `;

    const [users] = await this.connection.query(userSql, [id]);
    const usersArray = users as any[];

    if (usersArray.length === 0) {
      return null;
    }

    const user = usersArray[0] as UsuarioComDetalhes;

    // Get phone numbers
    const phonesSql = `
      SELECT telefone
      FROM Telefone_Usuario
      WHERE usuario_id = ?
    `;

    const [phones] = await this.connection.query(phonesSql, [id]);
    const phonesArray = phones as any[];

    return {
      ...user,
      telefones: phonesArray,
    };
  }

  /**
   * Create a user with all related details using raw SQL
   */
  async createWithDetails(
    usuario: Omit<Usuario, 'id'>,
    endereco: any,
    telefones: string[],
  ): Promise<UsuarioComDetalhes | null> {
    return this.transaction(async (conn) => {
      // Insert user
      const userKeys = Object.keys(usuario);
      const userPlaceholders = userKeys.map(() => '?').join(', ');
      const userValues = Object.values(usuario);

      const userSql = `
        INSERT INTO Usuario (${userKeys.join(', ')})
        VALUES (${userPlaceholders})
      `;

      const [userResult] = await conn.query(userSql, userValues);
      const userId = (userResult as any).insertId;

      // Insert address
      const addressKeys = Object.keys(endereco);
      const addressPlaceholders = addressKeys.map(() => '?').join(', ');
      const addressValues = Object.values(endereco);

      const addressSql = `
        INSERT INTO Endereco (usuario_id, ${addressKeys.join(', ')})
        VALUES (?, ${addressPlaceholders})
      `;

      await conn.query(addressSql, [userId, ...addressValues]);

      // Insert phone numbers
      if (telefones && telefones.length > 0) {
        const phoneSql = `
          INSERT INTO Telefone_Usuario (usuario_id, telefone)
          VALUES (?, ?)
        `;

        for (const telefone of telefones) {
          await conn.query(phoneSql, [userId, telefone]);
        }
      }

      // Return complete user data
      return this.findByIdWithDetails(userId);
    });
  }

  /**
   * Find a user by email using raw SQL
   */
  async findByEmail(email: string): Promise<Usuario | null> {
    const sql = `
      SELECT *
      FROM Usuario
      WHERE email = ?
      LIMIT 1
    `;

    const [users] = await this.connection.query(sql, [email]);
    const usersArray = users as any[];

    return usersArray.length > 0 ? (usersArray[0] as Usuario) : null;
  }

  /**
   * Get user loan history using raw SQL
   */
  async getLoanHistory(usuarioId: number): Promise<any[]> {
    const sql = `
      SELECT
        e.id,
        l.titulo,
        a.nome as autor,
        e.data_emprestimo,
        e.data_devolucao_prevista,
        e.data_devolucao_efetiva,
        e.numero_renovacoes
      FROM Emprestimo e
      JOIN Exemplar ex ON e.exemplar_id = ex.codigo_tombamento
      JOIN Livro l ON ex.isbn = l.isbn
      LEFT JOIN Livro_Autor la ON l.isbn = la.isbn
      LEFT JOIN Autor a ON la.autor_id = a.id
      WHERE e.usuario_id = ?
      ORDER BY e.data_emprestimo DESC
    `;

    const [loans] = await this.connection.query(sql, [usuarioId]);
    return loans as any[];
  }
}
