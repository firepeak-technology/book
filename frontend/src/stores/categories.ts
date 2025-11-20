import {defineStore} from 'pinia'
import {ref} from 'vue'
import api from '@/services/api'

export interface Category {
    id: string
    name: string
    bookCount: string

}

export const useCategoryStore = defineStore('categories', () => {
    const categories = ref<Category[]>([])
    const currentCategory = ref<Category | null>(null)
    const loading = ref(false)
    const basePath = '/categories'

    async function fetchCategories() {
        loading.value = true
        try {
            const response = await api.get<Category[]>(basePath)
            categories.value = response.data
        } finally {
            loading.value = false
        }
    }

    async function addCategory(data: any) {
        const response = await api.post(basePath, data)
        data.value.push(response.data)
        return response.data
    }

    async function fetchCategory(id: string) {
        loading.value = true
        try {
            const response = await api.get(`${basePath}/${id}`)
            currentCategory.value = response.data
            return response.data
        } finally {
            loading.value = false
        }
    }

    return {
        categories,
        currentCategory,
        loading,
        addCategory,
        fetchCategories,
        fetchCategory,
    }
})
