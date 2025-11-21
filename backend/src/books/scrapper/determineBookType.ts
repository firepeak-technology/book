import {BookType} from "@prisma/client";

/**
 * Dictionary of keywords for each book type
 * Priority order matters - checked from top to bottom
 */
const BOOK_TYPE_KEYWORDS: Record<BookType, string[]> = {
    [BookType.AUDIOBOOK]: [
        'audiobook',
        'luisterboek',
        'audio book',
        'audioboek',
        'luister boek',
        'hörbuch',
    ],
    [BookType.MAGAZINE]: [
        'magazine',
        'tijdschrift',
        'periodiek',
        'journal',
        'revue',
    ],
    [BookType.MANGA]: [
        'manga',
        'mangá',
    ],
    [BookType.GRAPHIC_NOVEL]: [
        'graphic novel',
        'grafische roman',
        'roman graphique',
        'graphic novels',
    ],
    [BookType.COMIC]: [
        'strip',
        'strips',
        'comic',
        'comics',
        'stripboek',
        'stripverhaal',
        'bande dessinée',
        'bd',
    ],
    [BookType.BOOK]: [], // Default, no keywords needed
};

/**
 * Determine book type based on categories
 * Checks against keyword dictionary for each book type
 */
export function determineBookType(...categories: (string | null | undefined)[]): BookType {
    console.log(categories)
    // Filter out null/undefined and combine all categories into lowercase
    const combined = categories
        .filter((cat): cat is string => cat != null && cat !== '')
        .map(cat => cat?.toLowerCase())
        .join(' ');

    if (!combined) {
        return BookType.BOOK;
    }

    // Check each book type in priority order
    // Note: Order matters! More specific types should be checked first
    const typeCheckOrder: BookType[] = [
        BookType.AUDIOBOOK,
        BookType.MAGAZINE,
        BookType.MANGA,
        BookType.GRAPHIC_NOVEL, // Check before COMIC
        BookType.COMIC,
    ];

    for (const bookType of typeCheckOrder) {
        const keywords = BOOK_TYPE_KEYWORDS[bookType];

        // Check if any keyword matches
        for (const keyword of keywords) {
            if (combined.includes(keyword)) {
                return bookType;
            }
        }
    }

    // Default to regular book
    return BookType.BOOK;
}
