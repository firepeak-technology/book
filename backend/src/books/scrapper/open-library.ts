import axios from "axios";

const mapOpenLibraryBook = (isbn: string, book) => {
    return {
        isbn,
        title: book.title,
        subtitle: book.subtitle,
        publishedDate: book.publish_date,
        pageCount: book.number_of_pages,
        categories: [],
        coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
        thumbnailUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
        authors: book.authors ?? [],
        source: 'openlibrary.org',
    };
}

export const findOpenLibraryByIsbn = async (isbn: string) => {
    const response = await axios.get(`https://openlibrary.org/isbn/${isbn}.json`);
    const data = response.data;

    return mapOpenLibraryBook(isbn, data)

}
