import axios from 'axios';
import * as cheerio from 'cheerio';
import {promises as fs} from 'fs';
import * as path from 'path';

/**
 * Book information interface for BooksInBelgium
 */
interface BooksInBelgiumBookInfo {
    isbn: string;
    isbn10: string | null;
    isbn13: string | null;
    url: string;
    title: string | null;
    authors: string[];
    publisher: string | null;
    language: string | null;
    pages: number | null;
    series: string | null;
    seriesNumber: string | null;
    year: number | null;
    dimensions: string | null;
    isColor: boolean | null;
    categories: string[];
    tags: string[];
    rating: {
        score: number | null;
        source: string | null;
    } | null;
    description: string | null;
    coverImage: string | null;
    thumbnailImage: string | null;
    priceFrom: number | null;
}

/**
 * Scrape book information from booksinbelgium.be
 * @param isbn - The ISBN number (can be ISBN-10 or ISBN-13)
 * @returns Book information
 */
export async function scrapeBooksInBelgiumBook(isbn: string): Promise<BooksInBelgiumBookInfo> {
    const url = `https://www.booksinbelgium.be/nl/b/${isbn}`;

    try {
        console.log(`Fetching data from: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'nl-BE,nl;q=0.9,en;q=0.8'
            }
        });

        const $ = cheerio.load(response.data);

        const bookInfo: BooksInBelgiumBookInfo = {
            isbn: isbn,
            isbn10: null,
            isbn13: null,
            url: url,
            title: null,
            authors: [],
            publisher: null,
            language: null,
            pages: null,
            series: null,
            seriesNumber: null,
            year: null,
            dimensions: null,
            isColor: null,
            categories: [],
            tags: [],
            rating: null,
            description: null,
            coverImage: null,
            thumbnailImage: null,
            priceFrom: null,
        };

        // Title and Author
        const titleElement = $('h1.book-title');
        if (titleElement.length) {
            const titleText = titleElement.clone().children().remove().end().text().trim();
            bookInfo.title = titleText;

            // Author is in a link within the title
            const authorLink = titleElement.find('a[href*="/s/a/"]');
            if (authorLink.length) {
                bookInfo.authors.push(authorLink.text().trim());
            }
        }

        // Cover images
        const coverImageElement = $('.image-carousel .card-img img');
        if (coverImageElement.length) {
            const src = coverImageElement.attr('src') || coverImageElement.attr('data-source');
            if (src) {
                bookInfo.coverImage = src.startsWith('http') ? src : `https://www.booksinbelgium.be${src}`;
            }
        }

        // Thumbnail
        const thumbnailElement = $('.thumbnail-image img');
        if (thumbnailElement.length) {
            const thumbSrc = thumbnailElement.attr('data-source') || thumbnailElement.attr('src');
            if (thumbSrc) {
                bookInfo.thumbnailImage = thumbSrc.startsWith('http') ? thumbSrc : `https://www.booksinbelgium.be${thumbSrc}`;
            }
        }

        // Description
        const descElement = $('.book-desc');
        if (descElement.length) {
            bookInfo.description = descElement.text().trim();
        }

        // Categories
        $('.cat-wrap a').each((i, elem) => {
            const category = $(elem).text().trim();
            if (category && !category.startsWith('>')) {
                bookInfo.categories.push(category);
            } else if (category.startsWith('>')) {
                bookInfo.categories.push(category.substring(1).trim());
            }
        });

        // Tags
        $('.info-item a[href*="/r/"]').each((i, elem) => {
            const tag = $(elem).text().trim();
            if (tag) {
                bookInfo.tags.push(tag);
            }
        });

        // Rating (from Goodreads)
        const ratingElement = $('.sr-only');
        if (ratingElement.length) {
            const ratingText = ratingElement.text();
            const match = ratingText.match(/Rated\s+([\d.]+)\s+stars/);
            if (match) {
                bookInfo.rating = {
                    score: parseFloat(match[1]),
                    source: 'Goodreads'
                };
            }
        }

        // Price
        const priceButton = $('button.bk-btn');
        if (priceButton.length) {
            const priceText = priceButton.text();
            const priceMatch = priceText.match(/€\s*([\d.]+)/);
            if (priceMatch) {
                bookInfo.priceFrom = parseFloat(priceMatch[1]);
            }
        }

        // Details section
        $('.book-info .info-item span, .book-info-mobile .info-item span').each((i, elem) => {
            const text = $(elem).text().trim();

            // Year (standalone number)
            if (/^\d{4}$/.test(text)) {
                bookInfo.year = parseInt(text);
            }

            // Publisher
            if (text.includes('Uitgever:')) {
                const publisherLink = $(elem).find('a');
                if (publisherLink.length) {
                    bookInfo.publisher = publisherLink.text().trim();
                }
            }

            // Series
            if (text.includes('Reeks:')) {
                const seriesLink = $(elem).find('a');
                if (seriesLink.length) {
                    bookInfo.series = seriesLink.text().trim();
                }
            }

            // Series number
            if (text.includes('Nummer:')) {
                const numberMatch = text.match(/Nummer:\s*(\d+)/);
                if (numberMatch) {
                    bookInfo.seriesNumber = numberMatch[1];
                }
            }

            // Color
            if (text.toLowerCase() === 'kleur') {
                bookInfo.isColor = true;
            }

            // Pages
            if (text.includes('pagina')) {
                const pagesMatch = text.match(/(\d+)\s*pagina/);
                if (pagesMatch) {
                    bookInfo.pages = parseInt(pagesMatch[1]);
                }
            }

            // Language
            if (text.includes('Taal:')) {
                const langLink = $(elem).find('a');
                if (langLink.length) {
                    bookInfo.language = langLink.text().trim();
                }
            }

            // Dimensions
            if (text.includes('Grootte:')) {
                const dimMatch = text.match(/Grootte:\s*([\d x]+)/);
                if (dimMatch) {
                    bookInfo.dimensions = dimMatch[1].trim();
                }
            }

            // ISBN-10
            if (text.includes('ISBN-10:')) {
                const isbn10Match = text.match(/ISBN-10:\s*(\S+)/);
                if (isbn10Match) {
                    bookInfo.isbn10 = isbn10Match[1];
                }
            }

            // ISBN-13
            if (text.includes('ISBN-13:')) {
                const isbn13Match = text.match(/ISBN-13:\s*(\S+)/);
                if (isbn13Match) {
                    bookInfo.isbn13 = isbn13Match[1];
                }
            }
        });
        return bookInfo;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                throw new Error(`HTTP Error ${error.response.status}: ${error.response.statusText}`);
            } else if (error.request) {
                throw new Error('No response received from server');
            }
        }
        throw new Error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Format book information for display
 */
export function formatBooksInBelgiumBookInfo(bookInfo: BooksInBelgiumBookInfo): void {
    console.log('\n' + '='.repeat(70));
    console.log('BOOKSINBELGIUM.BE - BOOK INFORMATION');
    console.log('='.repeat(70));

    console.log(`Title               : ${bookInfo.title || 'N/A'}`);

    if (bookInfo.authors.length > 0) {
        console.log(`Author(s)           : ${bookInfo.authors.join(', ')}`);
    }

    if (bookInfo.series) {
        console.log(`Series              : ${bookInfo.series}`);
    }

    if (bookInfo.seriesNumber) {
        console.log(`Series Number       : ${bookInfo.seriesNumber}`);
    }

    if (bookInfo.publisher) {
        console.log(`Publisher           : ${bookInfo.publisher}`);
    }

    if (bookInfo.year) {
        console.log(`Year                : ${bookInfo.year}`);
    }

    if (bookInfo.language) {
        console.log(`Language            : ${bookInfo.language}`);
    }

    if (bookInfo.pages !== null) {
        console.log(`Pages               : ${bookInfo.pages}`);
    }

    if (bookInfo.isColor !== null) {
        console.log(`Color               : ${bookInfo.isColor ? 'Yes' : 'No'}`);
    }

    if (bookInfo.dimensions) {
        console.log(`Dimensions          : ${bookInfo.dimensions}`);
    }

    if (bookInfo.isbn10) {
        console.log(`ISBN-10             : ${bookInfo.isbn10}`);
    }

    if (bookInfo.isbn13) {
        console.log(`ISBN-13             : ${bookInfo.isbn13}`);
    }


    if (bookInfo.priceFrom !== null) {
        console.log(`Price From          : € ${bookInfo.priceFrom.toFixed(2)}`);
    }

    if (bookInfo.rating) {
        console.log(`Rating              : ${bookInfo.rating.score}/5 (${bookInfo.rating.source})`);
    }

    if (bookInfo.categories.length > 0) {
        console.log(`Categories          : ${bookInfo.categories.join(' > ')}`);
    }

    if (bookInfo.tags.length > 0) {
        console.log(`Tags                : ${bookInfo.tags.join(', ')}`);
    }

    if (bookInfo.coverImage) {
        console.log(`Cover Image         : ${bookInfo.coverImage}`);
    }

    if (bookInfo.thumbnailImage) {
        console.log(`Thumbnail           : ${bookInfo.thumbnailImage}`);
    }

    if (bookInfo.description) {
        console.log(`\nDescription         :`);
        console.log(bookInfo.description);
    }

    console.log(`\nURL                 : ${bookInfo.url}`);
    console.log('='.repeat(70) + '\n');
}

/**
 * Save book information to JSON file
 */
export async function saveToJSON(bookInfo: BooksInBelgiumBookInfo, filename: string): Promise<void> {
    const outputPath = path.join(process.cwd(), filename);
    await fs.writeFile(outputPath, JSON.stringify(bookInfo, null, 2), 'utf-8');
    console.log(`✓ Book information saved to: ${filename}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: ts-node booksinbelgium-scraper.ts <ISBN> [--json output.json]');
        console.log('Example: ts-node booksinbelgium-scraper.ts 9789002202759');
        console.log('Example: ts-node booksinbelgium-scraper.ts 900220275X --json book.json');
        process.exit(1);
    }

    const isbn = args[0];
    const jsonIndex = args.indexOf('--json');
    const outputFile = jsonIndex !== -1 ? args[jsonIndex + 1] : null;

    try {
        const bookInfo = await scrapeBooksInBelgiumBook(isbn);

        // Display formatted output
        formatBooksInBelgiumBookInfo(bookInfo);

        // Save to JSON if requested
        if (outputFile) {
            await saveToJSON(bookInfo, outputFile);
        }

    } catch (error) {
        console.error('✗ Error scraping book:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

export const mapBooksInBelgiumToBook = (data: BooksInBelgiumBookInfo, serie: { id: string }) => {
    return {
        isbn: data.isbn,
        title: data.title,
        authors: data.authors,
        description: data.description,
        coverUrl: data.coverImage,
        thumbnailUrl: data.coverImage,
        language: data.language,
        categories: data.categories,
        serie,
        serieId: serie ? serie.id : null,
        serieNumber: data.seriesNumber,
        // publishedDate: data.,
        publisher: data.publisher,
        pageCount: data.pages,
        source: 'BooksInBelgium.be',
    };
};
