import axios from "axios";

const mapGoogleBook = (isbn: string, book) => {
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
        source: 'Google Books',
    };
}

export const findGoogleBookByIsbn = async (isbn: string) => {
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);

    if (response.data.totalItems === 0) {
        throw new Error('Book not found');
    }

    const book = response.data.items[0].volumeInfo;

    return mapGoogleBook(isbn, book);
}
