import {Body, Controller, Get, Param, Post, Query, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {BooksService} from './books.service';
import {CreateBookDto} from './dto/create-book.dto';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {PaginatedBooksResponseDto} from "./dto/paginated-books-response.dto";
import {QueryBooksDto} from "./dto/query-books.dto";

@ApiTags('books')
@Controller('books')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BooksController {
    constructor(private readonly booksService: BooksService) {
    }

    @Get('lookup/:isbn')
    @ApiOperation({summary: 'Lookup book by ISBN from external APIs'})
    async lookupByISBN(@Param('isbn') isbn: string) {
        return this.booksService.lookupByISBN(isbn);
    }

    @Get('check/:isbn')
    @ApiOperation({summary: 'Check if book is already owned by family'})
    async checkIfOwned(@CurrentUser() user, @Param('isbn') isbn: string) {
        return this.booksService.checkIfOwned(user.id, isbn);
    }

    @Post()
    @ApiOperation({summary: 'Add book to collection'})
    async create(@CurrentUser() user, @Body() createBookDto: CreateBookDto) {
        return this.booksService.create(user.id, createBookDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Get all books with pagination, search, and filters',
        description: 'Supports search, filtering by category/author/type, and sorting'
    })
    @ApiResponse({
        status: 200,
        description: 'Returns paginated books',
        type: PaginatedBooksResponseDto,
    })
    async findAll(
        @CurrentUser() user,
        @Query() query: QueryBooksDto,
    ): Promise<PaginatedBooksResponseDto> {
        return this.booksService.findAll(user.id, query);
    }

    @Get(':id')
    @ApiOperation({summary: 'Get book details'})
    async findOne(@Param('id') id: string) {
        return this.booksService.findOne(id);
    }
}
