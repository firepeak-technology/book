import {IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, ValidateNested} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {BookCondition, BookType} from '@prisma/client';

class FamilyBookDto {
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
    collectionId?: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsNumber()
    volumeNumber?: number;

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

    @ApiProperty({type: FamilyBookDto, required: false})
    @IsOptional()
    @ValidateNested()
    @Type(() => FamilyBookDto)
    familyBook?: FamilyBookDto;
}
