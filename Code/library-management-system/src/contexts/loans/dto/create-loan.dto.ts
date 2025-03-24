import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLoanDto {
  @ApiProperty({ example: 1, description: 'User ID associated with the loan' })
  @IsNotEmpty()
  @IsNumber()
  usuario_id: number;

  @ApiProperty({
    example: 'EX12345',
    description: 'Exemplar identifier of the book copy',
  })
  @IsNotEmpty()
  @IsString()
  exemplar_id: string;

  @ApiProperty({
    example: '2025-04-01',
    description: 'Due date for returning the book',
  })
  @IsNotEmpty()
  @IsDateString()
  data_devolucao_prevista: string;

  @ApiProperty({
    example: 'Handle with care',
    description: 'Additional remarks',
    required: false,
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
