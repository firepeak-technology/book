import {IsInt, IsNotEmpty, IsOptional, IsString, Min} from 'class-validator';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';

export class AddBookToCollectionDto {
    @ApiProperty({
        description: 'Book ID to add to collection',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString()
    @IsNotEmpty()
    bookId: string;

    @ApiProperty({
        description: 'Collection ID to which the book will be added',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString()
    @IsOptional()
    collectionId: string;

    @ApiPropertyOptional({
        description: 'Volume number in the series',
        example: 1,
        minimum: 1,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    volumeNumber?: number;
}
