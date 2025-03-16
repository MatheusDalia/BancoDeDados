import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateBookDto {
  @ApiProperty({ example: '9783161484100', description: 'ISBN of the book' })
  @IsNotEmpty()
  @IsString()
  isbn: string;

  @ApiProperty({ example: 'The Great Book', description: 'Title of the book' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'An amazing journey',
    description: 'Subtitle of the book',
    required: false,
  })
  @IsString()
  subtitle?: string;

  @ApiProperty({ example: 'Penguin', description: 'Publisher of the book' })
  @IsNotEmpty()
  @IsString()
  publisher: string;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Publication date of the book',
  })
  @IsNotEmpty()
  @IsDateString()
  publicationDate: string;

  @ApiProperty({ example: 1, description: 'Category ID of the book' })
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;
}
