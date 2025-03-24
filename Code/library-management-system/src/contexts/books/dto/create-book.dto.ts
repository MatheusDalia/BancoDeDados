import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBookDto {
  @ApiProperty({ example: '9783161484100', description: 'ISBN of the book' })
  @IsNotEmpty()
  @IsString()
  isbn: string;

  @ApiProperty({ example: 'The Great Book', description: 'Title of the book' })
  @IsNotEmpty()
  @IsString()
  titulo: string;

  @ApiProperty({
    example: 'An amazing journey',
    description: 'Subtitle of the book',
    required: false,
  })
  @IsString()
  subtitulo?: string;

  @ApiProperty({ example: 'Penguin', description: 'Publisher of the book' })
  @IsNotEmpty()
  @IsString()
  editora: string;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Publication date of the book',
  })
  @IsNotEmpty()
  @IsDateString()
  ano_publicacao: string;

  @ApiProperty({ example: 1, description: 'Category ID of the book' })
  @IsNotEmpty()
  @IsNumber()
  categoria_id: number;
}
