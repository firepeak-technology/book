import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {CreateBookDto} from './dto/create-book.dto';
import axios from 'axios';

import {CategoriesService} from '../categories/categories.service';
import {QueryBooksDto} from "./dto/query-books.dto";
import {PaginatedBooksResponseDto} from "./dto/paginated-books-response.dto";
import {CollectionsService} from "../collections/collections.service";

@Injectable()
export class BooksService {
    constructor(private prisma: PrismaService,
                private categoriesService: CategoriesService,
                private collectionService: CollectionsService) {
    }

    async lookupByISBN(isbn: string) {
        // Try in order of preference
        const sources = [
            () => this.lookupGoogleBooks(isbn),
            () => this.lookupOpenLibrary(isbn),
            // () => this.lookupComicVine(isbn), // For comics
        ];

        for (const source of sources) {
            try {
                const result = await source();
                if (result) return result;
            } catch (error) {
                continue; // Try next source
            }
        }

        throw new Error('Book not found in any database');
    }

    private async lookupOpenLibrary(isbn: string) {
        try {
            const response = await axios.get(`https://openlibrary.org/isbn/${isbn}.json`);
            const data = response.data;


            return {
                isbn,
                title: data.title,
                subtitle: data.subtitle,
                publishedDate: data.publish_date,
                pageCount: data.number_of_pages,
                coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
                thumbnailUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
                authors: data.authors ? await this.getAuthorNames(data.authors) : [],
            };
        } catch (error) {
            return this.lookupGoogleBooks(isbn);
        }
    }

    private async lookupGoogleBooks(isbn: string) {
        try {
            const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);

            if (response.data.totalItems === 0) {
                throw new Error('Book not found');
            }

            const book = response.data.items[0].volumeInfo;

            return {
                isbn,
                isbn13: book.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier,
                title: book.title,
                subtitle: book.subtitle,
                description: book.description,
                publishedDate: book.publishedDate,
                publisher: book.publisher,
                pageCount: book.pageCount,
                language: book.language,
                coverUrl: book.imageLinks?.thumbnail?.replace('http:', 'https:') ?? book.previewLink,
                thumbnailUrl: book.imageLinks?.smallThumbnail?.replace('http:', 'https:') ?? book.previewLink,
                authors: book.authors || [],
                categories: book.categories || [],
            };
        } catch (error) {
            throw new Error('Book not found in any database');
        }
    }

    private async getAuthorNames(authorRefs: any[]) {
        const authors = await Promise.all(
            authorRefs.map(async (ref) => {
                try {
                    const response = await axios.get(`https://openlibrary.org${ref.key}.json`);
                    return response.data.name;
                } catch {
                    return 'Unknown Author';
                }
            }),
        );
        return authors;
    }

    async create(userId: string, createBookDto: CreateBookDto) {
        const {authors, categories, familyBook, ...bookData} = createBookDto;

        let book = await this.prisma.book.findFirst({
            where: {
                OR: [
                    {isbn: bookData.isbn},
                    {isbn13: bookData.isbn13},
                ],
            },
        });

        if (!book) {
            const data = {...bookData};
            delete data.volumeNumber;
            delete data.collectionId;

            book = await this.prisma.book.create({
                data: data,
            });

            if (authors && authors.length > 0) {
                for (let i = 0; i < authors.length; i++) {
                    const authorName = authors[i];
                    let author = await this.prisma.author.findUnique({
                        where: {name: authorName},
                    });

                    if (!author) {
                        author = await this.prisma.author.create({
                            data: {name: authorName},
                        });
                    }

                    await this.prisma.bookAuthor.create({
                        data: {
                            bookId: book.id,
                            authorId: author.id,
                            order: i,
                        },
                    });
                }
            }

            if (categories && categories.length > 0) {
                const categoryIds = await this.categoriesService.mergeCategoriesIntoBooksService(
                    book.id,
                    categories,
                );

                // Create book-category associations
                for (const categoryId of categoryIds) {
                    await this.prisma.bookCategory.create({
                        data: {
                            bookId: book.id,
                            categoryId: categoryId,
                        },
                    });
                }
            }
        }

        const user = await this.prisma.user.findUnique({
            where: {id: userId},
        });

        if (familyBook && user.familyId) {
            await this.prisma.familyBook.upsert({
                where: {
                    familyId_bookId: {
                        familyId: user.familyId,
                        bookId: book.id,
                    },
                },
                update: {},
                create: {
                    familyId: user.familyId,
                    bookId: book.id,
                    ...familyBook,
                },
            });
        }

        await this.prisma.userBook.upsert({
            where: {
                userId_bookId: {
                    userId,
                    bookId: book.id,
                },
            },
            update: {},
            create: {
                userId,
                bookId: book.id,
                status: 'WANT_TO_READ',
            },
        });

        if (bookData.collectionId) {
            await this.collectionService.addBookToCollection(bookData.collectionId, {
                bookId: book.id,
                collectionId: bookData.collectionId,
                volumeNumber: bookData.volumeNumber,
            })
        }

        return this.findOne(book.id);
    }

    async findAll(userId: string, query: QueryBooksDto): Promise<PaginatedBooksResponseDto> {
        const {page, limit, search, sortBy, sortOrder, ...filters} = query;

        // Calculate pagination
        const skip = (page - 1) * limit;
        const take = limit;

        // Get user with family info
        const user = await this.prisma.user.findUnique({
            where: {id: userId},
            select: {familyId: true},
        });

        // Build where clause
        const where: any = {
            OR: [
                // Books owned by family
                user.familyId ? {
                    familyBooks: {
                        some: {
                            familyId: user.familyId,
                        },
                    },
                } : undefined,
                // Books in user's reading list
                {
                    userBooks: {
                        some: {
                            userId,
                        },
                    },
                },
            ].filter(Boolean),
        };

        // Add search filter
        if (search) {
            where.AND = [
                {
                    OR: [
                        {title: {contains: search, mode: 'insensitive'}},
                        {subtitle: {contains: search, mode: 'insensitive'}},
                        {description: {contains: search, mode: 'insensitive'}},
                        {isbn: {contains: search}},
                        {isbn13: {contains: search}},
                        {publisher: {contains: search, mode: 'insensitive'}},
                        {
                            authors: {
                                some: {
                                    author: {
                                        name: {contains: search, mode: 'insensitive'},
                                    },
                                },
                            },
                        },
                    ],
                },
            ];
        }

        // Add type filter
        if (filters.type) {
            where.type = filters.type;
        }

        // Add category filter
        if (filters.categoryId || filters.categoryName) {
            where.categories = {
                some: filters.categoryId
                    ? {categoryId: filters.categoryId}
                    : {category: {name: {contains: filters.categoryName, mode: 'insensitive'}}},
            };
        }

        if (filters.collectionId) {
            if (filters.collectionId === 'none') {
                where.collections = {
                    none: {}  // Prisma syntax for "has no relations"
                };
            } else
                where.collections = {
                    some: {collectionId: filters.collectionId},
                };
        }

        // Add author filter
        if (filters.author) {
            where.authors = {
                some: {
                    author: {
                        name: {contains: filters.author, mode: 'insensitive'},
                    },
                },
            };
        }

        // Add ISBN filter
        if (filters.isbn) {
            where.OR = [
                {isbn: {contains: filters.isbn}},
                {isbn13: {contains: filters.isbn}},
            ];
        }

        // Add publisher filter
        if (filters.publisher) {
            where.publisher = {contains: filters.publisher, mode: 'insensitive'};
        }

        // Add language filter
        if (filters.language) {
            where.language = filters.language;
        }

        // Add page count filters
        if (filters.minPages !== undefined || filters.maxPages !== undefined) {
            where.pageCount = {};
            if (filters.minPages !== undefined) {
                where.pageCount.gte = filters.minPages;
            }
            if (filters.maxPages !== undefined) {
                where.pageCount.lte = filters.maxPages;
            }
        }

        // Add published date filters
        if (filters.publishedAfter || filters.publishedBefore) {
            // Note: publishedDate is stored as string, so we do partial matching
            const dateConditions = [];

            if (filters.publishedAfter) {
                dateConditions.push({publishedDate: {gte: filters.publishedAfter.toString()}});
            }
            if (filters.publishedBefore) {
                dateConditions.push({publishedDate: {lte: filters.publishedBefore.toString()}});
            }

            if (where.AND) {
                where.AND.push(...dateConditions);
            } else {
                where.AND = dateConditions;
            }
        }

        // Build orderBy
        const orderBy: any = {};
        if (sortBy === 'title') {
            orderBy.title = sortOrder;
        } else if (sortBy === 'publishedDate') {
            orderBy.publishedDate = sortOrder;
        } else if (sortBy === 'pageCount') {
            orderBy.pageCount = sortOrder;
        } else if (sortBy === 'createdAt') {
            orderBy.createdAt = sortOrder;
        } else if (sortBy === 'updatedAt') {
            orderBy.updatedAt = sortOrder;
        }

        // Get total count
        const total = await this.prisma.book.count({where});

        // Get paginated data
        const books = await this.prisma.book.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                authors: {
                    include: {
                        author: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        return {
            data: books,
            meta: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage,
                hasPreviousPage,
            },
        };
    }


    async findOne(id: string) {
        return this.prisma.book.findUnique({
            where: {id},
            include: {
                authors: {
                    include: {
                        author: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
                collections: {
                    include: {
                        collection: true,
                    },
                },
            },
        });
    }

    async checkIfOwned(userId: string, isbn: string) {
        const user = await this.prisma.user.findUnique({
            where: {id: userId},
        });

        if (!user.familyId) {
            return {owned: false};
        }

        const book = await this.prisma.book.findFirst({
            where: {
                OR: [{isbn}, {isbn13: isbn}],
            },
        });

        if (!book) {
            return {owned: false};
        }

        const familyBook = await this.prisma.familyBook.findUnique({
            where: {
                familyId_bookId: {
                    familyId: user.familyId,
                    bookId: book.id,
                },
            },
        });

        return {
            owned: !!familyBook,
            book: familyBook ? await this.findOne(book.id) : null,
        };
    }
}
