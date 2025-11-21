<template>
  <div v-if="collection" class="card shadow-sm bg-white mb-4">
    <div class="card-body">
      <div class="flex gap-2">
        <div data-v-7e1eb1e9="" class="avatar">
          <div :src="collection.image" alt="Collection" class="rounded"></div>
        </div>
        <div>
          <h2>{{ collection.name }} </h2>
          <div>{{ collection.description }}</div>
        </div>
      </div>
    </div>
  </div>

  <BookList :books="booksStore.books"
            :pagination="booksStore.pagination"
            :query="query"
            @page-change="booksStore.changePage" @own="booksStore.own"/>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {useBooksStore} from '@/stores/books'
import BookList from "@/components/book-list.vue";
import {useRoute} from "vue-router";
import {computedAsync} from "@vueuse/core";
import {useSerieStore} from "@/stores/series.ts";

const booksStore = useBooksStore('collection-detail')
const serieStore = useSerieStore()
const loading = ref(false)
const query = ref({})

const route = useRoute()

const collection = computedAsync(() => {
  return serieStore.fetch(route.params.serieId as string)
})

watch(() => route.params.serieId, () => {
  loading.value = true
  const serieId = route.params.serieId as string
  query.value = {serieId: serieId}
  booksStore.fetchBooks({serieId, sortBy: 'serieNumber', sortOrder: 'asc'}).then(() => {
    loading.value = false
  })
}, {immediate: true})

onMounted(async () => {
  loading.value = true
})

</script>
