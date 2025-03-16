import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { EmprestimoRepository } from '../../infrastructure/repositories/emprestimo.repository';

@Injectable()
export class LoansService {
  constructor(private readonly emprestimoRepository: EmprestimoRepository) {}

  async createLoan(createLoanDto: CreateLoanDto) {
    const { userId, exemplarId, dueDate, remarks } = createLoanDto;
    return await this.emprestimoRepository.createLoan(
      userId,
      exemplarId,
      new Date(dueDate),
      remarks,
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
