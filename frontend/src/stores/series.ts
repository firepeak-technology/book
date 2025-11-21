import {defineStore} from 'pinia'
import {ref} from 'vue'
import api from '@/services/api'

export interface BookSerie {
    id: string
    name: string
    image?: string
    description?: string
    stats: {
        totalInDatabase: number,
        totalInCollection: number,
        completionPercentage: number
    }

}

export const useSerieStore = defineStore('bookSeries', () => {
    const series = ref<BookSerie[]>([])
    const loading = ref(false)
    const basePath = '/series'

    async function fetchAll() {
        loading.value = true
        try {
            const response = await api.get(`${basePath}/me`)
            series.value = response.data
        } finally {
            loading.value = false
        }
    }

    async function add(data: any) {
        const response = await api.post(basePath, data)
        data.value.push(response.data)
        return response.data
    }

    async function fetch(id: string) {
        loading.value = true
        try {
            const response = await api.get<BookSerie>(`${basePath}/${id}`)
            return response.data
        } finally {
            loading.value = false
        }
    }

    return {
        series,
        loading,
        add,
        fetchAll,
        fetch,
    }
})
