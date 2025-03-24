import { Injectable, NotFoundException } from '@nestjs/common';
import { LivroRepository } from '../../infrastructure/repositories/livro.repository';
import { CreateBookDto } from './dto/create-book.dto';

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

  async findExemplarsByIsbn(isbn: string) {
    // First check if the book exists
    const book = await this.livroRepository.findByIsbn(isbn);
    if (!book) {
      throw new NotFoundException(`Book with ISBN ${isbn} not found`);
    }

    // Then get all exemplars for this book
    const bookWithDetails =
      await this.livroRepository.findByIsbnWithDetails(isbn);
    if (!bookWithDetails || !bookWithDetails.exemplares) {
      return [];
    }

    return bookWithDetails.exemplares;
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
