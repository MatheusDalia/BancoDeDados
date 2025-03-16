import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLoanDto {
  @ApiProperty({ example: 1, description: 'User ID associated with the loan' })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({
    example: 'EX12345',
    description: 'Exemplar identifier of the book copy',
  })
  @IsNotEmpty()
  @IsString()
  exemplarId: string;

  @ApiProperty({
    example: '2025-04-01',
    description: 'Due date for returning the book',
  })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @ApiProperty({
    example: 'Handle with care',
    description: 'Additional remarks',
    required: false,
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
