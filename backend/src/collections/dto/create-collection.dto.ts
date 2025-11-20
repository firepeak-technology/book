import {IsNotEmpty, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';

export class CreateCollectionDto {
    @ApiProperty({
        description: 'Collection name',
        example: 'Harry Potter Series',
        minLength: 2,
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({
        description: 'Collection description',
        example: 'The complete Harry Potter book series by J.K. Rowling',
    })
    @IsString()
    @IsOptional()
    description?: string;
}
