import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {CreateBookDto} from './dto/create-book.dto';
import axios from 'axios';

import {CategoriesService} from '../categories/categories.service';
import {QueryBooksDto, SortBy} from "./dto/query-books.dto";
import {PaginatedBooksResponseDto} from "./dto/paginated-books-response.dto";
import {mapStandaardToBook, scrapeStandaardBook} from "./scrapper/standaard-book.scrapper";
import {SeriesService} from "../series/series.service";
import {determineBookType} from "./scrapper/determineBookType";
import {CoverImageService} from "../image/cover-image.service";
import {mapBooksInBelgiumToBook, scrapeBooksInBelgiumBook} from "./scrapper/booksInBelgium-be";
import {findGoogleBookByIsbn} from "./scrapper/google-api-books";
import {findOpenLibraryByIsbn} from "./scrapper/open-library";

@Injectable()
export class BooksService {
    constructor(private prisma: PrismaService,
                private categoriesService: CategoriesService,
                private coverImageService: CoverImageService,
                private seriesService: SeriesService) {
    }

    async lookupByISBN(userId: string, isbn: string) {
        // Try in order of preference
        const sources = [
            // TODO search internal DB first?
            () => this.lookupStandaard(isbn),
            () => this.lookupBooksInBelgium(isbn),
            () => this.lookupGoogleBooks(isbn),
            () => this.lookupOpenLibrary(isbn),
            // () => this.lookupComicVine(isbn), // For comics
        ];
        const isExistingBook = await this.findOneByWhere(userId, {isbn})

        for (const source of sources) {
            try {
                const result = await source();
                if (result) return {
                    ...isExistingBook ?? {},
                    ...result,
                    categories: Array.from(new Set([...(isExistingBook?.categories || []), ...(result.categories || [])])),
                    type: isExistingBook?.type ? isExistingBook.type : determineBookType(...result.categories)
                };
            } catch (error) {
                console.error(error);
                continue; // Try next source
            }
        }

        if (isExistingBook) {
            return {
                ...isExistingBook,
                authors: isExistingBook.authors.map(c => c.author.name),
                categories: isExistingBook.categories.map(c => c.category.name),
                source: 'local'
            };
        }

        throw new Error('Book not found in any database');
    }

    private async lookupStandaard(isbn: string) {
        const data = await scrapeStandaardBook(isbn)
        // const serie
        const serie = data.series ? await this.seriesService.findOrCreateByName(data.series) : null;
        return mapStandaardToBook(data, serie);
    }

    private async lookupBooksInBelgium(isbn: string) {
        const data = await scrapeBooksInBelgiumBook(isbn)
        // const serie
        const serie = data.series ? await this.seriesService.findOrCreateByName(data.series) : null;

        return mapBooksInBelgiumToBook(data, serie);
    }

    private async lookupOpenLibrary(isbn: string) {
        return findOpenLibraryByIsbn(isbn)
    }

    private async lookupGoogleBooks(isbn: string) {
        return findGoogleBookByIsbn(isbn)
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
        const {authors, categories, userBookDto, serieId, ...bookData} = createBookDto;

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
            if (serieId) {
                data['serie'] = {
                    connect: {
                        id: serieId
                    }
                };
            }

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

        if (book.coverUrl) {
            const coverImage = await this.coverImageService.downloadFromUrl(bookData.coverUrl);
            if (coverImage) {
                await this.prisma.book.update({
                    where: {id: book.id},
                    data: {
                        coverImage: {
                            connect: {id: coverImage.id},
                        },
                        coverUrl: coverImage.imageUrl,
                        thumbnailUrl: coverImage.thumbnailUrl,
                    },
                });
            }
        }

        const user = await this.prisma.user.findUnique({
            where: {id: userId},
        });


        await this.prisma.userBook.upsert({
            where: {
                userId_bookId: {
                    userId,
                    bookId: book.id,
                },
            },
            update: {
                ...userBookDto
            },
            create: {
                userId,
                bookId: book.id,
                status: 'WANT_TO_READ',
                ...userBookDto
            },
        });


        return this.findOne(userId, book.id);
    }

    async findAll(userId: string, query: QueryBooksDto): Promise<PaginatedBooksResponseDto> {
        const {page, limit, search, sortBy, sortOrder, ...filters} = query;

        // Calculate pagination
        const skip = (page - 1) * limit;
        const take = limit;

        // Get user with family info
        const user = await this.prisma.user.findUnique({
            where: {id: userId},
        });

        // Build where clause
        const where: any = {
            OR: [
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

        if (filters.serieId) {
            if (filters.serieId === 'none') {
                where.serieId = {
                    none: {}  // Prisma syntax for "has no relations"
                };
            } else
                where.serieId = {contains: filters.serieId};
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
        } else if (sortBy === SortBy.SERIE_NUMBER) {
            orderBy[SortBy.SERIE_NUMBER] = sortOrder;
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
                coverImage: true,
                serie: true,
                userBooks: true,
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
            data: books.map(book => ({
                ...book,
                user: book.userBooks.find(ub => ub.userId === userId)
            })),
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

    async own(userId: string, bookId: string) {
        const [user, book] = await Promise.all([
            this.prisma.user.findUnique({
                where: {id: userId},
            }),
            this.prisma.book.findUnique({
                where: {id: bookId},
            }),
        ]);

        await this.prisma.userBook.upsert({
            where: {
                userId_bookId: {
                    userId,
                    bookId: book.id,
                },
            },
            update: {
                own: true
            },
            create: {
                userId,
                bookId: book.id,
                status: 'WANT_TO_READ',
                own: true
            },
        });

        return this.findOne(userId, book.id);
    }


    async findOne(userId: string, id: string) {
        return this.findOneByWhere(userId, {id})
    }

    private async findOneByWhere(userId: string, where: any) {
        const book = await this.prisma.book.findUnique({
            where: {
                ...where,
                OR: [
                    // Books in user's reading list
                    {
                        userBooks: {
                            some: {
                                userId,
                            },
                        },
                    },
                ].filter(Boolean),
            },
            include: {
                coverImage: true,
                serie: true,
                userBooks: true,
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

        if (!book) return null

        return {
            ...book,
            user: book.userBooks.find(ub => ub.userId === userId)
        }
    }

    async checkIfOwned(userId: string, isbn: string) {
        const user = await this.prisma.user.findUnique({
            where: {id: userId},
        });

        const book = await this.prisma.book.findFirst({
            where: {
                OR: [{isbn}, {isbn13: isbn}],
            },
        });

        if (!book) {
            return {owned: false};
        }
        const userBook = await this.prisma.userBook.findFirst({
            where: {
                userId,
                bookId: book.id,
            },
        });

        if (!userBook) {
            return {owned: false, book};
        }

        return {
            owned: true,
            book: book
        };
    }
}
