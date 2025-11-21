import {defineStore} from 'pinia'
import {ref} from 'vue'
import api from '@/services/api'
import {PaginatedData, PaginationMeta} from "@/stores/paginated.data.ts";

export interface Book {
    id: string
    isbn?: string
    title: string
    serieNumber?: number
    subtitle?: string
    description?: string
    coverUrl?: string
    type: string
    authors?: Array<{ author: { name: string } }>
    categories?: Array<{ category: { name: string } }>
    serie?: { name: string };
    source?: string;
    user: {
        purchaseDate?: Date;

        purchasePrice?: number;

        location?: string;

        condition?: string;

        notes?: string;

        own?: boolean;
    }
}

type SearchParams = {
    page?: number,
    limit?: number,
    search?: string,
    type?: string,
    serieId?: string,
    categoryName?: string,
    sortBy?: string,
    sortOrder?: string,
}

export const useBooksStore = (id: string) => defineStore(`books-${id}`, () => {
    const books = ref<Book[]>([])
    const currentBook = ref<Book | null>(null)
    const loading = ref(false)
    const pagination = ref<PaginationMeta | null>(null)
    const searchQuery = ref<SearchParams | null>(null)

    async function fetchBooks(query: SearchParams) {
        console.log(query)
        loading.value = true
        searchQuery.value = query
        try {
            const params = new URLSearchParams()

            Object.entries(query).forEach(([key, value]) => {
                if (value) params.append(key, String(value))
            })
            const response = await api.get<PaginatedData<Book>>(`/books?${params.toString()}`)
            books.value = response.data.data
            pagination.value = response.data.meta
            return response.data.data // includes meta
        } finally {
            loading.value = false
        }
    }

    const changePage = (newPage: number) => {
        fetchBooks({
            ...(searchQuery.value ?? {}),
            ...(pagination.value ?? {})
            , page: newPage
        });
    }
    const reload = () => {
        fetchBooks({
            ...(searchQuery.value ?? {}),
            ...(pagination.value ?? {})
        });
    }

    async function searchByISBN(isbn: string) {
        loading.value = true
        try {
            const response = await api.get(`/books/lookup/${isbn}`)
            return response.data
        } finally {
            loading.value = false
        }
    }

    async function addBook(bookData: any) {
        const response = await api.post('/books', bookData)
        books.value.push(response.data)
        return response.data
    }

    async function own(book: Book) {
        const response = await api.patch(`/books/${book.id}/own`, {})
        books.value.push(response.data)
        await reload();
        // return response.data
    }

    async function fetchBook(id: string) {
        loading.value = true
        try {
            const response = await api.get(`/books/${id}`)
            currentBook.value = response.data
            return response.data
        } finally {
            loading.value = false
        }
    }

    return {
        books,
        pagination,
        currentBook,
        loading,
        fetchBooks,
        searchByISBN,
        addBook,
        fetchBook,
        changePage,
        own
    }
})()
