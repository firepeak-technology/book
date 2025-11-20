import {IsEnum, IsInt, IsOptional, IsString, Max, Min} from 'class-validator';
import {Type} from 'class-transformer';
import {ApiPropertyOptional} from '@nestjs/swagger';

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export enum SortBy {
    TITLE = 'title',
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
    PUBLISHED_DATE = 'publishedDate',
    PAGE_COUNT = 'pageCount',
}

export class QueryBooksDto {
    @ApiPropertyOptional({
        description: 'Page number (starts from 1)',
        minimum: 1,
        default: 1,
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        minimum: 1,
        maximum: 100,
        default: 10,
        example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Search query (searches title, subtitle, authors, ISBN)',
        example: 'harry potter',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter by book type',
        enum: ['BOOK', 'COMIC', 'MANGA', 'GRAPHIC_NOVEL', 'MAGAZINE', 'AUDIOBOOK'],
        example: 'BOOK',
    })
    @IsOptional()
    @IsString()
    type?: string;

    @ApiPropertyOptional({
        description: 'Filter by category ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional({
        description: 'Filter by collection ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsString()
    collectionId?: string;

    @ApiPropertyOptional({
        description: 'Filter by category name',
        example: 'Science Fiction',
    })
    @IsOptional()
    @IsString()
    categoryName?: string;

    @ApiPropertyOptional({
        description: 'Filter by author name',
        example: 'J.K. Rowling',
    })
    @IsOptional()
    @IsString()
    author?: string;

    @ApiPropertyOptional({
        description: 'Filter by ISBN (partial match)',
        example: '978',
    })
    @IsOptional()
    @IsString()
    isbn?: string;

    @ApiPropertyOptional({
        description: 'Filter by publisher',
        example: 'Penguin Books',
    })
    @IsOptional()
    @IsString()
    publisher?: string;

    @ApiPropertyOptional({
        description: 'Sort by field',
        enum: SortBy,
        default: SortBy.CREATED_AT,
        example: 'title',
    })
    @IsOptional()
    @IsEnum(SortBy)
    sortBy?: SortBy = SortBy.CREATED_AT;

    @ApiPropertyOptional({
        description: 'Sort order',
        enum: SortOrder,
        default: SortOrder.DESC,
        example: 'asc',
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;

    @ApiPropertyOptional({
        description: 'Filter by language code',
        example: 'en',
    })
    @IsOptional()
    @IsString()
    language?: string;

    @ApiPropertyOptional({
        description: 'Minimum page count',
        example: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    minPages?: number;

    @ApiPropertyOptional({
        description: 'Maximum page count',
        example: 500,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    maxPages?: number;

    @ApiPropertyOptional({
        description: 'Published after year',
        example: 2000,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1000)
    @Max(9999)
    publishedAfter?: number;

    @ApiPropertyOptional({
        description: 'Published before year',
        example: 2023,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1000)
    @Max(9999)
    publishedBefore?: number;
}
