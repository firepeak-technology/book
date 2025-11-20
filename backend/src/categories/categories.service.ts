import {ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {CreateCategoryDto} from './dto/create-category.dto';
import {UpdateCategoryDto} from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) {
    }

    async create(createCategoryDto: CreateCategoryDto) {
        // Check if category already exists
        const existing = await this.prisma.category.findUnique({
            where: {name: createCategoryDto.name},
        });

        if (existing) {
            throw new ConflictException(
                `Category "${createCategoryDto.name}" already exists`,
            );
        }

        return this.prisma.category.create({
            data: createCategoryDto,
            include: {
                _count: {
                    select: {books: true},
                },
            },
        });
    }

    async findAll() {
        const categories = await this.prisma.category.findMany({
            include: {
                _count: {
                    select: {books: true},
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        return categories.map((category) => ({
            id: category.id,
            name: category.name,
            createdAt: category.createdAt,
            bookCount: category._count.books,
        }));
    }

    async findOne(id: string) {
        const category = await this.prisma.category.findUnique({
            where: {id},
            include: {
                books: {
                    include: {
                        book: {
                            include: {
                                authors: {
                                    include: {
                                        author: true,
                                    },
                                },
                            },
                        },
                    },
                },
                _count: {
                    select: {books: true},
                },
            },
        });

        if (!category) {
            throw new NotFoundException(`Category with ID "${id}" not found`);
        }

        return {
            id: category.id,
            name: category.name,
            createdAt: category.createdAt,
            bookCount: category._count.books,
            books: category.books.map((bc) => bc.book),
        };
    }

    async findByName(name: string) {
        return this.prisma.category.findUnique({
            where: {name},
            include: {
                _count: {
                    select: {books: true},
                },
            },
        });
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto) {
        // Check if category exists
        await this.findOne(id);

        // If updating name, check for conflicts
        if (updateCategoryDto.name) {
            const existing = await this.prisma.category.findUnique({
                where: {name: updateCategoryDto.name},
            });

            if (existing && existing.id !== id) {
                throw new ConflictException(
                    `Category "${updateCategoryDto.name}" already exists`,
                );
            }
        }

        return this.prisma.category.update({
            where: {id},
            data: updateCategoryDto,
            include: {
                _count: {
                    select: {books: true},
                },
            },
        });
    }

    async remove(id: string) {
        // Check if category exists
        const category = await this.findOne(id);

        if (category.bookCount > 0) {
            throw new ConflictException(
                `Cannot delete category "${category.name}" because it has ${category.bookCount} book(s) associated with it`,
            );
        }

        return this.prisma.category.delete({
            where: {id},
        });
    }

    async getPopularCategories(limit: number = 10) {
        const categories = await this.prisma.category.findMany({
            include: {
                _count: {
                    select: {books: true},
                },
            },
            orderBy: {
                books: {
                    _count: 'desc',
                },
            },
            take: limit,
        });

        return categories.map((category) => ({
            id: category.id,
            name: category.name,
            bookCount: category._count.books,
        }));
    }

    async searchCategories(query: string) {
        return this.prisma.category.findMany({
            where: {
                name: {
                    contains: query,
                    mode: 'insensitive',
                },
            },
            include: {
                _count: {
                    select: {books: true},
                },
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async mergeCategoriesIntoBooksService(bookId: string, categoryNames: string[]) {
        // Helper method to be used by BooksService
        const categoryIds: string[] = [];

        for (const categoryName of categoryNames) {
            let category = await this.findByName(categoryName);

            if (!category) {
                category = await this.create({name: categoryName});
            }

            categoryIds.push(category.id);
        }

        return categoryIds;
    }
}
