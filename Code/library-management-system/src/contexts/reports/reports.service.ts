import { Injectable } from '@nestjs/common';
import { EmprestimoRepository } from '../../infrastructure/repositories/emprestimo.repository';
import { LivroRepository } from '../../infrastructure/repositories/livro.repository';
import { UsuarioRepository } from '../../infrastructure/repositories/usuario.repository';

@Injectable()
export class ReportsService {
  constructor(
    private readonly emprestimoRepository: EmprestimoRepository,
    private readonly livroRepository: LivroRepository,
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async getOverdueLoansReport() {
    return await this.emprestimoRepository.findOverdue();
  }

  async getSummaryReport() {
    const totalBooks = await this.livroRepository.count();
    const totalUsers = await this.usuarioRepository.count();
    const totalLoans = await this.emprestimoRepository.count();
    return { totalBooks, totalUsers, totalLoans };
  }
}
