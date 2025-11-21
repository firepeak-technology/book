import axios from 'axios';
import * as cheerio from 'cheerio';
import {promises as fs} from 'fs';
import * as path from 'path';

/**
 * Book information interface
 */
interface BookInfo {
    isbn: string;
    url: string;
    title: string | null;
    subtitle: string | null;
    series: string | null;
    author: string | null;
    publisher: string | null;
    publicationDate: string | null;
    pages: number | null;
    language: string | null;
    format: string | null;
    edition: string | null;
    illustrated: boolean | null;
    description: string | null;
    coverImage: string | null;
    backCoverImage: string | null;
    availability: {
        condition: string;
        price: string;
        year: string;
        seller: string;
        link: string;
    }[];
}

/**
 * Scrape book information from boekenplatform.nl
 * @param isbn - The ISBN number
 * @returns Book information
 */
export async function scrapeBoekenPlatformNl(isbn: string): Promise<BookInfo> {
    const url = `https://www.boekenplatform.nl/isbn/${isbn}`;

    try {
        console.log(`Fetching data from: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        // Extract book information
        const bookInfo: BookInfo = {
            isbn: isbn,
            url: url,
            title: null,
            subtitle: null,
            series: null,
            author: null,
            publisher: null,
            publicationDate: null,
            pages: null,
            language: null,
            format: null,
            edition: null,
            illustrated: null,
            description: null,
            coverImage: null,
            backCoverImage: null,
            availability: []
        };

        // Title (from h4 in view-header or h1.title)
        const titleElement = $('.view-header h4').first();
        if (titleElement.length) {
            bookInfo.title = titleElement.text().trim();
        } else {
            // Fallback to page title
            const pageTitleElement = $('h1.title#page-title');
            if (pageTitleElement.length) {
                bookInfo.title = pageTitleElement.text().trim();
            }
        }

        // Extract details from table
        $('.view-header table tr').each((i, row) => {
            const $row = $(row);
            const label = $row.find('td:first-child strong').text().trim();
            const value = $row.find('td:last-child').text().trim();

            switch (label) {
                case 'Hoofdtitel':
                    if (!bookInfo.title) bookInfo.title = value;
                    break;
                case 'Ondertitel':
                    bookInfo.subtitle = value;
                    break;
                case 'Reeks':
                    bookInfo.series = value;
                    break;
                case 'Uitgever':
                    bookInfo.publisher = value;
                    break;
                case 'Auteur(s)':
                    bookInfo.author = value;
                    break;
                case 'Druk':
                    bookInfo.edition = value;
                    break;
                case 'Taal':
                    bookInfo.language = value;
                    break;
                case 'Pagina\'s':
                    const pages = parseInt(value);
                    bookInfo.pages = isNaN(pages) ? null : pages;
                    break;
                case 'Productvorm':
                    bookInfo.format = value;
                    break;
                case 'Geïllustreerd':
                    bookInfo.illustrated = value.toLowerCase() === 'ja';
                    break;
                case 'Publicatiedatum':
                    bookInfo.publicationDate = value;
                    break;
                case 'ISBN':
                    // Already have ISBN
                    break;
            }
        });

        // Cover images
        const coverImages = $('.productafbeeldingen img');
        if (coverImages.length > 0) {
            const frontCover = coverImages.eq(0).attr('src');
            if (frontCover) {
                bookInfo.coverImage = frontCover.startsWith('http') ? frontCover : `https://www.boekenplatform.nl${frontCover}`;
            }

            if (coverImages.length > 1) {
                const backCover = coverImages.eq(1).attr('src');
                if (backCover) {
                    bookInfo.backCoverImage = backCover.startsWith('http') ? backCover : `https://www.boekenplatform.nl${backCover}`;
                }
            }
        }

        // Available copies (second-hand books)
        $('.view-content table.views-table tbody tr').each((i, row) => {
            const $row = $(row);

            const imageElement = $row.find('.field-name-field-afbeelding a');
            const titleElement = $row.find('.views-field-title a');
            const conditionElement = $row.find('.field-name-field-conditie-artikel');
            const yearElement = $row.find('.field-name-field-publicatiejaar');
            const authorPublisher = $row.find('td').eq(5).text().trim();
            const priceElement = $row.find('.field-name-field-prijs');
            const infoLink = $row.find('.views-field-nid a');

            const availability = {
                condition: conditionElement.text().trim(),
                price: priceElement.text().trim().replace(/\s+/g, ' '),
                year: yearElement.text().trim(),
                seller: authorPublisher,
                link: infoLink.length ? `https://www.boekenplatform.nl${infoLink.attr('href')}` : ''
            };

            bookInfo.availability.push(availability);
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
export function formatBookInfo(bookInfo: BookInfo): void {
    console.log('\n' + '='.repeat(70));
    console.log('BOOK INFORMATION');
    console.log('='.repeat(70));

    const fields: Array<[string, any]> = [
        ['ISBN', bookInfo.isbn],
        ['Title', bookInfo.title],
        ['Subtitle', bookInfo.subtitle],
        ['Series', bookInfo.series],
        ['Author', bookInfo.author],
        ['Publisher', bookInfo.publisher],
        ['Publication Date', bookInfo.publicationDate],
        ['Edition', bookInfo.edition],
        ['Pages', bookInfo.pages],
        ['Language', bookInfo.language],
        ['Format', bookInfo.format],
        ['Illustrated', bookInfo.illustrated ? 'Yes' : bookInfo.illustrated === false ? 'No' : null],
        ['Cover Image', bookInfo.coverImage],
        ['Back Cover Image', bookInfo.backCoverImage],
        ['URL', bookInfo.url]
    ];

    fields.forEach(([label, value]) => {
        if (value !== null && value !== '') {
            console.log(`${label.padEnd(20)}: ${value}`);
        }
    });

    // Display availability
    if (bookInfo.availability.length > 0) {
        console.log('\n' + '-'.repeat(70));
        console.log(`AVAILABLE COPIES (${bookInfo.availability.length})`);
        console.log('-'.repeat(70));

        bookInfo.availability.forEach((item, index) => {
            console.log(`\n${index + 1}.`);
            console.log(`  Condition : ${item.condition}`);
            console.log(`  Price     : ${item.price}`);
            console.log(`  Year      : ${item.year || 'N/A'}`);
            console.log(`  Seller    : ${item.seller}`);
            console.log(`  Link      : ${item.link}`);
        });
    } else {
        console.log('\nNo copies currently available');
    }

    console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Save book information to JSON file
 */
export async function saveToJSON(bookInfo: BookInfo, filename: string): Promise<void> {
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
        console.log('Usage: ts-node book-scraper.ts <ISBN> [--json output.json]');
        console.log('Example: ts-node book-scraper.ts 9789002112980');
        console.log('Example: ts-node book-scraper.ts 9789002112980 --json book.json');
        process.exit(1);
    }

    const isbn = args[0];
    const jsonIndex = args.indexOf('--json');
    const outputFile = jsonIndex !== -1 ? args[jsonIndex + 1] : null;

    try {
        const bookInfo = await scrapeBoekenPlatformNl(isbn);

        // Display formatted output
        formatBookInfo(bookInfo);

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
