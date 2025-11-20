import {defineStore} from 'pinia'
import {ref} from 'vue'
import api from '@/services/api'

export interface BookCollection {
    id: string
    name: string
    bookCount: string
    image?: string
    description?: string

}

export const useCollectionStore = defineStore('bookCollections', () => {
    const collections = ref<BookCollection[]>([])
    const currentCollection = ref<BookCollection | null>(null)
    const loading = ref(false)
    const basePath = '/collections'

    async function fetchAll() {
        loading.value = true
        try {
            const response = await api.get(basePath)
            collections.value = response.data
        } finally {
            loading.value = false
        }
    }

    async function addCollection(data: any) {
        const response = await api.post(basePath, data)
        data.value.push(response.data)
        return response.data
    }

    async function fetchCollection(id: string) {
        loading.value = true
        try {
            const response = await api.get<BookCollection>(`${basePath}/${id}`)
            currentCollection.value = response.data
            return response.data
        } finally {
            loading.value = false
        }
    }

    return {
        collections,
        currentCollection,
        loading,
        addCollection,
        fetchAll,
        fetchCollection,
    }
})
