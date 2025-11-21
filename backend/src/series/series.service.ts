import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {CreateSeriesDto, UpdateSeriesDto} from './dto/series.dto';

@Injectable()
export class SeriesService {
    constructor(private prisma: PrismaService) {
    }

    /**
     * Get all series
     */
    async findAll() {
        return this.prisma.series.findMany({
            include: {
                _count: {
                    select: {
                        books: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    private async mySerieStatistics(seriesId: string, userId: string) {
        const [totalInCollection, totalInDatabase] = await Promise.all([
            this.prisma.book.count({
                where: {
                    serieId: seriesId,
                    userBooks: {
                        some: {
                            userId: userId,
                            own: true
                        },
                    },
                },
            }),
            this.prisma.book.count({
                where: {
                    serieId: seriesId,
                },
            }),
        ]);

        return {
            totalInCollection, totalInDatabase,
            completionPercentage: totalInDatabase > 0
                ? Math.round((totalInCollection / totalInDatabase) * 100)
                : 0,
        }
    }

    /**
     * Get series where the user has books with counts
     * Returns only series where the user owns at least one book
     */
    async getMySeriesWithCounts(userId: string) {
        // Get all series that have at least one book owned by the user
        const seriesWithBooks = await this.prisma.series.findMany({
            where: {
                books: {
                    some: {
                        userBooks: {
                            some: {
                                userId: userId,
                            },
                        },
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        // For each series, get total books in database and user's collection count
        const seriesWithCounts = await Promise.all(
            seriesWithBooks.map(async (series) => {
                const seriesStats = await this.mySerieStatistics(series.id, userId);

                return {
                    ...series,
                    stats: seriesStats
                };
            })
        );

        return seriesWithCounts;
    }

    /**
     * Get a single series by ID
     */
    async findOne(id: string, userId: string) {
        const series = await this.prisma.series.findUnique({
            where: {id},
            include: {
                _count: {
                    select: {
                        books: true,
                    },
                },
            },
        });

        if (!series) {
            throw new NotFoundException(`Series with ID ${id} not found`);
        }

        // Get total count in database vs user's collection
        const seriesStats = await this.mySerieStatistics(series.id, userId);


        return {
            ...series,
            stats: seriesStats
        };
    }

    /**
     * Create a new series
     */
    async create(createSeriesDto: CreateSeriesDto, userId: string) {
        return this.prisma.series.create({
            data: {
                name: createSeriesDto.name,
                description: createSeriesDto.description,
            },
        });
    }

    /**
     * Update a series
     */
    async update(id: string, updateSeriesDto: UpdateSeriesDto, userId: string) {
        // Check if series exists
        const series = await this.prisma.series.findUnique({
            where: {id},
        });

        if (!series) {
            throw new NotFoundException(`Series with ID ${id} not found`);
        }

        return this.prisma.series.update({
            where: {id},
            data: {
                name: updateSeriesDto.name,
                description: updateSeriesDto.description,
            },
        });
    }

    /**
     * Delete a series
     * Note: This will set serieId to null for all books in this series (onDelete: SetNull)
     */
    async remove(id: string, userId: string) {
        const series = await this.prisma.series.findUnique({
            where: {id},
        });

        if (!series) {
            throw new NotFoundException(`Series with ID ${id} not found`);
        }

        return this.prisma.series.delete({
            where: {id},
        });
    }

    /**
     * Get series statistics for a user
     */
    async getStatistics(userId: string) {
        const totalSeries = await this.prisma.series.count();

        const seriesWithMyBooks = await this.prisma.series.count({
            where: {
                books: {
                    some: {
                        userBooks: {
                            some: {
                                userId: userId,
                            },
                        },
                    },
                },
            },
        });

        // const completedSeries = await this.getCompletedSeriesCount(userId);

        return {
            totalSeries,
            seriesWithMyBooks,
            // completedSeries,
            // completionRate: totalSeries > 0
            //     ? Math.round((completedSeries / seriesWithMyBooks) * 100)
            //     : 0,
        };
    }

    async findOrCreateByName(seriesName: string) {
        const name = seriesName.trim();

        // First, try to find existing series (case-insensitive)
        const existing = await this.prisma.series.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive',
                },
            },
        });

        if (existing) {
            return existing;
        }

        // If not found, create new one
        return this.prisma.series.create({
            data: {name},
        });
    }


}
