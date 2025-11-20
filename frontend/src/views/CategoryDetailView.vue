<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-100 shadow-lg">
      <div class="flex-1">
        <router-link to="/" class="btn btn-ghost text-xl">← Back</router-link>
      </div>
      <div class="flex-none gap-2">
        <div class="form-control">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search books..." 
            class="input input-bordered w-64"
          />
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">My Collection</h1>
        <div class="tabs tabs-boxed">
          <a 
            :class="['tab', { 'tab-active': filter === 'all' }]" 
            @click="filter = 'all'"
          >
            All
          </a>
          <a 
            :class="['tab', { 'tab-active': filter === 'BOOK' }]" 
            @click="filter = 'BOOK'"
          >
            Books
          </a>
          <a 
            :class="['tab', { 'tab-active': filter === 'COMIC' }]" 
            @click="filter = 'COMIC'"
          >
            Comics
          </a>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="filteredBooks.length === 0" class="text-center py-12">
        <p class="text-xl mb-4">No books in your collection yet</p>
        <router-link to="/scan" class="btn btn-primary">Scan Your First Book</router-link>
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <router-link 
          v-for="book in filteredBooks" 
          :key="book.id"
          :to="`/book/${book.id}`"
          class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
        >
          <figure class="px-4 pt-4">
            <img 
              v-if="book.coverUrl" 
              :src="book.coverUrl" 
              :alt="book.title"
              class="rounded-xl h-48 object-cover"
            />
            <div v-else class="bg-base-300 rounded-xl h-48 w-full flex items-center justify-center">
              <span class="text-4xl">📚</span>
            </div>
          </figure>
          <div class="card-body p-4">
            <h2 class="card-title text-sm line-clamp-2">{{ book.title }}</h2>
            <p class="text-xs opacity-70 line-clamp-1" v-if="book.authors?.length">
              {{ book.authors.map(a => a.author.name).join(', ') }}
            </p>
            <div class="badge badge-sm">{{ book.type }}</div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBooksStore } from '@/stores/books'

const booksStore = useBooksStore()
const searchQuery = ref('')
const filter = ref<string>('all')
const loading = ref(false)

const filteredBooks = computed(() => {
  let books = booksStore.books

  if (filter.value !== 'all') {
    books = books.filter(book => book.type === filter.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    books = books.filter(book => 
      book.title.toLowerCase().includes(query) ||
      book.authors?.some(a => a.author.name.toLowerCase().includes(query))
    )
  }

  return books
})

onMounted(async () => {
  loading.value = true
  try {
    await booksStore.fetchBooks()
  } finally {
    loading.value = false
  }
})
</script>
