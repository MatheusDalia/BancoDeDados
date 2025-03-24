import { Injectable, NotFoundException } from '@nestjs/common';
import { EmprestimoRepository } from '../../infrastructure/repositories/emprestimo.repository';
import { CreateLoanDto } from './dto/create-loan.dto';

@Injectable()
export class LoansService {
  constructor(private readonly emprestimoRepository: EmprestimoRepository) {}

  async createLoan(createLoanDto: CreateLoanDto) {
    const { usuario_id, exemplar_id, data_devolucao_prevista, observacoes } =
      createLoanDto;
    return await this.emprestimoRepository.createLoan(
      usuario_id,
      exemplar_id,
      new Date(data_devolucao_prevista),
      observacoes,
    );
  }

  async findAllLoans() {
    return await this.emprestimoRepository.findAll();
  }

  async findLoanById(id: number) {
    const loan = await this.emprestimoRepository.findById(id);
    if (!loan) {
      throw new NotFoundException(`Loan with ID ${id} not found`);
    }
    return loan;
  }

  async updateLoan(id: number, updateLoanDto: Partial<CreateLoanDto>) {
    const updated = await this.emprestimoRepository.update(id, updateLoanDto);
    if (!updated) {
      throw new NotFoundException(`Loan with ID ${id} not found`);
    }
    return updated;
  }
}
