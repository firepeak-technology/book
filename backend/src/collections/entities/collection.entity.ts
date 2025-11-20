import {ApiProperty} from '@nestjs/swagger';

export class CollectionEntity {
    @ApiProperty({
        description: 'Collection ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'Collection name',
        example: 'Harry Potter Series',
    })
    name: string;

    @ApiProperty({
        description: 'Collection description',
        example: 'The complete Harry Potter book series',
    })
    description?: string;

    @ApiProperty({
        description: 'Number of books in collection',
        example: 7,
    })
    bookCount: number;

    @ApiProperty({
        description: 'Creation timestamp',
    })
    createdAt: Date;
}
