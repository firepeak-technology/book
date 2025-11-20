<template>
  <div v-if="collection" class="card shadow-sm bg-white mb-4">
    <div class="card-body">
      <div class="flex gap-2">
        <div data-v-7e1eb1e9="" class="avatar">
          <div :src="collection.image" alt="Collection" class="rounded"></div>
        </div>
        <div>
          <h2>{{ collection.name }} ({{ collection.bookCount }})</h2>
          <div>{{ collection.description }}</div>
        </div>
      </div>
    </div>
  </div>
  <BookList :books="booksStore.books"
            :pagination="booksStore.pagination"
            :query="query"
            @page-change="booksStore.changePage"/>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {useBooksStore} from '@/stores/books'
import BookList from "@/components/book-list.vue";
import {useRoute} from "vue-router";
import {useCollectionStore} from "@/stores/collection.ts";
import {computedAsync} from "@vueuse/core";

const booksStore = useBooksStore('collection-detail')
const collectionStore = useCollectionStore()
const loading = ref(false)
const query = ref({})

const route = useRoute()

const collection = computedAsync(() => {
  return collectionStore.fetchCollection(route.params.collectionId as string)
})

watch(() => route.params.collectionId, () => {
  loading.value = true
  const collectionId = route.params.collectionId as string
  query.value = {collectionId: collectionId}
  booksStore.fetchBooks({collectionId}).then(() => {
    loading.value = false
  })
}, {immediate: true})

onMounted(async () => {
  loading.value = true
})

</script>
