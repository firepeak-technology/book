import {ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {CreateCollectionDto} from './dto/create-collection.dto';
import {UpdateCollectionDto} from './dto/update-collection.dto';
import {AddBookToCollectionDto} from './dto/add-book-to-collection.dto';

@Injectable()
export class CollectionsService {
    constructor(private prisma: PrismaService) {
    }

    async create(userId: string, createCollectionDto: CreateCollectionDto) {
        // Verify user exists
        await this.prisma.user.findUniqueOrThrow({
            where: {id: userId},
        });

        return this.prisma.collection.create({
            data: createCollectionDto,
            include: {
                _count: {
                    select: {books: true},
                },
            },
        });
    }

    async findAll(userId: string) {
        // Get user's family to show family collections
        const user = await this.prisma.user.findUnique({
            where: {id: userId},
            select: {familyId: true},
        });

        // Get collections that have books owned by user's family or user
        const collections = await this.prisma.collection.findMany({
            include: {
                _count: {
                    select: {books: true},
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        return collections.map((collection) => ({
            id: collection.id,
            name: collection.name,
            description: collection.description,
            createdAt: collection.createdAt,
            bookCount: collection._count.books,
        }));
    }

    async findOne(id: string) {
        const collection = await this.prisma.collection.findUnique({
            where: {id},
            include: {
                _count: {
                    select: {books: true},
                },
            },
        });

        if (!collection) {
            throw new NotFoundException(`Collection with ID "${id}" not found`);
        }

        return {
            id: collection.id,
            name: collection.name,
            description: collection.description,
            createdAt: collection.createdAt,
            bookCount: collection._count.books,
        };
    }

    async update(id: string, updateCollectionDto: UpdateCollectionDto) {
        // Verify collection exists
        await this.findOne(id);

        return this.prisma.collection.update({
            where: {id},
            data: updateCollectionDto,
            include: {
                _count: {
                    select: {books: true},
                },
            },
        });
    }

    async remove(id: string) {
        // Verify collection exists
        await this.findOne(id);

        // Delete all book associations first
        await this.prisma.bookCollection.deleteMany({
            where: {collectionId: id},
        });

        // Delete the collection
        return this.prisma.collection.delete({
            where: {id},
        });
    }

    async addBookToCollection(
        collectionId: string,
        addBookDto: AddBookToCollectionDto,
    ) {
        // Verify collection exists
        await this.findOne(collectionId);

        // Verify book exists
        const book = await this.prisma.book.findUnique({
            where: {id: addBookDto.bookId},
        });

        if (!book) {
            throw new NotFoundException(`Book with ID "${addBookDto.bookId}" not found`);
        }

        // Check if book is already in collection
        const existing = await this.prisma.bookCollection.findUnique({
            where: {
                bookId_collectionId: {
                    bookId: addBookDto.bookId,
                    collectionId,
                },
            },
        });

        if (existing) {
            throw new ConflictException(
                `Book "${book.title}" is already in this collection`,
            );
        }

        // Add book to collection
        await this.prisma.bookCollection.create({
            data: {
                bookId: addBookDto.bookId,
                collectionId,
                volumeNumber: addBookDto.volumeNumber,
            },
        });

        return this.findOne(collectionId);
    }

    async removeBookFromCollection(collectionId: string, bookId: string) {
        // Verify collection exists
        await this.findOne(collectionId);

        // Verify book is in collection
        const bookCollection = await this.prisma.bookCollection.findUnique({
            where: {
                bookId_collectionId: {
                    bookId,
                    collectionId,
                },
            },
        });

        if (!bookCollection) {
            throw new NotFoundException(
                `Book not found in this collection`,
            );
        }

        await this.prisma.bookCollection.delete({
            where: {
                bookId_collectionId: {
                    bookId,
                    collectionId,
                },
            },
        });

        return {message: 'Book removed from collection'};
    }

    async updateBookVolumeNumber(
        collectionId: string,
        bookId: string,
        volumeNumber: number,
    ) {
        // Verify collection exists
        await this.findOne(collectionId);

        // Update volume number
        const updated = await this.prisma.bookCollection.update({
            where: {
                bookId_collectionId: {
                    bookId,
                    collectionId,
                },
            },
            data: {
                volumeNumber,
            },
        });

        if (!updated) {
            throw new NotFoundException(`Book not found in this collection`);
        }

        return this.findOne(collectionId);
    }

    async searchCollections(query: string) {
        return this.prisma.collection.findMany({
            where: {
                OR: [
                    {name: {contains: query, mode: 'insensitive'}},
                    {description: {contains: query, mode: 'insensitive'}},
                ],
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

    async getPopularCollections(limit: number = 10) {
        const collections = await this.prisma.collection.findMany({
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

        return collections.map((collection) => ({
            id: collection.id,
            name: collection.name,
            description: collection.description,
            bookCount: collection._count.books,
        }));
    }

    async getCollectionProgress(collectionId: string, userId: string) {
        const collection = await this.findOne(collectionId);

        // Get books in this collection that user has read
        const readBooks = await this.prisma.userBook.findMany({
            where: {
                userId,
                status: 'FINISHED',
                book: {
                    collections: {
                        some: {
                            collectionId,
                        },
                    },
                },
            },
        });

        return {
            collectionId: collection.id,
            collectionName: collection.name,
            totalBooks: collection.bookCount,
            booksRead: readBooks.length,
            progress: collection.bookCount > 0
                ? Math.round((readBooks.length / collection.bookCount) * 100)
                : 0,
        };
    }
}
