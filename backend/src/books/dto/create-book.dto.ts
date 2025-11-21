import {IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, ValidateNested} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {BookCondition, BookType} from '@prisma/client';

class UserBookDto {
    @ApiProperty({required: false})
    @IsOptional()
    purchaseDate?: Date;

    @ApiProperty({required: false})
    @IsOptional()
    @IsInt()
    purchasePrice?: number;

    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({enum: BookCondition, required: false})
    @IsOptional()
    @IsEnum(BookCondition)
    condition?: BookCondition;

    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsBoolean()
    own?: boolean;
}

export class CreateBookDto {
    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    isbn?: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    isbn13?: string;

    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    subtitle?: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsInt()
    pageCount?: number;

    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    publishedDate?: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    publisher?: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    language?: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    coverUrl?: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    serieNumber?: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    serieId?: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsString()
    thumbnailUrl?: string;

    @ApiProperty({enum: BookType})
    @IsEnum(BookType)
    type: BookType;

    @ApiProperty({type: [String], required: false})
    @IsOptional()
    @IsArray()
    @IsString({each: true})
    authors?: string[];

    @ApiProperty({type: [String], required: false})
    @IsOptional()
    @IsArray()
    @IsString({each: true})
    categories?: string[];

    @ApiProperty({type: UserBookDto, required: false})
    @IsOptional()
    @ValidateNested()
    @Type(() => UserBookDto)
    userBookDto?: UserBookDto;
}
