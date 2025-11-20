<template>
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

  <CreateCollectionModal
      v-model="showCreateModal"
      @created="handleCollectionCreated"
  />

  <div v-if="loading" class="flex justify-center">
    <span class="loading loading-spinner loading-lg"></span>
  </div>


  <div v-else-if="collections.length === 0" class="text-center py-12">
    <p class="text-xl mb-4">No collections in your collection yet</p>
    <button class="btn btn-primary" @click="showCreateModal = true">Add your first collection</button>
  </div>

  <div v-else>
    <button class="btn btn-primary" @click="showCreateModal = true">Create new collection</button>

    <ul class="list bg-white shadow-sm rounded-box mt-4">

      <li v-for="collection in collections" :key="collection.id" class="list-row">
        <div><img class="size-10 rounded-box" :src="collection.image"/></div>
        <div>
          <div class="text-secondary font-semibold">{{ collection.name }}</div>
          <div class="text-xs uppercase font-semibold opacity-60">{{ collection.description }}</div>
          <div class="text-xs uppercase font-semibold opacity-60">Total books:: {{ collection.bookCount }}</div>
        </div>
        <router-link :to="'/collection/'+collection.id" class="btn btn-square btn-ghost">
          <svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                 stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/>
            </svg>
          </svg>
        </router-link>
      </li>
    </ul>
  </div>

  <div v-if="noCategoryBooks" class="mt-4">
    <h2>Books with no collection</h2>
    <BookList :books="booksStore.books"
              :pagination="booksStore.pagination"
              @page-change="booksStore.changePage"/>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useBooksStore} from '@/stores/books'
import BookList from "@/components/book-list.vue";
import {useCollectionStore} from "@/stores/collection.ts";
import CreateCollectionModal from "@/components/create-collection.modal.vue";

const booksStore = useBooksStore('collection-view')
const collectionStore = useCollectionStore()
const searchQuery = ref('')
const filter = ref<string>('all')
const loading = ref(false)
const noCategoryBooks = computed(() => {
  return booksStore.books
})
const showCreateModal = ref(false)

const collections = computed(() => {
  if (searchQuery.value) {
    return []
  }
  return collectionStore.collections
})

onMounted(async () => {
  loading.value = true
  try {
    await booksStore.fetchBooks({collectionId: 'none'})
    await collectionStore.fetchAll()
  } finally {
    loading.value = false
  }
})

const handleCollectionCreated = async () => {
  await collectionStore.fetchAll()
}
</script>
