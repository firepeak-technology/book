import {Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {CategoriesService} from './categories.service';
import {CreateCategoryDto} from './dto/create-category.dto';
import {UpdateCategoryDto} from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {
    }

    @Post()
    @ApiOperation({summary: 'Create a new category'})
    @ApiResponse({status: 201, description: 'Category created successfully'})
    @ApiResponse({status: 409, description: 'Category already exists'})
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }

    @Get()
    @ApiOperation({summary: 'Get all categories'})
    @ApiResponse({status: 200, description: 'Returns all categories with book counts'})
    findAll() {
        return this.categoriesService.findAll();
    }

    @Get('popular')
    @ApiOperation({summary: 'Get popular categories by book count'})
    @ApiQuery({name: 'limit', required: false, type: Number})
    @ApiResponse({status: 200, description: 'Returns most popular categories'})
    getPopular(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.categoriesService.getPopularCategories(limitNum);
    }

    @Get('search')
    @ApiOperation({summary: 'Search categories by name'})
    @ApiQuery({name: 'q', required: true, type: String})
    @ApiResponse({status: 200, description: 'Returns matching categories'})
    search(@Query('q') query: string) {
        return this.categoriesService.searchCategories(query);
    }

    @Get(':id')
    @ApiOperation({summary: 'Get a category by ID with its books'})
    @ApiResponse({status: 200, description: 'Returns category details'})
    @ApiResponse({status: 404, description: 'Category not found'})
    findOne(@Param('id') id: string) {
        return this.categoriesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({summary: 'Update a category'})
    @ApiResponse({status: 200, description: 'Category updated successfully'})
    @ApiResponse({status: 404, description: 'Category not found'})
    @ApiResponse({status: 409, description: 'Category name already exists'})
    update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
        return this.categoriesService.update(id, updateCategoryDto);
    }

    @Delete(':id')
    @ApiOperation({summary: 'Delete a category'})
    @ApiResponse({status: 200, description: 'Category deleted successfully'})
    @ApiResponse({status: 404, description: 'Category not found'})
    @ApiResponse({
        status: 409,
        description: 'Cannot delete category with associated books'
    })
    remove(@Param('id') id: string) {
        return this.categoriesService.remove(id);
    }
}
