import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { LivroRepository } from '../../infrastructure/repositories/livro.repository';

@Injectable()
export class BooksService {
  constructor(private readonly livroRepository: LivroRepository) {}

  async createBook(createBookDto: CreateBookDto) {
    return await this.livroRepository.create(createBookDto);
  }

  async findAllBooks() {
    return await this.livroRepository.findAll();
  }

  async findBookByIsbn(isbn: string) {
    const book = await this.livroRepository.findByIsbn(isbn);
    if (!book) {
      throw new NotFoundException(`Book with ISBN ${isbn} not found`);
    }
    return book;
  }

  async updateBook(isbn: string, updateBookDto: Partial<CreateBookDto>) {
    const updated = await this.livroRepository.update(isbn, updateBookDto);
    if (!updated) {
      throw new NotFoundException(`Book with ISBN ${isbn} not found`);
    }
    return updated;
  }

  async deleteBook(isbn: string) {
    const result = await this.livroRepository.delete(isbn);
    if (!result) {
      throw new NotFoundException(`Book with ISBN ${isbn} not found`);
    }
    return { message: 'Book deleted successfully' };
  }
}
