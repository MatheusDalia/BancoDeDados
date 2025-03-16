import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EmprestimoRepository } from './emprestimo.repository';
import { LivroRepository } from './livro.repository';
import { UsuarioRepository } from './usuario.repository';

@Module({
  imports: [DatabaseModule],
  providers: [LivroRepository, UsuarioRepository, EmprestimoRepository],
  exports: [LivroRepository, UsuarioRepository, EmprestimoRepository],
})
export class RepositoriesModule {}
