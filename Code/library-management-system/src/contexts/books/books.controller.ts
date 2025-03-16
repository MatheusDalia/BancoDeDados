import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateBookDto } from './dto/create-book.dto';
import { BooksService } from './books.service';

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new book' })
  @ApiResponse({ status: 201, description: 'Book created successfully.' })
  async create(@Body() createBookDto: CreateBookDto) {
    return await this.booksService.createBook(createBookDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all books' })
  @ApiResponse({ status: 200, description: 'List of books.' })
  async findAll() {
    return await this.booksService.findAllBooks();
  }

  @Get(':isbn')
  @ApiOperation({ summary: 'Retrieve a book by ISBN' })
  @ApiResponse({ status: 200, description: 'Book details.' })
  async findOne(@Param('isbn') isbn: string) {
    return await this.booksService.findBookByIsbn(isbn);
  }

  @Put(':isbn')
  @ApiOperation({ summary: 'Update a book by ISBN' })
  @ApiResponse({ status: 200, description: 'Book updated successfully.' })
  async update(
    @Param('isbn') isbn: string,
    @Body() updateBookDto: CreateBookDto,
  ) {
    return await this.booksService.updateBook(isbn, updateBookDto);
  }

  @Delete(':isbn')
  @ApiOperation({ summary: 'Delete a book by ISBN' })
  @ApiResponse({ status: 200, description: 'Book deleted successfully.' })
  async remove(@Param('isbn') isbn: string) {
    return await this.booksService.deleteBook(isbn);
  }
}
