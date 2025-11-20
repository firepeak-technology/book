import {Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {CollectionsService} from './collections.service';
import {CreateCollectionDto} from './dto/create-collection.dto';
import {UpdateCollectionDto} from './dto/update-collection.dto';
import {AddBookToCollectionDto} from './dto/add-book-to-collection.dto';
import {CurrentUser} from '../auth/decorators/current-user.decorator';

@ApiTags('collections')
@Controller('collections')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CollectionsController {
    constructor(private readonly collectionsService: CollectionsService) {
    }

    @Post()
    @ApiOperation({summary: 'Create a new collection (series)'})
    @ApiResponse({status: 201, description: 'Collection created successfully'})
    create(@CurrentUser() user, @Body() createCollectionDto: CreateCollectionDto) {
        return this.collectionsService.create(user.id, createCollectionDto);
    }

    @Get()
    @ApiOperation({summary: 'Get all collections'})
    @ApiResponse({status: 200, description: 'Returns all collections'})
    findAll(@CurrentUser() user) {
        return this.collectionsService.findAll(user.id);
    }

    @Get('popular')
    @ApiOperation({summary: 'Get popular collections by book count'})
    @ApiQuery({name: 'limit', required: false, type: Number})
    @ApiResponse({status: 200, description: 'Returns most popular collections'})
    getPopular(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.collectionsService.getPopularCollections(limitNum);
    }

    @Get('search')
    @ApiOperation({summary: 'Search collections by name or description'})
    @ApiQuery({name: 'q', required: true, type: String})
    @ApiResponse({status: 200, description: 'Returns matching collections'})
    search(@Query('q') query: string) {
        return this.collectionsService.searchCollections(query);
    }

    @Get(':id')
    @ApiOperation({summary: 'Get a collection by ID with all books'})
    @ApiResponse({status: 200, description: 'Returns collection details'})
    @ApiResponse({status: 404, description: 'Collection not found'})
    findOne(@Param('id') id: string) {
        return this.collectionsService.findOne(id);
    }

    @Get(':id/progress')
    @ApiOperation({summary: 'Get reading progress for a collection'})
    @ApiResponse({status: 200, description: 'Returns collection progress'})
    getProgress(@CurrentUser() user, @Param('id') id: string) {
        return this.collectionsService.getCollectionProgress(id, user.id);
    }

    @Patch(':id')
    @ApiOperation({summary: 'Update a collection'})
    @ApiResponse({status: 200, description: 'Collection updated successfully'})
    @ApiResponse({status: 404, description: 'Collection not found'})
    update(@Param('id') id: string, @Body() updateCollectionDto: UpdateCollectionDto) {
        return this.collectionsService.update(id, updateCollectionDto);
    }

    @Delete(':id')
    @ApiOperation({summary: 'Delete a collection'})
    @ApiResponse({status: 200, description: 'Collection deleted successfully'})
    @ApiResponse({status: 404, description: 'Collection not found'})
    remove(@Param('id') id: string) {
        return this.collectionsService.remove(id);
    }

    @Post(':id/books')
    @ApiOperation({summary: 'Add a book to a collection'})
    @ApiResponse({status: 201, description: 'Book added to collection'})
    @ApiResponse({status: 404, description: 'Collection or book not found'})
    @ApiResponse({status: 409, description: 'Book already in collection'})
    addBook(
        @Param('id') collectionId: string,
        @Body() addBookDto: AddBookToCollectionDto,
    ) {
        return this.collectionsService.addBookToCollection(collectionId, addBookDto);
    }

    @Delete(':id/books/:bookId')
    @ApiOperation({summary: 'Remove a book from a collection'})
    @ApiResponse({status: 200, description: 'Book removed from collection'})
    @ApiResponse({status: 404, description: 'Collection or book not found'})
    removeBook(
        @Param('id') collectionId: string,
        @Param('bookId') bookId: string,
    ) {
        return this.collectionsService.removeBookFromCollection(collectionId, bookId);
    }

    @Patch(':id/books/:bookId/volume')
    @ApiOperation({summary: 'Update book volume number in collection'})
    @ApiResponse({status: 200, description: 'Volume number updated'})
    updateVolumeNumber(
        @Param('id') collectionId: string,
        @Param('bookId') bookId: string,
        @Body('volumeNumber') volumeNumber: number,
    ) {
        return this.collectionsService.updateBookVolumeNumber(
            collectionId,
            bookId,
            volumeNumber,
        );
    }
}
