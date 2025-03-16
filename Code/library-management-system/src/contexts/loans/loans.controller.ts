import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoansService } from './loans.service';

@ApiTags('loans')
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new loan' })
  @ApiResponse({ status: 201, description: 'Loan created successfully.' })
  async create(@Body() createLoanDto: CreateLoanDto) {
    return await this.loansService.createLoan(createLoanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all loans' })
  @ApiResponse({ status: 200, description: 'List of loans.' })
  async findAll() {
    return await this.loansService.findAllLoans();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a loan by ID' })
  @ApiResponse({ status: 200, description: 'Loan details.' })
  async findOne(@Param('id') id: number) {
    return await this.loansService.findLoanById(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a loan by ID' })
  @ApiResponse({ status: 200, description: 'Loan updated successfully.' })
  async update(@Param('id') id: number, @Body() updateLoanDto: CreateLoanDto) {
    return await this.loansService.updateLoan(+id, updateLoanDto);
  }
}
