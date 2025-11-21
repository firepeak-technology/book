import axios from 'axios';
import * as cheerio from 'cheerio';
import {promises as fs} from 'fs';
import * as path from 'path';

/**
 * Book information interface for Standaard Boekhandel
 */
interface StandaardBookInfo {
    isbn: string;
    url: string;
    title: string | null;
    authors: string[];
    publisher: string | null;
    format: string | null;
    language: string | null;
    pages: number | null;
    series: string | null;
    seriesNumber: string | null;
    price: number | null;
    priceFormatted: string | null;
    loyaltyPoints: number | null;
    coverImage: string | null;
    publicationDate: string | null;
    dimensions: string | null;
    weight: string | null;
    availability: {
        homeDelivery: string | null;
        storePickup: string | null;
        storeCount: number | null;
    };
    promotion: {
        title: string | null;
        description: string | null;
    } | null;
    description: string | null;
    productData: {
        category: string | null;
        category2: string | null;
        isDigital: boolean;
    } | null;
}

/**
 * Scrape book information from standaardboekhandel.be
 * @param isbn - The ISBN number
 * @returns Book information
 */
export async function scrapeStandaardBook(isbn: string): Promise<StandaardBookInfo> {
    const url = `https://www.standaardboekhandel.be/p/${isbn}`;

    try {
        console.log(`Fetching data from: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'nl-BE,nl;q=0.9,en;q=0.8'
            }
        });

        const $ = cheerio.load(response.data);

        // Extract book information
        const bookInfo: StandaardBookInfo = {
            isbn: isbn,
            url: url,
            title: null,
            authors: [],
            publisher: null,
            format: null,
            language: null,
            pages: null,
            series: null,
            seriesNumber: null,
            price: null,
            priceFormatted: null,
            loyaltyPoints: null,
            coverImage: null,
            publicationDate: null,
            dimensions: null,
            weight: null,
            availability: {
                homeDelivery: null,
                storePickup: null,
                storeCount: null
            },
            promotion: null,
            description: null,
            productData: null
        };

        // Extract product data from data-component-parm attribute
        const productContainer = $('[data-component-class="SB.Ecom.Product"]');
        if (productContainer.length) {
            const componentParm = productContainer.attr('data-component-parm');
            if (componentParm) {
                try {
                    const productData = JSON.parse(componentParm);
                    if (productData.productData) {
                        bookInfo.price = productData.productData.price || null;
                        bookInfo.productData = {
                            category: productData.productData.category || null,
                            category2: productData.productData.category2 || null,
                            isDigital: productData.productData.isDigital || false
                        };
                    }
                } catch (e) {
                    console.warn('Could not parse product data JSON');
                }
            }
        }

        // Title
        const titleElement = $('.c-product-detail__title span, .c-product-detail__title');
        if (titleElement.length) {
            bookInfo.title = titleElement.first().text().trim();
        }

        // Authors
        $('.c-product-detail__author').each((i, elem) => {
            const author = $(elem).text().trim();
            if (author) {
                bookInfo.authors.push(author);
            }
        });

        // Discriminator info (format, language, series, series number)
        const discriminator = $('.c-product__discriminator.c-product-detail__discriminator');

        // Format (first span)
        const formatSpan = discriminator.find('span').first();
        if (formatSpan.length) {
            bookInfo.format = formatSpan.text().trim();
        }

        // Language (second span)
        const languageSpan = discriminator.find('span').eq(1);
        if (languageSpan.length) {
            bookInfo.language = languageSpan.text().trim();
        }

        // Series (link with href containing /c/reeks/)
        const seriesLink = discriminator.find('a[href*="/c/reeks/"]');
        if (seriesLink.length) {
            bookInfo.series = seriesLink.text().trim();
        }

        // Series number (span containing "nr.")
        discriminator.find('.c-product__discriminator-list').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text.includes('nr.')) {
                bookInfo.seriesNumber = text;
            }
        });

        // Price (formatted)
        const priceElement = $('.c-product__detail__price--largest');
        if (priceElement.length) {
            bookInfo.priceFormatted = priceElement.text().trim();
        }

        // Loyalty points
        const loyaltyPointsElement = $('[data-type="product-loyalty-points"]');
        if (loyaltyPointsElement.length) {
            const points = parseInt(loyaltyPointsElement.text().trim());
            bookInfo.loyaltyPoints = isNaN(points) ? null : points;
        }

        // Cover image - Look for image with ISBN in URL or in the product slider
        let coverImageUrl: string | null = null;

        // Method 1: Find image with ISBN in the src attribute
        $('img').each((i, elem) => {
            const src = $(elem).attr('src');
            if (src && src.includes(isbn)) {
                coverImageUrl = src;
                return false; // break loop
            }
        });

        // Method 2: Look in the product slider anchor tag
        if (!coverImageUrl) {
            const sliderLink = $('.c-products-slider a[data-lightbox="products"]');
            if (sliderLink.length) {
                const href = sliderLink.attr('href');
                if (href && href.includes(isbn)) {
                    coverImageUrl = href;
                }
            }
        }

        // Method 3: Look for img inside the slider with the ISBN
        if (!coverImageUrl) {
            const sliderImg = $('.c-products-slider img.c-product__image');
            if (sliderImg.length) {
                const src = sliderImg.attr('src');
                if (src && src.includes(isbn)) {
                    coverImageUrl = src;
                }
            }
        }

        if (coverImageUrl) {
            bookInfo.coverImage = coverImageUrl.startsWith('http')
                ? coverImageUrl
                : `https://www.standaardboekhandel.be${coverImageUrl}`;
        }

        // Availability - Home delivery
        const homeDeliveryElement = $('.c-customer-promise').filter((i, elem) => {
            return $(elem).text().includes('Levering');
        });
        if (homeDeliveryElement.length) {
            bookInfo.availability.homeDelivery = homeDeliveryElement.text().trim();
        }

        // Availability - Store pickup
        const storePickupElement = $('.c-customer-promise-shop-stock');
        if (storePickupElement.length) {
            const pickupText = storePickupElement.text().trim();
            bookInfo.availability.storePickup = pickupText;

            // Extract store count
            const storeMatch = pickupText.match(/(\d+)\s+winkel/);
            if (storeMatch) {
                bookInfo.availability.storeCount = parseInt(storeMatch[1]);
            }
        }

        // Promotion
        const promoElement = $('.c-product-detail__promo');
        if (promoElement.length) {
            const promoTitle = promoElement.find('.c-rt-title-ink').text().trim();
            const promoContent = promoElement.find('.c-product-detail__promo--content')
                .map((i, elem) => $(elem).text().trim())
                .get()
                .join(' ');

            if (promoTitle || promoContent) {
                bookInfo.promotion = {
                    title: promoTitle || null,
                    description: promoContent || null
                };
            }
        }

        // Description (from data attribute in yotpo element)
        const yotpoElement = $('.yotpo.bottomLine');
        if (yotpoElement.length) {
            const description = yotpoElement.attr('data-description');
            if (description) {
                bookInfo.description = description;
            }
        }

        // Extract specifications from the specifications section
        $('.c-product-spec__row').each((i, row) => {
            const $row = $(row);
            const label = $row.find('.c-product-spec__label').text().trim().replace(':', '');
            const value = $row.find('.c-product-spec__value, dd.c-product-spec__value').text().trim();

            switch (label) {
                case 'Auteur(s)':
                    // Already extracted from authors section, but can add if missing
                    if (bookInfo.authors.length === 0 && value) {
                        bookInfo.authors.push(value);
                    }
                    break;
                case 'Uitgeverij':
                    bookInfo.publisher = value;
                    break;
                case 'Aantal bladzijden':
                    const pages = parseInt(value);
                    bookInfo.pages = isNaN(pages) ? null : pages;
                    break;
                case 'Taal':
                    if (!bookInfo.language) {
                        bookInfo.language = value;
                    }
                    break;
                case 'Reeks':
                    if (!bookInfo.series) {
                        bookInfo.series = value;
                    }
                    break;
                case 'Reeksnummer':
                    if (!bookInfo.seriesNumber) {
                        bookInfo.seriesNumber = value;
                    }
                    break;
                case 'Productcode (EAN)':
                    // This is the ISBN/EAN, already have it
                    break;
                case 'Verschijningsdatum':
                    bookInfo.publicationDate = value;
                    break;
                case 'Uitvoering':
                    if (!bookInfo.format) {
                        bookInfo.format = value;
                    }
                    break;
                case 'Afmetingen':
                    bookInfo.dimensions = value;
                    break;
                case 'Gewicht':
                    bookInfo.weight = value;
                    break;
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
export function formatStandaardBookInfo(bookInfo: StandaardBookInfo): void {
    console.log('\n' + '='.repeat(70));
    console.log('STANDAARD BOEKHANDEL - BOOK INFORMATION');
    console.log('='.repeat(70));

    console.log(`ISBN                : ${bookInfo.isbn}`);
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

    if (bookInfo.format) {
        console.log(`Format              : ${bookInfo.format}`);
    }

    if (bookInfo.language) {
        console.log(`Language            : ${bookInfo.language}`);
    }

    if (bookInfo.pages !== null) {
        console.log(`Pages               : ${bookInfo.pages}`);
    }

    if (bookInfo.publisher) {
        console.log(`Publisher           : ${bookInfo.publisher}`);
    }

    if (bookInfo.publicationDate) {
        console.log(`Publication Date    : ${bookInfo.publicationDate}`);
    }

    if (bookInfo.dimensions) {
        console.log(`Dimensions          : ${bookInfo.dimensions}`);
    }

    if (bookInfo.weight) {
        console.log(`Weight              : ${bookInfo.weight}`);
    }

    if (bookInfo.priceFormatted) {
        console.log(`Price               : ${bookInfo.priceFormatted}`);
    } else if (bookInfo.price !== null) {
        console.log(`Price               : € ${bookInfo.price.toFixed(2)}`);
    }

    if (bookInfo.loyaltyPoints !== null) {
        console.log(`Loyalty Points      : ${bookInfo.loyaltyPoints} punten`);
    }

    if (bookInfo.coverImage) {
        console.log(`Cover Image         : ${bookInfo.coverImage}`);
    }

    if (bookInfo.description) {
        console.log(`Description         : ${bookInfo.description}`);
    }

    console.log('\n' + '-'.repeat(70));
    console.log('AVAILABILITY');
    console.log('-'.repeat(70));

    if (bookInfo.availability.homeDelivery) {
        console.log(`Home Delivery       : ${bookInfo.availability.homeDelivery}`);
    }

    if (bookInfo.availability.storePickup) {
        console.log(`Store Pickup        : ${bookInfo.availability.storePickup}`);
    }

    if (bookInfo.availability.storeCount !== null) {
        console.log(`Available in        : ${bookInfo.availability.storeCount} store(s)`);
    }

    if (bookInfo.promotion) {
        console.log('\n' + '-'.repeat(70));
        console.log('PROMOTION');
        console.log('-'.repeat(70));

        if (bookInfo.promotion.title) {
            console.log(`Title               : ${bookInfo.promotion.title}`);
        }

        if (bookInfo.promotion.description) {
            console.log(`Description         : ${bookInfo.promotion.description}`);
        }
    }

    if (bookInfo.productData) {
        console.log('\n' + '-'.repeat(70));
        console.log('ADDITIONAL INFO');
        console.log('-'.repeat(70));

        if (bookInfo.productData.category) {
            console.log(`Category            : ${bookInfo.productData.category}`);
        }

        if (bookInfo.productData.category2) {
            console.log(`Subcategory         : ${bookInfo.productData.category2}`);
        }

        console.log(`Digital             : ${bookInfo.productData.isDigital ? 'Yes' : 'No'}`);
    }

    console.log(`\nURL                 : ${bookInfo.url}`);
    console.log('='.repeat(70) + '\n');
}

/**
 * Save book information to JSON file
 */
export async function saveToJSON(bookInfo: StandaardBookInfo, filename: string): Promise<void> {
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
        console.log('Usage: ts-node standaard-scraper.ts <ISBN> [--json output.json]');
        console.log('Example: ts-node standaard-scraper.ts 9789002282119');
        console.log('Example: ts-node standaard-scraper.ts 9789002282119 --json book.json');
        process.exit(1);
    }

    const isbn = args[0];
    const jsonIndex = args.indexOf('--json');
    const outputFile = jsonIndex !== -1 ? args[jsonIndex + 1] : null;

    try {
        const bookInfo = await scrapeStandaardBook(isbn);

        // Display formatted output
        formatStandaardBookInfo(bookInfo);

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


export const mapStandaardToBook = (data: StandaardBookInfo, serie: { id: string }) => {
    return {
        isbn: data.isbn,
        title: data.title,
        authors: data.authors,
        description: data.description,
        coverUrl: data.coverImage,
        thumbnailUrl: data.coverImage,
        language: data.language,
        categories: [data.productData.category, data.productData.category2].flat().filter(Boolean),
        serie,
        serieId: serie ? serie.id : null,
        serieNumber: data.seriesNumber,
        publishedDate: data.publicationDate,
        publisher: data.publisher,
        pageCount: data.pages,
        source: 'Standaard Boekhandel',

    };
};
