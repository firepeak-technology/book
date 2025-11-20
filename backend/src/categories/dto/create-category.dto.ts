import {IsNotEmpty, IsString, MaxLength, MinLength} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';

export class CreateCategoryDto {
    @ApiProperty({
        description: 'Category name',
        example: 'Science Fiction',
        minLength: 2,
        maxLength: 50,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(2, {message: 'Category name must be at least 2 characters long'})
    @MaxLength(50, {message: 'Category name must not exceed 50 characters'})
    name: string;
}
