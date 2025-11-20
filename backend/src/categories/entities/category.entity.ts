import {ApiProperty} from '@nestjs/swagger';

export class CategoryEntity {
    @ApiProperty({
        description: 'Category ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'Category name',
        example: 'Science Fiction',
    })
    name: string;

    @ApiProperty({
        description: 'Number of books in this category',
        example: 42,
    })
    bookCount: number;

    @ApiProperty({
        description: 'Creation timestamp',
    })
    createdAt: Date;
}
